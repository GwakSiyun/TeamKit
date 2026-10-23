import Link from "next/link";
import { ErrorScreen } from "@/components/common/ErrorScreen";
import { buttonClass } from "@/components/ui/button";

/** 403: 멤버가 아니거나 없는 프로젝트 (규칙상 둘을 구분하지 않는다) */
export function NoAccess() {
  return (
    <ErrorScreen
      code="403"
      title="이 프로젝트에 접근할 수 없어요"
      description="프로젝트 멤버만 볼 수 있어요. 팀원에게 초대 링크나 코드를 받아 참여하세요."
      actions={
        <Link href="/projects" className={buttonClass("primary", "h-9 px-4")}>
          내 프로젝트로
        </Link>
      }
    />
  );
}
