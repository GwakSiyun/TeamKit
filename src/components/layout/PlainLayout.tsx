import type { ReactNode } from "react";
import Link from "next/link";
import { BackLink } from "@/components/common/BackLink";
import { BrandMark } from "@/components/common/BrandMark";
import { UserMenu } from "@/features/auth/components/UserMenu";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

interface PlainLayoutProps {
  /** 헤더 아래 왼쪽에 보여줄 뒤로가기 (예: 프로젝트 → 내 프로젝트) */
  back?: { href: string; label: string };
  children: ReactNode;
}

/** 사이드바 없는 화면(프로젝트 목록 등): 로고 헤더 + 가운데 본문 */
export function PlainLayout({ back, children }: PlainLayoutProps) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-[52px] items-center justify-between border-b border-line px-4 sm:px-6">
        <Link href="/projects" className="rounded focus-visible:outline-2 focus-visible:outline-accent">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <UserMenu />
        </div>
      </header>
      {back && (
        <nav aria-label="상위 화면" className="px-4 pt-3 sm:px-6">
          <BackLink href={back.href} label={back.label} />
        </nav>
      )}
      <main className={`mx-auto flex w-full max-w-[920px] flex-col gap-6 px-4 pb-12 sm:px-6 ${back ? "pt-6" : "pt-12"}`}>{children}</main>
    </div>
  );
}
