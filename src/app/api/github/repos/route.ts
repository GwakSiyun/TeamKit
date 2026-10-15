import { githubFetch, githubTokenOf } from "@/features/github/server/http";
import { fail, json, requireUser } from "@/lib/server/http";

interface GithubRepo {
  full_name: string;
  private: boolean;
  updated_at: string;
  permissions?: { admin?: boolean };
}

/** 내 GitHub 레포 목록 (웹훅을 만들 수 있는 관리자 권한 여부 포함) */
export async function POST(request: Request): Promise<Response> {
  const uid = await requireUser(request);
  if (uid instanceof Response) return uid;

  const token = await githubTokenOf(uid);
  if (!token) return fail(400, "GitHub가 연결돼 있지 않아요. 계정 설정에서 GitHub를 연결해주세요.");

  const res = await githubFetch(token, "/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member");
  if (res.status === 401) return fail(401, "GitHub 권한이 만료됐어요. 계정 설정에서 GitHub를 다시 연결해주세요.");
  if (!res.ok) return fail(502, "GitHub에서 레포 목록을 가져오지 못했어요.");

  const repos = ((await res.json()) as GithubRepo[]).map((r) => ({
    fullName: r.full_name,
    private: r.private,
    updatedAt: r.updated_at,
    admin: r.permissions?.admin === true,
  }));
  return json(200, { ok: true, repos });
}
