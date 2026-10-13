"use client";

import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { useAuth } from "../AuthProvider";
import { logout } from "../services";

/** 프로젝트 목록이 생기기 전까지 로그인 상태를 확인하는 임시 표시 */
export function SignedInSummary() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleLogout(): Promise<void> {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-line p-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold">{user?.displayName ?? "이름 없음"}</span>
        <span className="text-xs text-muted">{user?.email ?? "이메일 없음"} · 프로젝트 기능은 다음 작업에서 붙어요</span>
      </div>
      <button type="button" onClick={handleLogout} className={buttonClass("secondary")}>
        로그아웃
      </button>
    </div>
  );
}
