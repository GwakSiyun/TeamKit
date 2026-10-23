import type { ReactNode } from "react";
import { LogoMark } from "./LogoMark";

interface ErrorScreenProps {
  /** 크게 보여줄 상태 코드 (404 · 403 · 500) */
  code: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  /** 작게 덧붙일 정보 (오류 번호 등) */
  footnote?: ReactNode;
}

/** 404 · 403 · 500 공통 에러 화면 (가운데 정렬, 로고 + 큰 코드 + 안내 + 버튼) */
export function ErrorScreen({ code, title, description, actions, footnote }: ErrorScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-20 text-center">
      <div className="flex items-center gap-4">
        <LogoMark size={44} />
        <span className="font-mono text-[56px] leading-none font-bold tracking-tight text-faint tabular-nums">{code}</span>
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm leading-relaxed break-keep text-muted">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap justify-center gap-2">{actions}</div>}
      {footnote && <p className="text-xs text-faint">{footnote}</p>}
    </div>
  );
}
