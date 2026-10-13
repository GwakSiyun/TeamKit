import type { Metadata } from "next";
import { BrandMark } from "@/components/common/BrandMark";
import { AuthGate } from "@/features/auth/components/AuthGate";
import { GithubLinkRow } from "@/features/auth/components/GithubLinkRow";
import { SignedInSummary } from "@/features/auth/components/SignedInSummary";

export const metadata: Metadata = { title: "내 프로젝트" };

// TODO(6주차 남은 작업): 프로젝트 목록 · 새 프로젝트 · 초대 코드 참여. 지금은 로그인 확인용 임시 화면이다.
export default function ProjectsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-[52px] items-center border-b border-line px-6">
        <BrandMark />
      </header>
      <main className="mx-auto flex w-full max-w-[920px] flex-col gap-6 px-6 py-12">
        <h1 className="text-[30px] font-bold">내 프로젝트</h1>
        <AuthGate require="signed-in">
          <SignedInSummary />
          <GithubLinkRow />
        </AuthGate>
      </main>
    </div>
  );
}
