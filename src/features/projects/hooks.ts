"use client";

import { FirebaseError } from "firebase/app";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import type { Project, ProjectDoc } from "./types";

type ListState = { status: "loading" } | { status: "ready"; projects: Project[] } | { status: "error" };

function createdMillis(p: Project): number {
  // 방금 만든 문서는 서버 시간이 확정되기 전이라 null → 맨 앞에 둔다
  return p.createdAt?.toMillis() ?? Number.MAX_SAFE_INTEGER;
}

/** 내가 멤버인 프로젝트 목록 (실시간 구독, 최신순) */
export function useMyProjects(uid: string): ListState {
  const [state, setState] = useState<ListState>({ status: "loading" });

  useEffect(() => {
    // array-contains + orderBy 는 복합 색인이 필요해서, 정렬은 받아온 뒤 한다 (프로젝트 수가 적음)
    const q = query(collection(firestore(), "projects"), where("memberIds", "array-contains", uid));
    return onSnapshot(
      q,
      (snap) => {
        const projects = snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: "none" }) as ProjectDoc) }));
        projects.sort((a, b) => createdMillis(b) - createdMillis(a));
        setState({ status: "ready", projects });
      },
      () => setState({ status: "error" }),
    );
  }, [uid]);

  return state;
}

type ProjectState = { status: "loading" } | { status: "ready"; project: Project } | { status: "denied" } | { status: "error" };

/** 프로젝트 한 개 (실시간 구독). 멤버가 아니거나 없는 프로젝트는 규칙이 거부 → "denied" */
export function useProject(projectId: string): ProjectState {
  const [state, setState] = useState<ProjectState>({ status: "loading" });

  useEffect(() => {
    return onSnapshot(
      doc(firestore(), "projects", projectId),
      (snap) => {
        if (!snap.exists()) setState({ status: "denied" });
        else setState({ status: "ready", project: { id: snap.id, ...(snap.data() as ProjectDoc) } });
      },
      (e) => setState(e instanceof FirebaseError && e.code === "permission-denied" ? { status: "denied" } : { status: "error" }),
    );
  }, [projectId]);

  return state;
}
