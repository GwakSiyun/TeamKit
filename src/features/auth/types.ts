import type { Timestamp } from "firebase/firestore";

/** users/{uid} */
export interface UserDoc {
  name: string;
  email: string;
  githubLogin: string | null;
  createdAt: Timestamp;
}

/** users/{uid}/private/github — 본인만 읽기 (firestore.rules) */
export interface GithubTokenDoc {
  accessToken: string;
  login: string | null;
  updatedAt: Timestamp;
}

export type AuthResult = { ok: true } | { ok: false; message: string };
