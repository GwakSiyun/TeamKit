import type { Timestamp } from "firebase/firestore";

export type PollStatus = "open" | "confirmed";

export interface ConfirmedSlot {
  /** "YYYY-MM-DD" */
  date: string;
  /** 시작 시각 (0~23) */
  hour: number;
}

/** projects/{projectId}/polls/{pollId} */
export interface PollDoc {
  title: string;
  startDate: string;
  endDate: string;
  /** 하루 중 시작 시각 (포함) */
  startHour: number;
  /** 하루 중 끝 시각 (미포함). 22 이면 21시 칸까지 */
  endHour: number;
  durationHours: 1 | 2;
  status: PollStatus;
  confirmedSlot: ConfirmedSlot | null;
  createdBy: string;
  createdAt: Timestamp | null;
}

export interface Poll extends PollDoc {
  id: string;
}

/** polls/{pollId}/responses/{uid} — slots 는 "YYYY-MM-DDTHH" (그 시각부터 1시간 가능) */
export interface PollResponse {
  uid: string;
  slots: string[];
}

export type PollInput = Pick<PollDoc, "title" | "startDate" | "endDate" | "startHour" | "endHour" | "durationHours">;

export type PollResult = { ok: true; pollId?: string } | { ok: false; message: string };
