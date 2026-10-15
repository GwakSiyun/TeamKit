import type { Timestamp } from "firebase/firestore";

export type TaskStatus = "todo" | "doing" | "done";
export type StatusSource = "manual" | "github";

/** projects/{projectId}/tasks/{taskId} — 날짜는 시간대 문제를 피하려고 "YYYY-MM-DD" 문자열 */
export interface TaskDoc {
  number: number;
  title: string;
  description: string;
  status: TaskStatus;
  statusSource: StatusSource;
  assigneeId: string | null;
  startDate: string | null;
  dueDate: string | null;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  /** GitHub 웹훅 서버만 씀: 처음 연결된 브랜치 */
  branch?: string | null;
  /** GitHub 웹훅 서버만 씀: 연결된 PR */
  github?: TaskGithub | null;
}

export interface TaskGithub {
  prNumber: number;
  prTitle: string;
  prState: "open" | "merged" | "closed";
  prUrl: string;
}

export interface Task extends TaskDoc {
  id: string;
}

/** 만들기 · 수정 폼에서 받는 값 */
export type TaskInput = Pick<TaskDoc, "title" | "description" | "assigneeId" | "startDate" | "dueDate">;

/** projects/{projectId}/tasks/{taskId}/history/{id} */
export interface HistoryEntry {
  id: string;
  from: TaskStatus | null;
  to: TaskStatus;
  source: StatusSource;
  actor: string;
  at: Timestamp | null;
}

export type TaskResult = { ok: true } | { ok: false; message: string };
