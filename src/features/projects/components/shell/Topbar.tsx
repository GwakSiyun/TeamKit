"use client";

import Link from "next/link";
import { BackLink } from "@/components/common/BackLink";
import { AvatarStack } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { projectBase } from "../../navigation";
import { useCurrentProject } from "../../ProjectContext";

export function Topbar() {
  const { project, members } = useCurrentProject();

  return (
    <header className="flex h-[46px] shrink-0 items-center justify-between gap-3 pr-4 pl-6 text-sm md:pl-12">
      <BackLink href="/projects" label="내 프로젝트로 돌아가기" />
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
