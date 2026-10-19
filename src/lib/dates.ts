/** 날짜는 "YYYY-MM-DD" 문자열로 다룬다 (사용자 기기 시간대 기준 오늘) */

const DAY_MS = 24 * 60 * 60 * 1000;

export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** b - a (일) */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY_MS);
}

export function addDays(iso: string, days: number): string {
  const t = new Date(toUTC(iso) + days * DAY_MS);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function weekdayOf(iso: string): string {
  return WEEKDAYS[new Date(toUTC(iso)).getUTCDay()];
}

/** "2026-10-17" → "10/17" */
export function formatShort(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}/${d}`;
}

/** Firestore Timestamp 등 Date → "10/14 11:20" */
export function formatDateTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${date.getMonth() + 1}/${date.getDate()} ${hh}:${mm}`;
}

/** "방금" · "12분 전" · "3시간 전" · "어제" · "10/14" */
export function formatRelative(date: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return "방금";
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 60 * 24 && date.getDate() === now.getDate()) return `${Math.floor(minutes / 60)}시간 전`;
  const days = daysBetween(todayISO(date), todayISO(now));
  if (days === 1) return "어제";
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
