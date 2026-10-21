"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/** 로그인 ↔ 회원가입 이동 링크. 돌아갈 주소(?next=)를 그대로 넘긴다 (초대 링크로 들어온 경우) */
export function AuthSwitchLink({ href, children }: { href: "/login" | "/signup"; children: ReactNode }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(e) => {
        const search = window.location.search;
        if (!search) return;
        e.preventDefault();
        router.push(`${href}${search}`);
      }}
      className="text-accent hover:text-accent-strong"
    >
      {children}
    </Link>
  );
}
