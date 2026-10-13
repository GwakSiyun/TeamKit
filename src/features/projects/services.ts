import { FirebaseError } from "firebase/app";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase";
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from "./inviteCode";
import type { JoinResult, Project, ProjectResult } from "./types";

const MAX_CODE_ATTEMPTS = 5;

function isPermissionDenied(e: unknown): boolean {
  return e instanceof FirebaseError && e.code === "permission-denied";
}

function failureMessage(e: unknown): string {
  if (e instanceof FirebaseError && e.code === "unavailable") {
    return "네트워크에 연결할 수 없어요. 인터넷 연결을 확인해주세요.";
  }
  return "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.";
}

/**
 * 프로젝트 + 초대 코드 문서를 한 배치로 만든다.
 * 이미 쓰이는 코드면 규칙이 거부하므로(permission-denied) 새 코드로 다시 시도한다.
 */
export async function createProject(rawName: string): Promise<ProjectResult> {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid) return { ok: false, message: "로그인한 뒤 만들 수 있어요." };
  const name = rawName.trim();

  const db = firestore();
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const projectRef = doc(collection(db, "projects"));
    const code = generateInviteCode();
    const batch = writeBatch(db);
    batch.set(projectRef, {
      name,
      inviteCode: code,
      ownerId: uid,
      memberIds: [uid],
      taskCounter: 0,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(db, "inviteCodes", code), { projectId: projectRef.id, createdAt: serverTimestamp() });
    try {
      await batch.commit();
      return { ok: true, projectId: projectRef.id };
    } catch (e) {
      if (!isPermissionDenied(e)) return { ok: false, message: failureMessage(e) };
      // 코드 충돌일 가능성이 높으므로 새 코드로 재시도
    }
  }
  return { ok: false, message: "초대 코드를 만들지 못했어요. 다시 시도해주세요." };
}

/** 초대 코드 → 프로젝트 찾기 → 참여 증명(joins/{uid}) + memberIds 추가를 한 배치로 */
export async function joinProject(rawCode: string): Promise<JoinResult> {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid) return { status: "error", message: "로그인한 뒤 참여할 수 있어요." };

  const code = normalizeInviteCode(rawCode);
  if (!isValidInviteCode(code)) {
    return { status: "error", message: "초대 코드는 6자리 영문·숫자예요. 다시 확인해주세요." };
  }

  const db = firestore();
  try {
    const codeSnap = await getDoc(doc(db, "inviteCodes", code));
    if (!codeSnap.exists()) {
      return { status: "error", message: "코드를 찾을 수 없어요. 6자리를 다시 확인해주세요." };
    }
    const projectId = String(codeSnap.data().projectId);
    const projectRef = doc(db, "projects", projectId);

    // 멤버만 읽을 수 있으므로, 읽기에 성공하면 이미 참여 중인 프로젝트다
    try {
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        return { status: "already-member", projectId, projectName: String(projectSnap.data().name) };
      }
    } catch (e) {
      if (!isPermissionDenied(e)) throw e;
    }

    const batch = writeBatch(db);
    batch.set(doc(db, "projects", projectId, "joins", uid), { code, at: serverTimestamp() });
    batch.update(projectRef, { memberIds: arrayUnion(uid) });
    await batch.commit();
    return { status: "joined", projectId };
  } catch (e) {
    if (isPermissionDenied(e)) {
      return { status: "error", message: "이 코드로 참여할 수 없어요. 코드가 바뀌었거나 인원이 가득 찼을 수 있어요." };
    }
    return { status: "error", message: failureMessage(e) };
  }
}

export type SimpleResult = { ok: true } | { ok: false; message: string };

// Firestore 배치 한 번에 최대 500건 → 여유 있게 나눠 지운다
const BATCH_LIMIT = 450;

async function deleteInChunks(refs: DocumentReference[]): Promise<void> {
  const db = firestore();
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

/**
 * 프로젝트 삭제 (만든 사람만).
 * 1) 할 일 · 변경 기록을 먼저 지우고 2) 참여 기록 · 초대 코드 · 프로젝트를 한 배치로 지운다.
 * 프로젝트 문서가 마지막에 지워져야 규칙의 멤버 확인(get)이 끝까지 통과한다.
 * TODO(8주차~): 회의록 · 녹음 파일이 생기면 Cloud Functions 재귀 삭제로 옮긴다.
 */
export async function deleteProject(project: Project): Promise<SimpleResult> {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid || uid !== project.ownerId) return { ok: false, message: "프로젝트를 만든 사람만 삭제할 수 있어요." };

  const db = firestore();
  try {
    const tasks = await getDocs(collection(db, "projects", project.id, "tasks"));
    const histories = await Promise.all(tasks.docs.map((t) => getDocs(collection(t.ref, "history"))));
    await deleteInChunks([...histories.flatMap((h) => h.docs.map((d) => d.ref)), ...tasks.docs.map((t) => t.ref)]);

    const joins = await getDocs(collection(db, "projects", project.id, "joins"));
    const batch = writeBatch(db);
    joins.forEach((j) => batch.delete(j.ref));
    batch.delete(doc(db, "inviteCodes", project.inviteCode));
    batch.delete(doc(db, "projects", project.id));
    await batch.commit();
    return { ok: true };
  } catch (e) {
    if (isPermissionDenied(e)) return { ok: false, message: "삭제 권한이 없어요." };
    return { ok: false, message: failureMessage(e) };
  }
}

/** 프로젝트 나가기 (만든 사람 제외). 멤버 목록에서 나를 빼고 내 참여 기록을 지운다 */
export async function leaveProject(project: Project): Promise<SimpleResult> {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid) return { ok: false, message: "로그인한 뒤 나갈 수 있어요." };
  if (uid === project.ownerId) return { ok: false, message: "만든 사람은 나갈 수 없어요. 프로젝트를 삭제해주세요." };

  const db = firestore();
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, "projects", project.id), { memberIds: arrayRemove(uid) });
    batch.delete(doc(db, "projects", project.id, "joins", uid));
    await batch.commit();
    return { ok: true };
  } catch (e) {
    if (isPermissionDenied(e)) return { ok: false, message: "나가기 권한이 없어요." };
    return { ok: false, message: failureMessage(e) };
  }
}
