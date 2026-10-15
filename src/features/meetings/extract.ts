import type { ActionItem, MeetingDecision, MeetingSegment } from "./types";

/**
 * 규칙 기반 후보 추출 (AI 요약 아님). 문장에 아래 표현이 있으면 후보로 뽑는다.
 * 후보일 뿐이라 화면에서 사람이 보고 보드에 추가할지 고른다.
 */
export const DECISION_KEYWORDS = ["기로 했", "기로 해", "기로했", "결정", "확정", "합의", "정했", "정하자", "채택", "로 가자", "로 갑시다"] as const;

export const ACTION_KEYWORDS = ["해주세요", "해 주세요", "해줘", "부탁", "맡아", "맡을", "담당", "할게요", "하겠습니다", "해야", "까지 해", "까지 끝", "까지 올"] as const;

/** 회의 진행 멘트는 "~할게요" 여도 할 일이 아니다 */
const NOT_ACTION = ["시작할게", "시작하겠", "마칠게", "마치겠", "넘어갈게", "넘어가겠", "끝낼게요"] as const;

/** 회의록에 넣는 최대 개수 · 길이 */
export const MAX_CANDIDATES = 30;
const MAX_TEXT = 200;

/** 줄 · 문장부호 기준으로 문장 나누기 */
export function splitSentences(text: string): string[] {
  return text
    .split(/\n+|(?<=[.!?。])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function matches(sentence: string, keywords: readonly string[]): boolean {
  const compact = sentence.replace(/\s+/g, " ");
  return keywords.some((k) => compact.includes(k));
}

function clip(text: string): string {
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;
}

/** 한 문장이 결정사항이면서 할 일일 수도 있다 ("로그인은 금요일까지 하기로 했어요") → 양쪽에 다 넣는다 */
export function extractCandidates(segments: readonly MeetingSegment[]): { decisions: MeetingDecision[]; actionItems: ActionItem[] } {
  const decisions: MeetingDecision[] = [];
  const actionItems: ActionItem[] = [];
  const seenD = new Set<string>();
  const seenA = new Set<string>();

  segments.forEach((seg, segment) => {
    for (const sentence of splitSentences(seg.text)) {
      const text = clip(sentence);
      if (matches(sentence, DECISION_KEYWORDS) && !seenD.has(text) && decisions.length < MAX_CANDIDATES) {
        seenD.add(text);
        decisions.push({ text, segment });
      }
      if (matches(sentence, ACTION_KEYWORDS) && !matches(sentence, NOT_ACTION) && !seenA.has(text) && actionItems.length < MAX_CANDIDATES) {
        seenA.add(text);
        actionItems.push({ text, segment, taskNumber: null });
      }
    }
  });

  return { decisions, actionItems };
}

/** 직접 입력한 회의 내용 → 줄 단위 구간 */
export function segmentsFromText(text: string): MeetingSegment[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => ({ start: null, text: line }));
}

/** 초 → "12:05" (1시간 넘으면 "1:02:05") */
export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
