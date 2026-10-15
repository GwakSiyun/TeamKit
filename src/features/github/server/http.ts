// 서버 전용: GitHub REST 호출 · 사용자 GitHub 토큰
import { adminDb } from "@/lib/server/firebaseAdmin";

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
