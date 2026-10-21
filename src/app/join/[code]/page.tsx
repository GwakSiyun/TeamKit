import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandMark } from "@/components/common/BrandMark";
import { JoinInviteView } from "@/features/projects/components/JoinInviteView";

// 카카오톡 · 메시지에 링크를 붙였을 때 미리보기 카드
export const metadata: Metadata = {
  title: "프로젝트 초대",
  openGraph: {
    title: "TeamKit 프로젝트에 초대받았어요",
    description: "링크를 누르고 '참여하기'만 하면 팀의 할 일 · 회의록 · 일정을 함께 볼 수 있어요.",
    siteName: "TeamKit",
  },
};

/** 초대 링크 (teamkit.site/join/ABC234). 로그인 전에도 열려야 해서 AuthGate 없이 화면 안에서 나눈다 */
export default function JoinPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex h-14 items-center px-4 sm:px-6">
        <Link href="/projects" className="rounded focus-visible:outline-2 focus-visible:outline-accent">
          <BrandMark />
        </Link>
      </header>
      <main className="flex flex-1 justify-center px-4 pt-[72px] pb-12">
        <div className="w-full max-w-[400px]">
          {/* 주소의 코드(useParams)는 요청 때 정해져서 Suspense 로 감싼다 */}
          <Suspense fallback={<p className="py-12 text-center text-sm text-muted">불러오는 중…</p>}>
            <JoinInviteView />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
