import type { Timestamp } from "firebase/firestore";

/** github = PR 머지로 완료가 됐을 때 (웹훅 서버가 만든다) */
export type NotificationType = "status" | "edit" | "assign" | "github";

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
