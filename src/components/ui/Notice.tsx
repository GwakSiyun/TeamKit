import type { ReactNode } from "react";

type Tone = "error" | "success" | "info";

const TONES: Record<Tone, string> = {
  error: "bg-danger-soft text-danger-fg",
  success: "bg-success-soft text-success-fg",
  info: "bg-side text-sub",
};

export function Notice({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md px-3.5 py-3 text-[13px] leading-relaxed ${TONES[tone]}`}>
      {children}
    </div>
  );
}
