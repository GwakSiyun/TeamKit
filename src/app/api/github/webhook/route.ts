import { createHmac, timingSafeEqual } from "node:crypto";
import { FieldValue, type DocumentSnapshot, type Firestore } from "firebase-admin/firestore";
import { forwardStatus, repoDocId, taskNumbersIn, type PrState } from "@/features/github/sync";
import type { TaskStatus } from "@/features/tasks/types";
import { adminDb } from "@/lib/server/firebaseAdmin";

/** 웹훅 하나를 카드에 반영할 내용으로 정리한 것 */
interface Change {
  type: "create" | "push" | "pull_request";
  title: string;
  url: string | null;
  author: string;
  numbers: number[];
  /** 이 상태까지 앞으로 이동 (null 이면 상태는 그대로) */
  target: TaskStatus | null;
  branch: string | null;
  pr: { prNumber: number; prTitle: string; prState: PrState; prUrl: string } | null;
}

type Payload = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function obj(v: unknown): Payload {
  return v && typeof v === "object" ? (v as Payload) : {};
}

/** X-Hub-Signature-256 = "sha256=" + HMAC-SHA256(secret, 원본 body) — 길이가 같을 때만 상수 시간 비교 */
function validSignature(secret: string, raw: string, header: string | null): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(`sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`);
  const given = Buffer.from(header);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

