"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Member, Project } from "./types";

interface ProjectContextValue {
  project: Project;
  members: Member[];
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ value, children }: { value: ProjectContextValue; children: ReactNode }) {
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

/** 프로젝트 내부 화면(/p/[projectId]/*)에서 현재 프로젝트 · 멤버를 꺼낸다. ProjectShell 이 멤버 확인 후 제공 */
export function useCurrentProject(): ProjectContextValue {
  const value = useContext(ProjectContext);
  if (!value) throw new Error("useCurrentProject 는 ProjectShell 안에서만 쓸 수 있어요.");
  return value;
}
