// 서버 전용: TeamKit 마일스톤 → 연결된 레포의 GitHub Milestone (한 방향)
import { githubFetch } from "./http";

export interface MilestoneInput {
  name: string;
  /** "YYYY-MM-DD" */
  date: string;
}

export type SyncResult = { ok: true; number: number | null; url: string | null } | { ok: false; message: string };

/**
 * GitHub 은 마감일을 시각까지 받고, 화면에는 미국(태평양) 시간 기준 날짜로 보여준다.
 * UTC 정오(한국 밤 9시 · 미국 새벽 5시)로 보내야 양쪽 다 같은 날짜가 된다. (UTC 03:00 이면 미국 기준 전날로 보임)
 */
function dueOn(date: string): string {
  return `${date}T12:00:00Z`;
}

async function readMilestone(res: Response): Promise<{ number: number; url: string | null }> {
  const body = (await res.json()) as { number?: unknown; html_url?: unknown };
  return { number: Number(body.number), url: typeof body.html_url === "string" ? body.html_url : null };
}

/** 같은 이름의 마일스톤이 이미 있으면 그 번호 (직접 만들어 둔 경우) */
async function findByTitle(token: string, fullName: string, title: string): Promise<number | null> {
  const res = await githubFetch(token, `/repos/${fullName}/milestones?state=all&per_page=100`);
  if (!res.ok) return null;
  const list = (await res.json()) as Array<{ number?: unknown; title?: unknown }>;
  const hit = list.find((m) => m.title === title);
  return hit ? Number(hit.number) : null;
}

function failure(status: number): SyncResult {
  if (status === 401) return { ok: false, message: "GitHub 권한이 만료됐어요. 계정 설정에서 '다시 연결'을 눌러주세요." };
  if (status === 403 || status === 404) return { ok: false, message: "레포에 마일스톤을 만들 권한이 없어요." };
  return { ok: false, message: "GitHub 마일스톤을 반영하지 못했어요. 잠시 후 다시 저장해주세요." };
}

/**
 * 마일스톤 만들기 · 고치기 · 닫기(null). 이미 연결된 번호가 있으면 그걸 고치고, 없으면 만든다.
 * 지울 때는 GitHub 에서 삭제하지 않고 닫는다 (거기 묶인 PR 기록은 남게).
 */
export async function syncMilestone(token: string, fullName: string, milestone: MilestoneInput | null, current: number | null): Promise<SyncResult> {
  if (!milestone) {
    if (!current) return { ok: true, number: null, url: null };
    const res = await githubFetch(token, `/repos/${fullName}/milestones/${current}`, { method: "PATCH", body: JSON.stringify({ state: "closed" }) });
    if (!res.ok && res.status !== 404) return failure(res.status);
    return { ok: true, number: null, url: null };
  }

  const body = JSON.stringify({ title: milestone.name, due_on: dueOn(milestone.date), state: "open" });
  if (current) {
    const res = await githubFetch(token, `/repos/${fullName}/milestones/${current}`, { method: "PATCH", body });
    if (res.ok) return { ok: true, ...(await readMilestone(res)) };
    if (res.status !== 404) return failure(res.status);
    // GitHub 에서 지워졌으면 새로 만든다
  }

  const created = await githubFetch(token, `/repos/${fullName}/milestones`, { method: "POST", body });
  if (created.ok) return { ok: true, ...(await readMilestone(created)) };
  if (created.status === 422) {
    // 같은 이름이 이미 있음(GitHub 에서 직접 만들어 둔 경우) → 그걸 고쳐서 쓴다
    const existing = await findByTitle(token, fullName, milestone.name);
    if (existing) {
      const res = await githubFetch(token, `/repos/${fullName}/milestones/${existing}`, { method: "PATCH", body });
      if (res.ok) return { ok: true, ...(await readMilestone(res)) };
      return failure(res.status);
    }
  }
  return failure(created.status);
}

/** PR 을 마일스톤에 넣기 (PR 은 GitHub 에서 이슈 번호를 같이 쓴다). 실패해도 웹훅 처리는 계속 */
export async function attachToMilestone(token: string, fullName: string, prNumber: number, milestone: number): Promise<boolean> {
  const res = await githubFetch(token, `/repos/${fullName}/issues/${prNumber}`, { method: "PATCH", body: JSON.stringify({ milestone }) });
  return res.ok;
}

export interface ListedMilestone extends MilestoneInput {
  id: string;
}

/** TeamKit 마일스톤 id → GitHub 마일스톤 번호 */
export type MilestoneNumbers = Record<string, number>;

/**
 * 목록 전체 맞추기: 목록에 있는 건 만들기 · 고치기, 목록에서 빠진 건 GitHub 에서 닫기.
 * 하나라도 실패하면 거기서 멈추고 그때까지 맞춘 번호를 돌려준다 (다음 저장 때 이어서).
 */
export async function syncMilestones(
  token: string,
  fullName: string,
  list: readonly ListedMilestone[],
  current: MilestoneNumbers,
): Promise<{ ok: true; numbers: MilestoneNumbers } | { ok: false; message: string; numbers: MilestoneNumbers }> {
  const numbers: MilestoneNumbers = {};
  for (const m of list) {
    const result = await syncMilestone(token, fullName, m, current[m.id] ?? null);
    if (!result.ok) return { ok: false, message: result.message, numbers: { ...current, ...numbers } };
    if (result.number) numbers[m.id] = result.number;
  }
  for (const [id, number] of Object.entries(current)) {
    if (list.some((m) => m.id === id)) continue;
    const closed = await syncMilestone(token, fullName, null, number);
    if (!closed.ok) return { ok: false, message: closed.message, numbers: { ...numbers, [id]: number } };
  }
  return { ok: true, numbers };
}

/** 저장된 값(예전 형식 포함) → 목록 */
export function listedMilestones(milestones: unknown, legacy: unknown): ListedMilestone[] {
  if (Array.isArray(milestones)) {
    return milestones.flatMap((m): ListedMilestone[] => {
      if (!m || typeof m !== "object") return [];
      const { id, name, date } = m as Record<string, unknown>;
      return typeof id === "string" && typeof name === "string" && typeof date === "string" ? [{ id, name, date }] : [];
    });
  }
  if (legacy && typeof legacy === "object") {
    const { name, date } = legacy as Record<string, unknown>;
    if (typeof name === "string" && typeof date === "string") return [{ id: "legacy", name, date }];
  }
  return [];
}

/** 예전 저장 형식(githubMilestone 숫자 하나) → 번호 표 */
export function numbersOf(repoNumbers: unknown, legacyNumber: unknown): MilestoneNumbers {
  if (repoNumbers && typeof repoNumbers === "object") {
    return Object.fromEntries(Object.entries(repoNumbers as Record<string, unknown>).filter((e): e is [string, number] => typeof e[1] === "number"));
  }
  return typeof legacyNumber === "number" && legacyNumber > 0 ? { legacy: legacyNumber } : {};
}

/** 한국 기준 오늘 "YYYY-MM-DD" (서버는 UTC) */
export function todayKST(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
