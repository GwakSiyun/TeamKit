"use client";

import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { STATUS_META, nextStatus, prevStatus } from "../constants";
import { useCurrentProject } from "@/features/projects/ProjectContext";
import { changeStatus } from "../services";
import type { Task } from "../types";

/** ← 이전 상태 / 다음 상태 → 버튼 (카드 · 상세 모달 공통) */
export function StatusButtons({ projectId, task, size = "mini" }: { projectId: string; task: Task; size?: "mini" | "normal" }) {
  const { project } = useCurrentProject();
  const [pending, setPending] = useState(false);
  const prev = prevStatus(task.status);
  const next = nextStatus(task.status);
  const cls = size === "mini" ? buttonClass("ghost", "h-6 gap-0.5 px-1.5 text-xs") : buttonClass("secondary", "h-7 gap-0.5 px-2 text-xs");

  async function move(to: NonNullable<typeof prev>): Promise<void> {
    setPending(true);
    await changeStatus({ id: projectId, name: project.name }, task, to);
    setPending(false);
  }

  return (
    <div className="flex gap-0.5">
      {prev && (
        <button type="button" disabled={pending} onClick={() => move(prev)} className={cls} aria-label={`${STATUS_META[prev].label}(으)로 되돌리기`}>
          <Icon name="left" size={13} />
          {STATUS_META[prev].label}
        </button>
      )}
      {next && (
        <button type="button" disabled={pending} onClick={() => move(next)} className={cls} aria-label={`${STATUS_META[next].label}(으)로 옮기기`}>
          {STATUS_META[next].label}
          <Icon name="right" size={13} />
        </button>
      )}
    </div>
  );
}
