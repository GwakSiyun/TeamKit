"use client";

import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";

/** 브라우저 기록으로 한 칸 뒤로 (에러 화면용). 기록이 없으면 내 프로젝트로 */
export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/projects"))}
      className={buttonClass("secondary", "h-9 px-4")}
    >
      <Icon name="arrowLeft" size={15} />
      뒤로가기
    </button>
  );
}
