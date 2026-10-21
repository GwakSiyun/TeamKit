import { FirebaseError } from "firebase/app";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  deleteField,
  where,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { callGithubApi } from "@/features/github/api";
import { firebaseAuth, firestore } from "@/lib/firebase";
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from "./inviteCode";
import { MAX_MILESTONES, MILESTONE_NAME_MAX } from "./milestones";
import type { JoinResult, Milestone, Project, ProjectResult } from "./types";

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
 * 0) GitHub 레포가 연결돼 있으면 웹훅부터 해제 (안 그러면 지워진 프로젝트로 알림이 계속 온다)
 * 1) 할 일 · 변경 기록 · 회의록 · 투표(응답 포함) · GitHub 활동 기록을 지우고
 * 2) 참여 기록 · 초대 코드 · 프로젝트를 한 배치로 지운다.
 * 프로젝트 문서가 마지막에 지워져야 규칙의 멤버 확인(get)이 끝까지 통과한다.
 */
export async function deleteProject(project: Project): Promise<SimpleResult> {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid || uid !== project.ownerId) return { ok: false, message: "프로젝트를 만든 사람만 삭제할 수 있어요." };

  if (project.github) {
    const disconnected = await callGithubApi("disconnect", { projectId: project.id });
    if (!disconnected.ok) return { ok: false, message: `GitHub 연결을 먼저 해제하지 못했어요. ${disconnected.message}` };
  }

  const db = firestore();
  try {
    const tasks = await getDocs(collection(db, "projects", project.id, "tasks"));
    const histories = await Promise.all(tasks.docs.map((t) => getDocs(collection(t.ref, "history"))));
    await deleteInChunks([...histories.flatMap((h) => h.docs.map((d) => d.ref)), ...tasks.docs.map((t) => t.ref)]);

    // 회의록에는 회의 내용 전문이 있으니 프로젝트와 함께 지운다
    const meetings = await getDocs(collection(db, "projects", project.id, "meetings"));
    await deleteInChunks(meetings.docs.map((m) => m.ref));

    const polls = await getDocs(collection(db, "projects", project.id, "polls"));
    const responses = await Promise.all(polls.docs.map((p) => getDocs(collection(p.ref, "responses"))));
    await deleteInChunks([...responses.flatMap((r) => r.docs.map((d) => d.ref)), ...polls.docs.map((p) => p.ref)]);

    const events = await getDocs(collection(db, "projects", project.id, "githubEvents"));
    await deleteInChunks(events.docs.map((e) => e.ref));

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

/**
 * 그 사람이 담당인 할 일을 "담당자 없음"으로. 멤버가 아닌 담당자가 남으면 규칙상 그 카드를 수정할 수 없게 된다.
 * 나가기 · 내보내기 전에 (아직 멤버일 때) 실행한다.
 */
async function unassignTasksOf(projectId: string, uid: string): Promise<void> {
  const db = firestore();
  const assigned = await getDocs(query(collection(db, "projects", projectId, "tasks"), where("assigneeId", "==", uid)));
  for (let i = 0; i < assigned.docs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    assigned.docs.slice(i, i + BATCH_LIMIT).forEach((t) => batch.update(t.ref, { assigneeId: null, updatedAt: serverTimestamp() }));
    await batch.commit();
  }
}

/** 프로젝트 나가기 (만든 사람 제외). 내 할 일 담당을 풀고, 멤버 목록에서 나를 빼고 내 참여 기록을 지운다 */
export async function leaveProject(project: Project): Promise<SimpleResult> {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid) return { ok: false, message: "로그인한 뒤 나갈 수 있어요." };
  if (uid === project.ownerId) return { ok: false, message: "만든 사람은 나갈 수 없어요. 프로젝트를 삭제해주세요." };

  const db = firestore();
  try {
    await unassignTasksOf(project.id, uid);
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

export const PROJECT_NAME_MAX = 40;

/** 프로젝트 이름 바꾸기 (만든 사람만) */
export async function renameProject(project: Project, rawName: string): Promise<SimpleResult> {
  const name = rawName.trim();
  if (!name) return { ok: false, message: "이름을 입력해주세요." };
  if (name.length > PROJECT_NAME_MAX) return { ok: false, message: `이름은 ${PROJECT_NAME_MAX}자까지예요.` };
  try {
    await updateDoc(doc(firestore(), "projects", project.id), { name });
    return { ok: true };
  } catch (e) {
    if (isPermissionDenied(e)) return { ok: false, message: "프로젝트를 만든 사람만 이름을 바꿀 수 있어요." };
    return { ok: false, message: failureMessage(e) };
  }
}

/**
 * 초대 코드 재발급 (만든 사람만). 새 코드 문서 만들기 · 프로젝트 코드 교체 · 옛 코드 삭제를 한 배치로.
 * 옛 코드는 바로 못 쓰게 된다. 이미 쓰이는 코드가 나오면 규칙이 거부하므로 새 코드로 다시 시도한다.
 */
export async function regenerateInviteCode(project: Project): Promise<SimpleResult> {
  const db = firestore();
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateInviteCode();
    if (code === project.inviteCode) continue;
    const batch = writeBatch(db);
    batch.set(doc(db, "inviteCodes", code), { projectId: project.id, createdAt: serverTimestamp() });
    batch.update(doc(db, "projects", project.id), { inviteCode: code });
    batch.delete(doc(db, "inviteCodes", project.inviteCode));
    try {
      await batch.commit();
      return { ok: true };
    } catch (e) {
      if (!isPermissionDenied(e)) return { ok: false, message: failureMessage(e) };
    }
  }
  return { ok: false, message: "새 코드를 만들지 못했어요. 프로젝트를 만든 사람인지 확인하고 다시 시도해주세요." };
}

/** 멤버 내보내기 (만든 사람만, 만든 사람 자신은 제외). 그 사람 담당 할 일은 담당자 없음으로 */
export async function removeMember(project: Project, memberId: string): Promise<SimpleResult> {
  if (memberId === project.ownerId) return { ok: false, message: "만든 사람은 내보낼 수 없어요." };
  const db = firestore();
  try {
    await unassignTasksOf(project.id, memberId);
    const batch = writeBatch(db);
    batch.update(doc(db, "projects", project.id), { memberIds: arrayRemove(memberId) });
    batch.delete(doc(db, "projects", project.id, "joins", memberId));
    await batch.commit();
    return { ok: true };
  } catch (e) {
    if (isPermissionDenied(e)) return { ok: false, message: "프로젝트를 만든 사람만 멤버를 내보낼 수 있어요." };
    return { ok: false, message: failureMessage(e) };
  }
}

export type MilestoneResult =
  | { ok: true; github: "none" | "synced" | "failed"; githubMessage?: string }
  | { ok: false; message: string };

/**
 * 마일스톤 목록 저장 (만든 사람만). 예전 형식(milestone 하나)은 이때 지운다.
 * 레포가 연결돼 있으면 GitHub Milestone 도 맞춘다 (새로 생긴 건 만들고, 바뀐 건 고치고, 빠진 건 닫기).
 */
export async function saveMilestones(project: Project, list: Milestone[]): Promise<MilestoneResult> {
  if (list.length > MAX_MILESTONES) return { ok: false, message: `마일스톤은 ${MAX_MILESTONES}개까지예요.` };
  const clean = list.map((m) => ({ id: m.id, name: m.name.trim(), date: m.date }));
  if (clean.some((m) => !m.name || m.name.length > MILESTONE_NAME_MAX || !m.date)) {
    return { ok: false, message: `이름(1~${MILESTONE_NAME_MAX}자)과 날짜를 확인해주세요.` };
  }
  try {
    await updateDoc(doc(firestore(), "projects", project.id), { milestones: clean, ...(project.milestone !== undefined ? { milestone: deleteField() } : {}) });
  } catch (e) {
    if (isPermissionDenied(e)) return { ok: false, message: "프로젝트를 만든 사람만 마일스톤을 정할 수 있어요." };
    return { ok: false, message: failureMessage(e) };
  }
  // TeamKit 저장은 끝났으니 GitHub 반영 실패는 따로 알린다
  if (!project.github) return { ok: true, github: "none" };
  const synced = await callGithubApi("milestone", { projectId: project.id });
  return synced.ok ? { ok: true, github: "synced" } : { ok: true, github: "failed", githubMessage: synced.message };
}
