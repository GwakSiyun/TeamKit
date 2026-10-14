/** 할 일마다 고정된 파스텔 색 (간트 막대 · 목록 밑줄 공통). 빨강은 지연 · 긴박 표시용이라 뺀다 */
const PALETTE = [
  { bg: "#C6DCF5", fg: "#183A5E" },
  { bg: "#CDEBD2", fg: "#1C4A2B" },
  { bg: "#FBE3A6", fg: "#5A4110" },
  { bg: "#F9CFB0", fg: "#5C2E10" },
  { bg: "#DDD0F0", fg: "#3D2766" },
  { bg: "#F5CFE0", fg: "#5C1F3B" },
  { bg: "#C8E8E5", fg: "#16443F" },
] as const;

export type TaskColor = (typeof PALETTE)[number];

/** task id 해시 → 항상 같은 색 */
export function taskColor(taskId: string): TaskColor {
  let hash = 0;
  for (const ch of taskId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
