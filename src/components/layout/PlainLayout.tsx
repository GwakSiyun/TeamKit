import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/common/BrandMark";
import { UserMenu } from "@/features/auth/components/UserMenu";

/** 사이드바 없는 화면(프로젝트 목록 등): 로고 헤더 + 가운데 본문 */
export function PlainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-[52px] items-center justify-between border-b border-line px-6">
        <Link href="/projects" className="rounded focus-visible:outline-2 focus-visible:outline-accent">
          <BrandMark />
        </Link>
        <UserMenu />
      </header>
      <main className="mx-auto flex w-full max-w-[920px] flex-col gap-6 px-6 py-12">{children}</main>
    </div>
  );
}
