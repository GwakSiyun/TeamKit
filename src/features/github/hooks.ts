"use client";

import { collection, limit, onSnapshot, orderBy, query, type Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import type { PrState } from "./sync";

export interface GithubEvent {
  id: string;
  type: "create" | "push" | "pull_request";
  title: string;
  url: string | null;
  author: string;
  taskNumbers: number[];
  /** PR 이벤트만. 이 필드가 생기기 전 기록은 없음 */
  prState?: PrState | null;
  at: Timestamp | null;
}

/** 프로젝트의 최근 GitHub 활동 (웹훅 서버가 기록) */
export function useGithubEvents(projectId: string, max = 20): GithubEvent[] {
  const [events, setEvents] = useState<GithubEvent[]>([]);

  useEffect(() => {
    const q = query(collection(firestore(), "projects", projectId, "githubEvents"), orderBy("at", "desc"), limit(max));
    return onSnapshot(q, (snap) => setEvents(snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: "estimate" }) as Omit<GithubEvent, "id">) }))));
  }, [projectId, max]);

  return events;
}
