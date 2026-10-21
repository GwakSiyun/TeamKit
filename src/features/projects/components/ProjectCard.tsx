import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { daysBetween, todayISO } from "@/lib/dates";
import { useProjectStats } from "../hooks";
import { dDay, milestonesOf, upcomingMilestones } from "../milestones";
import type { Project } from "../types";

/** 이 날 수 안으로 남은 마일스톤은 빨갛게 */
const URGENT_DAYS = 3;

/** 내 프로젝트 목록 카드: 이름 · 팀원 + 진행률 · 가장 가까운 마일스톤 D-day · 지연 개수 */
export function ProjectCard({ project, isOwner }: { project: Project; isOwner: boolean }) {
  const stats = useProjectStats(project.id);
  const today = todayISO();
  const next = upcomingMilestones(milestonesOf(project), today)[0];
  const percent = stats && stats !== "loading" && stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <Link
      href={`/p/${project.id}`}
      className="flex flex-col gap-3.5 rounded-lg border border-line bg-surface p-4 text-ink transition-shadow hover:shadow-[0_2px_6px_rgba(15,15,15,0.08)] focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[7px] border border-line bg-side font-bold">
          {project.name.slice(0, 1)}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-bold">{project.name}</span>
          <span className="text-xs text-muted">
            팀원 {project.memberIds.length}명{isOwner ? " · 내가 만든 프로젝트" : ""}
          </span>
        </div>
      </div>

      {stats === "loading" ? (
        <div className="h-[34px] animate-pulse rounded bg-side" aria-hidden />
      ) : stats ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">{stats.total === 0 ? "아직 할 일이 없어요" : `${stats.done}/${stats.total}개 완료`}</span>
            {stats.total > 0 && <span className="font-semibold tabular-nums">{percent}%</span>}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-hover">
            <div className="h-full rounded-full bg-[#4DAB9A]" style={{ width: `${percent}%` }} />
          </div>
        </div>
      ) : null}

      {(next || (stats && stats !== "loading" && stats.late > 0)) && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {next && (
            <span
              className={`inline-flex h-6 items-center gap-1 rounded-full px-2 ${
                daysBetween(today, next.date) <= URGENT_DAYS ? "bg-danger text-white" : "bg-[#FDF0EF] text-[#B42318]"
              }`}
            >
              <Icon name="flag" size={12} />
              <span className="max-w-[120px] truncate">{next.name}</span>
              <b className="font-bold tabular-nums">{dDay(next.date, today)}</b>
            </span>
          )}
          {stats && stats !== "loading" && stats.late > 0 && (
            <span className="inline-flex h-6 items-center rounded-full bg-[#FFE2DD] px-2 font-medium text-[#5D1715]">지연 {stats.late}개</span>
          )}
        </div>
      )}
    </Link>
  );
}
