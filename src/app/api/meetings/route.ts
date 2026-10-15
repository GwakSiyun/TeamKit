import { FieldValue } from "firebase-admin/firestore";
import { fail, json, readBody, requireUser } from "@/lib/server/http";
import { extractCandidates, segmentsFromText } from "@/features/meetings/extract";
import { AUDIO_EXTENSIONS, MAX_AUDIO_BYTES, MAX_TEXT_LENGTH, MAX_TITLE_LENGTH } from "@/features/meetings/limits";
import { transcribe } from "@/features/meetings/server/groq";
import type { MeetingSegment, MeetingSource } from "@/features/meetings/types";
import { adminDb } from "@/lib/server/firebaseAdmin";

// 긴 녹음은 음성 인식에 수십 초 걸릴 수 있다
export const maxDuration = 300;

interface Input {
  projectId: string;
  title: string;
  audio: File | null;
  text: string;
}

async function readInput(request: Request): Promise<Input | null> {
  if ((request.headers.get("content-type") ?? "").startsWith("multipart/form-data")) {
    try {
      const form = await request.formData();
      const audio = form.get("audio");
      return {
        projectId: String(form.get("projectId") ?? ""),
        title: String(form.get("title") ?? ""),
        audio: audio instanceof File ? audio : null,
        text: "",
      };
    } catch {
      return null;
    }
  }
  const body = await readBody(request);
  return {
    projectId: typeof body.projectId === "string" ? body.projectId : "",
    title: typeof body.title === "string" ? body.title : "",
    audio: null,
    text: typeof body.text === "string" ? body.text : "",
  };
}

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/**
 * 회의록 만들기 (프로젝트 멤버만).
 * 녹음 · 파일(multipart, audio) → Groq Whisper 로 텍스트 변환, 직접 입력(JSON, text) → 줄 단위로 나눔.
 * 그다음 규칙 기반으로 결정사항 · 할 일 후보를 뽑아 Firestore 에 저장한다. 음성 파일은 저장하지 않는다.
 */
export async function POST(request: Request): Promise<Response> {
  const uid = await requireUser(request);
  if (uid instanceof Response) return uid;

  const input = await readInput(request);
  if (!input) return fail(400, "보낸 내용을 읽지 못했어요. 다시 시도해주세요.");
  const title = input.title.trim();
  if (!input.projectId) return fail(400, "프로젝트 정보가 없어요.");
  if (!title || title.length > MAX_TITLE_LENGTH) return fail(400, `제목은 1~${MAX_TITLE_LENGTH}자로 입력해주세요.`);

  // 음성 인식(외부 API) 호출 전에 멤버인지 먼저 확인
  const db = adminDb();
  const project = await db.doc(`projects/${input.projectId}`).get();
  const memberIds: unknown = project.get("memberIds");
  if (!project.exists || !Array.isArray(memberIds) || !memberIds.includes(uid)) return fail(403, "이 프로젝트의 멤버만 회의록을 만들 수 있어요.");

  let source: MeetingSource;
  let segments: MeetingSegment[];
  let durationSec: number | null = null;

  if (input.audio) {
    const audio = input.audio;
    if (audio.size === 0) return fail(400, "녹음 파일이 비어 있어요.");
    if (audio.size > MAX_AUDIO_BYTES) return fail(413, "파일이 너무 커요. 25MB 이하로 올려주세요.");
    if (!(AUDIO_EXTENSIONS as readonly string[]).includes(extensionOf(audio.name))) {
      return fail(400, `지원하지 않는 형식이에요. (${AUDIO_EXTENSIONS.join(", ")})`);
    }
    const result = await transcribe(audio, audio.name);
    if (!result.ok) return fail(result.status, result.message);
    source = "audio";
    segments = result.segments;
    durationSec = result.durationSec;
  } else {
    const text = input.text.trim();
    if (!text) return fail(400, "회의 내용을 입력해주세요.");
    if (text.length > MAX_TEXT_LENGTH) return fail(400, `회의 내용은 ${MAX_TEXT_LENGTH.toLocaleString()}자까지 입력할 수 있어요.`);
    source = "text";
    segments = segmentsFromText(text);
  }

  if (segments.length === 0) return fail(422, "말소리를 찾지 못했어요. 녹음이 잘 됐는지 확인해주세요.");

  const { decisions, actionItems } = extractCandidates(segments);
  const ref = db.collection(`projects/${input.projectId}/meetings`).doc();
  await ref.set({
    title,
    source,
    durationSec,
    segments,
    decisions,
    actionItems,
    createdBy: uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return json(200, { ok: true, meetingId: ref.id });
}
