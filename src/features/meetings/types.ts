import type { Timestamp } from "firebase/firestore";

export type MeetingSource = "audio" | "text";

/** 회의 내용 한 줄. 녹음이면 Whisper 가 나눈 구간(start = 시작 초), 직접 입력이면 한 줄(start = null) */
export interface MeetingSegment {
  start: number | null;
  text: string;
}

/** 결정사항 후보. segment = 원문 줄 번호 (본문에서 표시 · 이동용) */
export interface MeetingDecision {
  text: string;
  segment: number;
}

/** 할 일 후보. 보드에 추가하면 taskNumber 가 생긴다 */
export interface ActionItem {
  text: string;
  segment: number;
  taskNumber: number | null;
}

/** 이 회의에서 정한 다음 회의 (결정사항에서 등록). 대시보드 "다음 회의" · 간트 점선에 쓴다 */
export interface NextMeeting {
  /** "YYYY-MM-DD" */
  date: string;
  /** 시작 시각 0~23 */
  hour: number;
  /** 근거가 된 결정사항 문장 */
  text: string;
}

/** projects/{projectId}/meetings/{meetingId} — 만들기는 서버(/api/meetings)만, 브라우저는 actionItems 만 수정 */
export interface MeetingDoc {
  title: string;
  source: MeetingSource;
  /** 녹음 길이(초). 직접 입력이면 null */
  durationSec: number | null;
  segments: MeetingSegment[];
  decisions: MeetingDecision[];
  actionItems: ActionItem[];
  nextMeeting?: NextMeeting | null;
  createdBy: string;
  createdAt: Timestamp | null;
}

export interface Meeting extends MeetingDoc {
  id: string;
}

export type MeetingResult = { ok: true; meetingId?: string; taskNumber?: number } | { ok: false; message: string };
