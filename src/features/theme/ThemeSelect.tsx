"use client";

import { useState } from "react";
import { applyTheme, readTheme, type ThemeChoice } from "./theme";

const OPTIONS: ReadonlyArray<{ value: ThemeChoice; label: string }> = [
  { value: "light", label: "라이트" },
  { value: "dark", label: "다크" },
  { value: "system", label: "시스템 설정" },
];

/** 화면 테마 고르기 (이 브라우저에만 저장) */
export function ThemeSelect() {
  const [choice, setChoice] = useState<ThemeChoice>(readTheme);

  return (
    <div className="flex flex-col gap-1.5">
      <div role="radiogroup" aria-label="화면 테마" className="inline-flex w-fit rounded-md bg-hover p-0.5">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={choice === o.value}
            onClick={() => {
              setChoice(o.value);
              applyTheme(o.value);
            }}
            className={`h-7 cursor-pointer rounded-[5px] px-3 text-sm ${
              choice === o.value ? "bg-surface font-medium text-ink shadow-[0_1px_2px_rgba(15,15,15,0.1)]" : "text-sub"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <span className="text-xs text-muted">기본은 라이트예요. 시스템 설정을 고르면 기기의 라이트 · 다크 모드를 따라가요. 이 브라우저에만 저장돼요.</span>
    </div>
  );
}
