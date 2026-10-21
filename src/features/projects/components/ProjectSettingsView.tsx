"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { controlClass } from "@/components/ui/Field";
import { formatShort, todayISO, weekdayOf } from "@/lib/dates";
import { eulReul } from "@/lib/josa";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { useAuth } from "@/features/auth/AuthProvider";
import { useTransientState } from "@/hooks/useTransientState";
import { useCurrentProject } from "../ProjectContext";
import { dDay, MAX_MILESTONES, MILESTONE_NAME_MAX, milestonesOf, newMilestoneId } from "../milestones";
import { PROJECT_NAME_MAX, regenerateInviteCode, removeMember, renameProject, saveMilestones } from "../services";
import type { Member, Milestone } from "../types";
import { DangerZone } from "./DangerZone";
import { ShareInviteButton } from "./ShareInviteButton";

const COPIED_MS = 1500;

type Confirming = { kind: "reissue" } | { kind: "remove"; member: Member } | null;

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b border-line pb-1.5 text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** 이름: 만든 사람은 바로 고쳐서 저장, 멤버는 보기만 */
function NameSection({ isOwner }: { isOwner: boolean }) {
  const { project } = useCurrentProject();
  const [name, setName] = useState(project.name);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const result = await renameProject(project, name);
    setPending(false);
    setMessage(result.ok ? { tone: "success", text: "이름을 바꿨어요." } : { tone: "error", text: result.message });
  }

  if (!isOwner) {
    return (
      <Section title="프로젝트 이름">
        <p className="text-sm">{project.name}</p>
        <p className="text-xs text-muted">이름은 프로젝트를 만든 사람이 바꿀 수 있어요.</p>
      </Section>
    );
  }

  const unchanged = name.trim() === project.name;
  return (
    <Section title="프로젝트 이름">
      <form onSubmit={handleSubmit} noValidate className="flex max-w-md items-center gap-2">
        <label htmlFor="project-name" className="sr-only">
          프로젝트 이름
        </label>
        <input
          id="project-name"
          value={name}
          maxLength={PROJECT_NAME_MAX}
          onChange={(e) => {
            setName(e.target.value);
            setMessage(null);
          }}
          className={controlClass(message?.tone === "error" ? message.text : null, "h-9")}
        />
        <button type="submit" disabled={pending || unchanged || !name.trim()} className={buttonClass("secondary", "h-9")}>
          {pending ? "저장 중…" : "저장"}
        </button>
      </form>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
    </Section>
  );
}

