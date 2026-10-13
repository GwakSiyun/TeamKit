"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { useAuth } from "../AuthProvider";
import { logout } from "../services";

/** 헤더 오른쪽: 이름(계정 설정으로) + 로그아웃 */
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
      <Link href="/account" className={buttonClass("ghost")}>
        {user.displayName ?? user.email}
      </Link>
      <button type="button" onClick={handleLogout} className={buttonClass("ghost")}>
        로그아웃
      </button>
    </div>
  );
}
