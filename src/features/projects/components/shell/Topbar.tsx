"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AvatarStack } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { activeNavItem, projectBase } from "../../navigation";
import { useCurrentProject } from "../../ProjectContext";

export function Topbar() {
  const { project, members } = useCurrentProject();
  const pathname = usePathname();
  const current = activeNavItem(pathname, project.id);

  return (
    <header className="flex h-[46px] shrink-0 items-center justify-between gap-3 pr-4 pl-6 text-sm">
      <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-muted">
        <Link href="/projects" className="md:hidden hover:text-ink" aria-label="내 프로젝트 목록으로">
          <Icon name="arrowLeft" />
        </Link>
        <Link href={projectBase(project.id)} className="truncate hover:text-ink">
          {project.name}
        </Link>
        {current && (
          <>
            <span className="text-faint">/</span>
            <span className="text-ink">{current.label}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <AvatarStack people={members} />
        <Link href={`${projectBase(project.id)}/settings`} className={buttonClass("ghost", "h-7")}>
          <Icon name="users" size={15} />
          초대
        </Link>
      </div>
    </header>
  );
}
