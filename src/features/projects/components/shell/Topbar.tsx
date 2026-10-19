"use client";

import Link from "next/link";
import { BackLink } from "@/components/common/BackLink";
import { AvatarStack } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { projectBase } from "../../navigation";
import { useCurrentProject } from "../../ProjectContext";
import { MobileNav } from "./MobileNav";

export function Topbar() {
  const { project, members } = useCurrentProject();

  return (
    <header className="flex h-[46px] shrink-0 items-center justify-between gap-3 pr-3 pl-4 text-sm md:pr-4 md:pl-12">
      <div className="flex min-w-0 items-center gap-1">
        <MobileNav />
        <BackLink href="/projects" label="내 프로젝트로 돌아가기" />
      </div>
      <div className="flex items-center gap-2.5">
        <span className="hidden sm:inline-flex">
          <AvatarStack people={members} />
        </span>
        <Link href={`${projectBase(project.id)}/settings`} className={buttonClass("ghost", "h-7")}>
          <Icon name="users" size={15} />
          초대
        </Link>
      </div>
    </header>
  );
}
