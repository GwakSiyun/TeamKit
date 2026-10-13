"use client";

import { useState } from "react";
import { Dropdown, DropdownButton, DropdownDivider, DropdownLabel, DropdownLink } from "@/components/ui/Dropdown";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/AuthProvider";
import { useMyProjects } from "../../hooks";
import { projectBase } from "../../navigation";
import { useCurrentProject } from "../../ProjectContext";
import { JoinProjectModal } from "../JoinProjectModal";
import { NewProjectModal } from "../NewProjectModal";

function ProjectMark({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[5px] bg-ink text-xs font-bold text-white"
      style={{ width: size, height: size }}
    >
      {name.slice(0, 1)}
    </span>
  );
}

/** 사이드바 맨 위: 현재 프로젝트 이름 ▾ → 내 프로젝트 목록으로 전환 */
export function ProjectSwitcher() {
  const { project } = useCurrentProject();
  const { user } = useAuth();
  const list = useMyProjects(user?.uid ?? "");
  const [modal, setModal] = useState<"new" | "join" | null>(null);

  return (
    <>
      <Dropdown
        label="프로젝트 전환"
        width={240}
        buttonClassName="mb-2 flex h-10 w-full items-center gap-2 rounded-md px-2.5 text-sm text-ink hover:bg-hover focus-visible:outline-2 focus-visible:outline-accent"
        button={
          <>
            <ProjectMark name={project.name} />
            <span className="flex-1 truncate text-left font-semibold">{project.name}</span>
            <span className="text-faint">
              <Icon name="chevronDown" size={14} />
            </span>
          </>
        }
      >
        {(close) => (
          <>
            <DropdownLabel>내 프로젝트</DropdownLabel>
            {list.status === "loading" && <span className="px-2 py-1.5 text-xs text-muted">불러오는 중…</span>}
            {list.status === "error" && <span className="px-2 py-1.5 text-xs text-danger">목록을 불러오지 못했어요</span>}
            {list.status === "ready" &&
              list.projects.map((p) => (
                <DropdownLink key={p.id} href={projectBase(p.id)} onSelect={close} current={p.id === project.id}>
                  <ProjectMark name={p.name} size={20} />
                  <span className="flex-1 truncate">{p.name}</span>
                  {p.id === project.id && (
                    <span className="text-accent">
                      <Icon name="check" size={15} />
                    </span>
                  )}
                </DropdownLink>
              ))}
            <DropdownDivider />
            <DropdownButton
              onClick={() => {
                close();
                setModal("new");
              }}
            >
              <Icon name="plus" size={15} />새 프로젝트
            </DropdownButton>
            <DropdownButton
              onClick={() => {
                close();
                setModal("join");
              }}
            >
              <Icon name="users" size={15} />
              초대 코드로 참여
            </DropdownButton>
            <DropdownLink href="/projects" onSelect={close}>
              <span className="text-sub">
                <Icon name="board" size={15} />
              </span>
              <span className="text-sub">모든 프로젝트 보기</span>
            </DropdownLink>
          </>
        )}
      </Dropdown>
      <NewProjectModal open={modal === "new"} onClose={() => setModal(null)} />
      <JoinProjectModal open={modal === "join"} onClose={() => setModal(null)} />
    </>
  );
}
