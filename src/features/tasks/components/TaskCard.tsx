"use client";

import { Avatar } from "@/components/ui/Avatar";
import { formatShort } from "@/lib/dates";
import { taskKey } from "../constants";
import { lateDays } from "../deadline";
import type { Task } from "../types";
import { GithubBadge } from "./GithubBadge";
import { StatusButtons } from "./StatusButtons";

interface TaskCardProps {
  projectId: string;
  task: Task;
  assigneeName: string | null;
  today: string;
  onOpen: () => void;
}

export function TaskCard({ projectId, task, assigneeName, today, onOpen }: TaskCardProps) {
  const late = lateDays(task, today);

  return (
    <article className="flex flex-col gap-2 rounded-md bg-white px-2.5 pt-2.5 pb-1.5 shadow-[0_0_0_1px_rgba(15,15,15,0.08),0_1px_2px_rgba(15,15,15,0.06)] transition-shadow hover:shadow-[0_0_0_1px_rgba(15,15,15,0.1),0_2px_6px_rgba(15,15,15,0.08)]">
      <button type="button" onClick={onOpen} className="cursor-pointer text-left text-sm leading-snug font-medium hover:underline hover:decoration-[#C9C7C2]">
        {task.title}
      </button>
      {(task.github || task.branch) && (
        <div className="flex flex-wrap gap-1">
          <GithubBadge task={task} />
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-xs text-muted">{taskKey(task.number)}</span>
          {task.assigneeId && assigneeName && <Avatar seed={task.assigneeId} name={assigneeName} size={18} />}
        </span>
        {task.dueDate &&
          (late > 0 ? (
            <span className="text-xs font-medium text-danger">
              {formatShort(task.dueDate)} · {late}일 지연
            </span>
          ) : (
            <span className="text-xs text-muted tabular-nums">~{formatShort(task.dueDate)}</span>
          ))}
      </div>
      <div className="flex justify-end border-t border-[#F1F1EF] pt-1">
        <StatusButtons projectId={projectId} task={task} />
      </div>
    </article>
  );
}
