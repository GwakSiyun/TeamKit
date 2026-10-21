"use client";

import { BackLink } from "@/components/common/BackLink";
import { AvatarStack } from "@/components/ui/Avatar";
import { useCurrentProject } from "../../ProjectContext";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { ShareInviteButton } from "../ShareInviteButton";
import { MobileNav } from "./MobileNav";

export function Topbar() {
  const { project, members } = useCurrentProject();

  return (
    <header className="flex h-[46px] shrink-0 items-center justify-between gap-3 pr-3 pl-4 text-sm md:pr-4 md:pl-12">
      <div className="flex min-w-0 items-center gap-1">
        <MobileNav />
        <BackLink href="/projects" label="내 프로젝트로 돌아가기" />
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <NotificationBell />
        <span className="hidden sm:inline-flex">
          <AvatarStack people={members} />
        </span>
        <ShareInviteButton project={project} label="초대" variant="ghost" extra="h-7" />
      </div>
    </header>
  );
}
