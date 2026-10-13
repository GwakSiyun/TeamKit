import { daysBetween } from "@/lib/dates";
import type { Task } from "./types";

/** 완료가 아닌데 마감일이 지났으면 지연 일수, 아니면 0 */
export function lateDays(task: Pick<Task, "status" | "dueDate">, today: string): number {
  if (task.status === "done" || !task.dueDate) return 0;
  return Math.max(0, daysBetween(task.dueDate, today));
}
