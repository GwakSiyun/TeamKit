"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { Tag } from "@/components/ui/Tag";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCurrentProject } from "@/features/projects/ProjectContext";
import { useTransientState } from "@/hooks/useTransientState";
import { todayISO } from "@/lib/dates";
import { STATUS_META, STATUS_ORDER } from "../constants";
import { useTasks } from "../hooks";
import { TaskCard } from "./TaskCard";
import { TaskDetailModal } from "./TaskDetailModal";
import { TaskFormModal } from "./TaskFormModal";

type Filter = "all" | "mine";
/** 열린 모달: 새로 만들기 / 상세 / 수정 */
type OpenModal = { kind: "create" } | { kind: "detail"; taskId: string } | { kind: "edit"; taskId: string } | null;

export function BoardView() {
  const { project, members } = useCurrentProject();
  const { user } = useAuth();
  const state = useTasks(project.id);
  const [filter, setFilter] = useState<Filter>("all");
  const [modal, setModal] = useTransientState<OpenModal>(null);
  // 알림에서 들어오면 ?task=할일ID 로 그 할 일 상세를 바로 연다 (닫으면 주소에서 지움)
  const searchParams = useSearchParams();
  const router = useRouter();
  const linkedTaskId = searchParams.get("task");
  const current: OpenModal = modal ?? (linkedTaskId ? { kind: "detail", taskId: linkedTaskId } : null);
  function closeModal(): void {
    setModal(null);
    if (linkedTaskId) router.replace(`/p/${project.id}/board`);
  }
  const today = todayISO();
  const nameOf = (uid: string | null): string | null => (uid ? (members.find((m) => m.id === uid)?.name ?? null) : null);

  const tasks = state.status === "ready" ? state.tasks : [];
  const mine = tasks.filter((t) => t.assigneeId === user?.uid);
  const shown = filter === "mine" ? mine : tasks;
  const selected = current && current.kind !== "create" ? (tasks.find((t) => t.id === current.taskId) ?? null) : null;

  const tab = (value: Filter, label: string, count: number) => (
    <button
      type="button"
      role="tab"
      aria-selected={filter === value}
      onClick={() => setFilter(value)}
      // 공통 ghost 버튼은 bg-transparent 라 선택 배경이 덮이므로, 탭은 선택 여부에 따라 클래스를 따로 준다
      className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
        filter === value ? "bg-hover font-semibold text-ink" : "text-sub hover:bg-hover hover:text-ink"
      }`}
    >
      {label} <span className="text-faint">{count}</span>
    </button>
  );

  return (
    <>
      <PageHeader title="할 일" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
        <div role="tablist" className="flex gap-1">
          {tab("all", "전체", tasks.length)}
          {tab("mine", "내 할 일", mine.length)}
        </div>
        <button type="button" onClick={() => setModal({ kind: "create" })} className={buttonClass("primary", "h-[30px]")}>
          <Icon name="plus" size={15} />새 할 일
        </button>
      </div>

      {state.status === "loading" && <p className="py-12 text-center text-sm text-muted">불러오는 중…</p>}
      {state.status === "error" && <Notice tone="error">할 일을 불러오지 못했어요. 새로고침해주세요.</Notice>}
      {state.status === "ready" && tasks.length === 0 && (
        <Notice tone="info">
          첫 할 일을 만들어 보세요. 카드 번호는 <b className="font-mono">TM-1</b>부터 붙어요. GitHub 레포를 연결하고 브랜치 이름이나 커밋 메시지에 카드 번호를
          넣으면 카드가 자동으로 진행 중 · 완료로 움직여요.
        </Notice>
      )}

      {state.status === "ready" && (
        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-3">
          {STATUS_ORDER.map((status) => {
            const column = shown.filter((t) => t.status === status);
            return (
              <section key={status} aria-label={STATUS_META[status].label} className="flex min-w-0 flex-col gap-2 rounded-lg bg-side p-2">
                <div className="flex items-center gap-2 px-1 pt-0.5 pb-1">
                  <Tag tone={STATUS_META[status].tone}>{STATUS_META[status].label}</Tag>
                  <span className="text-[13px] text-muted">{column.length}</span>
                </div>
                {column.map((task) => (
                  <TaskCard
                    key={task.id}
                    projectId={project.id}
                    task={task}
                    assigneeName={nameOf(task.assigneeId)}
                    today={today}
                    onOpen={() => setModal({ kind: "detail", taskId: task.id })}
                  />
                ))}
                {column.length === 0 && <div className="h-16 rounded-md border border-dashed border-dashed" />}
                {status === "todo" && (
                  <button type="button" onClick={() => setModal({ kind: "create" })} className={buttonClass("ghost", "justify-start text-muted")}>
                    <Icon name="plus" size={14} />새로 만들기
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}

      {current?.kind === "create" && <TaskFormModal open onClose={closeModal} />}
      {current?.kind === "edit" && selected && (
        <TaskFormModal open task={selected} onClose={() => setModal({ kind: "detail", taskId: selected.id })} />
      )}
      {current?.kind === "detail" && selected && (
        <TaskDetailModal task={selected} today={today} onClose={closeModal} onEdit={() => setModal({ kind: "edit", taskId: selected.id })} />
      )}
    </>
  );
}
