"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClass } from "@/components/ui/button";
import { useAuth } from "../AuthProvider";
import { logout } from "../services";
import { GithubLinkRow } from "./GithubLinkRow";

export function AccountView() {
  const { user } = useAuth();
  const router = useRouter();
  if (!user) return null;

  async function handleLogout(): Promise<void> {
    await logout();
    router.replace("/login");
  }

  return (
    <>
      <PageHeader title="계정 설정" />
      <section className="flex flex-col gap-3">
        <h2 className="border-b border-line pb-1.5 text-base font-bold">프로필</h2>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-muted">이름</dt>
          <dd>{user.displayName ?? "이름 없음"}</dd>
          <dt className="text-muted">이메일</dt>
          <dd>{user.email ?? "없음"}</dd>
        </dl>
        <p className="text-xs text-muted">이름 변경은 다음 작업에서 추가돼요.</p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="border-b border-line pb-1.5 text-base font-bold">로그인 방식</h2>
        <GithubLinkRow />
      </section>
      <div>
        <button type="button" onClick={handleLogout} className={buttonClass("secondary")}>
          로그아웃
        </button>
      </div>
    </>
  );
}
