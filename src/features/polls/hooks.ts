"use client";

import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import type { Poll, PollDoc, PollResponse } from "./types";

type PollsState = { status: "loading" } | { status: "ready"; polls: Poll[] } | { status: "error" };

/** 프로젝트의 투표 전체 (최신순) */
export function usePolls(projectId: string): PollsState {
  const [state, setState] = useState<PollsState>({ status: "loading" });

  useEffect(() => {
    const q = query(collection(firestore(), "projects", projectId, "polls"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => setState({ status: "ready", polls: snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: "estimate" }) as PollDoc) })) }),
      () => setState({ status: "error" }),
    );
  }, [projectId]);

  return state;
}

type PollState = { status: "loading" } | { status: "ready"; poll: Poll } | { status: "missing" };

export function usePoll(projectId: string, pollId: string): PollState {
  const [state, setState] = useState<PollState>({ status: "loading" });

  useEffect(() => {
    return onSnapshot(
      doc(firestore(), "projects", projectId, "polls", pollId),
      (snap) => setState(snap.exists() ? { status: "ready", poll: { id: snap.id, ...(snap.data() as PollDoc) } } : { status: "missing" }),
      () => setState({ status: "missing" }),
    );
  }, [projectId, pollId]);

  return state;
}

/** 투표의 응답 전체 (실시간) */
export function usePollResponses(projectId: string, pollId: string): PollResponse[] {
  const [responses, setResponses] = useState<PollResponse[]>([]);

  useEffect(() => {
    return onSnapshot(collection(firestore(), "projects", projectId, "polls", pollId, "responses"), (snap) =>
      setResponses(snap.docs.map((d) => ({ uid: d.id, slots: Array.isArray(d.data().slots) ? (d.data().slots as string[]) : [] }))),
    );
  }, [projectId, pollId]);

  return responses;
}
