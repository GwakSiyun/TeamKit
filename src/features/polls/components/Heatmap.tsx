"use client";

import { useEffect, useRef } from "react";
import { formatShort, weekdayOf } from "@/lib/dates";
import { slotKey } from "../slots";

// 가능 인원 비율 → 칸 색 (0명 · 일부 · 절반 이상 · 대부분 · 전원)
const LEVELS = [
  "bg-white text-ink shadow-[inset_0_0_0_1px_#ECEBE8]",
  "bg-[#D3E5EF] text-[#183347]",
  "bg-[#9CC3E4] text-[#0F2A40]",
  "bg-[#5A9BD8] text-white",
  "bg-accent text-white",
] as const;

function level(count: number, total: number): number {
  if (count === 0 || total === 0) return 0;
  if (count >= total) return 4;
  const ratio = count / total;
  return ratio >= 0.66 ? 3 : ratio >= 0.34 ? 2 : 1;
}

interface HeatmapProps {
  days: string[];
  hours: number[];
  /** 칸별 가능한 사람 수 (나 포함) */
  countOf: (key: string) => number;
  total: number;
  mine: Set<string>;
  /** 없으면 읽기 전용 (확정된 투표) */
  onChange?: (next: Set<string>) => void;
  /** 드래그가 끝났을 때 (저장 시점) */
  onCommit?: (next: Set<string>) => void;
}

/**
 * 날짜 × 시간 표. 칸을 누르거나 끌어서 내 가능 시간을 켜고 끈다.
 * 처음 누른 칸이 켜져 있었으면 "지우기", 꺼져 있었으면 "칠하기" 로 드래그 내내 같은 동작.
 */
export function Heatmap({ days, hours, countOf, total, mine, onChange, onCommit }: HeatmapProps) {
  const drag = useRef<{ mode: "add" | "remove"; next: Set<string> } | null>(null);
  const editable = !!onChange;

  useEffect(() => {
    function end(): void {
      if (!drag.current) return;
      const next = drag.current.next;
      drag.current = null;
      onCommit?.(next);
    }
    window.addEventListener("pointerup", end);
    return () => window.removeEventListener("pointerup", end);
  }, [onCommit]);

  function apply(key: string): void {
    const d = drag.current;
    if (!d || !onChange) return;
    if (d.mode === "add") d.next.add(key);
    else d.next.delete(key);
    onChange(new Set(d.next));
  }

  const cols = { gridTemplateColumns: `48px repeat(${days.length}, minmax(40px, 1fr))` };

  return (
    <div className="overflow-x-auto select-none">
      <div className="flex min-w-max flex-col gap-[3px]">
        <div className="grid gap-[3px]" style={cols}>
          <span />
          {days.map((d) => (
            <span key={d} className="text-center text-xs leading-tight text-muted tabular-nums">
              {weekdayOf(d)}
              <br />
              <b className="font-medium text-ink">{formatShort(d)}</b>
            </span>
          ))}
        </div>
        {hours.map((h) => (
          <div key={h} className="grid items-center gap-[3px]" style={cols}>
            <span className="text-[11px] text-faint tabular-nums">{String(h).padStart(2, "0")}:00</span>
            {days.map((d) => {
              const key = slotKey(d, h);
              const count = countOf(key);
              const isMine = mine.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!editable}
                  aria-pressed={isMine}
                  aria-label={`${formatShort(d)} ${weekdayOf(d)}요일 ${h}시, ${count}명 가능${isMine ? ", 나 포함" : ""}`}
                  onPointerDown={(e) => {
                    if (!editable) return;
                    e.preventDefault();
                    drag.current = { mode: isMine ? "remove" : "add", next: new Set(mine) };
                    apply(key);
                  }}
                  onPointerEnter={() => apply(key)}
                  className={`h-6 rounded-[3px] text-[11px] font-bold ${LEVELS[level(count, total)]} ${editable ? "cursor-pointer" : "cursor-default"}`}
                >
                  {isMine ? "✓" : ""}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeatmapLegend({ total }: { total: number }) {
  const steps = [
    { cls: LEVELS[0], label: "0명" },
    { cls: LEVELS[1], label: "일부" },
    { cls: LEVELS[3], label: "대부분" },
    { cls: LEVELS[4], label: `전원(${total}명)` },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted">
      가능 인원
      {steps.map((s) => (
        <span key={s.label} className="inline-flex items-center gap-1">
          <span className={`h-2.5 w-3.5 rounded-sm ${s.cls}`} />
          {s.label}
        </span>
      ))}
      <span>✓ = 내가 되는 시간 · 누르거나 끌어서 바꾸세요</span>
    </div>
  );
}
