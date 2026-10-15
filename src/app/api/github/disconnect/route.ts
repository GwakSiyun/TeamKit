import { FieldValue } from "firebase-admin/firestore";
import { repoDocId } from "@/features/github/sync";
import { fail, githubFetch, githubTokenOf, json, readBody, requireUser } from "@/features/github/server/http";
import { adminDb } from "@/lib/server/firebaseAdmin";

/** 레포 연결 해제 (프로젝트를 만든 사람만). 웹훅 삭제는 실패해도(이미 지워짐 등) 연결 정보는 지운다 */
export async function POST(request: Request): Promise<Response> {
  const uid = await requireUser(request);
  if (uid instanceof Response) return uid;

  const body = await readBody(request);
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  if (!projectId) return fail(400, "프로젝트 정보가 올바르지 않아요.");

  const db = adminDb();
  const projectRef = db.doc(`projects/${projectId}`);
  const project = await projectRef.get();
  if (!project.exists) return fail(404, "프로젝트를 찾을 수 없어요.");
  if (project.get("ownerId") !== uid) return fail(403, "연결 해제는 프로젝트를 만든 사람만 할 수 있어요.");

  const github = project.get("github") as { owner?: string; repo?: string } | undefined;
  if (!github?.owner || !github.repo) return json(200, { ok: true });

  const fullName = `${github.owner}/${github.repo}`;
  const repoRef = db.doc(`githubRepos/${repoDocId(fullName)}`);
  const hookId = Number((await repoRef.get()).get("hookId") ?? 0);
  const token = await githubTokenOf(uid);
  if (token && hookId) await githubFetch(token, `/repos/${fullName}/hooks/${hookId}`, { method: "DELETE" });

  const batch = db.batch();
  batch.delete(repoRef);
  batch.update(projectRef, { github: FieldValue.delete() });
  await batch.commit();
  return json(200, { ok: true });
}
