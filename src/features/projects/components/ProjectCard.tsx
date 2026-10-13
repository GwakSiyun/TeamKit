import Link from "next/link";
import type { Project } from "../types";

export function ProjectCard({ project, isOwner }: { project: Project; isOwner: boolean }) {
  return (
    <Link
      href={`/p/${project.id}`}
      className="flex flex-col gap-3.5 rounded-lg border border-line bg-white p-4 text-ink transition-shadow hover:shadow-[0_2px_6px_rgba(15,15,15,0.08)] focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[7px] border border-line bg-side font-bold">
          {project.name.slice(0, 1)}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-bold">{project.name}</span>
          <span className="text-xs text-muted">
            팀원 {project.memberIds.length}명{isOwner ? " · 내가 만든 프로젝트" : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
