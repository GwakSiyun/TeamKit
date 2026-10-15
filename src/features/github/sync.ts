import { TASK_KEY_PREFIX } from "@/features/tasks/constants";
import type { TaskStatus } from "@/features/tasks/types";

/** 브랜치 · 커밋 메시지 · PR 제목에서 카드 번호(TM-12) 찾기. 대소문자 무시, 중복 제거 */
export function taskNumbersIn(...texts: Array<string | null | undefined>): number[] {
  const re = new RegExp(`\\b${TASK_KEY_PREFIX}-(\\d+)\\b`, "gi");
  const found = new Set<number>();
  for (const text of texts) {
    if (!text) continue;
    for (const m of text.matchAll(re)) found.add(Number(m[1]));
  }
  return [...found].sort((a, b) => a - b);
}

const ORDER: Record<TaskStatus, number> = { todo: 0, doing: 1, done: 2 };

/** 상태는 앞으로만 간다 (완료된 카드에 커밋이 와도 진행 중으로 되돌리지 않음). 바꿀 게 없으면 null */
export function forwardStatus(current: TaskStatus, target: TaskStatus): TaskStatus | null {
  return ORDER[target] > ORDER[current] ? target : null;
}

export type PrState = "open" | "merged" | "closed";

/** "owner/repo" → 문서 ID ("/" 는 문서 ID 에 못 씀) */
export function repoDocId(fullName: string): string {
  return fullName.toLowerCase().replace("/", "__");
}
