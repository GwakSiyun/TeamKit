"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { useCurrentProject } from "../ProjectContext";
import { DangerZone } from "./DangerZone";

const COPIED_MS = 1500;

export function ProjectSettingsView() {
  const { project, members } = useCurrentProject();
  const [copied, setCopied] = useState(false);

  async function copyCode(): Promise<void> {
    await navigator.clipboard.writeText(project.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <>
      <PageHeader title="프로젝트 설정" />

      <section className="flex flex-col gap-3">
        <h2 className="border-b border-line pb-1.5 text-base font-bold">초대 코드</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-side px-3.5 py-1.5 font-mono text-2xl tracking-[0.2em]">{project.inviteCode}</span>
          <button type="button" onClick={copyCode} className={buttonClass("secondary")}>
            <Icon name={copied ? "check" : "copy"} size={15} />
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
        <p className="text-xs text-muted">팀원이 &lsquo;초대 코드로 참여&rsquo;에 이 코드를 입력하면 프로젝트에 들어와요.</p>
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="border-b border-line pb-1.5 text-base font-bold">
          멤버 <span className="font-normal text-muted">{project.memberIds.length}</span>
        </h2>
        <ul className="flex flex-col">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 border-b border-[#F1F1EF] px-2 py-2 text-[13px]">
              <Avatar seed={m.id} name={m.name} size={22} />
              <span className="w-32 truncate font-medium">{m.name}</span>
              <span className="flex-1 truncate text-sub">{m.email}</span>
              {m.id === project.ownerId ? (
                <span className="rounded bg-[#FADEC9] px-1.5 py-0.5 text-[11px] font-medium text-[#49290E]">만든 사람</span>
              ) : (
                <span className="rounded bg-[#E3E2E0] px-1.5 py-0.5 text-[11px] font-medium text-[#32302C]">멤버</span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">이름 변경 · 초대 코드 재발급 · 멤버 내보내기는 다음 작업에서 추가돼요.</p>
      </section>

      <DangerZone />
    </>
  );
}
