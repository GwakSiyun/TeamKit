import { FirebaseError } from "firebase/app";
import { arrayUnion, collection, doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase";
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from "./inviteCode";
import type { ProjectResult } from "./types";

const MAX_CODE_ATTEMPTS = 5;

function isPermissionDenied(e: unknown): boolean {
  return e instanceof FirebaseError && e.code === "permission-denied";
}

function failure(e: unknown): ProjectResult {
  if (e instanceof FirebaseError && e.code === "unavailable") {
    return { ok: false, message: "네트워크에 연결할 수 없어요. 인터넷 연결을 확인해주세요." };
  }
  return { ok: false, message: "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요." };
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
      if (!isPermissionDenied(e)) return failure(e);
      // 코드 충돌일 가능성이 높으므로 새 코드로 재시도
    }
  }
  return { ok: false, message: "초대 코드를 만들지 못했어요. 다시 시도해주세요." };
}

/** 초대 코드 → 프로젝트 찾기 → 참여 증명(joins/{uid}) + memberIds 추가를 한 배치로 */
export async function joinProject(rawCode: string): Promise<ProjectResult> {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid) return { ok: false, message: "로그인한 뒤 참여할 수 있어요." };

  const code = normalizeInviteCode(rawCode);
  if (!isValidInviteCode(code)) {
    return { ok: false, message: "초대 코드는 6자리 영문·숫자예요. 다시 확인해주세요." };
  }

  const db = firestore();
  try {
    const codeSnap = await getDoc(doc(db, "inviteCodes", code));
    if (!codeSnap.exists()) {
      return { ok: false, message: "코드를 찾을 수 없어요. 6자리를 다시 확인해주세요." };
    }
    const projectId = String(codeSnap.data().projectId);
    const projectRef = doc(db, "projects", projectId);

    // 이미 멤버면 읽기가 허용된다 → 바로 이동
    try {
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) return { ok: true, projectId };
    } catch (e) {
      if (!isPermissionDenied(e)) throw e;
    }

    const batch = writeBatch(db);
    batch.set(doc(db, "projects", projectId, "joins", uid), { code, at: serverTimestamp() });
    batch.update(projectRef, { memberIds: arrayUnion(uid) });
    await batch.commit();
    return { ok: true, projectId };
  } catch (e) {
    if (isPermissionDenied(e)) {
      return { ok: false, message: "이 코드로 참여할 수 없어요. 코드가 바뀌었거나 인원이 가득 찼을 수 있어요." };
    }
    return failure(e);
  }
}
