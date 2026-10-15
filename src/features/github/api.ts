import { firebaseAuth } from "@/lib/firebase";

export type ApiResult<T> = ({ ok: true } & T) | { ok: false; message: string };

/** 브라우저 → 우리 서버 API (/api/github/*). 로그인 토큰을 붙여 보내고, 서버가 검증한다 */
export async function callGithubApi<T extends object>(path: "repos" | "connect" | "disconnect", body: object = {}): Promise<ApiResult<T>> {
  const user = firebaseAuth().currentUser;
  if (!user) return { ok: false, message: "로그인이 필요해요." };
  try {
    const res = await fetch(`/api/github/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as ApiResult<T>;
    return data;
  } catch {
    return { ok: false, message: "서버에 연결하지 못했어요. 배포 주소에서 다시 시도해주세요." };
  }
}

export interface RepoItem {
  fullName: string;
  private: boolean;
  updatedAt: string;
  admin: boolean;
}
