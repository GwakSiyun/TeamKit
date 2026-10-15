import { FirebaseError } from "firebase/app";
import { addDoc, collection, doc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase";
import type { ConfirmedSlot, PollInput, PollResult } from "./types";

function failure(e: unknown): PollResult {
  if (e instanceof FirebaseError && e.code === "permission-denied") {
    return { ok: false, message: "권한이 없어요. 투표를 만든 사람만 확정 · 다시 열기를 할 수 있어요." };
  }
  if (e instanceof FirebaseError && e.code === "unavailable") {
    return { ok: false, message: "네트워크에 연결할 수 없어요. 인터넷 연결을 확인해주세요." };
  }
  return { ok: false, message: "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요." };
}

function pollsRef(projectId: string) {
  return collection(firestore(), "projects", projectId, "polls");
}

export async function createPoll(projectId: string, input: PollInput): Promise<PollResult> {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid) return { ok: false, message: "로그인한 뒤 만들 수 있어요." };
  try {
    const ref = await addDoc(pollsRef(projectId), {
      ...input,
      status: "open",
      confirmedSlot: null,
      createdBy: uid,
      createdAt: serverTimestamp(),
    });
    return { ok: true, pollId: ref.id };
  } catch (e) {
    return failure(e);
  }
}

/** 내 가능 시간 저장 (사람마다 문서 1개라 동시에 입력해도 서로 덮어쓰지 않는다) */
export async function saveMySlots(projectId: string, pollId: string, slots: string[]): Promise<PollResult> {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid) return { ok: false, message: "로그인한 뒤 입력할 수 있어요." };
  try {
    await setDoc(doc(pollsRef(projectId), pollId, "responses", uid), { slots: [...slots].sort(), updatedAt: serverTimestamp() });
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function confirmPoll(projectId: string, pollId: string, slot: ConfirmedSlot): Promise<PollResult> {
  try {
    await updateDoc(doc(pollsRef(projectId), pollId), { status: "confirmed", confirmedSlot: slot });
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function reopenPoll(projectId: string, pollId: string): Promise<PollResult> {
  try {
    await updateDoc(doc(pollsRef(projectId), pollId), { status: "open", confirmedSlot: null });
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

/** 투표와 응답(사람별 문서)을 한 배치로 지운다 (투표를 만든 사람 · 프로젝트를 만든 사람) */
export async function deletePoll(projectId: string, pollId: string): Promise<PollResult> {
  try {
    const responses = await getDocs(collection(pollsRef(projectId), pollId, "responses"));
    const batch = writeBatch(firestore());
    responses.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(pollsRef(projectId), pollId));
    await batch.commit();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
