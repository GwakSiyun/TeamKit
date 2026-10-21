"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useHoverTip } from "@/components/ui/HoverTip";
import type { Milestone } from "@/features/projects/types";
import { lateDays } from "@/features/tasks/deadline";
import type { Task } from "@/features/tasks/types";
import { formatShort, weekdayOf } from "@/lib/dates";
import { BAR_COLORS, barKind, MILESTONE_COLOR } from "../colors";
import { taskSpan, type GanttGroup, type GanttRange } from "../gantt";

const LABEL_WIDTH = 240;
const DAY_MIN = 24;
/** 처음 열 때 오늘 왼쪽으로 보여줄 날 수 (지난 며칠 흐름도 보이게) */
const DAYS_BEFORE_TODAY = 2;

/** 가로로 스크롤해도 이름 칸이 왼쪽에 붙어 있게 (sticky) */
const STICKY = "sticky left-0 z-[2] border-r border-divider";

function columnStyle(count: number): React.CSSProperties {
  // 이름 칸 너비는 컨테이너의 --gantt-label (좁은 화면 140px · 넓은 화면 240px)
  return {
    gridTemplateColumns: `var(--gantt-label, ${LABEL_WIDTH}px) repeat(${count}, minmax(${DAY_MIN}px, 1fr))`,
    minWidth: `calc(var(--gantt-label, ${LABEL_WIDTH}px) + ${count * DAY_MIN}px)`,
  };
}

type Bind = ReturnType<typeof useHoverTip>["bind"];

/** 그날의 회의 · 마일스톤 설명 (툴팁). 없으면 null */
function dayNote(d: string, meetings: MeetingsByDate, milestones: readonly Milestone[]): ReactNode {
  const lines = [
    ...milestones.filter((m) => m.date === d).map((m) => `${m.name} · ${formatShort(d)}`),
    ...(meetings.get(d) ?? []).map((m) => `회의 · ${m}`),
  ];
  if (lines.length === 0) return null;
  return lines.map((l) => <div key={l}>{l}</div>);
}

/** 주말 · 오늘 · 마일스톤 배경 칸 + 회의 날 세로 점선 (행마다 같은 그리드에 깔린다). 회의 · 마일스톤 칸은 마우스를 올리면 설명 */
function Backdrop({ days, today, meetings, milestones, bind }: { days: string[]; today: string; meetings: MeetingsByDate; milestones: readonly Milestone[]; bind: Bind }) {
  return (
    <>
      {days.map((d, i) => {
        const weekend = weekdayOf(d) === "토" || weekdayOf(d) === "일";
        const meeting = meetings.has(d);
        const isMilestone = milestones.some((m) => m.date === d);
        if (d !== today && !weekend && !meeting && !isMilestone) return null;
        const bg = d === today ? "bg-[#EAF3FB]" : isMilestone ? "" : weekend ? "bg-[#FAFAF9]" : "";
        const note = dayNote(d, meetings, milestones);
        return (
          <div
            key={d}
            aria-hidden
            {...(note ? bind(note) : {})}
            className={`${bg} ${meeting ? "border-l-2 border-dashed border-[#9A6DD7]" : ""}`}
            style={{ gridRow: 1, gridColumn: i + 2, ...(isMilestone && d !== today ? { background: MILESTONE_COLOR.bg } : {}) }}
          />
        );
      })}
    </>
  );
}

/** 깃발 이름 너비 어림 (한글 11px · 그 밖 7px + 깃발 아이콘) → 차지하는 날 수. 날짜 칸은 좁게 잡아(32px) 넉넉히 */
const FLAG_DAY_PX = 32;
function flagSpanDays(name: string): number {
  const px = 20 + [...name].reduce((sum, ch) => sum + (/[가-힣]/.test(ch) ? 11 : 7), 0);
  return Math.max(1, Math.ceil(px / FLAG_DAY_PX));
}

/** 깃발끼리 겹치면 아랫줄로: 날짜순으로 놓으면서 앞 깃발 이름이 끝난 줄에만 넣는다 */
function flagLanes(items: Array<{ id: string; index: number; span: number }>): Map<string, number> {
  const laneEnds: number[] = [];
  const lanes = new Map<string, number>();
  for (const it of [...items].sort((a, b) => a.index - b.index)) {
    let lane = laneEnds.findIndex((end) => end < it.index);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = it.index + it.span - 1;
    lanes.set(it.id, lane);
  }
  return lanes;
}

/** 회의 날짜("YYYY-MM-DD") → 그날 회의 이름들 ("10:00 「1주차 회의」에서 정함") */
export type MeetingsByDate = ReadonlyMap<string, string[]>;

