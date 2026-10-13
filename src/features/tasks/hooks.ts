"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import type { HistoryEntry, Task, TaskDoc } from "./types";

type TasksState = { status: "loading" } | { status: "ready"; tasks: Task[] } | { status: "error" };

/** 프로젝트의 할 일 전체 (실시간 구독, 카드 번호순) */
export function useTasks(projectId: string): TasksState {
  const [state, setState] = useState<TasksState>({ status: "loading" });

  useEffect(() => {
    const q = query(collection(firestore(), "projects", projectId, "tasks"), orderBy("number", "asc"));
    return onSnapshot(
      q,
      (snap) =>
        setState({
          status: "ready",
          tasks: snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: "estimate" }) as TaskDoc) })),
        }),
      () => setState({ status: "error" }),
    );
  }, [projectId]);

  return state;
}

/** 할 일 한 개의 상태 변경 기록 (최신순) */
export function useTaskHistory(projectId: string, taskId: string): HistoryEntry[] {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const q = query(collection(firestore(), "projects", projectId, "tasks", taskId, "history"), orderBy("at", "desc"));
    return onSnapshot(q, (snap) =>
      setEntries(snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: "estimate" }) as Omit<HistoryEntry, "id">) }))),
    );
  }, [projectId, taskId]);

  return entries;
}
