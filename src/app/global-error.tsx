"use client";

import "./globals.css";
import { ErrorScreen } from "@/components/common/ErrorScreen";
import { buttonClass } from "@/components/ui/button";

/** 루트 레이아웃까지 깨졌을 때의 마지막 오류 화면 (자체 html · body 필요) */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col">
        <ErrorScreen
          code="500"
          title="TeamKit 을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요. 계속되면 새로고침해 주세요."
          actions={
            <button type="button" onClick={reset} className={buttonClass("primary", "h-9 px-4")}>
              다시 시도
            </button>
          }
          footnote={error.digest ? `오류 번호 ${error.digest}` : undefined}
        />
      </body>
    </html>
  );
}
