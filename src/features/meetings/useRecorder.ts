"use client";

import { useCallback, useEffect, useRef } from "react";
import { useTransientState } from "@/hooks/useTransientState";
import { MAX_RECORD_SEC } from "./limits";

export type RecorderState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "recording"; elapsed: number }
  | { status: "done"; blob: Blob; filename: string; durationSec: number; url: string }
  | { status: "error"; message: string };

const IDLE: RecorderState = { status: "idle" };

/** 브라우저마다 되는 형식이 달라서 앞에서부터 고른다 (크롬 · 파이어폭스 = webm, 사파리 = mp4) */
const MIME_TYPES = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"] as const;

/** 음성 인식에는 낮은 음질로 충분하다 → 60분 ≈ 14MB 로 업로드 상한(25MB) 안에 들어온다 */
const BITS_PER_SECOND = 32_000;

function extensionFor(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

/**
 * 브라우저 마이크 녹음 (MediaRecorder). 최대 60분이 되면 자동으로 끝난다.
 * 화면을 떠나면(숨겨지면) 녹음을 멈추고 처음 상태로 돌아간다.
 */
export function useRecorder() {
  const [state, setState] = useTransientState<RecorderState>(IDLE);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const release = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  // 화면을 떠나면 녹음 중지 (결과는 버린다)
  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      release();
    };
  }, [release]);

  // 미리듣기 주소 정리
  useEffect(() => {
    if (state.status !== "done") return;
    const url = state.url;
    return () => URL.revokeObjectURL(url);
  }, [state]);

  async function start(): Promise<void> {
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState({ status: "error", message: "이 브라우저는 녹음을 지원하지 않아요. 크롬에서 열거나 녹음 파일을 올려주세요." });
      return;
    }
    setState({ status: "requesting" });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState({ status: "error", message: "마이크를 쓸 수 없어요. 주소창 왼쪽의 사이트 설정에서 마이크 권한을 허용해주세요." });
      return;
    }

    const mimeType = MIME_TYPES.find((m) => MediaRecorder.isTypeSupported(m));
    const recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: BITS_PER_SECOND });
    const chunks: Blob[] = [];
    const startedAt = Date.now();

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunks, { type });
      release();
      setState({
        status: "done",
        blob,
        filename: `meeting.${extensionFor(type)}`,
        durationSec: Math.round((Date.now() - startedAt) / 1000),
        url: URL.createObjectURL(blob),
      });
    };

    streamRef.current = stream;
    recorderRef.current = recorder;
    recorder.start(1000);
    setState({ status: "recording", elapsed: 0 });
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      if (elapsed >= MAX_RECORD_SEC) recorder.stop();
      else setState({ status: "recording", elapsed });
    }, 1000);
  }

  function stop(): void {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }

  function reset(): void {
    setState(IDLE);
  }

  return { state, start, stop, reset };
}
