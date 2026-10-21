"use client";

import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
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
import { TaskFormModal } from "@/features/tasks/components/TaskFormModal";
import { TASK_KEY_PREFIX } from "@/features/tasks/constants";
import { useTransientState } from "@/hooks/useTransientState";
import { formatDateTime, formatShort, todayISO, weekdayOf } from "@/lib/dates";
import { formatClock } from "../extract";
import { useMeeting } from "../hooks";
import { addActionItemToBoard, deleteMeeting, setNextMeeting } from "../services";
import { suggestSchedule, suggestTask, type TaskSuggestion } from "../suggest";
import { KeywordGuide } from "./KeywordGuide";
import { NextMeetingModal } from "./NextMeetingModal";

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

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 border-b border-line pb-1.5 text-base font-bold">
        {title}
        <span className="text-sm font-normal text-muted">{count}</span>
      </h2>
      {children}
    </section>
  );
}

function periodLabel(s: Pick<TaskSuggestion, "startDate" | "dueDate">): string | null {
  if (s.startDate && s.dueDate) return `${formatShort(s.startDate)}~${formatShort(s.dueDate)}`;
  if (s.dueDate) return `~${formatShort(s.dueDate)}`;
  if (s.startDate) return `${formatShort(s.startDate)}~`;
  return null;
}

/** "10/20(화) 10:00" */
function scheduleLabel(date: string, hour: number): string {
  return `${formatShort(date)}(${weekdayOf(date)}) ${String(hour).padStart(2, "0")}:00`;
}

/** 시각을 말하지 않았으면 등록 창에서 이 시각으로 시작 */
const DEFAULT_MEETING_HOUR = 10;

type Scheduling = { text: string; date: string; hour: number } | null;

/** 후보를 누르면 본문의 해당 줄로 이동 */
function segmentId(index: number): string {
  return `seg-${index}`;
}

