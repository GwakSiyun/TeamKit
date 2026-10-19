"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { eventMeta } from "@/features/github/events";
import type { GithubEvent } from "@/features/github/hooks";
import { taskKey } from "@/features/tasks/constants";
import type { Task } from "@/features/tasks/types";
import { formatRelative } from "@/lib/dates";

interface GithubActivityProps {
  events: GithubEvent[];
  tasks: Task[];
  /** 레포가 연결돼 있는지 (없으면 연결 안내) */
  connected: boolean;
  githubHref: string;
  onOpenTask: (taskId: string) => void;
}

/** 대시보드 "최근 GitHub 활동": 브랜치 · 커밋 · PR 흐름과 연결된 카드 */
export function GithubActivity({ events, tasks, connected, githubHref, onOpenTask }: GithubActivityProps) {
  if (!connected) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-side px-4 py-3">
        <span className="text-[13px] text-sub">레포를 연결하면 브랜치 · 커밋 · PR 흐름이 여기에 쌓이고, 카드 상태도 자동으로 바뀌어요.</span>
        <Link href={githubHref} className={buttonClass("secondary", "h-7")}>
          <Icon name="github" size={14} />
          레포 연결
        </Link>
      </div>
    );
  }
  if (events.length === 0) {
    return <p className="px-2 py-3 text-[13px] text-muted">아직 받은 활동이 없어요. 브랜치 이름이나 커밋 메시지에 카드 번호(TM-1)를 넣어 보세요.</p>;
  }

  const taskByNumber = new Map(tasks.map((t) => [t.number, t]));
  return (
    <ul className="flex flex-col">
      {events.map((e) => {
        const meta = eventMeta(e);
        return (
          <li key={e.id} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-[#F1F1EF] px-2 py-2 text-sm sm:flex-nowrap">
            <Tag tone={meta.tone}>{meta.label}</Tag>
            <span className="min-w-0 flex-1 truncate">
              {e.url ? (
                <a href={e.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {e.title}
                </a>
              ) : (
                <span className="font-mono text-[13px]">{e.title}</span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {e.taskNumbers.map((n) => {
                const task = taskByNumber.get(n);
                return task ? (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onOpenTask(task.id)}
                    title={task.title}
                    className="cursor-pointer rounded bg-hover px-1.5 py-0.5 font-mono text-[11px] text-sub hover:text-ink"
                  >
                    {taskKey(n)}
                  </button>
                ) : (
                  <span key={n} className="px-1.5 font-mono text-[11px] text-faint" title="삭제됐거나 없는 카드">
                    {taskKey(n)}
                  </span>
                );
              })}
            </span>
            <span className="shrink-0 text-xs text-muted tabular-nums">
              {e.author}
              {e.at && ` · ${formatRelative(e.at.toDate())}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
