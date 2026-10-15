import { addDays, daysBetween, formatShort, weekdayOf } from "@/lib/dates";
import type { Poll, PollResponse } from "./types";

/** 투표 기간 상한 (규칙과 같음) */
export const MAX_POLL_DAYS = 14;

export function slotKey(date: string, hour: number): string {
  return `${date}T${String(hour).padStart(2, "0")}`;
}

export function pollDays(poll: Pick<Poll, "startDate" | "endDate">): string[] {
  const n = daysBetween(poll.startDate, poll.endDate) + 1;
  return Array.from({ length: n }, (_, i) => addDays(poll.startDate, i));
}

export function pollHours(poll: Pick<Poll, "startHour" | "endHour">): number[] {
  return Array.from({ length: poll.endHour - poll.startHour }, (_, i) => poll.startHour + i);
}

/** 칸마다 가능한 사람 uid 목록 */
export function availabilityMap(responses: PollResponse[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const r of responses) {
    for (const s of r.slots) map.set(s, [...(map.get(s) ?? []), r.uid]);
  }
  return map;
}

export interface Recommendation {
  date: string;
  hour: number;
  /** 회의 길이 내내 가능한 사람 */
  people: string[];
}

/**
 * 회의 길이(1 · 2시간)만큼 연속으로 가능한 시간 중 사람 수가 많은 순, 같으면 이른 순.
 * 연속 구간 전체에 모두 가능한 사람만 센다 (한 칸만 되는 사람은 제외).
 */
export function recommend(poll: Poll, responses: PollResponse[], limit = 3): Recommendation[] {
  const sets = responses.map((r) => ({ uid: r.uid, slots: new Set(r.slots) }));
  const result: Recommendation[] = [];
  for (const date of pollDays(poll)) {
    for (let hour = poll.startHour; hour + poll.durationHours <= poll.endHour; hour++) {
      const people = sets
        .filter((s) => Array.from({ length: poll.durationHours }, (_, k) => slotKey(date, hour + k)).every((key) => s.slots.has(key)))
        .map((s) => s.uid);
      if (people.length > 0) result.push({ date, hour, people });
    }
  }
  result.sort((a, b) => b.people.length - a.people.length || a.date.localeCompare(b.date) || a.hour - b.hour);
  return result.slice(0, limit);
}

/** "10/20(화) 19:00–21:00" */
export function formatSlot(date: string, hour: number, durationHours: number): string {
  return `${formatShort(date)}(${weekdayOf(date)}) ${String(hour).padStart(2, "0")}:00–${String(hour + durationHours).padStart(2, "0")}:00`;
}
