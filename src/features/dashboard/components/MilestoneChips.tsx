import { Icon } from "@/components/ui/Icon";
import { dDay } from "@/features/projects/milestones";
import type { Milestone } from "@/features/projects/types";
import { daysBetween, formatShort, weekdayOf } from "@/lib/dates";

/** 이 날 수 안으로 남으면 빨갛게 채워 강조 */
const URGENT_DAYS = 3;

/**
 * 대시보드 제목 아래 마일스톤 D-day 칩. 다가오는 것만 날짜순, 가장 가까운 날짜인 것은 진하게, D-3 이내는 빨강.
 * 다 지났으면 마지막 것 하나만 흐리게 "끝남".
 */
export function MilestoneChips({ milestones, today }: { milestones: readonly Milestone[]; today: string }) {
  const upcoming = milestones.filter((m) => m.date >= today);
  const shown = upcoming.length > 0 ? upcoming : milestones.slice(-1);
  if (shown.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {shown.map((m) => {
        const left = daysBetween(today, m.date);
        const past = left < 0;
        // 가장 가까운 날짜인 것은 모두 강조 (같은 날 여러 개여도), D-3 이내는 모두 빨강
        const next = !past && m.date === upcoming[0]?.date;
        const urgent = !past && left <= URGENT_DAYS;
        const tone = urgent
          ? "bg-danger text-white"
          : next
            ? "bg-[#FDF0EF] text-[#B42318] shadow-[inset_0_0_0_1px_#F3C4C0]"
            : "bg-side text-sub";
        return (
          <span key={m.id} className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] ${tone} ${past ? "opacity-60" : ""}`}>
            <Icon name="flag" size={13} />
            <span className="font-medium">{m.name}</span>
            <b className="font-bold tabular-nums">{dDay(m.date, today)}</b>
            <span className={`tabular-nums ${urgent ? "text-white/80" : "text-muted"}`}>
              {formatShort(m.date)}({weekdayOf(m.date)})
            </span>
          </span>
        );
      })}
    </div>
  );
}
