import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon, type IconName } from "@/components/ui/Icon";

interface PlannedFeatureProps {
  icon: IconName;
  /** 계획서 기준 구현 주차 (예: "7주차") */
  week: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
}

/** 아직 구현 전인 화면. 가짜 데이터 대신 언제 무엇이 들어오는지 안내한다 */
export function PlannedFeature({ icon, week, title, description, actions }: PlannedFeatureProps) {
  return (
    <EmptyState
      icon={<Icon name={icon} size={22} />}
      title={title}
      description={
        <>
          {description}
          <br />
          <span className="mt-2 inline-block rounded bg-hover px-1.5 py-0.5 text-xs font-medium text-sub">{week} 구현 예정</span>
        </>
      }
      actions={actions}
    />
  );
}
