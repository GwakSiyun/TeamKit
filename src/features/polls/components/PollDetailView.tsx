"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { BackLink } from "@/components/common/BackLink";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { Tag } from "@/components/ui/Tag";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCurrentProject } from "@/features/projects/ProjectContext";
import { projectBase } from "@/features/projects/navigation";
import { useTransientState } from "@/hooks/useTransientState";
import { formatShort, weekdayOf } from "@/lib/dates";
import { usePoll, usePollResponses } from "../hooks";
import { availabilityMap, formatSlot, pollDays, pollHours, recommend, type Recommendation } from "../slots";
import { confirmPoll, deletePoll, reopenPoll, saveMySlots } from "../services";
import { Heatmap, HeatmapLegend } from "./Heatmap";

function Prop({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-[34px] grid-cols-[92px_minmax(0,1fr)] sm:grid-cols-[130px_minmax(0,1fr)] items-center gap-2">
      <span className="flex items-center gap-2 text-sm text-muted">
        <Icon name={icon} size={15} />
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2 text-sm">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="border-b border-line pb-1.5 text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

type Confirming = { kind: "confirm"; rec: Recommendation } | { kind: "reopen" } | { kind: "delete" } | null;

export function PollDetailView() {
  const { pollId } = useParams<{ pollId: string }>();
  const { project, members } = useCurrentProject();
  const { user } = useAuth();
  const router = useRouter();
  const state = usePoll(project.id, pollId);
  // 나간 · 내보낸 사람의 응답은 추천 계산에서 뺀다
  const allResponses = usePollResponses(project.id, pollId);
  const responses = useMemo(() => allResponses.filter((r) => project.memberIds.includes(r.uid)), [allResponses, project.memberIds]);
  // 내가 칠하는 중인 칸 (저장 전). null 이면 서버의 내 응답을 그대로 보여준다
  const [draft, setDraft] = useState<Set<string> | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirming, setConfirming] = useTransientState<Confirming>(null);

  const uid = user?.uid ?? "";
  const serverMine = useMemo(() => new Set(responses.find((r) => r.uid === uid)?.slots ?? []), [responses, uid]);
  const mine = draft ?? serverMine;
  // 내 칸은 저장 전 값으로 바꿔 계산 → 칠하는 즉시 색과 추천이 바뀐다
  const effective = useMemo(
    () => [...responses.filter((r) => r.uid !== uid), ...(uid ? [{ uid, slots: [...mine] }] : [])].filter((r) => r.slots.length > 0),
    [responses, uid, mine],
  );
  const avail = useMemo(() => availabilityMap(effective), [effective]);

  const commit = useCallback(
    async (next: Set<string>) => {
      setSaveState("saving");
      const result = await saveMySlots(project.id, pollId, [...next]);
      setSaveState(result.ok ? "saved" : "error");
      if (result.ok) setDraft(null);
    },
    [project.id, pollId],
  );

  if (state.status === "loading") return <p className="py-12 text-center text-sm text-muted">불러오는 중…</p>;
  if (state.status === "missing") {
    return (
      <>
        <BackLink href={`${projectBase(project.id)}/polls`} label="투표 목록으로" />
        <Notice tone="error">투표를 찾을 수 없어요. 삭제됐을 수 있어요.</Notice>
      </>
    );
  }

  const poll = state.poll;
  const isCreator = poll.createdBy === uid;
  const canDelete = isCreator || project.ownerId === uid;
  const confirmed = poll.status === "confirmed";
  const recs = recommend(poll, effective);
  const respondedIds = new Set(effective.map((r) => r.uid));
  const nameOf = (id: string): string => members.find((m) => m.id === id)?.name ?? "알 수 없음";
  const total = project.memberIds.length;
  const missing = members.filter((m) => !respondedIds.has(m.id));

  async function run(action: () => Promise<{ ok: boolean; message?: string }>): Promise<string | null> {
    const result = await action();
    return result.ok ? null : (result.message ?? "요청을 처리하지 못했어요.");
  }

  return (
    <>
      <BackLink href={`${projectBase(project.id)}/polls`} label="투표 목록으로" />
      <PageHeader
        title={poll.title}
        actions={
          canDelete && (
            <button
              type="button"
              onClick={() => setConfirming({ kind: "delete" })}
              className="inline-flex h-8 cursor-pointer items-center rounded-md px-3 text-sm font-medium text-danger hover:bg-[#FFF5F4]"
            >
              삭제
            </button>
          )
        }
      />
      <div className="-mt-2 flex flex-col">
        <Prop icon="calendar" label="기간">
          <span className="tabular-nums">
            {formatShort(poll.startDate)}({weekdayOf(poll.startDate)}) → {formatShort(poll.endDate)}({weekdayOf(poll.endDate)}) · {String(poll.startHour).padStart(2, "0")}
            :00–{String(poll.endHour).padStart(2, "0")}:00
          </span>
        </Prop>
        <Prop icon="board" label="회의 길이">
          {poll.durationHours}시간
        </Prop>
        <Prop icon="users" label="응답">
          <span className="tabular-nums">
            {respondedIds.size}/{total}명
          </span>
          {confirmed ? <Tag tone="green">확정</Tag> : <Tag tone="blue">진행 중</Tag>}
        </Prop>
      </div>

      {confirmed && poll.confirmedSlot && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#EEF6F1] px-4 py-3 text-[#2B6747]">
          <span className="flex items-center gap-2 text-sm">
            <Icon name="check" size={16} />
            <b className="font-semibold">{formatSlot(poll.confirmedSlot.date, poll.confirmedSlot.hour, poll.durationHours)}</b>로 확정됐어요. 대시보드에 다음 회의로
            표시돼요.
          </span>
          {isCreator && (
            <button type="button" onClick={() => setConfirming({ kind: "reopen" })} className={buttonClass("secondary", "h-7")}>
              다시 열기
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-2.5">
          <Heatmap
            days={pollDays(poll)}
            hours={pollHours(poll)}
            countOf={(key) => avail.get(key)?.length ?? 0}
            total={total}
            mine={mine}
            onChange={confirmed ? undefined : setDraft}
            onCommit={confirmed ? undefined : commit}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <HeatmapLegend total={total} />
            <span className="text-xs text-muted">
              {confirmed
                ? "확정된 투표는 수정할 수 없어요"
                : saveState === "saving"
                  ? "저장하는 중…"
                  : saveState === "saved"
                    ? "저장됨"
                    : saveState === "error"
                      ? "저장하지 못했어요. 다시 시도해주세요."
                      : ""}
            </span>
          </div>
        </div>

        <div className="flex flex-[0_1_300px] flex-col gap-6">
          <Section title="추천 시간">
            {recs.length === 0 ? (
              <p className="px-2 py-3 text-[13px] text-muted">아직 {poll.durationHours}시간 연속으로 되는 시간이 없어요</p>
            ) : (
              <ul className="flex flex-col">
                {recs.map((r, i) => (
                  <li key={`${r.date}-${r.hour}`} className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 border-b border-divider px-2 py-2.5">
                    <span className="text-xs font-bold text-accent">{i + 1}</span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm font-semibold tabular-nums">{formatSlot(r.date, r.hour, poll.durationHours)}</span>
                      <span className="truncate text-xs text-muted">
                        {total}명 중 {r.people.length}명 · {r.people.map(nameOf).join(", ")}
                      </span>
                    </span>
                    {isCreator && !confirmed && (
                      <button type="button" onClick={() => setConfirming({ kind: "confirm", rec: r })} className={buttonClass("secondary", "h-6 px-2 text-xs")}>
                        확정
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!isCreator && !confirmed && <p className="text-xs text-muted">확정은 투표를 만든 {nameOf(poll.createdBy)}님이 해요</p>}
          </Section>

          <Section title="응답 현황">
            <ul className="flex flex-col">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-2 py-1.5 text-[13px]">
                  <span className="flex items-center gap-1.5">
                    <Avatar seed={m.id} name={m.name} size={20} />
                    {m.name}
                    {m.id === uid && <span className="text-faint">(나)</span>}
                  </span>
                  {respondedIds.has(m.id) ? <Tag tone="green">응답함</Tag> : <Tag>미응답</Tag>}
                </li>
              ))}
            </ul>
            {missing.length > 0 && !confirmed && <p className="text-xs text-muted">미응답 {missing.length}명</p>}
          </Section>
        </div>
      </div>

      {confirming?.kind === "confirm" && (
        <ConfirmModal
          open
          tone="primary"
          title="이 시간으로 확정할까요?"
          confirmLabel="확정"
          onClose={() => setConfirming(null)}
          onConfirm={() => run(() => confirmPoll(project.id, poll.id, { date: confirming.rec.date, hour: confirming.rec.hour }))}
        >
          <b className="text-ink">{formatSlot(confirming.rec.date, confirming.rec.hour, poll.durationHours)}</b>
          <br />
          {total}명 중 {confirming.rec.people.length}명이 돼요. 확정하면 투표가 마감되고 대시보드에 다음 회의로 표시돼요.
        </ConfirmModal>
      )}
      {confirming?.kind === "reopen" && (
        <ConfirmModal
          open
          tone="primary"
          title="투표를 다시 열까요?"
          confirmLabel="다시 열기"
          onClose={() => setConfirming(null)}
          onConfirm={() => run(() => reopenPoll(project.id, poll.id))}
        >
          확정된 시간이 지워지고 팀원들이 다시 가능 시간을 바꿀 수 있어요.
        </ConfirmModal>
      )}
      {confirming?.kind === "delete" && (
        <ConfirmModal
          open
          title="투표를 삭제할까요?"
          confirmLabel="삭제"
          onClose={() => setConfirming(null)}
          onConfirm={async () => {
            const message = await run(() => deletePoll(project.id, poll.id));
            if (!message) router.replace(`${projectBase(project.id)}/polls`);
            return message;
          }}
        >
          <b className="text-ink">{poll.title}</b>
          <br />
          팀원들의 응답까지 함께 지워지고, 되돌릴 수 없어요.
        </ConfirmModal>
      )}
    </>
  );
}
