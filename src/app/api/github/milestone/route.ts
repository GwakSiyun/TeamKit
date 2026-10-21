import { FieldValue } from "firebase-admin/firestore";
import { githubTokenOf } from "@/features/github/server/http";
import { syncMilestone, type MilestoneInput } from "@/features/github/server/milestone";
import { repoDocId } from "@/features/github/sync";
import { fail, json, readBody, requireUser } from "@/lib/server/http";
import { adminDb } from "@/lib/server/firebaseAdmin";

/**
 * 프로젝트 마일스톤 → 연결된 레포의 GitHub Milestone 반영 (프로젝트를 만든 사람만).
 * 마일스톤 값은 브라우저가 Firestore 에 먼저 저장하고(규칙 검사), 이 API 는 저장된 값을 읽어 GitHub 에 맞춘다.
 * 레포가 연결 안 돼 있으면 할 일 없음.
 */
export async function POST(request: Request): Promise<Response> {
  const uid = await requireUser(request);
  if (uid instanceof Response) return uid;

  const body = await readBody(request);
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  if (!projectId) return fail(400, "프로젝트 정보가 올바르지 않아요.");

  const db = adminDb();
  const project = await db.doc(`projects/${projectId}`).get();
  if (!project.exists) return fail(404, "프로젝트를 찾을 수 없어요.");
  if (project.get("ownerId") !== uid) return fail(403, "마일스톤은 프로젝트를 만든 사람만 정할 수 있어요.");

  const github = project.get("github") as { owner?: string; repo?: string } | undefined;
  if (!github?.owner || !github.repo) return json(200, { ok: true, synced: false });

  const token = await githubTokenOf(uid);
  if (!token) return fail(400, "GitHub가 연결돼 있지 않아요. 계정 설정에서 GitHub를 연결해주세요.");

  const fullName = `${github.owner}/${github.repo}`;
  const repoRef = db.doc(`githubRepos/${repoDocId(fullName)}`);
  const current = Number((await repoRef.get()).get("githubMilestone") ?? 0) || null;
  const milestone = (project.get("milestone") ?? null) as MilestoneInput | null;

  const result = await syncMilestone(token, fullName, milestone, current);
  if (!result.ok) return fail(502, result.message);
  await repoRef.update({ githubMilestone: result.number ?? FieldValue.delete() });
  return json(200, { ok: true, synced: true, url: result.url });
}
