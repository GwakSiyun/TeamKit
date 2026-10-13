import type { Metadata } from "next";
import { PlannedFeature } from "@/components/common/PlannedFeature";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "GitHub 연동" };

export default function GithubPage() {
  return (
    <>
      <PageHeader title="GitHub 연동" description="카드 번호(TM-12)가 들어간 브랜치 · 커밋 · PR이 할 일에 자동으로 반영돼요" />
      <PlannedFeature
        icon="github"
        week="11~12주차"
        title="레포 연결 · 웹훅 자동 반영"
        description="레포를 연결하고 웹훅을 등록하면 브랜치 생성은 진행 중, PR 머지는 완료로 카드가 움직여요."
      />
    </>
  );
}
