import { createHmac, timingSafeEqual } from "node:crypto";
import { FieldValue, type DocumentSnapshot, type Firestore } from "firebase-admin/firestore";
import { forwardStatus, repoDocId, taskNumbersIn, type PrState } from "@/features/github/sync";
import type { TaskStatus } from "@/features/tasks/types";
import { githubTokenOf } from "@/features/github/server/http";
import { attachToMilestone } from "@/features/github/server/milestone";
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
      moved.push(n);
    }
    await batch.commit();
  }
  return moved;
}

/**
 * 카드 번호가 있는 PR 이 열리면(다시 열림 · 초안 해제 포함) 프로젝트 마일스톤에 자동으로 넣는다
 * → GitHub 마일스톤 화면에 PR 진행률이 생긴다. 이미 다른 마일스톤에 들어간 PR 은 건드리지 않는다.
 * 레포를 연결한 사람의 GitHub 토큰으로 처리, 실패해도 웹훅 처리는 성공으로 둔다.
 */
async function attachPrToMilestone(repo: DocumentSnapshot, fullName: string, payload: Payload, change: Change): Promise<boolean> {
  const milestone = Number(repo.get("githubMilestone") ?? 0);
  if (!milestone || change.type !== "pull_request" || change.numbers.length === 0 || !change.pr) return false;
  if (!["opened", "reopened", "ready_for_review"].includes(str(payload.action))) return false;
  if (obj(payload.pull_request).milestone) return false;
  const token = await githubTokenOf(String(repo.get("connectedBy") ?? ""));
  if (!token) return false;
  return attachToMilestone(token, fullName, change.pr.prNumber, milestone);
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
  const attached = await attachPrToMilestone(repo, fullName, payload, change);
  return Response.json({ ok: true, tasks: change.numbers, moved, attached });
}
