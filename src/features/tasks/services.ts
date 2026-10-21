import { FirebaseError } from "firebase/app";
import { collection, doc, getDocs, runTransaction, serverTimestamp, writeBatch } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase";
import { addTaskNotification, type NotifyProject } from "@/features/notifications/services";
import { STATUS_META } from "./constants";
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
      // 다른 사람을 담당자로 정해 만들면 그 사람에게 알림
      addTaskNotification(
        tx,
        { id: projectId, name: String(project.data()?.name ?? "") },
        { id: taskRef.id, number, title: input.title, assigneeId: input.assigneeId, createdBy: uid },
        "assign",
        "할 일을 맡겼어요",
        input.assigneeId,
      );
    });
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

/**
 * 할 일 수정. 남의 할 일을 고치면 주인(담당자 · 없으면 만든 사람)에게 알림,
 * 담당자를 다른 사람으로 바꾸면 새 담당자에게 "맡겼어요" 알림.
 */
export async function updateTask(project: NotifyProject, task: Task, input: TaskInput): Promise<TaskResult> {
  try {
    const batch = writeBatch(firestore());
    batch.update(doc(firestore(), "projects", project.id, "tasks", task.id), { ...input, updatedAt: serverTimestamp() });
    const info = { id: task.id, number: task.number, title: input.title, assigneeId: task.assigneeId, createdBy: task.createdBy };
    if (input.assigneeId && input.assigneeId !== task.assigneeId) {
      addTaskNotification(batch, project, info, "assign", "할 일을 맡겼어요", input.assigneeId);
    } else {
      addTaskNotification(batch, project, info, "edit", "내용을 수정했어요");
    }
    await batch.commit();
    return { ok: true };
  } catch (e) {
    return failure(e);
  }
}

/** 상태 버튼. 사람이 바꾼 값이므로 statusSource = manual, 변경 기록을 함께 남긴다. 남의 할 일이면 주인에게 알림 */
export async function changeStatus(project: NotifyProject, task: Task, to: TaskStatus): Promise<TaskResult> {
  const uid = currentUid();
  if (!uid) return { ok: false, message: "로그인한 뒤 바꿀 수 있어요." };
  if (task.status === to) return { ok: true };

  const db = firestore();
  const taskRef = doc(db, "projects", project.id, "tasks", task.id);
  try {
    const batch = writeBatch(db);
    batch.update(taskRef, { status: to, statusSource: "manual", updatedAt: serverTimestamp() });
    batch.set(doc(collection(taskRef, "history")), { from: task.status, to, source: "manual", actor: uid, at: serverTimestamp() });
    // 남의 할 일 상태를 바꾸면 주인에게 알림
    addTaskNotification(batch, project, task, "status", `상태를 '${STATUS_META[to].label}'(으)로 바꿨어요`);
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
