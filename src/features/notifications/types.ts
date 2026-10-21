import type { Timestamp } from "firebase/firestore";

export type NotificationType = "status" | "edit" | "assign";

/** users/{uid}/notifications/{id} — 다른 사람이 내 할 일을 바꾸면 그 사람이 만들어 넣는다. 읽기 · 읽음 표시 · 삭제는 본인만 */
export interface NotificationDoc {
  type: NotificationType;
  projectId: string;
  projectName: string;
  taskId: string;
  taskNumber: number;
  taskTitle: string;
  actorId: string;
  actorName: string;
  /** "상태를 '진행 중'으로 바꿨어요" 처럼 화면에 그대로 보여줄 문장 */
  text: string;
  read: boolean;
  createdAt: Timestamp | null;
}

export interface AppNotification extends NotificationDoc {
  id: string;
}
