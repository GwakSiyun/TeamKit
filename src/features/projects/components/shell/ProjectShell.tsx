"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { PlainLayout } from "@/components/layout/PlainLayout";
import { Notice } from "@/components/ui/Notice";
import { useMembers, useProject } from "../../hooks";
import { ProjectProvider } from "../../ProjectContext";
import { NoAccess } from "../NoAccess";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * 프로젝트 내부 화면 공통 틀. 프로젝트를 한 번 구독해서 멤버인지 확인하고,
 * 하위 화면에는 useCurrentProject() 로 프로젝트 · 멤버를 넘긴다.
 */
export function ProjectShell({ children }: { children: ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();
  const state = useProject(projectId);
  const members = useMembers(state.status === "ready" ? state.project.memberIds : []);

  if (state.status === "loading") {
    return <p className="py-24 text-center text-sm text-muted">불러오는 중…</p>;
  }
  if (state.status !== "ready") {
    return (
      <PlainLayout back={{ href: "/projects", label: "내 프로젝트로 돌아가기" }}>
        {state.status === "denied" ? <NoAccess /> : <Notice tone="error">프로젝트를 불러오지 못했어요. 새로고침해주세요.</Notice>}
      </PlainLayout>
    );
  }

  return (
    <ProjectProvider value={{ project: state.project, members }}>
      <div className="flex min-h-full flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex flex-1 flex-col gap-6 px-6 pt-5 pb-14 md:px-12">{children}</main>
        </div>
      </div>
    </ProjectProvider>
  );
}