function toChange(event: string, p: Payload): Change | null {
  const author = str(obj(p.sender).login) || "GitHub";

  if (event === "create" && p.ref_type === "branch") {
    const branch = str(p.ref);
    return { type: "create", title: branch, url: null, author, numbers: taskNumbersIn(branch), target: "doing", branch, pr: null };
  }

  if (event === "push" && !p.deleted) {
    const branch = str(p.ref).replace(/^refs\/heads\//, "");
    const commits = Array.isArray(p.commits) ? p.commits.map(obj) : [];
    const messages = commits.map((c) => str(c.message));
    const first = messages[0]?.split("\n")[0] ?? "";
    return {
      type: "push",
      title: commits.length > 1 ? `${first} 외 ${commits.length - 1}개` : first || branch,
      url: str(obj(p.head_commit).url) || str(p.compare) || null,
      author,
      numbers: taskNumbersIn(branch, ...messages),
      target: commits.length > 0 ? "doing" : null,
      branch,
      pr: null,
    };
  }

  if (event === "pull_request") {
    const pr = obj(p.pull_request);
    const action = str(p.action);
    if (!["opened", "reopened", "closed", "edited", "ready_for_review"].includes(action)) return null;
    const prState: PrState = pr.merged === true ? "merged" : pr.state === "closed" ? "closed" : "open";
    const title = str(pr.title);
    const branch = str(obj(pr.head).ref);
    return {
      type: "pull_request",
      title: `#${Number(pr.number)} ${title}`,
      url: str(pr.html_url) || null,
      author,
      numbers: taskNumbersIn(title, branch),
      target: prState === "merged" ? "done" : prState === "open" ? "doing" : null,
      branch: branch || null,
      pr: { prNumber: Number(pr.number), prTitle: title, prState, prUrl: str(pr.html_url) },
    };
  }

  return null;
}

/**
 * PR 머지로 완료가 되면 할 일 주인(담당자, 없으면 만든 사람)에게 알림.
 * 브랜치 · 커밋으로 '진행 중'이 될 땐 보통 본인이 한 일이라 보내지 않는다.
 * 주인의 GitHub 계정이 머지한 사람과 같아도 보내지 않는다 (내가 내 PR 을 머지한 경우).
 */
async function mergeNotification(
  db: Firestore,
  projectId: string,
  change: Change,
  task: DocumentSnapshot,
): Promise<{ recipient: string; data: Record<string, unknown> } | null> {
  if (change.type !== "pull_request" || change.pr?.prState !== "merged") return null;
  const recipient = (task.get("assigneeId") as string | null) ?? (task.get("createdBy") as string | null);
  if (!recipient) return null;
  const owner = await db.doc(`users/${recipient}`).get();
  const ownerLogin = owner.get("githubLogin");
  if (typeof ownerLogin === "string" && ownerLogin.toLowerCase() === change.author.toLowerCase()) return null;
  const project = await db.doc(`projects/${projectId}`).get();
  return {
    recipient,
    data: {
      type: "github",
      projectId,
      projectName: String(project.get("name") ?? ""),
      taskId: task.id,
      taskNumber: Number(task.get("number")),
      taskTitle: String(task.get("title") ?? "").slice(0, 100),
      actorId: `github:${change.author}`,
      actorName: change.author,
      text: `PR #${change.pr.prNumber}을 머지해서 '완료'로 옮겼어요`,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    },
  };
}

/** 카드 번호마다 상태를 앞으로만 옮기고, 브랜치 · PR 정보를 붙이고, 상태가 바뀌면 기록을 남긴다 */
async function applyToTasks(db: Firestore, projectId: string, change: Change): Promise<number[]> {
  const moved: number[] = [];
  for (const n of change.numbers) {
    const found = await db.collection(`projects/${projectId}/tasks`).where("number", "==", n).limit(1).get();
    const doc = found.docs[0];
    if (!doc) continue;
    const current = doc.get("status") as TaskStatus;
    const next = change.target ? forwardStatus(current, change.target) : null;

    const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (change.branch && !doc.get("branch")) update.branch = change.branch;
    if (change.pr) update.github = change.pr;
    if (next) Object.assign(update, { status: next, statusSource: "github" });

    const batch = db.batch();
    batch.update(doc.ref, update);
    if (next) {
      batch.set(doc.ref.collection("history").doc(), {
        from: current,
        to: next,
        source: "github",
        actor: `github:${change.author}`,
        at: FieldValue.serverTimestamp(),
      });
      const notification = next === "done" ? await mergeNotification(db, projectId, change, doc) : null;
      if (notification) batch.set(db.collection(`users/${notification.recipient}/notifications`).doc(), notification.data);
      moved.push(n);
    }
    await batch.commit();
  }
  return moved;
}

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  const event = request.headers.get("x-github-event") ?? "";
  const delivery = request.headers.get("x-github-delivery") ?? "";

  let payload: Payload;
  try {
    payload = obj(JSON.parse(raw));
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const fullName = str(obj(payload.repository).full_name);
  if (!fullName || !delivery) return Response.json({ ok: false }, { status: 400 });

  const db = adminDb();
  const repo = await db.doc(`githubRepos/${repoDocId(fullName)}`).get();
  if (!repo.exists) return Response.json({ ok: false, reason: "연결되지 않은 레포" }, { status: 404 });

  // 서명 검증: 레포마다 다른 secret. 위조된 요청은 여기서 끝
  if (!validSignature(String(repo.get("webhookSecret")), raw, request.headers.get("x-hub-signature-256"))) {
    return Response.json({ ok: false }, { status: 401 });
  }
  if (event === "ping") return Response.json({ ok: true, pong: true });

  const change = toChange(event, payload);
  if (!change) return Response.json({ ok: true, ignored: event });

  const projectId = String(repo.get("projectId"));
  // 같은 배달(재전송)은 한 번만 처리: 배달 ID 를 문서 ID 로 create → 이미 있으면 실패
  try {
    await db.doc(`projects/${projectId}/githubEvents/${delivery}`).create({
      type: change.type,
      title: change.title,
      url: change.url,
      author: change.author,
      taskNumbers: change.numbers,
      // PR 이면 열림 · 머지 · 닫힘 (대시보드 · 활동 목록 표시용)
      prState: change.pr?.prState ?? null,
      at: FieldValue.serverTimestamp(),
    });
  } catch {
    return Response.json({ ok: true, duplicate: true });
  }

  const moved = await applyToTasks(db, projectId, change);
  return Response.json({ ok: true, tasks: change.numbers, moved });
}