/** 마일스톤 목록 (예: 1차 배포 10/30, 최종 발표 11/13): 대시보드 D-day 칩 · 간트 깃발. 만든 사람만 추가 · 삭제 */
function MilestoneSection({ isOwner }: { isOwner: boolean }) {
  const { project } = useCurrentProject();
  const list = milestonesOf(project);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const today = todayISO();

  async function save(next: Milestone[], done: string): Promise<boolean> {
    setPending(true);
    setMessage(null);
    const result = await saveMilestones(project, next);
    setPending(false);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.message });
      return false;
    }
    if (result.github === "failed") {
      setMessage({ tone: "error", text: `TeamKit 에는 저장했지만 GitHub 에는 반영하지 못했어요. ${result.githubMessage ?? ""}` });
      return true;
    }
    setMessage({ tone: "success", text: done + (result.github === "synced" ? " GitHub 레포의 마일스톤에도 반영했어요." : "") });
    return true;
  }

  // 수정 중인 줄 (같은 id 라서 GitHub 쪽도 같은 마일스톤의 이름 · 날짜만 바뀐다)
  const [editing, setEditing] = useTransientState<Milestone | null>(null);

  async function handleEdit(): Promise<void> {
    if (!editing) return;
    if (!editing.name.trim() || !editing.date) {
      setMessage({ tone: "error", text: "이름과 날짜를 모두 넣어주세요." });
      return;
    }
    const ok = await save(
      list.map((m) => (m.id === editing.id ? editing : m)),
      `「${editing.name.trim()}」${eulReul(editing.name.trim())} 고쳤어요.`,
    );
    if (ok) setEditing(null);
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!name.trim() || !date) {
      setMessage({ tone: "error", text: "이름과 날짜를 모두 넣어주세요." });
      return;
    }
    const ok = await save([...list, { id: newMilestoneId(), name, date }], `「${name.trim()}」${eulReul(name.trim())} 추가했어요.`);
    if (ok) {
      setName("");
      setDate("");
    }
  }

  return (
    <Section
      title={
        <>
          마일스톤 <span className="font-normal text-muted">{list.length}</span>
        </>
      }
    >
      {list.length === 0 ? (
        <p className="text-sm text-muted">아직 없어요.{isOwner && " 1차 배포 · 최종 발표처럼 중요한 날을 추가해 보세요."}</p>
      ) : (
        <ul className="-mt-1 flex max-w-xl flex-col">
          {list.map((m) =>
            editing?.id === m.id ? (
              <li key={m.id} className="border-b border-divider px-2 py-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleEdit();
                  }}
                  noValidate
                  className="flex flex-wrap items-center gap-2"
                >
                  <label htmlFor={`milestone-edit-name-${m.id}`} className="sr-only">
                    마일스톤 이름
                  </label>
                  <input
                    id={`milestone-edit-name-${m.id}`}
                    value={editing.name}
                    maxLength={MILESTONE_NAME_MAX}
                    autoFocus
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className={controlClass(null, "h-8 min-w-0 flex-1")}
                  />
                  <label htmlFor={`milestone-edit-date-${m.id}`} className="sr-only">
                    마일스톤 날짜
                  </label>
                  <input
                    id={`milestone-edit-date-${m.id}`}
                    type="date"
                    value={editing.date}
                    onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                    className={controlClass(null, "h-8 w-auto")}
                  />
                  <button type="button" onClick={() => setEditing(null)} disabled={pending} className={buttonClass("ghost", "h-8")}>
                    취소
                  </button>
                  <button type="submit" disabled={pending} className={buttonClass("secondary", "h-8")}>
                    {pending ? "저장 중…" : "저장"}
                  </button>
                </form>
              </li>
            ) : (
              <li key={m.id} className="flex items-center gap-3 border-b border-divider px-2 py-2 text-sm">
                <span className={m.date < today ? "text-faint" : "text-danger"}>
                  <Icon name="flag" size={14} />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
                <span className="text-sub tabular-nums">
                  {formatShort(m.date)}({weekdayOf(m.date)})
                </span>
                <span className="w-12 text-right text-xs font-semibold text-muted tabular-nums">{dDay(m.date, today)}</span>
                {isOwner && (
                  <span className="flex">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setEditing({ id: m.id, name: m.name, date: m.date });
                        setMessage(null);
                      }}
                      className="inline-flex h-6 cursor-pointer items-center rounded-md px-2 text-xs font-medium text-sub hover:bg-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void save(list.filter((x) => x.id !== m.id), `「${m.name}」${eulReul(m.name)} 지웠어요.`)}
                      className="inline-flex h-6 cursor-pointer items-center rounded-md px-2 text-xs font-medium text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </span>
                )}
              </li>
            ),
          )}
        </ul>
      )}

      {isOwner && list.length < MAX_MILESTONES && (
        <form onSubmit={handleAdd} noValidate className="flex max-w-xl flex-wrap items-center gap-2">
          <label htmlFor="milestone-name" className="sr-only">
            마일스톤 이름
          </label>
          <input
            id="milestone-name"
            value={name}
            placeholder="예) 1차 배포"
            maxLength={MILESTONE_NAME_MAX}
            onChange={(e) => {
              setName(e.target.value);
              setMessage(null);
            }}
            className={controlClass(null, "h-9 min-w-0 flex-1")}
          />
          <label htmlFor="milestone-date" className="sr-only">
            마일스톤 날짜
          </label>
          <input
            id="milestone-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setMessage(null);
            }}
            className={controlClass(null, "h-9 w-auto")}
          />
          <button type="submit" disabled={pending} className={buttonClass("secondary", "h-9")}>
            <Icon name="plus" size={14} />
            {pending ? "저장 중…" : "추가"}
          </button>
        </form>
      )}
      <p className="text-xs text-muted">
        {isOwner ? `최대 ${MAX_MILESTONES}개. ` : "마일스톤은 프로젝트를 만든 사람이 정해요. "}
        대시보드 제목 아래 D-day 로 보이고, 일정 차트 위에 깃발로 표시돼요.
        {project.github && " 연결된 GitHub 레포에도 같은 이름 · 마감일로 마일스톤이 생겨요."}
      </p>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
    </Section>
  );
}

