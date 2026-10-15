"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { controlClass } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { useAuth } from "@/features/auth/AuthProvider";
import { useTransientState } from "@/hooks/useTransientState";
import { useCurrentProject } from "../ProjectContext";
import { PROJECT_NAME_MAX, regenerateInviteCode, removeMember, renameProject } from "../services";
import type { Member } from "../types";
import { DangerZone } from "./DangerZone";

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

      <Section title="초대 코드">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-side px-3.5 py-1.5 font-mono text-2xl tracking-[0.2em]">{project.inviteCode}</span>
          <button type="button" onClick={copyCode} className={buttonClass("secondary")}>
            <Icon name={copied ? "check" : "copy"} size={15} />
            {copied ? "복사됨" : "복사"}
          </button>
          {isOwner && (
            <button type="button" onClick={() => setConfirming({ kind: "reissue" })} className={buttonClass("ghost")}>
              재발급
            </button>
          )}
        </div>
        <p className="text-xs text-muted">
          팀원이 &lsquo;초대 코드로 참여&rsquo;에 이 코드를 입력하면 프로젝트에 들어와요.
          {isOwner && " 코드가 퍼졌다면 재발급하세요. 이미 들어온 멤버는 그대로예요."}
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
            <li key={m.id} className="flex items-center gap-3 border-b border-[#F1F1EF] px-2 py-2 text-[13px]">
              <Avatar seed={m.id} name={m.name} size={22} />
              <span className="w-32 truncate font-medium">
                {m.name}
                {m.id === user?.uid && <span className="font-normal text-faint"> (나)</span>}
              </span>
              <span className="flex-1 truncate text-sub">{m.email}</span>
              {m.id === project.ownerId ? (
                <span className="rounded bg-[#FADEC9] px-1.5 py-0.5 text-[11px] font-medium text-[#49290E]">만든 사람</span>
              ) : (
                <>
                  <span className="rounded bg-[#E3E2E0] px-1.5 py-0.5 text-[11px] font-medium text-[#32302C]">멤버</span>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setConfirming({ kind: "remove", member: m })}
                      className="inline-flex h-6 cursor-pointer items-center rounded-md px-2 text-xs font-medium text-danger hover:bg-[#FFF5F4]"
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
