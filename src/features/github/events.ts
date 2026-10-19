import type { TagTone } from "@/components/ui/Tag";
import type { GithubEvent } from "./hooks";

/** 활동 종류 → 표시 이름 · 태그 색 (GitHub 연동 화면 · 대시보드 공통) */
export function eventMeta(e: Pick<GithubEvent, "type" | "prState">): { label: string; tone: TagTone } {
  if (e.type === "create") return { label: "브랜치 생성", tone: "gray" };
  if (e.type === "push") return { label: "커밋", tone: "blue" };
  if (e.prState === "merged") return { label: "PR 머지", tone: "purple" };
  if (e.prState === "closed") return { label: "PR 닫힘", tone: "gray" };
  if (e.prState === "open") return { label: "PR 열림", tone: "yellow" };
  return { label: "PR", tone: "yellow" };
}
