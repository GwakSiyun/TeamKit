import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";

/** 멤버가 아니거나 없는 프로젝트 (규칙상 둘을 구분하지 않는다) */
export function NoAccess() {
  return (
    <EmptyState
      icon={<Icon name="lock" size={24} />}
      title="이 프로젝트에 접근할 수 없어요"
      description="프로젝트 멤버만 볼 수 있어요. 팀원에게 초대 코드를 받아 참여하세요."
      actions={
        <Link href="/projects" className={buttonClass("primary")}>
          내 프로젝트로
        </Link>
      }
    />
  );
}
