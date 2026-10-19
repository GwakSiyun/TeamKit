"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { Tag } from "@/components/ui/Tag";
import { useCurrentProject } from "@/features/projects/ProjectContext";
import { projectBase } from "@/features/projects/navigation";
import { useTransientState } from "@/hooks/useTransientState";
import { formatShort } from "@/lib/dates";
import { usePolls } from "../hooks";
import { formatSlot } from "../slots";
import { PollFormModal } from "./PollFormModal";

// 넓은 화면(lg)은 표, 좁은 화면은 제목 한 줄 + 나머지를 줄바꿈으로 (가로 스크롤 없이)
const GRID = "lg:grid lg:grid-cols-[minmax(160px,2fr)_1.3fr_0.9fr_1.6fr] lg:items-center lg:gap-3";
const ROW = "flex flex-wrap items-center gap-x-3 gap-y-1.5";

export function PollsView() {
  const { project } = useCurrentProject();
  const state = usePolls(project.id);
  const [creating, setCreating] = useTransientState(false);

  const newButton = (
    <button type="button" onClick={() => setCreating(true)} className={buttonClass("primary")}>
      <Icon name="plus" size={15} />새 투표
    </button>
  );

  return (
    <>
      <PageHeader title="일정 맞추기" description="기간을 정하면 팀원이 되는 시간을 표시하고, 겹치는 시간을 추천해줘요" actions={newButton} />

      {state.status === "loading" && <p className="py-12 text-center text-sm text-muted">불러오는 중…</p>}
      {state.status === "error" && <Notice tone="error">투표를 불러오지 못했어요. 새로고침해주세요.</Notice>}
      {state.status === "ready" && state.polls.length === 0 && (
        <EmptyState
          icon={<Icon name="calendar" size={22} />}
          title="아직 투표가 없어요"
          description="회의할 기간을 정해 투표를 만들고, 팀원들이 되는 시간을 표시하게 하세요."
          actions={newButton}
        />
      )}
      {state.status === "ready" && state.polls.length > 0 && (
        <div className="overflow-x-auto">
          <div className="lg:min-w-[620px]">
            <div className={`hidden ${GRID} border-b border-line px-2 py-2 text-[13px] text-muted`}>
              <span>제목</span>
              <span>기간</span>
              <span>상태</span>
              <span>확정 시간</span>
            </div>
            {state.polls.map((p) => (
              <Link
                key={p.id}
                href={`${projectBase(project.id)}/polls/${p.id}`}
                className={`${ROW} ${GRID} rounded border-b border-[#F1F1EF] px-2 py-2.5 text-sm tabular-nums hover:bg-side`}
              >
                <span className="w-full truncate font-semibold lg:w-auto">{p.title}</span>
                <span className="text-sub">
                  {formatShort(p.startDate)} – {formatShort(p.endDate)}
                </span>
                <span>{p.status === "confirmed" ? <Tag tone="green">확정</Tag> : <Tag tone="blue">진행 중</Tag>}</span>
                <span className="text-sub">{p.confirmedSlot ? formatSlot(p.confirmedSlot.date, p.confirmedSlot.hour, p.durationHours) : "—"}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {creating && <PollFormModal onClose={() => setCreating(false)} />}
    </>
  );
}
