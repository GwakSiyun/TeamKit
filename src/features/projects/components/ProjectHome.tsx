"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { useProject } from "../hooks";
import { NoAccess } from "./NoAccess";

/** TODO(다음 PR): 사이드바·상단바가 있는 프로젝트 내부 화면. 지금은 접근 확인 + 초대 코드 공유용 임시 화면 */
export function ProjectHome() {
  const { projectId } = useParams<{ projectId: string }>();
  const state = useProject(projectId);
  const [copied, setCopied] = useState(false);

  if (state.status === "loading") return <p className="py-12 text-center text-sm text-muted">불러오는 중…</p>;
  if (state.status === "denied") return <NoAccess />;
  if (state.status === "error") return <Notice tone="error">프로젝트를 불러오지 못했어요. 새로고침해주세요.</Notice>;

  const { project } = state;

  async function copyCode(): Promise<void> {
    await navigator.clipboard.writeText(project.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-bold">{project.name}</h1>
        <p className="text-sm text-muted">팀원 {project.memberIds.length}명</p>
      </div>
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
      <Notice tone="info">할 일 보드 · 회의록 · 일정 맞추기 화면은 다음 작업에서 이 프로젝트 안에 붙어요.</Notice>
    </div>
  );
}
