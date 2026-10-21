"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/button";
import { Field, controlClass } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { Tag } from "@/components/ui/Tag";
import { useAuth } from "../AuthProvider";
import { changePassword, hasPassword, isGithubLinked, logout, updateName } from "../services";
import { validateName, validatePassword } from "../validation";
import { ThemeSelect } from "@/features/theme/ThemeSelect";
import { GithubLinkRow } from "./GithubLinkRow";

type Message = { tone: "success" | "error"; text: string } | null;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="border-b border-line pb-1.5 text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** 이름: 바로 고쳐서 저장. 팀원 목록 · 담당자 표시에도 바뀐 이름이 보인다 */
function NameForm({ initial }: { initial: string }) {
  const { refresh } = useAuth();
  const [name, setName] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const trimmed = name.trim();
    const error = validateName(trimmed);
    if (error) {
      setMessage({ tone: "error", text: error });
      return;
    }
    setPending(true);
    setMessage(null);
    const result = await updateName(trimmed);
    setPending(false);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.message });
      return;
    }
    setSaved(trimmed);
    refresh();
    setMessage({ tone: "success", text: "이름을 바꿨어요. 팀원들에게도 바뀐 이름으로 보여요." });
  }

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="flex max-w-md items-center gap-2">
        <label htmlFor="account-name" className="sr-only">
          이름
        </label>
        <input
          id="account-name"
          value={name}
          maxLength={20}
          onChange={(e) => {
            setName(e.target.value);
            setMessage(null);
          }}
          className={controlClass(message?.tone === "error" ? message.text : null, "h-9")}
        />
        <button type="submit" disabled={pending || name.trim() === saved} className={buttonClass("secondary", "h-9")}>
          {pending ? "저장 중…" : "저장"}
        </button>
      </form>
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
    </>
  );
}

/** 비밀번호 변경 (이메일로 가입한 계정만). 현재 비밀번호로 한 번 더 확인 */
function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ next?: string; confirm?: string }>({});
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<Message>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const found: typeof errors = {};
    const weak = validatePassword(next);
    if (weak) found.next = weak;
    else if (next === current) found.next = "지금 비밀번호와 다르게 정해주세요.";
    if (next !== confirm) found.confirm = "새 비밀번호가 서로 달라요.";
    setErrors(found);
    if (!current) {
      setMessage({ tone: "error", text: "현재 비밀번호를 입력해주세요." });
      return;
    }
    if (Object.keys(found).length > 0) return;

    setPending(true);
    setMessage(null);
    const result = await changePassword(current, next);
    setPending(false);
    if (!result.ok) {
      setMessage({ tone: "error", text: result.message });
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setMessage({ tone: "success", text: "비밀번호를 바꿨어요. 다음 로그인부터 새 비밀번호를 쓰세요." });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-md flex-col gap-3">
      <Field
        id="pw-current"
        label="현재 비밀번호"
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <Field
        id="pw-next"
        label="새 비밀번호"
        type="password"
        autoComplete="new-password"
        hint="8자 이상, 영문과 숫자를 섞어주세요"
        error={errors.next}
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      <Field
        id="pw-confirm"
        label="새 비밀번호 확인"
        type="password"
        autoComplete="new-password"
        error={errors.confirm}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      <div>
        <button type="submit" disabled={pending} className={buttonClass("secondary")}>
          {pending ? "바꾸는 중…" : "비밀번호 변경"}
        </button>
      </div>
    </form>
  );
}

export function AccountView() {
  const { user } = useAuth();
  const router = useRouter();
  if (!user) return null;

  const withPassword = hasPassword(user);
  const withGithub = isGithubLinked(user);
  const displayName = user.displayName ?? "이름 없음";

  async function handleLogout(): Promise<void> {
    await logout();
    router.replace("/login");
  }

  return (
    <>
      <PageHeader title="계정 설정" />

      <div className="flex items-center gap-4 rounded-lg bg-side px-5 py-4">
        <Avatar seed={user.uid} name={displayName} size={48} />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-lg font-bold">{displayName}</span>
          <span className="truncate text-sm text-muted">{user.email ?? "이메일 없음"}</span>
          <span className="flex flex-wrap gap-1">
            {withPassword && <Tag>이메일 로그인</Tag>}
            {withGithub && <Tag tone="purple">GitHub 연결됨</Tag>}
          </span>
        </div>
      </div>

      <Section title="이름">
        <NameForm initial={user.displayName ?? ""} />
      </Section>

      <Section title="비밀번호">
        {withPassword ? <PasswordForm /> : <p className="text-sm text-muted">GitHub로 가입한 계정이라 비밀번호가 없어요. GitHub 계정으로 로그인하세요.</p>}
      </Section>

      <Section title="화면 테마">
        <ThemeSelect />
      </Section>

      <Section title="로그인 방식">
        <GithubLinkRow />
      </Section>

      <div>
        <button type="button" onClick={handleLogout} className={buttonClass("secondary")}>
          로그아웃
        </button>
      </div>
    </>
  );
}
