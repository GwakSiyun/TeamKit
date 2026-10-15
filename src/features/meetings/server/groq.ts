// 서버 전용: Groq Whisper 음성 인식. API 키(GROQ_API_KEY)는 서버 환경 변수(Secret Manager)에만 있다
import type { MeetingSegment } from "../types";

const ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
const MODEL = "whisper-large-v3-turbo";
/** 이 값보다 "말소리 없음" 확률이 높은 구간은 버린다 (조용한 구간에서 Whisper 가 지어내는 문장 방지) */
const NO_SPEECH_CUTOFF = 0.8;

export type TranscribeResult = { ok: true; segments: MeetingSegment[]; durationSec: number | null } | { ok: false; status: number; message: string };

function toSegments(data: unknown): MeetingSegment[] {
  if (!data || typeof data !== "object") return [];
  const raw = (data as { segments?: unknown }).segments;
  if (Array.isArray(raw)) {
    return raw.flatMap((s): MeetingSegment[] => {
      if (!s || typeof s !== "object") return [];
      const { start, text, no_speech_prob: noSpeech } = s as { start?: unknown; text?: unknown; no_speech_prob?: unknown };
      const clean = typeof text === "string" ? text.trim() : "";
      if (!clean || (typeof noSpeech === "number" && noSpeech >= NO_SPEECH_CUTOFF)) return [];
      return [{ start: typeof start === "number" ? Math.round(start * 10) / 10 : null, text: clean }];
    });
  }
  // 구간 정보가 없으면 전체 텍스트를 한 구간으로
  const text = (data as { text?: unknown }).text;
  return typeof text === "string" && text.trim() ? [{ start: 0, text: text.trim() }] : [];
}

export async function transcribe(audio: Blob, filename: string): Promise<TranscribeResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { ok: false, status: 500, message: "음성 인식 키가 서버에 설정되지 않았어요. 배포 주소에서 다시 시도해주세요." };

  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", MODEL);
  form.append("language", "ko");
  form.append("response_format", "verbose_json");
  form.append("temperature", "0");

  let res: Response;
  try {
    // multipart 경계(boundary)는 fetch 가 붙이므로 Content-Type 을 직접 넣지 않는다
    res = await fetch(ENDPOINT, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
  } catch {
    return { ok: false, status: 502, message: "음성 인식 서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요." };
  }

  if (res.status === 413) return { ok: false, status: 413, message: "파일이 너무 커요. 25MB 이하로 올려주세요." };
  if (res.status === 429) return { ok: false, status: 429, message: "음성 인식 무료 사용량을 넘었어요. 잠시 후 다시 시도해주세요." };
  if (res.status === 400) return { ok: false, status: 400, message: "음성 파일을 읽지 못했어요. 다른 형식(mp3 · m4a · wav)으로 올려주세요." };
  if (res.status === 401) return { ok: false, status: 500, message: "음성 인식 키가 올바르지 않아요. 관리자에게 알려주세요." };
  if (!res.ok) return { ok: false, status: 502, message: "음성 인식에 실패했어요. 잠시 후 다시 시도해주세요." };

  const data: unknown = await res.json();
  const duration = data && typeof data === "object" ? (data as { duration?: unknown }).duration : undefined;
  return { ok: true, segments: toSegments(data), durationSec: typeof duration === "number" ? Math.round(duration) : null };
}
