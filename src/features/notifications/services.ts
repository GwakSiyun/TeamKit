import { collection, doc, serverTimestamp, updateDoc, writeBatch, type DocumentData, type DocumentReference } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase";
import type { NotificationType } from "./types";

/** 알림에 넣을 할 일 정보 (바꾸기 전 기준) */
export interface NotifyTask {
  id: string;
  number: number;
  title: string;
  assigneeId: string | null;
  createdBy: string;
}

export interface NotifyProject {
  id: string;
  name: string;
}

const MAX_TITLE = 100;

/** 할 일 변경과 함께 쓰는 배치(WriteBatch) · 트랜잭션(Transaction) 공통 */
interface Writer {
  set(ref: DocumentReference, data: DocumentData): unknown;
}

/**
 * 할 일을 바꾼 사람이 아닌 "그 할 일의 주인"에게 알림을 남긴다.
 * 주인 = 담당자, 담당자가 없으면 만든 사람. 내가 내 할 일을 바꾸면 알림 없음.
 * 할 일 변경과 같은 배치 · 트랜잭션에 넣어서 변경이 실패하면 알림도 남지 않게 한다.
 */
export function addTaskNotification(
  writer: Writer,
  project: NotifyProject,
  task: NotifyTask,
  type: NotificationType,
  text: string,
  recipient: string | null = task.assigneeId ?? task.createdBy,
): void {
  const actor = firebaseAuth().currentUser;
  if (!actor || !recipient || recipient === actor.uid) return;
  const ref = doc(collection(firestore(), "users", recipient, "notifications"));
  writer.set(ref, {
    type,
    projectId: project.id,
    projectName: project.name,
    taskId: task.id,
    taskNumber: task.number,
    taskTitle: task.title.slice(0, MAX_TITLE),
    actorId: actor.uid,
    actorName: actor.displayName ?? actor.email ?? "팀원",
    text,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function markRead(uid: string, notificationId: string): Promise<void> {
  await updateDoc(doc(firestore(), "users", uid, "notifications", notificationId), { read: true });
}

/** 안 읽은 알림을 한 번에 읽음으로 (화면에 불러온 것만) */
export async function markAllRead(uid: string, ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  const batch = writeBatch(firestore());
  ids.forEach((id) => batch.update(doc(firestore(), "users", uid, "notifications", id), { read: true }));
  await batch.commit();
}
