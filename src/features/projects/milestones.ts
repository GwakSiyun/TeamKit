import { daysBetween } from "@/lib/dates";
import type { Milestone, Project } from "./types";

export const MAX_MILESTONES = 5;
export const MILESTONE_NAME_MAX = 20;

/** 프로젝트의 마일스톤 목록 (날짜순). 예전 형식(milestone 하나)도 읽는다 */
export function milestonesOf(project: Pick<Project, "milestones" | "milestone">): Milestone[] {
  const list = project.milestones ?? (project.milestone ? [{ id: "legacy", ...project.milestone }] : []);
  return [...list].sort((a, b) => a.date.localeCompare(b.date));
}

/** 오늘 포함 앞으로 남은 것 (날짜순) */
export function upcomingMilestones(list: readonly Milestone[], today: string): Milestone[] {
  return list.filter((m) => m.date >= today);
}

/** "D-9" · "D-day" · "끝남" */
export function dDay(date: string, today: string): string {
  const left = daysBetween(today, date);
  if (left > 0) return `D-${left}`;
  if (left === 0) return "D-day";
  return "끝남";
}

export function newMilestoneId(): string {
  return Math.random().toString(36).slice(2, 10);
}
