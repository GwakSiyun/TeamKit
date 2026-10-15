// 서버 전용: API 라우트 공통 (로그인 확인 · JSON 응답 · 요청 본문)
import { adminAuth } from "@/lib/server/firebaseAdmin";

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

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
