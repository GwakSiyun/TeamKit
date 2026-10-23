import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandMark } from "@/components/common/BrandMark";
import { AuthActionView } from "@/features/auth/components/AuthActionView";

export const metadata: Metadata = { title: "계정 확인" };

/** 메일 링크(비밀번호 재설정 · 이메일 인증)가 도착하는 화면. 로그인 여부와 상관없이 열려야 해서 (auth) 그룹 밖에 둔다 */
export default function AuthActionPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex h-14 items-center px-4 sm:px-6">
        <Link href="/login" className="rounded focus-visible:outline-2 focus-visible:outline-accent">
          <BrandMark />
        </Link>
      </header>
      <main className="flex flex-1 justify-center px-4 pt-[72px] pb-12">
        <div className="w-full max-w-[340px]">
          {/* 주소의 mode · oobCode(useSearchParams)는 요청 때 정해져서 Suspense 로 감싼다 */}
          <Suspense fallback={<p className="py-12 text-center text-sm text-muted">불러오는 중…</p>}>
            <AuthActionView />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
