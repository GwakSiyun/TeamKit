"use client";

import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import { Field, SelectField } from "@/components/ui/Field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { setNextMeeting } from "../services";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${String(h).padStart(2, "0")}:00` }));

interface NextMeetingModalProps {
  projectId: string;
  meetingId: string;
  /** 근거가 된 결정사항 문장 */
  text: string;
  initialDate: string;
  initialHour: number;
  onClose: () => void;
}

/** 결정사항에서 읽은 날짜 · 시각을 확인 · 수정해서 다음 회의로 등록 */
export function NextMeetingModal({ projectId, meetingId, text, initialDate, initialHour, onClose }: NextMeetingModalProps) {
  const [date, setDate] = useState(initialDate);
  const [hour, setHour] = useState(initialHour);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!date) {
      setError("날짜를 정해주세요.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await setNextMeeting(projectId, meetingId, { date, hour, text });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onClose();
  }

  return (
    <Modal open onClose={onClose} title="다음 회의로 등록" description="등록하면 대시보드의 다음 회의와 일정 차트에 표시돼요." width={440}>
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody>
          <p className="rounded-md bg-side px-3 py-2 text-[13px] leading-relaxed text-sub">“{text}”</p>
          {error && <Notice tone="error">{error}</Notice>}
          <div className="grid grid-cols-2 gap-3">
            <Field id="next-meeting-date" label="날짜" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <SelectField id="next-meeting-hour" label="시작 시각" options={HOUR_OPTIONS} value={String(hour)} onChange={(e) => setHour(Number(e.target.value))} />
          </div>
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={onClose} className={buttonClass("secondary")}>
            취소
          </button>
          <button type="submit" disabled={pending} className={buttonClass("primary")}>
            {pending ? "등록하는 중…" : "등록"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
