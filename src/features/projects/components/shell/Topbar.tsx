"use client";

import { usePathname } from "next/navigation";
import { BackLink } from "@/components/common/BackLink";
import { AvatarStack } from "@/components/ui/Avatar";
import { useCurrentProject } from "../../ProjectContext";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { ShareInviteButton } from "../ShareInviteButton";
import { MobileNav } from "./MobileNav";

export function Topbar() {
  const { project, members } = useCurrentProject();
  // 상세 화면(/p/{id}/polls/{pollId} · /meetings/{id} · /meetings/new)은 본문에 "목록으로" 뒤로가기가 따로 있다
  // → 위에도 "내 프로젝트로" 뒤로가기를 두면 뒤로가기가 두 개 보이고 서로 다른 곳으로 가서 헷갈림
  const hasOwnBackLink = (usePathname() ?? "").split("/").filter(Boolean).length > 3;

  return (
    <header className="flex h-[46px] shrink-0 items-center justify-between gap-3 pr-3 pl-4 text-sm md:pr-4 md:pl-12">
      <div className="flex min-w-0 items-center gap-1">
        <MobileNav />
        {!hasOwnBackLink && <BackLink href="/projects" label="내 프로젝트로 돌아가기" />}
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
