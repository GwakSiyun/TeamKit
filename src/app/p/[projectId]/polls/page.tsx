import type { Metadata } from "next";
import { PlannedFeature } from "@/components/common/PlannedFeature";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "일정 맞추기" };

export default function PollsPage() {
  return (
    <>
      <PageHeader title="일정 맞추기" description="기간을 정하면 팀원이 되는 시간을 표시하고, 겹치는 시간을 추천해줘요" />
      <PlannedFeature
        icon="calendar"
        week="10주차"
        title="가능 시간 투표"
        description="날짜 × 시간 히트맵에 각자 되는 시간을 표시하고, 가장 많이 겹치는 시간을 추천받아요."
      />
    </>
  );
}
