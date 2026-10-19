"use client";

import { Avatar } from "@/components/ui/Avatar";
import { weekdayOf } from "@/lib/dates";
import { lateDays } from "@/features/tasks/deadline";
import type { Task } from "@/features/tasks/types";
import { taskColor } from "../colors";
import type { GanttGroup, GanttRange } from "../gantt";

const LABEL_WIDTH = 240;
const DAY_MIN = 24;

/** 상태 표시: 완료는 흐리게, 지연은 빨간 테두리 */
function barState(task: Task, today: string): string {
  if (task.status === "done") return "opacity-50";
  if (lateDays(task, today) > 0) return "ring-2 ring-danger ring-inset";
  return "";
}

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

  return (
    <div className="overflow-x-auto rounded-lg border border-line [--gantt-label:140px] sm:[--gantt-label:240px]">
      {/* 날짜 머리글 */}
      <div className="grid h-10 border-b border-line text-[11px] text-muted" style={grid}>
        <Backdrop days={days} today={today} meetings={meetings} />
        <div className="flex items-center px-3 text-xs font-medium" style={{ gridRow: 1, gridColumn: 1 }}>
          담당자 · 할 일
        </div>
        {days.map((d, i) => {
          const [, m, day] = d.split("-").map(Number);
          const firstOfMonth = i === 0 || day === 1;
          return (
            <div key={d} className="flex flex-col items-center justify-center gap-px tabular-nums" style={{ gridRow: 1, gridColumn: i + 2 }}>
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
            <div className="flex items-center gap-2 px-3 text-[13px] font-semibold" style={{ gridColumn: "1 / -1" }}>
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
                className="flex min-w-0 cursor-pointer items-center gap-2 pr-3 pl-4 text-left sm:pl-[38px] text-[13px] hover:underline hover:decoration-[#C9C7C2]"
                style={{ gridRow: 1, gridColumn: 1 }}
              >
                <span className="truncate">{b.task.title}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenTask(b.task.id)}
                title={b.task.title}
                className={`relative z-[1] mx-0.5 flex h-5 cursor-pointer items-center justify-center self-center overflow-hidden px-1.5 text-[11px] font-medium whitespace-nowrap ${barState(b.task, today)} ${
                  b.clippedStart ? "rounded-l-none" : "rounded-l"
                } ${b.clippedEnd ? "rounded-r-none" : "rounded-r"}`}
                style={{ gridRow: 1, gridColumn: `${b.from + 2} / ${b.to + 3}`, background: taskColor(b.task.id).bg, color: taskColor(b.task.id).fg }}
              >
                {/* 이틀 이상인 막대에만 제목 (넘치면 잘림) */}
                {b.to - b.from >= 1 ? (
                  <span className="truncate">
                    {b.task.status === "done" ? "✓ " : ""}
                    {b.task.title}
                  </span>
                ) : null}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function GanttLegend() {
  const items: { cls: string; label: string }[] = [
    { cls: "bg-[#C6DCF5] opacity-50", label: "완료" },
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
