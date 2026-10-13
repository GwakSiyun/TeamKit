import type { Metadata } from "next";
import { PlannedFeature } from "@/components/common/PlannedFeature";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "할 일" };

export default function BoardPage() {
  return (
    <>
      <PageHeader title="할 일" />
      <PlannedFeature
        icon="board"
        week="7주차"
        title="할 일 보드"
        description="할 일 · 진행 중 · 완료 칸반과 카드 번호(TM-1)가 들어와요."
      />
    </>
  );
}
