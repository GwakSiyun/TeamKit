"use client";

import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { useAuth } from "../AuthProvider";
import { logout } from "../services";

/** 헤더 오른쪽: 이름 + 로그아웃 (계정 설정 화면이 생기면 메뉴로 바뀐다) */
export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  if (!user) return null;

  async function handleLogout(): Promise<void> {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-sub">{user.displayName ?? user.email}</span>
      <button type="button" onClick={handleLogout} className={buttonClass("ghost")}>
        로그아웃
      </button>
    </div>
  );
}