/**
 * 막대 안 제목: 글자가 막대에 다 들어가면 제목, 안 들어가면 완료는 ✓ 만 · 나머지는 색만 (제목은 마우스를 올리면 툴팁).
 * 보이지 않는 측정용 글자의 실제 너비를 막대 너비와 비교한다 (화면 너비가 바뀌어도 다시 잼).
 */
function InsideLabel({ title, done }: { title: string; done: boolean }) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fits, setFits] = useState(true);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;
    // ResizeObserver 는 observe 직후에도 한 번 불린다 → 처음 측정도 여기서
    const observer = new ResizeObserver(() => setFits(text.offsetWidth <= box.clientWidth));
    observer.observe(box);
    return () => observer.disconnect();
  }, [title, done]);

  const label = `${done ? "✓ " : ""}${title}`;
  return (
    <span ref={boxRef} className="relative flex min-w-0 flex-1 justify-center">
      <span ref={textRef} aria-hidden className="invisible absolute whitespace-nowrap">
        {label}
      </span>
      {fits ? label : done ? "✓" : null}
    </span>
  );
}

interface GanttChartProps {
  range: GanttRange;
  groups: GanttGroup[];
  today: string;
  /** 회의가 있는 날 (확정된 투표 · 회의록에서 등록) */
  meetings: MeetingsByDate;
  /** 마일스톤 (날짜 위 깃발 줄 · 날짜 칸 강조) */
  milestones: readonly Milestone[];
  onOpenTask: (taskId: string) => void;
}

function spanLabel(task: Task): string {
  const span = taskSpan(task);
  if (!span) return "";
  return span.start === span.end ? formatShort(span.start) : `${formatShort(span.start)} – ${formatShort(span.end)}`;
}

/** 막대 툴팁: 제목 + 상태(지연 일수) · 기간 · 담당 */
function barTip(task: Task, today: string, owner: string): ReactNode {
  const kind = barKind(task, today);
  const status = kind === "late" ? `${lateDays(task, today)}일 지연` : BAR_COLORS[kind].label;
  return (
    <>
      <div className="font-semibold">{task.title}</div>
      <div className="flex items-center gap-1.5 text-[#D3D1CB]">
        <span className="size-2 rounded-sm" style={{ background: BAR_COLORS[kind].bg }} />
        {status} · {spanLabel(task)} · {owner}
      </div>
    </>
  );
}

