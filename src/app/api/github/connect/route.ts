import { randomBytes } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { repoDocId } from "@/features/github/sync";
import { githubFetch, githubTokenOf } from "@/features/github/server/http";
import { listedMilestones, syncMilestones } from "@/features/github/server/milestone";
import { fail, json, readBody, requireUser } from "@/lib/server/http";
import { adminDb } from "@/lib/server/firebaseAdmin";

const REPO_RE = /^[\w.-]+\/[\w.-]+$/;

/**
 * 프로젝트에 레포 연결 (프로젝트를 만든 사람만).
 * 사용자 GitHub 토큰으로 레포에 웹훅을 만들고, 서명 검증용 secret 은 서버 전용 컬렉션(githubRepos)에만 둔다.
 */
export async function POST(request: Request): Promise<Response> {
  const uid = await requireUser(request);
  if (uid instanceof Response) return uid;

  const body = await readBody(request);
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  const fullName = typeof body.fullName === "string" ? body.fullName : "";
  if (!projectId || !REPO_RE.test(fullName)) return fail(400, "프로젝트나 레포 정보가 올바르지 않아요.");

  const appUrl = process.env.PUBLIC_APP_URL;
  if (!appUrl) return fail(400, "배포 주소에서만 연결할 수 있어요. (GitHub가 localhost 로는 알림을 못 보내요)");

  const db = adminDb();
  const projectRef = db.doc(`projects/${projectId}`);
  const project = await projectRef.get();
  if (!project.exists) return fail(404, "프로젝트를 찾을 수 없어요.");
  if (project.get("ownerId") !== uid) return fail(403, "레포 연결은 프로젝트를 만든 사람만 할 수 있어요.");
  if (project.get("github")) return fail(409, "이미 연결된 레포가 있어요. 연결을 해제한 뒤 다시 시도해주세요.");

  const repoRef = db.doc(`githubRepos/${repoDocId(fullName)}`);
  if ((await repoRef.get()).exists) return fail(409, "이 레포는 이미 다른 프로젝트에 연결돼 있어요.");

  const token = await githubTokenOf(uid);
  if (!token) return fail(400, "GitHub가 연결돼 있지 않아요. 계정 설정에서 GitHub를 연결해주세요.");

  const secret = randomBytes(32).toString("hex");
  const hookRes = await githubFetch(token, `/repos/${fullName}/hooks`, {
    method: "POST",
    body: JSON.stringify({
      name: "web",
      active: true,
      events: ["push", "create", "pull_request"],
      config: { url: `${appUrl}/api/github/webhook`, content_type: "json", secret, insecure_ssl: "0" },
    }),
  });
  if (hookRes.status === 404 || hookRes.status === 403) {
    return fail(403, "웹훅을 만들 권한이 없어요. 레포 관리자(Admin)인 계정으로 연결해주세요.");
  }
  if (!hookRes.ok) return fail(502, "GitHub에 웹훅을 만들지 못했어요. 잠시 후 다시 시도해주세요.");
  const hookId = Number(((await hookRes.json()) as { id?: number }).id ?? 0);

  const [owner, repo] = fullName.split("/");
  const batch = db.batch();
  batch.set(repoRef, { projectId, fullName, webhookSecret: secret, hookId, connectedBy: uid, connectedAt: FieldValue.serverTimestamp() });
  batch.update(projectRef, { github: { owner, repo, connectedBy: uid, connectedAt: FieldValue.serverTimestamp() } });
  await batch.commit();

  // 마일스톤을 먼저 정해 뒀으면 연결하면서 GitHub 에도 만든다 (실패해도 연결은 성공)
  const milestones = listedMilestones(project.get("milestones"), project.get("milestone"));
  if (milestones.length > 0) {
    const synced = await syncMilestones(token, fullName, milestones, {});
    await repoRef.update({ githubMilestones: synced.numbers });
  }

  return json(200, { ok: true });
}
