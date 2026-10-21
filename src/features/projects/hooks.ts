"use client";

import { FirebaseError } from "firebase/app";
import { collection, doc, documentId, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { lateDays } from "@/features/tasks/deadline";
import type { TaskDoc } from "@/features/tasks/types";
import { todayISO } from "@/lib/dates";
import { firestore } from "@/lib/firebase";
import type { Member, Project, ProjectDoc } from "./types";

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

// Firestore 'in' 조건은 한 번에 최대 30개. 프로젝트 인원 상한(규칙: 10명) 안이라 한 번으로 충분하다.
const IN_QUERY_LIMIT = 30;

/** 멤버 이름·이메일 (users/{uid} 실시간 구독). memberIds 순서를 유지한다 */
export function useMembers(memberIds: string[]): Member[] {
  const [members, setMembers] = useState<Member[]>([]);
  const key = memberIds.join(",");

  useEffect(() => {
    const ids = key ? key.split(",").slice(0, IN_QUERY_LIMIT) : [];
    if (ids.length === 0) return;
    const q = query(collection(firestore(), "users"), where(documentId(), "in", ids));
    return onSnapshot(q, (snap) => {
      const byId = new Map(snap.docs.map((d) => [d.id, d.data()]));
      setMembers(
        ids.map((id) => {
          const data = byId.get(id);
          return { id, name: typeof data?.name === "string" ? data.name : "알 수 없음", email: typeof data?.email === "string" ? data.email : "" };
        }),
      );
    });
  }, [key]);

  return members;
}

export interface ProjectStats {
  total: number;
  done: number;
  late: number;
}

/**
 * 프로젝트 목록 카드용 할 일 통계 (전체 · 완료 · 지연, 실시간). 팀원이 할 일을 끝내면 목록에서도 바로 바뀐다.
 * 못 읽으면 null (카드에서 통계만 빼고 보여줌)
 */
export function useProjectStats(projectId: string): ProjectStats | null | "loading" {
  const [stats, setStats] = useState<ProjectStats | null | "loading">("loading");

  useEffect(() => {
    return onSnapshot(
      collection(firestore(), "projects", projectId, "tasks"),
      (snap) => {
        const today = todayISO();
        const tasks = snap.docs.map((d) => d.data() as Pick<TaskDoc, "status" | "dueDate">);
        setStats({
          total: tasks.length,
          done: tasks.filter((t) => t.status === "done").length,
          late: tasks.filter((t) => lateDays(t, today) > 0).length,
        });
      },
      () => setStats(null),
    );
  }, [projectId]);

  return stats;
}
