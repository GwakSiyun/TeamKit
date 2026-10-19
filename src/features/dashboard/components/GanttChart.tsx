"use client";

import { useLayoutEffect, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { weekdayOf } from "@/lib/dates";
import { lateDays } from "@/features/tasks/deadline";
import type { Task } from "@/features/tasks/types";
import { DONE_COLOR, taskColor } from "../colors";
import type { GanttGroup, GanttRange } from "../gantt";

const LABEL_WIDTH = 240;
const DAY_MIN = 24;
/** 처음 열 때 오늘 왼쪽으로 보여줄 날 수 (지난 며칠 흐름도 보이게) */
const DAYS_BEFORE_TODAY = 2;

/** 가로로 스크롤해도 이름 칸이 왼쪽에 붙어 있게 (sticky) */
const STICKY = "sticky left-0 z-[2] border-r border-[#F1F1EF]";

/** 상태 표시: 완료는 초록 막대(색은 barColor), 지연은 빨간 테두리 */
function barState(task: Task, today: string): string {
  if (task.status !== "done" && lateDays(task, today) > 0) return "ring-2 ring-danger ring-inset";
  return "";
}

function barColor(task: Task): { bg: string; fg: string } {
  return task.status === "done" ? DONE_COLOR : taskColor(task.id);
}

/** 이 날 수보다 짧은 막대는 제목을 막대 밖(오른쪽, 끝이면 왼쪽)에 쓴다 — 좁은 화면에서 잘려 안 보이던 문제 */
const MIN_INNER_LABEL_DAYS = 3;

function columnStyle(count: number): React.CSSProperties {
  // 이름 칸 너비는 컨테이너의 --gantt-label (좁은 화면 140px · 넓은 화면 240px)
  return {
    gridTemplateColumns: `var(--gantt-label, ${LABEL_WIDTH}px) repeat(${count}, minmax(${DAY_MIN}px, 1fr))`,
    minWidth: `calc(var(--gantt-label, ${LABEL_WIDTH}px) + ${count * DAY_MIN}px)`,
  };
}

/** 주말 · 오늘 배경 칸 + 확정된 회의 날 세로 점선 (행마다 같은 그리드에 깔린다) */
function Backdrop({ days, today, meetings }: { days: string[]; today: string; meetings: Set<string> }) {
  return (
    <>
      {days.map((d, i) => {
        const weekend = weekdayOf(d) === "토" || weekdayOf(d) === "일";
        const meeting = meetings.has(d);
        if (d !== today && !weekend && !meeting) return null;
        const bg = d === today ? "bg-[#EAF3FB]" : weekend ? "bg-[#FAFAF9]" : "";
        return (
          <div
            key={d}
            aria-hidden
            className={`${bg} ${meeting ? "border-l-2 border-dashed border-[#9A6DD7]" : ""}`}
            style={{ gridRow: 1, gridColumn: i + 2 }}
          />
        );
      })}
    </>
  );
}

interface GanttChartProps {
  range: GanttRange;
  groups: GanttGroup[];
  today: string;
  /** 확정된 회의 날짜 ("YYYY-MM-DD") */
  meetings: Set<string>;
  onOpenTask: (taskId: string) => void;
}

export function GanttChart({ range, groups, today, meetings, onOpenTask }: GanttChartProps) {
  const { days } = range;
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
      {/* 날짜 머리글 */}
      <div className="grid h-10 border-b border-line text-[11px] text-muted" style={grid}>
        <Backdrop days={days} today={today} meetings={meetings} />
        <div data-gantt-label className={`${STICKY} flex items-center bg-white px-3 text-xs font-medium`} style={{ gridRow: 1, gridColumn: 1 }}>
          담당자 · 할 일
        </div>
        {days.map((d, i) => {
          const [, m, day] = d.split("-").map(Number);
          const firstOfMonth = i === 0 || day === 1;
          return (
            <div key={d} data-day={d} className="flex flex-col items-center justify-center gap-px tabular-nums" style={{ gridRow: 1, gridColumn: i + 2 }}>
              <span className={firstOfMonth ? "text-[10px] text-faint" : ""}>{firstOfMonth ? `${m}월` : weekdayOf(d)}</span>
              {d === today ? (
                <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-accent font-medium text-white">{day}</span>
              ) : (
                <span className="font-medium text-ink">{day}</span>
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
            <div key={b.task.id} className="grid h-[34px] border-b border-[#F1F1EF] hover:bg-side/60" style={grid}>
              <Backdrop days={days} today={today} meetings={meetings} />
              <button
                type="button"
                onClick={() => onOpenTask(b.task.id)}
                className={`${STICKY} flex min-w-0 cursor-pointer items-center gap-2 bg-white pr-3 pl-4 text-left text-[13px] hover:underline hover:decoration-[#C9C7C2] sm:pl-[38px]`}
                style={{ gridRow: 1, gridColumn: 1 }}
              >
                <span className="truncate">{b.task.title}</span>
              </button>
              {(() => {
                const color = barColor(b.task);
                const label = `${b.task.status === "done" ? "✓ " : ""}${b.task.title}`;
                const inside = b.to - b.from + 1 >= MIN_INNER_LABEL_DAYS;
                const roomRight = b.to < days.length - 1;
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenTask(b.task.id)}
                      title={b.task.title}
                      aria-label={b.task.title}
                      className={`relative z-[1] mx-0.5 flex h-5 cursor-pointer items-center justify-center self-center overflow-hidden px-1.5 text-[11px] font-medium whitespace-nowrap ${barState(b.task, today)} ${
                        b.clippedStart ? "rounded-l-none" : "rounded-l"
                      } ${b.clippedEnd ? "rounded-r-none" : "rounded-r"}`}
                      style={{ gridRow: 1, gridColumn: `${b.from + 2} / ${b.to + 3}`, background: color.bg, color: color.fg }}
                    >
                      {inside ? <span className="truncate">{label}</span> : b.task.status === "done" ? "✓" : null}
                    </button>
                    {!inside && (
                      <span
                        aria-hidden
                        className={`pointer-events-none relative z-[1] self-center truncate px-1 text-[11px] font-medium text-sub ${roomRight ? "text-left" : "text-right"}`}
                        style={{ gridRow: 1, gridColumn: roomRight ? `${b.to + 3} / -1` : `2 / ${b.from + 2}` }}
                      >
                        {b.task.title}
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function GanttLegend() {
  const items: { cls: string; label: string }[] = [
    { cls: "bg-[#4DAB6F]", label: "완료" },
    { cls: "bg-[#FBE3A6] shadow-[inset_0_0_0_2px_var(--color-danger)]", label: "지연" },
    { cls: "bg-[#EAF3FB] shadow-[inset_0_0_0_1px_var(--color-accent)]", label: "오늘" },
    { cls: "w-0 rounded-none border-l-2 border-dashed border-[#9A6DD7]", label: "확정 회의" },
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5">
          <span className={`size-2.5 rounded-sm ${i.cls}`} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
