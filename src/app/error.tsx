"use client";

import Link from "next/link";
import { ErrorScreen } from "@/components/common/ErrorScreen";
import { buttonClass } from "@/components/ui/button";

/** 500: 화면을 그리다 오류가 났을 때 (Error Boundary). 다시 시도 = 그 화면만 다시 그리기 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      code="500"
      title="문제가 생겼어요"
      description="화면을 불러오다 오류가 났어요. 잠시 후 다시 시도해 주세요. 계속되면 새로고침하거나 내 프로젝트에서 다시 들어와 주세요."
      actions={
        <>
          <button type="button" onClick={reset} className={buttonClass("primary", "h-9 px-4")}>
            다시 시도
          </button>
          <Link href="/projects" className={buttonClass("secondary", "h-9 px-4")}>
            내 프로젝트로
          </Link>
        </>
      }
      footnote={error.digest ? `오류 번호 ${error.digest}` : undefined}
    />
  );
}
