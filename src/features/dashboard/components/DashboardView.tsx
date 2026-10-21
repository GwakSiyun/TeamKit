"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { Tag } from "@/components/ui/Tag";
import { useCurrentProject } from "@/features/projects/ProjectContext";
import { milestonesOf, upcomingMilestones } from "@/features/projects/milestones";
import { projectBase } from "@/features/projects/navigation";
import { lateDays } from "@/features/tasks/deadline";
import { useTasks } from "@/features/tasks/hooks";
import { usePolls } from "@/features/polls/hooks";
import { useMeetings } from "@/features/meetings/hooks";
import { useGithubEvents } from "@/features/github/hooks";
import { TaskDetailModal } from "@/features/tasks/components/TaskDetailModal";
import { TaskFormModal } from "@/features/tasks/components/TaskFormModal";
import { useTransientState } from "@/hooks/useTransientState";
import { daysBetween, formatShort, todayISO, weekdayOf } from "@/lib/dates";
import { ganttGroups, ganttRange, taskSpan } from "../gantt";
import { GanttChart, GanttLegend } from "./GanttChart";
import { GithubActivity } from "./GithubActivity";
import { MilestoneChips } from "./MilestoneChips";
import { StatCard } from "./StatCard";
import { TaskList } from "./TaskList";

const DUE_SOON_DAYS = 7;

