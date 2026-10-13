import type { Timestamp } from "firebase/firestore";

/** projects/{projectId} */
export interface ProjectDoc {
  name: string;
  inviteCode: string;
  ownerId: string;
  memberIds: string[];
  taskCounter: number;
  createdAt: Timestamp | null;
}

export interface Project extends ProjectDoc {
  id: string;
}

/** 화면 표시용 멤버 (users/{uid} 에서 읽음) */
export interface Member {
  id: string;
  name: string;
  email: string;
}

export type ProjectResult = { ok: true; projectId: string } | { ok: false; message: string };

export type JoinResult =
  | { status: "joined"; projectId: string }
  | { status: "already-member"; projectId: string; projectName: string }
  | { status: "error"; message: string };