export function ProjectSettingsView() {
  const { project, members } = useCurrentProject();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useTransientState<Confirming>(null);
  const isOwner = user?.uid === project.ownerId;

  async function copyCode(): Promise<void> {
    await navigator.clipboard.writeText(project.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <>
      <PageHeader title="프로젝트 설정" />

      <NameSection isOwner={isOwner} />

      <MilestoneSection isOwner={isOwner} />

      <Section title="초대 코드">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-side px-3.5 py-1.5 font-mono text-2xl tracking-[0.2em]">{project.inviteCode}</span>
          <ShareInviteButton project={project} />
          <button type="button" onClick={() => void copyCode()} className={buttonClass("secondary")}>
            <Icon name={copied ? "check" : "copy"} size={15} />
            {copied ? "복사됨" : "코드 복사"}
          </button>
          {isOwner && (
            <button type="button" onClick={() => setConfirming({ kind: "reissue" })} className={buttonClass("ghost")}>
              재발급
            </button>
          )}
        </div>
        <p className="text-xs text-muted">
          &lsquo;초대 링크 공유&rsquo;를 누르면 카카오톡 · 메시지 등으로 바로 보낼 수 있어요 (PC 에선 링크 복사). 받은 사람은 링크를 누르고 &lsquo;참여하기&rsquo;만 하면 들어와요. 코드는 &lsquo;초대 코드로 참여&rsquo;에 입력해도 돼요.
          {isOwner && " 코드가 퍼졌다면 재발급하세요. 예전 코드 · 링크는 바로 못 쓰게 되고, 이미 들어온 멤버는 그대로예요."}
        </p>
      </Section>

      <Section
        title={
          <>
            멤버 <span className="font-normal text-muted">{project.memberIds.length}</span>
          </>
        }
      >
        <ul className="-mt-3 flex flex-col">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 border-b border-divider px-2 py-2 text-[13px]">
              <Avatar seed={m.id} name={m.name} size={22} />
              <span className="min-w-0 flex-1 truncate font-medium sm:w-32 sm:flex-none">
                {m.name}
                {m.id === user?.uid && <span className="font-normal text-faint"> (나)</span>}
              </span>
              <span className="hidden flex-1 truncate text-sub sm:block">{m.email}</span>
              {m.id === project.ownerId ? (
                <span className="rounded bg-tint-orange px-1.5 py-0.5 text-[11px] font-medium text-tint-orange-fg">만든 사람</span>
              ) : (
                <>
                  <span className="rounded bg-tint-gray px-1.5 py-0.5 text-[11px] font-medium text-tint-gray-fg">멤버</span>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setConfirming({ kind: "remove", member: m })}
                      className="inline-flex h-6 cursor-pointer items-center rounded-md px-2 text-xs font-medium text-danger hover:bg-danger-soft"
                    >
                      내보내기
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <DangerZone />

      {confirming?.kind === "reissue" && (
        <ConfirmModal
          open
          tone="primary"
          title="초대 코드를 재발급할까요?"
          confirmLabel="재발급"
          onClose={() => setConfirming(null)}
          onConfirm={async () => {
            const result = await regenerateInviteCode(project);
            return result.ok ? null : result.message;
          }}
        >
          지금 코드 <b className="font-mono text-ink">{project.inviteCode}</b>는 바로 쓸 수 없게 돼요.
          <br />
          이미 들어온 멤버는 그대로예요.
        </ConfirmModal>
      )}
      {confirming?.kind === "remove" && (
        <ConfirmModal
          open
          title={`${confirming.member.name}님을 내보낼까요?`}
          confirmLabel="내보내기"
          onClose={() => setConfirming(null)}
          onConfirm={async () => {
            const result = await removeMember(project, confirming.member.id);
            return result.ok ? null : result.message;
          }}
        >
          이 프로젝트에 들어올 수 없게 되고, 맡고 있던 할 일은 담당자 없음으로 바뀌어요.
          <br />
          초대 코드를 알면 다시 들어올 수 있으니, 필요하면 코드도 재발급하세요.
        </ConfirmModal>
      )}
    </>
  );
}
