import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

/** 목록이 비었거나 접근할 수 없을 때 보여주는 가운데 정렬 안내 */
export function EmptyState({ icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-[#D9D8D4] px-6 py-[72px] text-center">
      {icon && <span className="inline-flex size-11 items-center justify-center rounded-[10px] bg-side text-muted">{icon}</span>}
      <h2 className="text-[17px] font-bold">{title}</h2>
      {description && <p className="text-sm leading-relaxed text-muted">{description}</p>}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
