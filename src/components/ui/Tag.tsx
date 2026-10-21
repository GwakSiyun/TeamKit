import type { ReactNode } from "react";

export type TagTone = "gray" | "blue" | "green" | "yellow" | "red" | "purple" | "orange" | "redSolid";

// 디자인 캔버스의 노션 태그 색 (배경 · 글자)
const TONES: Record<TagTone, string> = {
  gray: "bg-tint-gray text-tint-gray-fg",
  blue: "bg-tint-blue text-tint-blue-fg",
  green: "bg-tint-green text-tint-green-fg",
  yellow: "bg-tint-yellow text-tint-yellow-fg",
  red: "bg-tint-red text-tint-red-fg",
  purple: "bg-tint-purple text-tint-purple-fg",
  orange: "bg-tint-orange text-tint-orange-fg",
  // 이미 늦은 것처럼 연한 빨강(임박)과 확실히 구분해야 할 때
  redSolid: "bg-danger font-semibold text-white",
};

export function Tag({ tone = "gray", children }: { tone?: TagTone; children: ReactNode }) {
  return <span className={`inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}
