import type { Metadata } from "next";
import { PlannedFeature } from "@/components/common/PlannedFeature";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "대시보드" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="대시보드" />
      <PlannedFeature
        icon="dashboard"
        week="할 일 보드 다음"
        title="전체 진행률과 간트 차트가 여기에 보여요"
        description="담당자별 할 일 기간 · 지연 · 다음 회의 · 최근 GitHub 활동을 한 화면에서 봐요."
      />
    </>
  );
}