export function GanttChart({ range, groups, today, meetings, milestones, onOpenTask }: GanttChartProps) {
  const { days } = range;
  const tip = useHoverTip();
  const milestoneDays = new Set(milestones.map((m) => m.date));
  const visibleMilestones = milestones.filter((m) => days.includes(m.date));
  const lanes = flagLanes(visibleMilestones.map((m) => ({ id: m.id, index: days.indexOf(m.date), span: flagSpanDays(m.name) })));
  const laneCount = Math.max(1, ...[...lanes.values()].map((l) => l + 1));
  const grid = columnStyle(days.length);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 처음 열 때 오늘 근처로 가로 스크롤 (차트가 화면보다 넓을 때만)
  useLayoutEffect(() => {
    const box = scrollRef.current;
    if (!box || box.scrollWidth <= box.clientWidth) return;
    const cell = box.querySelector<HTMLElement>(`[data-day="${today}"]`);
    const label = box.querySelector<HTMLElement>("[data-gantt-label]");
    if (!cell || !label) return;
    box.scrollLeft = Math.max(0, cell.offsetLeft - label.offsetWidth - cell.offsetWidth * DAYS_BEFORE_TODAY);
  }, [today, days.length]);

  return (
    <div ref={scrollRef} className="overflow-x-auto rounded-lg border border-line [--gantt-label:140px] sm:[--gantt-label:240px]">
      {/* 마일스톤 깃발 줄: 그 날짜 칸에 깃발 + 이름 (범위 안에 있을 때만). 이름이 겹치면 아랫줄로 */}
      {visibleMilestones.length > 0 && (
        <div className="grid border-b border-divider py-1" style={{ ...grid, gridTemplateRows: `repeat(${laneCount}, 20px)` }}>
          <div className={`${STICKY} flex items-center bg-surface px-3 text-[11px] font-medium text-faint`} style={{ gridRow: `1 / ${laneCount + 1}`, gridColumn: 1 }}>
            마일스톤
          </div>
          {visibleMilestones.map((m) => {
            const i = days.indexOf(m.date);
            return (
              <div
                key={m.id}
                {...tip.bind(dayNote(m.date, meetings, milestones))}
                className="relative z-[1] flex min-w-0 items-center gap-1 self-center pl-1 text-[11px] font-semibold whitespace-nowrap text-danger"
                style={{ gridRow: (lanes.get(m.id) ?? 0) + 1, gridColumn: `${i + 2} / span 1` }}
              >
                <Icon name="flag" size={13} />
                <span className="overflow-visible">{m.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 날짜 머리글 */}
      <div className="grid h-10 border-b border-line text-[11px] text-muted" style={grid}>
        <Backdrop days={days} today={today} meetings={meetings} milestones={milestones} bind={tip.bind} />
        <div data-gantt-label className={`${STICKY} flex items-center bg-surface px-3 text-xs font-medium`} style={{ gridRow: 1, gridColumn: 1 }}>
          담당자 · 할 일
        </div>
        {days.map((d, i) => {
          const [, m, day] = d.split("-").map(Number);
          const firstOfMonth = i === 0 || day === 1;
          return (
            <div
              key={d}
              data-day={d}
              {...(dayNote(d, meetings, milestones) ? tip.bind(dayNote(d, meetings, milestones)) : {})}
              className={`flex flex-col items-center justify-center gap-px tabular-nums ${milestoneDays.has(d) ? "font-semibold text-danger" : ""}`}
              style={{ gridRow: 1, gridColumn: i + 2 }}
            >
              <span className={firstOfMonth ? "text-[10px] text-faint" : ""}>{firstOfMonth ? `${m}월` : weekdayOf(d)}</span>
              {d === today ? (
                <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-accent font-medium text-white">{day}</span>
              ) : (
                <span className={`font-medium ${milestoneDays.has(d) ? "text-danger" : "text-ink"}`}>{day}</span>
              )}
            </div>
          );
        })}
      </div>

      {groups.map((g) => (
        <div key={g.id || "none"}>
          <div className="grid h-8 border-b border-line bg-side" style={grid}>
            <div className="sticky left-0 z-[2] flex w-fit items-center gap-2 px-3 text-[13px] font-semibold whitespace-nowrap" style={{ gridRow: 1, gridColumn: "1 / -1" }}>
              {g.id ? <Avatar seed={g.id} name={g.name} size={18} /> : null}
              {g.name}
              <span className="text-xs font-normal text-muted">
                {g.done}/{g.total} 완료
              </span>
            </div>
          </div>
          {g.bars.map((b) => (
            <div key={b.task.id} className="grid h-[34px] border-b border-divider hover:bg-side/60" style={grid}>
              <Backdrop days={days} today={today} meetings={meetings} milestones={milestones} bind={tip.bind} />
              <button
                type="button"
                onClick={() => onOpenTask(b.task.id)}
                className={`${STICKY} flex min-w-0 cursor-pointer items-center gap-2 bg-surface pr-3 pl-4 text-left text-[13px] hover:underline hover:decoration-[#C9C7C2] sm:pl-[38px]`}
                style={{ gridRow: 1, gridColumn: 1 }}
              >
                <span className="truncate">{b.task.title}</span>
              </button>
              {(() => {
                const kind = barKind(b.task, today);
                const color = BAR_COLORS[kind];
                return (
                  <button
                    type="button"
                    onClick={() => onOpenTask(b.task.id)}
                    aria-label={b.task.title}
                    {...tip.bind(barTip(b.task, today, g.name))}
                    className={`relative z-[1] mx-0.5 flex h-5 cursor-pointer items-center justify-center self-center overflow-hidden px-1.5 text-[11px] font-medium whitespace-nowrap transition-[filter] hover:brightness-95 ${
                      b.clippedStart ? "rounded-l-none" : "rounded-l"
                    } ${b.clippedEnd ? "rounded-r-none" : "rounded-r"}`}
                    style={{ gridRow: 1, gridColumn: `${b.from + 2} / ${b.to + 3}`, background: color.bg, color: color.fg }}
                  >
                    <InsideLabel title={b.task.title} done={kind === "done"} />
                  </button>
                );
              })()}
            </div>
          ))}
        </div>
      ))}
      {tip.node}
    </div>
  );
}

export function GanttLegend() {
  const items: { label: string; swatch: ReactNode }[] = [
    ...(["todo", "doing", "done", "late"] as const).map((k) => ({
      label: BAR_COLORS[k].label,
      swatch: <span className="size-2.5 rounded-sm" style={{ background: BAR_COLORS[k].bg }} />,
    })),
    { label: "오늘", swatch: <span className="size-2.5 rounded-sm bg-[#EAF3FB] shadow-[inset_0_0_0_1px_var(--color-accent)]" /> },
    { label: "회의", swatch: <span className="h-3 w-0 border-l-2 border-dashed border-[#9A6DD7]" /> },
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          {i.swatch}
          {i.label}
        </span>
      ))}
    </div>
  );
}
