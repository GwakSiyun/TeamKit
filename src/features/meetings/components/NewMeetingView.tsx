"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { BackLink } from "@/components/common/BackLink";
import { PageHeader } from "@/components/layout/PageHeader";
import { buttonClass } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { useCurrentProject } from "@/features/projects/ProjectContext";
import { projectBase } from "@/features/projects/navigation";
import { AUDIO_EXTENSIONS, MAX_AUDIO_BYTES, MAX_TEXT_LENGTH, MAX_TITLE_LENGTH } from "../limits";
import { createMeeting, type MeetingContent } from "../services";
import { useRecorder } from "../useRecorder";
import { KeywordGuide } from "./KeywordGuide";
import { Recorder } from "./Recorder";

type Mode = "record" | "file" | "text";

const MODES: ReadonlyArray<{ value: Mode; label: string; icon: IconName }> = [
  { value: "record", label: "녹음", icon: "mic" },
  { value: "file", label: "파일 올리기", icon: "upload" },
  { value: "text", label: "직접 입력", icon: "doc" },
];

function formatMB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function NewMeetingView() {
  const { project } = useCurrentProject();
  const router = useRouter();
  const recorder = useRecorder();
  const [mode, setMode] = useState<Mode>("record");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const base = `${projectBase(project.id)}/meetings`;
  const recording = recorder.state.status === "recording" || recorder.state.status === "requesting";

  function handleFile(e: ChangeEvent<HTMLInputElement>): void {
    const picked = e.target.files?.[0] ?? null;
    setError(picked && picked.size > MAX_AUDIO_BYTES ? `파일이 너무 커요 (${formatMB(picked.size)}). 25MB 이하로 올려주세요.` : null);
    setFile(picked);
  }

  /** 지금 모드에서 보낼 내용. 없으면 오류 문장 */
  function content(): MeetingContent | string {
    if (mode === "record") {
      if (recorder.state.status !== "done") return "녹음을 끝낸 뒤 만들 수 있어요.";
      if (recorder.state.blob.size > MAX_AUDIO_BYTES) return `녹음 파일이 너무 커요 (${formatMB(recorder.state.blob.size)}). 25MB 이하만 올릴 수 있어요.`;
      return { kind: "audio", audio: recorder.state.blob, filename: recorder.state.filename };
    }
    if (mode === "file") {
      if (!file) return "음성 파일을 골라주세요.";
      if (file.size > MAX_AUDIO_BYTES) return `파일이 너무 커요 (${formatMB(file.size)}). 25MB 이하로 올려주세요.`;
      return { kind: "audio", audio: file, filename: file.name };
    }
    if (!text.trim()) return "회의 내용을 입력해주세요.";
    return { kind: "text", text };
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("제목을 입력해주세요.");
      return;
    }
    const c = content();
    if (typeof c === "string") {
      setError(c);
      return;
    }
    setError(null);
    setPending(true);
    const result = await createMeeting(project.id, trimmed, c);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`${base}/${result.meetingId}`);
  }

  return (
    <>
      <BackLink href={base} label="회의록 목록으로" />
      <PageHeader title="새 회의록" description="녹음하거나 파일을 올리면 텍스트로 바꾸고, 결정사항 · 할 일 후보를 찾아줘요" />

      <form onSubmit={handleSubmit} noValidate className="flex max-w-[720px] flex-col gap-5">
        <Field
          id="meeting-title"
          label="제목"
          placeholder="예) 3주차 정기 회의"
          maxLength={MAX_TITLE_LENGTH}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-sub">회의 내용</span>
          <div role="radiogroup" aria-label="회의 내용 넣는 방법" className="inline-flex w-fit rounded-md bg-hover p-0.5">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={mode === m.value}
                disabled={recording || pending}
                onClick={() => {
                  setMode(m.value);
                  setError(null);
                }}
                className={`inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-[5px] px-3 text-sm disabled:cursor-not-allowed ${
                  mode === m.value ? "bg-surface font-medium text-ink shadow-[0_1px_2px_rgba(15,15,15,0.1)]" : "text-sub"
                }`}
              >
                <Icon name={m.icon} size={14} />
                {m.label}
              </button>
            ))}
          </div>

          {mode === "record" && <Recorder state={recorder.state} onStart={recorder.start} onStop={recorder.stop} onReset={recorder.reset} disabled={pending} />}

          {mode === "file" && (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-dashed px-6 py-8 text-center hover:bg-side">
              <span className="inline-flex size-11 items-center justify-center rounded-[10px] bg-side text-muted">
                <Icon name="upload" size={22} />
              </span>
              {file ? (
                <span className="text-sm font-medium">
                  {file.name} <span className="font-normal text-muted">· {formatMB(file.size)}</span>
                </span>
              ) : (
                <span className="text-sm font-medium">음성 파일 고르기</span>
              )}
              <span className="text-xs text-muted">{AUDIO_EXTENSIONS.join(" · ")} · 25MB 이하 · 휴대폰 녹음 앱 파일(m4a)도 돼요</span>
              <input type="file" accept={AUDIO_EXTENSIONS.map((ext) => `.${ext}`).join(",")} onChange={handleFile} disabled={pending} className="sr-only" />
            </label>
          )}

          {mode === "text" && (
            <TextAreaField
              id="meeting-text"
              label="회의 메모"
              rows={12}
              maxLength={MAX_TEXT_LENGTH}
              hint="한 줄에 한 문장씩 적으면 후보를 더 잘 찾아요"
              placeholder={"예)\n로그인은 GitHub 로그인으로 가기로 했어요.\n시윤님이 금요일까지 회원가입 화면 맡아 주세요.\n다음 회의는 목요일 저녁으로 확정."}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}
        </div>

        <KeywordGuide />

        {error && <Notice tone="error">{error}</Notice>}
        {pending && mode !== "text" && (
          <Notice tone="info">음성을 텍스트로 바꾸는 중이에요. 1시간 녹음도 보통 1분 안에 끝나요. 이 화면을 닫지 말아주세요.</Notice>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => router.push(base)} disabled={pending} className={buttonClass("secondary")}>
            취소
          </button>
          <button type="submit" disabled={pending || recording} className={buttonClass("primary")}>
            {pending ? (mode === "text" ? "만드는 중…" : "텍스트로 바꾸는 중…") : mode === "text" ? "후보 찾기" : "텍스트로 바꾸고 후보 찾기"}
          </button>
        </div>
      </form>
    </>
  );
}