export function MeetingDetailView() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { project, members } = useCurrentProject();
  const { user } = useAuth();
  const router = useRouter();
  const state = useMeeting(project.id, meetingId);
  const [confirmingDelete, setConfirmingDelete] = useTransientState(false);
  // 보드에 추가 중인 후보 번호 (폼이 열림)
  const [adding, setAdding] = useTransientState<number | null>(null);
  // 다음 회의로 등록 중인 결정사항 (등록 창이 열림)
  const [scheduling, setScheduling] = useTransientState<Scheduling>(null);

  const base = `${projectBase(project.id)}/meetings`;

  if (state.status === "loading") return <p className="py-12 text-center text-sm text-muted">불러오는 중…</p>;
  if (state.status === "missing") {
    return (
      <>
        <BackLink href={base} label="회의록 목록으로" />
        <Notice tone="error">회의록을 찾을 수 없어요. 삭제됐을 수 있어요.</Notice>
      </>
    );
  }

  const meeting = state.meeting;
  const uid = user?.uid ?? "";
  const canDelete = meeting.createdBy === uid || project.ownerId === uid;
  const creatorName = members.find((m) => m.id === meeting.createdBy)?.name ?? "알 수 없음";
  const decisionSegs = new Set(meeting.decisions.map((d) => d.segment));
  const actionSegs = new Set(meeting.actionItems.map((a) => a.segment));
  // 날짜 표현("금요일까지")은 회의한 날 기준으로 계산
  const meetingDay = meeting.createdAt ? todayISO(meeting.createdAt.toDate()) : todayISO();
  const suggestions = meeting.actionItems.map((a) => suggestTask(a.text, members, meetingDay));
  const nameOf = (id: string): string => members.find((m) => m.id === id)?.name ?? "알 수 없음";
  const addingItem = adding !== null ? meeting.actionItems[adding] : undefined;

  return (
    <>
      <BackLink href={base} label="회의록 목록으로" />
      <PageHeader
        title={meeting.title}
        actions={
          canDelete && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="inline-flex h-8 cursor-pointer items-center rounded-md px-3 text-sm font-medium text-danger hover:bg-danger-soft"
            >
              삭제
            </button>
          )
        }
      />
      <div className="-mt-2 flex flex-col">
        <Prop icon="calendar" label="날짜">
          <span className="tabular-nums">{meeting.createdAt ? formatDateTime(meeting.createdAt.toDate()) : "—"}</span>
        </Prop>
        <Prop icon={meeting.source === "audio" ? "mic" : "doc"} label="방식">
          {meeting.source === "audio" ? `녹음 · 음성 인식${meeting.durationSec !== null ? ` · ${formatClock(meeting.durationSec)}` : ""}` : "직접 입력"}
        </Prop>
        <Prop icon="user" label="작성자">
          <Avatar seed={meeting.createdBy} name={creatorName} size={20} />
          {creatorName}
        </Prop>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-2">
          <h2 className="border-b border-line pb-1.5 text-base font-bold">회의 내용</h2>
          <ol className="flex flex-col">
            {meeting.segments.map((seg, i) => {
              const tone = decisionSegs.has(i) ? "border-[#4DAB6F] bg-success-soft" : actionSegs.has(i) ? "border-accent bg-accent-soft" : "border-transparent";
              return (
                <li
                  key={i}
                  id={segmentId(i)}
                  className={`grid scroll-mt-20 grid-cols-[52px_minmax(0,1fr)] gap-2 border-l-2 px-2 py-1.5 text-sm leading-relaxed ${tone}`}
                >
                  <span className="pt-px font-mono text-xs text-faint tabular-nums">{seg.start !== null ? formatClock(seg.start) : i + 1}</span>
                  <span className="break-keep">{seg.text}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex flex-[0_1_340px] flex-col gap-6">
          <Section title="결정사항" count={meeting.decisions.length}>
            {meeting.decisions.length === 0 ? (
              <p className="px-2 py-3 text-[13px] text-muted">찾은 결정사항이 없어요</p>
            ) : (
              <ul className="flex flex-col">
                {meeting.decisions.map((d, i) => {
                  const schedule = suggestSchedule(d.text, meetingDay);
                  const registered = meeting.nextMeeting?.text === d.text ? meeting.nextMeeting : null;
                  return (
                    <li key={i} className="flex flex-col gap-1.5 border-b border-divider px-2 py-2">
                      <a href={`#${segmentId(d.segment)}`} className="flex gap-2 rounded text-sm leading-relaxed hover:underline">
                        <span className="mt-[7px] size-2 shrink-0 rounded-full bg-[#4DAB6F]" aria-hidden="true" />
                        <span className="break-keep">{d.text}</span>
                      </a>
                      {registered ? (
                        <span className="flex flex-wrap items-center gap-1.5 pl-4">
                          <Tag tone="purple">
                            <Icon name="calendar" size={11} />
                            다음 회의 · {scheduleLabel(registered.date, registered.hour)}
                          </Tag>
                          <button
                            type="button"
                            onClick={() => setScheduling({ text: d.text, date: registered.date, hour: registered.hour })}
                            className={buttonClass("ghost", "h-6 px-1.5 text-xs")}
                          >
                            변경
                          </button>
                          <button
                            type="button"
                            onClick={() => void setNextMeeting(project.id, meeting.id, null)}
                            className={buttonClass("ghost", "h-6 px-1.5 text-xs")}
                          >
                            등록 취소
                          </button>
                        </span>
                      ) : (
                        schedule && (
                          <span className="pl-4">
                            <button
                              type="button"
                              onClick={() => setScheduling({ text: d.text, date: schedule.date, hour: schedule.hour ?? DEFAULT_MEETING_HOUR })}
                              className={buttonClass("secondary", "h-6 px-2 text-xs")}
                            >
                              <Icon name="calendar" size={12} />
                              다음 회의로 등록 · {scheduleLabel(schedule.date, schedule.hour ?? DEFAULT_MEETING_HOUR)}
                            </button>
                          </span>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="할 일 후보" count={meeting.actionItems.length}>
            {meeting.actionItems.length === 0 ? (
              <p className="px-2 py-3 text-[13px] text-muted">찾은 할 일 후보가 없어요</p>
            ) : (
              <ul className="flex flex-col">
                {meeting.actionItems.map((a, i) => {
                  const s = suggestions[i];
                  const period = periodLabel(s);
                  return (
                    <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 border-b border-divider px-2 py-2.5">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-sm font-semibold break-keep">{s.title}</span>
                        {(s.assigneeId || period) && (
                          <span className="flex flex-wrap items-center gap-1.5 text-xs text-sub">
                            {s.assigneeId && (
                              <span className="flex items-center gap-1">
                                <Avatar seed={s.assigneeId} name={nameOf(s.assigneeId)} size={16} />
                                {nameOf(s.assigneeId)}
                              </span>
                            )}
                            {period && <span className="tabular-nums">{period}</span>}
                          </span>
                        )}
                        <a href={`#${segmentId(a.segment)}`} className="truncate text-xs text-faint hover:text-sub hover:underline" title={a.text}>
                          “{a.text}”
                        </a>
                      </div>
                      {a.taskNumber !== null ? (
                        <Tag tone="green">
                          <Icon name="check" size={11} />
                          {TASK_KEY_PREFIX}-{a.taskNumber}
                        </Tag>
                      ) : (
                        <button type="button" onClick={() => setAdding(i)} className={buttonClass("secondary", "h-6 px-2 text-xs")}>
                          보드에 추가
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {meeting.actionItems.length > 0 && (
              <p className="text-xs text-muted">담당자 · 기간은 문장 속 이름과 “금요일까지” 같은 말로 채워요. 추가 전에 고칠 수 있어요.</p>
            )}
          </Section>

          {meeting.decisions.length + meeting.actionItems.length === 0 && <KeywordGuide />}
        </div>
      </div>

      {adding !== null && addingItem && (
        <TaskFormModal
          open
          heading="회의록에서 할 일 추가"
          initial={{
            title: suggestions[adding].title,
            description: `회의록 「${meeting.title}」에서 추가\n“${addingItem.text}”`,
            assigneeId: suggestions[adding].assigneeId,
            startDate: suggestions[adding].startDate,
            dueDate: suggestions[adding].dueDate,
          }}
          onCreate={(input) => addActionItemToBoard(project.id, meeting.id, adding, input)}
          onClose={() => setAdding(null)}
        />
      )}

      {scheduling && (
        <NextMeetingModal
          projectId={project.id}
          meetingId={meeting.id}
          text={scheduling.text}
          initialDate={scheduling.date}
          initialHour={scheduling.hour}
          onClose={() => setScheduling(null)}
        />
      )}

      {confirmingDelete && (
        <ConfirmModal
          open
          title="회의록을 삭제할까요?"
          confirmLabel="삭제"
          onClose={() => setConfirmingDelete(false)}
          onConfirm={async () => {
            const result = await deleteMeeting(project.id, meeting.id);
            if (!result.ok) return result.message;
            router.replace(base);
            return null;
          }}
        >
          <b className="text-ink">{meeting.title}</b>
          <br />
          되돌릴 수 없어요. 이미 보드에 추가한 카드는 그대로 남아요.
        </ConfirmModal>
      )}
    </>
  );
}
