"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { Tag } from "@/components/ui/Tag";
import { useCurrentProject } from "@/features/projects/ProjectContext";
import { projectBase } from "@/features/projects/navigation";
import { formatDateTime } from "@/lib/dates";
import { formatClock } from "../extract";
import { useMeetings } from "../hooks";
import type { Meeting } from "../types";
import { KeywordGuide } from "./KeywordGuide";

// 넓은 화면(lg)은 표, 좁은 화면은 제목 한 줄 + 나머지를 줄바꿈으로 (가로 스크롤 없이)
const GRID = "lg:grid lg:grid-cols-[minmax(160px,2fr)_0.9fr_0.9fr_1.2fr_28px] lg:items-center lg:gap-3";
const ROW = "flex flex-wrap items-center gap-x-3 gap-y-1.5";

function SourceLabel({ meeting }: { meeting: Meeting }) {
  return meeting.source === "audio" ? (
    <span className="flex items-center gap-1 text-sub">
      <Icon name="mic" size={14} />
      {meeting.durationSec !== null ? formatClock(meeting.durationSec) : "녹음"}
    </span>
  ) : (
    <span className="flex items-center gap-1 text-sub">
      <Icon name="doc" size={14} />
      직접 입력
    </span>
  );
}

export function MeetingsView() {
  const { project, members } = useCurrentProject();
  const state = useMeetings(project.id);
  const base = `${projectBase(project.id)}/meetings`;
  const nameOf = (id: string): string => members.find((m) => m.id === id)?.name ?? "알 수 없음";

  const newButton = (
    <Link href={`${base}/new`} className={buttonClass("primary")}>
      <Icon name="plus" size={15} />새 회의록
    </Link>
  );

  return (
    <>
      <PageHeader title="회의록" description="녹음하면 텍스트로 바꾸고 결정사항 · 할 일 후보를 찾아줘요" actions={newButton} />

      {state.status === "loading" && <p className="py-12 text-center text-sm text-muted">불러오는 중…</p>}
      {state.status === "error" && <Notice tone="error">회의록을 불러오지 못했어요. 새로고침해주세요.</Notice>}
      {state.status === "ready" && state.meetings.length === 0 && (
        <>
          <EmptyState
            icon={<Icon name="mic" size={22} />}
            title="아직 회의록이 없어요"
            description="회의를 녹음하거나 녹음 파일 · 메모를 올리면, 결정사항과 할 일 후보를 찾아 보드에 바로 추가할 수 있어요."
            actions={newButton}
          />
          <KeywordGuide />
        </>
      )}
      {state.status === "ready" && state.meetings.length > 0 && (
        <div className="overflow-x-auto">
          <div className="lg:min-w-[620px]">
            <div className={`hidden ${GRID} border-b border-line px-2 py-2 text-[13px] text-muted`}>
              <span>제목</span>
              <span>날짜</span>
              <span>방식</span>
              <span>후보</span>
              <span className="sr-only">작성자</span>
            </div>
            {state.meetings.map((m) => {
              const added = m.actionItems.filter((a) => a.taskNumber !== null).length;
              return (
                <Link key={m.id} href={`${base}/${m.id}`} className={`${ROW} ${GRID} rounded border-b border-[#F1F1EF] px-2 py-2.5 text-sm tabular-nums hover:bg-side`}>
                  <span className="w-full truncate font-semibold lg:w-auto">{m.title}</span>
                  <span className="text-sub">{m.createdAt ? formatDateTime(m.createdAt.toDate()) : "—"}</span>
                  <SourceLabel meeting={m} />
                  <span className="flex flex-wrap gap-1">
                    <Tag tone="green">결정 {m.decisions.length}</Tag>
                    <Tag tone="blue">
                      할 일 {m.actionItems.length}
                      {added > 0 && ` · ${added} 추가됨`}
                    </Tag>
                  </span>
                  <Avatar seed={m.createdBy} name={nameOf(m.createdBy)} size={22} />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