function hhmm(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/** 남은 일수 → 태그 색: 오늘·1일 빨강, 2~4일 주황, 5일 이상 초록 */
function urgencyTone(daysLeft: number): "red" | "orange" | "green" {
  if (daysLeft <= 1) return "red";
  if (daysLeft <= 4) return "orange";
  return "green";
}
const LIST_SIZE = 5;
const GITHUB_EVENTS = 5;

type OpenModal = { kind: "detail"; taskId: string } | { kind: "edit"; taskId: string } | null;

function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-1.5">
        <h2 className="text-base font-bold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function DashboardView() {
  const { project, members } = useCurrentProject();
  const state = useTasks(project.id);
  const pollsState = usePolls(project.id);
  const meetingsState = useMeetings(project.id);
  const githubEvents = useGithubEvents(project.id, GITHUB_EVENTS);
  const [modal, setModal] = useTransientState<OpenModal>(null);
  const today = todayISO();
  const [, month, day] = today.split("-").map(Number);
  const nameOf = (uid: string | null): string | null => (uid ? (members.find((m) => m.id === uid)?.name ?? null) : null);
  const boardHref = `${projectBase(project.id)}/board`;

  if (state.status === "loading") return <p className="py-12 text-center text-sm text-muted">불러오는 중…</p>;
  if (state.status === "error") return <Notice tone="error">할 일을 불러오지 못했어요. 새로고침해주세요.</Notice>;

  const tasks = state.tasks;
  const milestones = milestonesOf(project);
  const header = (
    <div className="flex flex-col gap-3">
      <PageHeader title="대시보드" description={`${month}월 ${day}일 ${weekdayOf(today)}요일`} />
      <MilestoneChips milestones={milestones} today={today} />
    </div>
  );

  if (tasks.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={<Icon name="dashboard" size={22} />}
          title="아직 할 일이 없어요"
          description="할 일을 만들고 시작일 · 마감일을 정하면 진행률과 간트 차트가 여기에 보여요."
          actions={
            <Link href={boardHref} className={buttonClass("primary")}>
              할 일 보드로
            </Link>
          }
        />
      </>
    );
  }

  const done = tasks.filter((t) => t.status === "done").length;
  const doing = tasks.filter((t) => t.status === "doing");
  const late = tasks.filter((t) => lateDays(t, today) > 0).sort((a, b) => lateDays(b, today) - lateDays(a, today));
  const percent = Math.round((done / tasks.length) * 100);
  const undated = tasks.filter((t) => !taskSpan(t)).length;

  const doingByPerson = Object.entries(
    doing.reduce<Record<string, number>>((acc, t) => {
      const name = nameOf(t.assigneeId) ?? "담당자 없음";
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([name, n]) => `${name} ${n}`)
    .join(" · ");

  const dueSoon = tasks
    .filter((t) => t.status !== "done" && t.dueDate && daysBetween(today, t.dueDate) <= DUE_SOON_DAYS)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, LIST_SIZE);
  const recent = [...tasks].sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0)).slice(0, LIST_SIZE);

  const range = ganttRange(
    tasks,
    today,
    upcomingMilestones(milestones, today).map((m) => m.date),
  );
  // 정해진 회의 = 확정된 투표 + 회의록에서 등록한 다음 회의(1시간).
  // 오늘 이후 가장 가까운 것 → "다음 회의" 카드, 전부 → 간트 점선
  const confirmed = [
    ...(pollsState.status === "ready" ? pollsState.polls : []).flatMap((p) =>
      p.status === "confirmed" && p.confirmedSlot
        ? [{ title: p.title, date: p.confirmedSlot.date, hour: p.confirmedSlot.hour, duration: p.durationHours }]
        : [],
    ),
    ...(meetingsState.status === "ready" ? meetingsState.meetings : []).flatMap((m) =>
      m.nextMeeting ? [{ title: `「${m.title}」에서 정함`, date: m.nextMeeting.date, hour: m.nextMeeting.hour, duration: 1 }] : [],
    ),
  ];
  const nextMeeting = confirmed.filter((m) => m.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour)[0] ?? null;
  const meetingDates = confirmed.reduce<Map<string, string[]>>((acc, m) => {
    acc.set(m.date, [...(acc.get(m.date) ?? []), `${hhmm(m.hour)} ${m.title}`]);
    return acc;
  }, new Map());
  const groups = ganttGroups(tasks, members, range);
  const selected = modal ? (tasks.find((t) => t.id === modal.taskId) ?? null) : null;

  return (
    <>
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="전체 진행률" value={`${percent}%`} sub={`${done}/${tasks.length}개 완료`}>
          <div className="mt-0.5 h-1 rounded-sm bg-hover">
            <div className="h-1 rounded-sm bg-[#4DAB9A]" style={{ width: `${percent}%` }} />
          </div>
        </StatCard>
        <StatCard label="진행 중" value={`${doing.length}개`} sub={doingByPerson || "진행 중인 할 일 없음"} />
        <StatCard
          label="지연"
          value={`${late.length}개`}
          tone={late.length > 0 ? "danger" : "default"}
          sub={late[0] ? `${late[0].title} · ${nameOf(late[0].assigneeId) ?? "담당자 없음"}` : "마감을 넘긴 할 일 없음"}
        />
        {nextMeeting ? (
          <StatCard
            label="다음 회의"
            value={<span className="text-tint-purple-fg">{`${formatShort(nextMeeting.date)}(${weekdayOf(nextMeeting.date)})`}</span>}
            sub={`${hhmm(nextMeeting.hour)}–${hhmm(nextMeeting.hour + nextMeeting.duration)} · ${nextMeeting.title}`}
          />
        ) : (
          <StatCard label="다음 회의" value="—" tone="muted" sub="일정 맞추기 확정 · 회의록에서 등록하면 표시돼요" />
        )}
      </div>

      <Section title="일정" right={<GanttLegend />}>
        {groups.length > 0 ? (
          <GanttChart
            range={range}
            groups={groups}
            today={today}
            meetings={meetingDates}
            milestones={milestones}
            onOpenTask={(id) => setModal({ kind: "detail", taskId: id })}
          />
        ) : (
          <Notice tone="info">시작일이나 마감일이 있는 할 일이 이 기간에 없어요.</Notice>
        )}
        {undated > 0 && (
          <p className="text-xs text-muted">
            기간이 없는 할 일 {undated}개는 차트에서 빠졌어요.{" "}
            <Link href={boardHref} className="text-accent hover:text-accent-strong">
              할 일 보드
            </Link>
            에서 시작일 · 마감일을 정하면 표시돼요.
          </p>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section
          title="마감 임박"
          right={
            <Link href={boardHref} className="text-[13px] text-accent hover:text-accent-strong">
              할 일 보드
            </Link>
          }
        >
          <TaskList
            tasks={dueSoon}
            nameOf={nameOf}
            empty={`${DUE_SOON_DAYS}일 안에 마감인 할 일이 없어요`}
            onOpenTask={(id) => setModal({ kind: "detail", taskId: id })}
            trailing={(t) => {
              const lateBy = lateDays(t, today);
              const left = t.dueDate ? daysBetween(today, t.dueDate) : 0;
              return (
                <>
                  {t.dueDate && formatShort(t.dueDate)}
                  {lateBy > 0 ? <Tag tone="redSolid">{lateBy}일 지연</Tag> : <Tag tone={urgencyTone(left)}>{left === 0 ? "오늘 마감" : `${left}일 남음`}</Tag>}
                </>
              );
            }}
          />
        </Section>
        <Section title="최근 바뀐 할 일">
          <TaskList
            tasks={recent}
            nameOf={nameOf}
            empty="아직 바뀐 할 일이 없어요"
            onOpenTask={(id) => setModal({ kind: "detail", taskId: id })}
            trailing={(t) => {
              const at = t.updatedAt?.toDate();
              return at ? `${at.getMonth() + 1}/${at.getDate()} ${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}` : "";
            }}
          />
        </Section>
      </div>

      <Section
        title="최근 GitHub 활동"
        right={
          <Link href={`${projectBase(project.id)}/github`} className="text-[13px] text-accent hover:text-accent-strong">
            GitHub 연동
          </Link>
        }
      >
        <GithubActivity
          events={githubEvents}
          tasks={tasks}
          connected={!!project.github}
          githubHref={`${projectBase(project.id)}/github`}
          onOpenTask={(id) => setModal({ kind: "detail", taskId: id })}
        />
      </Section>

      {modal?.kind === "detail" && selected && (
        <TaskDetailModal task={selected} today={today} onClose={() => setModal(null)} onEdit={() => setModal({ kind: "edit", taskId: selected.id })} />
      )}
      {modal?.kind === "edit" && selected && <TaskFormModal open task={selected} onClose={() => setModal({ kind: "detail", taskId: selected.id })} />}
    </>
  );
}
