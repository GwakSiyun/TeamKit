import type { ReactNode } from "react";

export type TagTone = "gray" | "blue" | "green" | "yellow" | "red" | "purple" | "orange" | "redSolid";

// 디자인 캔버스의 노션 태그 색 (배경 · 글자)
const TONES: Record<TagTone, string> = {
  gray: "bg-[#E3E2E0] text-[#32302C]",
  blue: "bg-[#D3E5EF] text-[#183347]",
  green: "bg-[#DBEDDB] text-[#1C3829]",
  yellow: "bg-[#FDECC8] text-[#402C1B]",
  red: "bg-[#FFE2DD] text-[#5D1715]",
  purple: "bg-[#E8DEEE] text-[#412454]",
  orange: "bg-[#FADEC9] text-[#49290E]",
  // 이미 늦은 것처럼 연한 빨강(임박)과 확실히 구분해야 할 때
  redSolid: "bg-danger font-semibold text-white",
};

export function Tag({ tone = "gray", children }: { tone?: TagTone; children: ReactNode }) {
  return (
    <span className={`inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>
  );
}
