"use client";

import { Avatar } from "@/components/ui/Avatar";
import { weekdayOf } from "@/lib/dates";
import { lateDays } from "@/features/tasks/deadline";
import type { Task } from "@/features/tasks/types";
import type { GanttGroup, GanttRange } from "../gantt";

const LABEL_WIDTH = 240;
const DAY_MIN = 24;

// 막대 색: 상태 + 지연
function barStyle(task: Task, today: string): string {
  if (lateDays(task, today) > 0) return "bg-danger text-white";
  if (task.status === "done") return "bg-[#4DAB9A] text-white";
  if (task.status === "doing") return "bg-accent text-white";
  return "bg-[#D3D1CB] text-ink";
}

function columnStyle(count: number): React.CSSProperties {
  return { gridTemplateColumns: `${LABEL_WIDTH}px repeat(${count}, minmax(${DAY_MIN}px, 1fr))`, minWidth: LABEL_WIDTH + count * DAY_MIN };
}

/** 주말 · 오늘 배경 칸 (행마다 같은 그리드에 깔린다) */
function Backdrop({ days, today }: { days: string[]; today: string }) {
  return (
    <>
      {days.map((d, i) => {
        const weekend = weekdayOf(d) === "토" || weekdayOf(d) === "일";
        if (d !== today && !weekend) return null;
        return <div key={d} aria-hidden className={d === today ? "bg-[#EAF3FB]" : "bg-[#FAFAF9]"} style={{ gridRow: 1, gridColumn: i + 2 }} />;
      })}
    </>
  );
}

interface GanttChartProps {
  range: GanttRange;
  groups: GanttGroup[];
  today: string;
  onOpenTask: (taskId: string) => void;
}

export function GanttChart({ range, groups, today, onOpenTask }: GanttChartProps) {
  const { days } = range;
  const grid = columnStyle(days.length);

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      {/* 날짜 머리글 */}
      <div className="grid h-10 border-b border-line text-[11px] text-muted" style={grid}>
        <Backdrop days={days} today={today} />
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
              <Backdrop days={days} today={today} />
              <button
                type="button"
                onClick={() => onOpenTask(b.task.id)}
                className="flex min-w-0 cursor-pointer items-center gap-2 pr-3 pl-[38px] text-left text-[13px] hover:underline hover:decoration-[#C9C7C2]"
                style={{ gridRow: 1, gridColumn: 1 }}
              >
                <span className="truncate">{b.task.title}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenTask(b.task.id)}
                title={b.task.title}
                className={`relative z-[1] mx-0.5 flex h-5 cursor-pointer items-center self-center overflow-hidden px-1.5 text-[11px] font-medium whitespace-nowrap ${barStyle(b.task, today)} ${
                  b.clippedStart ? "rounded-l-none" : "rounded-l"
                } ${b.clippedEnd ? "rounded-r-none" : "rounded-r"}`}
                style={{ gridRow: 1, gridColumn: `${b.from + 2} / ${b.to + 3}` }}
              >
                {/* 이틀 이상인 막대에만 제목 (넘치면 잘림) */}
                {b.to - b.from >= 1 ? <span className="truncate">{b.task.title}</span> : null}
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
    { cls: "bg-[#D3D1CB]", label: "할 일" },
    { cls: "bg-accent", label: "진행 중" },
    { cls: "bg-[#4DAB9A]", label: "완료" },
    { cls: "bg-danger", label: "지연" },
    { cls: "bg-[#EAF3FB] shadow-[inset_0_0_0_1px_var(--color-accent)]", label: "오늘" },
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
