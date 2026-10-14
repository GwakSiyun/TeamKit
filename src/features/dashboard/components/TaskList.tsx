"use client";

import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { Task } from "@/features/tasks/types";
import { taskColor } from "../colors";

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
              className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 rounded border-b border-[#F1F1EF] px-2 py-2 text-left text-sm hover:bg-side"
            >
              {/* 제목 배경 = 간트 막대와 같은 색 → 차트에서 어떤 막대인지 바로 찾게 */}
              <span
                className="min-w-0 justify-self-start truncate rounded px-2 py-0.5 font-medium"
                style={{ background: taskColor(t.id).bg, color: taskColor(t.id).fg }}
              >
                {t.title}
              </span>
              {t.assigneeId && name ? <Avatar seed={t.assigneeId} name={name} size={20} /> : <span />}
              <span className="flex items-center gap-1.5 text-xs text-muted tabular-nums">{trailing(t)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
