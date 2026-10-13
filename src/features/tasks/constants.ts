import type { TagTone } from "@/components/ui/Tag";
import type { TaskStatus } from "./types";

/** 카드 번호 앞글자. GitHub 브랜치 · 커밋 · PR 에서 "TM-12" 로 카드를 찾는다 */
export const TASK_KEY_PREFIX = "TM";

export function taskKey(number: number): string {
  return `${TASK_KEY_PREFIX}-${number}`;
}

export const STATUS_ORDER: readonly TaskStatus[] = ["todo", "doing", "done"];

export const STATUS_META: Record<TaskStatus, { label: string; tone: TagTone }> = {
  todo: { label: "할 일", tone: "gray" },
  doing: { label: "진행 중", tone: "blue" },
  done: { label: "완료", tone: "green" },
};

export function prevStatus(s: TaskStatus): TaskStatus | null {
  const i = STATUS_ORDER.indexOf(s);
  return i > 0 ? STATUS_ORDER[i - 1] : null;
}

export function nextStatus(s: TaskStatus): TaskStatus | null {
  const i = STATUS_ORDER.indexOf(s);
  return i < STATUS_ORDER.length - 1 ? STATUS_ORDER[i + 1] : null;
}

export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 2000;
