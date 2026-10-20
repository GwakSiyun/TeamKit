import type { Timestamp } from "firebase/firestore";

/** projects/{projectId} */
export interface ProjectDoc {
  name: string;
  inviteCode: string;
  ownerId: string;
  memberIds: string[];
  taskCounter: number;
  createdAt: Timestamp | null;
  /** 마일스톤 (예: 1차 배포 10/30). 대시보드 D-day · 간트 표시. 만든 사람이 설정 */
  milestone?: Milestone | null;
  /** 연결된 GitHub 레포 (서버가 씀) */
  github?: { owner: string; repo: string; connectedBy: string; connectedAt: Timestamp | null } | null;
}

export interface Milestone {
  name: string;
  /** "YYYY-MM-DD" */
  date: string;
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
