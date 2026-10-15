"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import { Field, SelectField } from "@/components/ui/Field";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { Notice } from "@/components/ui/Notice";
import { useCurrentProject } from "@/features/projects/ProjectContext";
import { projectBase } from "@/features/projects/navigation";
import { addDays, daysBetween, todayISO } from "@/lib/dates";
import { MAX_POLL_DAYS } from "../slots";
import { createPoll } from "../services";
import type { PollInput } from "../types";

const HOUR_OPTIONS = Array.from({ length: 25 }, (_, h) => ({ value: String(h), label: `${String(h).padStart(2, "0")}:00` }));

function initial(): PollInput {
  const start = addDays(todayISO(), 1);
  return { title: "", startDate: start, endDate: addDays(start, 6), startHour: 10, endHour: 22, durationHours: 1 };
}

export function PollFormModal({ onClose }: { onClose: () => void }) {
  const { project } = useCurrentProject();
  const router = useRouter();
  const [v, setV] = useState<PollInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update<K extends keyof PollInput>(key: K, value: PollInput[K]): void {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  function validate(input: PollInput): string | null {
    if (!input.title) return "제목을 입력해주세요.";
    if (!input.startDate || !input.endDate) return "기간을 정해주세요.";
    if (input.startDate > input.endDate) return "종료일은 시작일과 같거나 뒤여야 해요.";
    if (daysBetween(input.startDate, input.endDate) >= MAX_POLL_DAYS) return `기간은 최대 ${MAX_POLL_DAYS}일이에요.`;
    if (input.startHour >= input.endHour) return "하루 중 끝 시각은 시작 시각보다 뒤여야 해요.";
    if (input.endHour - input.startHour < input.durationHours) return "시간 범위가 회의 길이보다 짧아요.";
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const input = { ...v, title: v.title.trim() };
    const found = validate(input);
    setError(found);
    if (found) return;
    setPending(true);
    const result = await createPoll(project.id, input);
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onClose();
    router.push(`${projectBase(project.id)}/polls/${result.pollId}`);
  }

  const seg = (value: 1 | 2) => (
    <button
      type="button"
      role="radio"
      aria-checked={v.durationHours === value}
      onClick={() => update("durationHours", value)}
      className={`h-7 cursor-pointer rounded-[5px] px-3 text-sm ${v.durationHours === value ? "bg-white font-medium text-ink shadow-[0_1px_2px_rgba(15,15,15,0.1)]" : "text-sub"}`}
    >
      {value}시간
    </button>
  );

  return (
    <Modal open onClose={onClose} title="새 투표" description="만들면 팀원 모두에게 투표가 보여요." width={520}>
      <form onSubmit={handleSubmit} noValidate>
        <ModalBody>
          {error && <Notice tone="error">{error}</Notice>}
          <Field id="poll-title" label="제목" placeholder="예) 2주차 회고" maxLength={60} autoFocus value={v.title} onChange={(e) => update("title", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Field id="poll-start" label="시작일" type="date" value={v.startDate} onChange={(e) => update("startDate", e.target.value)} />
            <Field id="poll-end" label="종료일" type="date" hint={`최대 ${MAX_POLL_DAYS}일`} value={v.endDate} onChange={(e) => update("endDate", e.target.value)} />
            <SelectField
              id="poll-from"
              label="하루 중 시작"
              options={HOUR_OPTIONS.slice(0, 24)}
              value={String(v.startHour)}
              onChange={(e) => update("startHour", Number(e.target.value))}
            />
            <SelectField id="poll-to" label="하루 중 끝" options={HOUR_OPTIONS.slice(1)} value={String(v.endHour)} onChange={(e) => update("endHour", Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-sub">회의 길이</span>
            <div role="radiogroup" aria-label="회의 길이" className="inline-flex w-fit rounded-md bg-hover p-0.5">
              {seg(1)}
              {seg(2)}
            </div>
            <span className="text-xs text-muted">이 길이만큼 연속으로 되는 시간만 추천해요</span>
          </div>
        </ModalBody>
        <ModalFooter>
          <button type="button" onClick={onClose} className={buttonClass("secondary")}>
            취소
          </button>
          <button type="submit" disabled={pending} className={buttonClass("primary")}>
            {pending ? "만드는 중…" : "만들기"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
