"use client";

import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { formatClock } from "../extract";
import { MAX_RECORD_SEC } from "../limits";
import type { RecorderState } from "../useRecorder";

interface RecorderProps {
  state: RecorderState;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  disabled?: boolean;
}

/** 녹음 시작 · 진행 시간 · 끝내기 · 미리듣기 */
export function Recorder({ state, onStart, onStop, onReset, disabled = false }: RecorderProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-line px-6 py-8 text-center">
      {(state.status === "idle" || state.status === "error" || state.status === "requesting") && (
        <>
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger">
            <Icon name="mic" size={26} />
          </span>
          <button type="button" onClick={onStart} disabled={disabled || state.status === "requesting"} className={buttonClass("primary", "h-9 px-4")}>
            {state.status === "requesting" ? "마이크 연결 중…" : "녹음 시작"}
          </button>
          <span className="text-xs text-muted">최대 {MAX_RECORD_SEC / 60}분 · 녹음은 텍스트로 바꾼 뒤 저장하지 않아요</span>
          {state.status === "error" && <Notice tone="error">{state.message}</Notice>}
        </>
      )}

      {state.status === "recording" && (
        <>
          <span className="flex items-center gap-2 text-sm font-medium text-danger">
            <span className="size-2.5 animate-pulse rounded-full bg-danger" aria-hidden="true" />
            녹음 중
          </span>
          <span className="font-mono text-[32px] font-semibold tabular-nums" aria-live="off">
            {formatClock(state.elapsed)}
          </span>
          <button type="button" onClick={onStop} className={buttonClass("secondary", "h-9 px-4")}>
            <span className="size-2.5 rounded-[2px] bg-ink" aria-hidden="true" />
            녹음 끝내기
          </button>
        </>
      )}

      {state.status === "done" && (
        <>
          <span className="flex items-center gap-1.5 text-sm font-medium text-success-fg">
            <Icon name="check" size={16} />
            녹음 완료 · {formatClock(state.durationSec)}
          </span>
          <audio controls src={state.url} className="w-full max-w-md" />
          <button type="button" onClick={onReset} disabled={disabled} className={buttonClass("ghost")}>
            다시 녹음
          </button>
        </>
      )}
    </div>
  );
}
