import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "danger" | "muted";
  children?: ReactNode;
}

const VALUE_TONE = { default: "text-ink", danger: "text-danger", muted: "text-faint" } as const;

export function StatCard({ label, value, sub, tone = "default", children }: StatCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-line px-4 py-3.5">
      <span className="text-[13px] text-muted">{label}</span>
      <span className={`text-2xl leading-tight font-bold tabular-nums ${VALUE_TONE[tone]}`}>{value}</span>
      {sub && <span className="truncate text-xs text-muted">{sub}</span>}
      {children}
    </div>
  );
}
