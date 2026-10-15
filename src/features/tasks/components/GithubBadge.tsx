import { Icon } from "@/components/ui/Icon";
import { Tag, type TagTone } from "@/components/ui/Tag";
import type { Task } from "../types";

const PR_META: Record<"open" | "merged" | "closed", { label: string; tone: TagTone }> = {
  open: { label: "리뷰 중", tone: "yellow" },
  merged: { label: "머지됨", tone: "purple" },
  closed: { label: "닫힘", tone: "gray" },
};

/** 카드 · 상세 공통: PR 이 있으면 "PR #9 · 리뷰 중", 브랜치만 있으면 "브랜치" (웹훅 서버가 붙인 정보) */
export function GithubBadge({ task, linked = false }: { task: Pick<Task, "branch" | "github">; linked?: boolean }) {
  if (task.github) {
    const meta = PR_META[task.github.prState];
    const tag = (
      <Tag tone={meta.tone}>
        <Icon name="github" size={11} />
        PR #{task.github.prNumber} · {meta.label}
      </Tag>
    );
    return linked ? (
      <a href={task.github.prUrl} target="_blank" rel="noreferrer" className="hover:opacity-80">
        {tag}
      </a>
    ) : (
      tag
    );
  }
  if (task.branch) {
    return (
      <Tag>
        <Icon name="github" size={11} />
        브랜치
      </Tag>
    );
  }
  return null;
}
