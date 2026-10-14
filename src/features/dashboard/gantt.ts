import { addDays, daysBetween } from "@/lib/dates";
import type { Member } from "@/features/projects/types";
import type { Task } from "@/features/tasks/types";

/** 간트에 그릴 기간 상한 (그 이상이면 오늘 기준으로 자른다) */
const MAX_DAYS = 56;
const MIN_DAYS = 21;
const LEAD_DAYS = 3;
const TAIL_DAYS = 7;

export interface GanttRange {
  start: string;
  days: string[];
}

export interface GanttBar {
  task: Task;
  /** 범위 안 0부터 시작하는 칸 번호 (양 끝 포함) */
  from: number;
  to: number;
  /** 범위 밖으로 잘린 쪽 */
  clippedStart: boolean;
  clippedEnd: boolean;
}

export interface GanttGroup {
  id: string;
  name: string;
  done: number;
  total: number;
  bars: GanttBar[];
}

/** 시작일만 있으면 하루짜리, 마감일만 있으면 마감일 하루짜리 막대 */
export function taskSpan(task: Pick<Task, "startDate" | "dueDate">): { start: string; end: string } | null {
  const start = task.startDate ?? task.dueDate;
  const end = task.dueDate ?? task.startDate;
  return start && end ? { start, end } : null;
}

function mondayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = 일
  return addDays(iso, dow === 0 ? -6 : 1 - dow);
}

/** 할 일 날짜들과 오늘을 모두 담는 범위. 월요일에서 시작, 최소 3주 · 최대 8주 */
export function ganttRange(tasks: Task[], today: string): GanttRange {
  const spans = tasks.map(taskSpan).filter((s): s is { start: string; end: string } => s !== null);
  let first = addDays(today, -LEAD_DAYS);
  let last = addDays(today, TAIL_DAYS);
  for (const s of spans) {
    if (s.start < first) first = s.start;
    if (s.end > last) last = s.end;
  }
  let start = mondayOf(first);
  let length = Math.max(MIN_DAYS, daysBetween(start, last) + 1);
  if (length > MAX_DAYS) {
    // 너무 길면 오늘이 앞쪽 1주 안에 오도록 자른다
    start = mondayOf(addDays(today, -7));
    length = MAX_DAYS;
  }
  length = Math.ceil(length / 7) * 7;
  return { start, days: Array.from({ length }, (_, i) => addDays(start, i)) };
}

export function ganttGroups(tasks: Task[], members: Member[], range: GanttRange): GanttGroup[] {
  const end = range.days[range.days.length - 1];
  const people: { id: string; name: string }[] = [...members, { id: "", name: "담당자 없음" }];

  return people
    .map((p) => {
      const own = tasks.filter((t) => (t.assigneeId ?? "") === p.id);
      const bars: GanttBar[] = [];
      for (const task of own) {
        const span = taskSpan(task);
        if (!span || span.end < range.start || span.start > end) continue;
        bars.push({
          task,
          from: Math.max(0, daysBetween(range.start, span.start)),
          to: Math.min(range.days.length - 1, daysBetween(range.start, span.end)),
          clippedStart: span.start < range.start,
          clippedEnd: span.end > end,
        });
      }
      bars.sort((a, b) => a.from - b.from || a.task.number - b.task.number);
      return { id: p.id, name: p.name, done: own.filter((t) => t.status === "done").length, total: own.length, bars };
    })
    .filter((g) => g.total > 0);
}
