"use client";

import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import type { Meeting, MeetingDoc } from "./types";

type MeetingsState = { status: "loading" } | { status: "ready"; meetings: Meeting[] } | { status: "error" };

/** 프로젝트의 회의록 전체 (최신순, 실시간) */
export function useMeetings(projectId: string): MeetingsState {
  const [state, setState] = useState<MeetingsState>({ status: "loading" });

  useEffect(() => {
    const q = query(collection(firestore(), "projects", projectId, "meetings"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => setState({ status: "ready", meetings: snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: "estimate" }) as MeetingDoc) })) }),
      () => setState({ status: "error" }),
    );
  }, [projectId]);

  return state;
}

type MeetingState = { status: "loading" } | { status: "ready"; meeting: Meeting } | { status: "missing" };

export function useMeeting(projectId: string, meetingId: string): MeetingState {
  const [state, setState] = useState<MeetingState>({ status: "loading" });

  useEffect(() => {
    return onSnapshot(
      doc(firestore(), "projects", projectId, "meetings", meetingId),
      (snap) =>
        setState(
          snap.exists() ? { status: "ready", meeting: { id: snap.id, ...(snap.data({ serverTimestamps: "estimate" }) as MeetingDoc) } } : { status: "missing" },
        ),
      () => setState({ status: "missing" }),
    );
  }, [projectId, meetingId]);

  return state;
}
