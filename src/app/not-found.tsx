import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/common/BackButton";
import { ErrorScreen } from "@/components/common/ErrorScreen";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "페이지를 찾을 수 없어요" };

/** 404: 없는 주소 (Next.js 기본 영어 화면 대신) */
export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      title="페이지를 찾을 수 없어요"
      description="주소가 바뀌었거나 삭제된 페이지예요. 주소를 다시 확인하거나 내 프로젝트에서 찾아보세요."
      actions={
        <>
          <BackButton />
          <Link href="/projects" className={buttonClass("primary", "h-9 px-4")}>
            내 프로젝트로
          </Link>
        </>
      }
    />
  );
}
