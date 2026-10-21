import { FirebaseError } from "firebase/app";
import { collection, deleteDoc, doc, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase";
import { addTaskNotification } from "@/features/notifications/services";
import type { TaskInput } from "@/features/tasks/types";
import type { ActionItem, MeetingResult, NextMeeting } from "./types";

function failure(e: unknown): MeetingResult {
  if (e instanceof FirebaseError && e.code === "permission-denied") {
    return { ok: false, message: "권한이 없어요. 프로젝트 멤버인지 확인해주세요." };
  }
  if (e instanceof FirebaseError && e.code === "unavailable") {
    return { ok: false, message: "네트워크에 연결할 수 없어요. 인터넷 연결을 확인해주세요." };
  }
  return { ok: false, message: "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요." };
}

export type MeetingContent = { kind: "audio"; audio: Blob; filename: string } | { kind: "text"; text: string };

/**
 * 회의록 만들기 → 우리 서버(/api/meetings). 음성 인식 키가 서버에만 있어서 브라우저가 Groq 를 직접 부르지 않는다.
 * 녹음 · 파일은 multipart, 직접 입력은 JSON 으로 보낸다.
 */
export async function createMeeting(projectId: string, title: string, content: MeetingContent): Promise<MeetingResult> {
  const user = firebaseAuth().currentUser;
  if (!user) return { ok: false, message: "로그인한 뒤 만들 수 있어요." };

  const headers: Record<string, string> = { Authorization: `Bearer ${await user.getIdToken()}` };
  let body: BodyInit;
  if (content.kind === "audio") {
    const form = new FormData();
    form.append("projectId", projectId);
    form.append("title", title);
    form.append("audio", content.audio, content.filename);
    // multipart 경계(boundary)는 브라우저가 붙이므로 Content-Type 을 직접 넣지 않는다
    body = form;
  } else {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({ projectId, title, text: content.text });
  }

  try {
    const res = await fetch("/api/meetings", { method: "POST", headers, body });
    return (await res.json()) as MeetingResult;
  } catch {
    return { ok: false, message: "서버에 연결하지 못했어요. 배포 주소에서 다시 시도해주세요." };
  }
}

/**
 * 할 일 후보 → 보드 카드 (폼에서 확인 · 수정한 값으로). 카드 번호 발급 · 할 일 생성 · 회의록에 "추가됨(TM-n)" 표시를 한 트랜잭션으로 처리한다
 * (둘이 같이 눌러도 같은 후보가 두 번 추가되지 않는다).
 */
export async function addActionItemToBoard(projectId: string, meetingId: string, index: number, input: TaskInput): Promise<MeetingResult> {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid) return { ok: false, message: "로그인한 뒤 추가할 수 있어요." };

  const db = firestore();
  const projectRef = doc(db, "projects", projectId);
  const meetingRef = doc(db, "projects", projectId, "meetings", meetingId);
  const taskRef = doc(collection(db, "projects", projectId, "tasks"));
  try {
    const taskNumber = await runTransaction(db, async (tx) => {
      const [project, meeting] = await Promise.all([tx.get(projectRef), tx.get(meetingRef)]);
      const items = (meeting.data()?.actionItems ?? []) as ActionItem[];
      const item = items[index];
      if (!item) throw new Error("missing");
      if (item.taskNumber !== null) return item.taskNumber;

      const number = Number(project.data()?.taskCounter ?? 0) + 1;
      tx.update(projectRef, { taskCounter: number });
      tx.set(taskRef, {
        ...input,
        number,
        status: "todo",
        statusSource: "manual",
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      tx.set(doc(collection(taskRef, "history")), { from: null, to: "todo", source: "manual", actor: uid, at: serverTimestamp() });
      tx.update(meetingRef, { actionItems: items.map((it, i) => (i === index ? { ...it, taskNumber: number } : it)) });
      addTaskNotification(
        tx,
        { id: projectId, name: String(project.data()?.name ?? "") },
        { id: taskRef.id, number, title: input.title, assigneeId: input.assigneeId, createdBy: uid },
        "assign",
        "회의록에서 할 일을 맡겼어요",
        input.assigneeId,
      );
      return number;
    });
    return { ok: true, taskNumber };
  } catch (e) {
    if (e instanceof Error && e.message === "missing") return { ok: false, message: "후보를 찾을 수 없어요. 새로고침해주세요." };
    return failure(e);
  }
}

/** 회의록 삭제 (만든 사람 · 프로젝트를 만든 사람). 이미 보드에 추가한 카드는 남는다 */
export async function deleteMeeting(projectId: string, meetingId: string): Promise<MeetingResult> {
  try {
    await deleteDoc(doc(firestore(), "projects", projectId, "meetings", meetingId));
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

/** 다음 회의 등록 · 변경 (null = 등록 취소). 프로젝트 멤버 누구나 */
export async function setNextMeeting(projectId: string, meetingId: string, next: NextMeeting | null): Promise<MeetingResult> {
  try {
    await updateDoc(doc(firestore(), "projects", projectId, "meetings", meetingId), { nextMeeting: next });
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
