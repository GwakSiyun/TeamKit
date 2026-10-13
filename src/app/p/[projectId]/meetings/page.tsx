import type { Metadata } from "next";
import { PlannedFeature } from "@/components/common/PlannedFeature";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "회의록" };

export default function MeetingsPage() {
  return (
    <>
      <PageHeader title="회의록" description="녹음하면 텍스트로 바꾸고 결정사항 · 할 일 후보를 찾아줘요" />
      <PlannedFeature
        icon="mic"
        week="8~9주차"
        title="회의 녹음 · 음성 인식"
        description="녹음 → CLOVA Speech 텍스트 변환 → 결정사항 · 할 일 후보 검토 → 보드에 추가."
      />
    </>
  );
}
