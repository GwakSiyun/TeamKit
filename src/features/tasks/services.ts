import { FirebaseError } from "firebase/app";
import { collection, doc, getDocs, runTransaction, serverTimestamp, writeBatch } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase";
import type { Task, TaskInput, TaskResult, TaskStatus } from "./types";

function failure(e: unknown): TaskResult {
  if (e instanceof FirebaseError && e.code === "permission-denied") {
    return { ok: false, message: "권한이 없어요. 프로젝트 멤버인지 확인해주세요." };
  }
  if (e instanceof FirebaseError && e.code === "unavailable") {
    return { ok: false, message: "네트워크에 연결할 수 없어요. 인터넷 연결을 확인해주세요." };
  }
  return { ok: false, message: "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요." };
}

function currentUid(): string | null {
  return firebaseAuth().currentUser?.uid ?? null;
}

/**
 * 할 일 만들기. 프로젝트의 taskCounter 를 트랜잭션으로 1 올리고 그 번호를 카드 번호(TM-n)로 쓴다.
 * 동시에 여러 명이 만들어도 번호가 겹치지 않는다 (규칙에서도 검증).
 */
export async function createTask(projectId: string, input: TaskInput): Promise<TaskResult> {
  const uid = currentUid();
  if (!uid) return { ok: false, message: "로그인한 뒤 만들 수 있어요." };

  const db = firestore();
  const projectRef = doc(db, "projects", projectId);
  const taskRef = doc(collection(db, "projects", projectId, "tasks"));
  try {
    await runTransaction(db, async (tx) => {
      const project = await tx.get(projectRef);
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
    });
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

export async function updateTask(projectId: string, taskId: string, input: TaskInput): Promise<TaskResult> {
  try {
    const batch = writeBatch(firestore());
    batch.update(doc(firestore(), "projects", projectId, "tasks", taskId), { ...input, updatedAt: serverTimestamp() });
    await batch.commit();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

/** 상태 버튼. 사람이 바꾼 값이므로 statusSource = manual, 변경 기록을 함께 남긴다 */
export async function changeStatus(projectId: string, task: Task, to: TaskStatus): Promise<TaskResult> {
  const uid = currentUid();
  if (!uid) return { ok: false, message: "로그인한 뒤 바꿀 수 있어요." };
  if (task.status === to) return { ok: true };

  const db = firestore();
  const taskRef = doc(db, "projects", projectId, "tasks", task.id);
  try {
    const batch = writeBatch(db);
    batch.update(taskRef, { status: to, statusSource: "manual", updatedAt: serverTimestamp() });
    batch.set(doc(collection(taskRef, "history")), { from: task.status, to, source: "manual", actor: uid, at: serverTimestamp() });
    await batch.commit();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

/** 할 일과 변경 기록을 함께 지운다. 카드 번호는 다시 쓰지 않는다 (GitHub 기록과 헷갈리지 않게) */
export async function deleteTask(projectId: string, taskId: string): Promise<TaskResult> {
  const db = firestore();
  const taskRef = doc(db, "projects", projectId, "tasks", taskId);
  try {
    const history = await getDocs(collection(taskRef, "history"));
    const batch = writeBatch(db);
    history.forEach((h) => batch.delete(h.ref));
    batch.delete(taskRef);
    await batch.commit();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}
