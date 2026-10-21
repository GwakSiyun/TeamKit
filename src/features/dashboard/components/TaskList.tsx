"use client";

import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { Task } from "@/features/tasks/types";

interface TaskListProps {
  tasks: Task[];
  nameOf: (uid: string | null) => string | null;
  /** 오른쪽에 붙일 내용 (마감일 · 태그 등) */
  trailing: (task: Task) => ReactNode;
  empty: string;
  onOpenTask: (taskId: string) => void;
}

/** 대시보드 아래 목록 (마감 임박 · 최근 변경) */
export function TaskList({ tasks, nameOf, trailing, empty, onOpenTask }: TaskListProps) {
  if (tasks.length === 0) return <p className="px-2 py-3 text-[13px] text-muted">{empty}</p>;
  return (
    <ul className="flex flex-col">
      {tasks.map((t) => {
        const name = nameOf(t.assigneeId);
        return (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onOpenTask(t.id)}
              className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 rounded border-b border-divider px-2 py-2 text-left text-sm hover:bg-side"
            >
              <span className="truncate">{t.title}</span>
              {t.assigneeId && name ? <Avatar seed={t.assigneeId} name={name} size={20} /> : <span />}
              <span className="flex items-center gap-1.5 text-xs text-muted tabular-nums">{trailing(t)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
