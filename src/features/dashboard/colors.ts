import { lateDays } from "@/features/tasks/deadline";
import type { Task } from "@/features/tasks/types";

/** 간트 막대 색 = 상태별 (디자인 캔버스 범례와 같음). 지연은 상태보다 우선 */
export const BAR_COLORS = {
  todo: { bg: "#D3D1CB", fg: "#37352F", label: "할 일" },
  doing: { bg: "#2383E2", fg: "#FFFFFF", label: "진행 중" },
  done: { bg: "#4DAB9A", fg: "#FFFFFF", label: "완료" },
  late: { bg: "#E03E3E", fg: "#FFFFFF", label: "지연" },
} as const;

export type BarKind = keyof typeof BAR_COLORS;

export function barKind(task: Task, today: string): BarKind {
  if (task.status === "done") return "done";
  if (lateDays(task, today) > 0) return "late";
  return task.status;
}

/** 마일스톤(1차 배포 등) 날짜 칸 */
export const MILESTONE_COLOR = { bg: "#FDF0EF", line: "#E03E3E" } as const;
