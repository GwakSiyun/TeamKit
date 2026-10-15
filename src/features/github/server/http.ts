// 서버 전용: API 라우트 공통 (로그인 확인 · JSON 응답 · GitHub REST 호출)
import { adminAuth, adminDb } from "@/lib/server/firebaseAdmin";

export function json(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status });
}

export function fail(status: number, message: string): Response {
  return json(status, { ok: false, message });
}

/** Authorization: Bearer <Firebase ID 토큰> 검증 → uid. 실패하면 응답을 돌려준다 */
export async function requireUser(request: Request): Promise<string | Response> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return fail(401, "로그인이 필요해요.");
  try {
    return (await adminAuth().verifyIdToken(token)).uid;
  } catch {
    return fail(401, "로그인이 만료됐어요. 새로고침 후 다시 시도해주세요.");
  }
}

/** 로그인 · GitHub 연결 때 저장한 사용자 GitHub 토큰 */
export async function githubTokenOf(uid: string): Promise<string | null> {
  const snap = await adminDb().doc(`users/${uid}/private/github`).get();
  const token = snap.get("accessToken");
  return typeof token === "string" && token ? token : null;
}

export async function githubFetch(token: string, path: string, init: RequestInit = {}): Promise<globalThis.Response> {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "TeamKit",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
