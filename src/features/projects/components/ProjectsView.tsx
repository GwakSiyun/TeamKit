"use client";

import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { useAuth } from "@/features/auth/AuthProvider";
import { useTransientState } from "@/hooks/useTransientState";
import { useMyProjects } from "../hooks";
import { JoinProjectModal } from "./JoinProjectModal";
import { NewProjectModal } from "./NewProjectModal";
import { ProjectCard } from "./ProjectCard";

type OpenModal = "new" | "join" | null;

/** AuthGate(signed-in) 안에서만 렌더된다 */
export function ProjectsView() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const list = useMyProjects(uid);
  const [modal, setModal] = useTransientState<OpenModal>(null);

  const actions = (
    <>
      <button type="button" onClick={() => setModal("join")} className={buttonClass("secondary")}>
        초대 코드로 참여
      </button>
      <button type="button" onClick={() => setModal("new")} className={buttonClass("primary")}>
        <Icon name="plus" size={15} />새 프로젝트
      </button>
    </>
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px] font-bold">내 프로젝트</h1>
          {list.status === "ready" && list.projects.length > 0 && (
            <p className="text-sm text-muted">참여 중인 프로젝트 {list.projects.length}개</p>
          )}
        </div>
        {list.status === "ready" && list.projects.length > 0 && <div className="flex gap-2">{actions}</div>}
      </div>

      {list.status === "loading" && <p className="py-12 text-center text-sm text-muted">불러오는 중…</p>}
      {list.status === "error" && <Notice tone="error">프로젝트 목록을 불러오지 못했어요. 새로고침해주세요.</Notice>}
      {list.status === "ready" && list.projects.length === 0 && (
        <EmptyState
          icon={<Icon name="board" size={22} />}
          title="아직 참여한 프로젝트가 없어요"
          description={
            <>
              프로젝트를 만들고 팀원에게 초대 코드를 공유하거나,
              <br />
              팀원에게 받은 초대 코드로 참여하세요.
            </>
          }
          actions={actions}
        />
      )}
      {list.status === "ready" && list.projects.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {list.projects.map((p) => (
            <ProjectCard key={p.id} project={p} isOwner={p.ownerId === uid} />
          ))}
        </div>
      )}

      <NewProjectModal open={modal === "new"} onClose={() => setModal(null)} />
      <JoinProjectModal open={modal === "join"} onClose={() => setModal(null)} />
    </>
  );
}
