import type { Metadata } from "next";
import { PlainLayout } from "@/components/layout/PlainLayout";
import { AuthGate } from "@/features/auth/components/AuthGate";
import { GithubLinkRow } from "@/features/auth/components/GithubLinkRow";
import { ProjectsView } from "@/features/projects/components/ProjectsView";

export const metadata: Metadata = { title: "내 프로젝트" };

export default function ProjectsPage() {
  return (
    <PlainLayout>
      <AuthGate require="signed-in">
        <ProjectsView />
        {/* 계정 설정 화면이 생기면 그쪽으로 옮긴다 */}
        <section className="mt-6 flex flex-col gap-3">
          <h2 className="border-b border-line pb-1.5 text-base font-bold">계정</h2>
          <GithubLinkRow />
        </section>
      </AuthGate>
    </PlainLayout>
  );
}
