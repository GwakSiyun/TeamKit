"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { checkResetCode, resetPassword, verifyEmail } from "../services";
import { validatePassword } from "../validation";

type View =
  { status: "checking" } | { status: "reset"; email: string } | { status: "done"; title: string; text: string } | { status: "error"; message: string };

function Done({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-success-soft text-success-fg">
        <Icon name="check" size={24} />
      </span>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm leading-relaxed text-muted">{text}</p>
      <Link href="/login" className={buttonClass("primary", "mt-2 h-9 px-4")}>
        로그인하러 가기
      </Link>
    </div>
  );
}

/**
 * Firebase 메일 링크가 도착하는 화면 (/auth/action?mode=…&oobCode=…).
 * 기본 Firebase 화면 대신 TeamKit 디자인으로 비밀번호 재설정 · 이메일 인증을 처리한다.
 * 콘솔 Authentication → 템플릿 → 작업 URL 을 https://teamkit.site/auth/action 으로 맞춰야 이 화면으로 온다.
 */
export function AuthActionView() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const code = params.get("oobCode") ?? "";
  const [view, setView] = useState<View>({ status: "checking" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 링크를 연 순간 한 번: 코드 확인(비밀번호 재설정) 또는 바로 처리(이메일 인증)
  useEffect(() => {
    let cancelled = false;
    const finish = (next: View) => {
      if (!cancelled) setView(next);
    };
    if (!code) {
      finish({ status: "error", message: "링크가 올바르지 않아요. 메일의 링크를 다시 눌러주세요." });
    } else if (mode === "resetPassword") {
      void checkResetCode(code).then((r) => finish(r.ok ? { status: "reset", email: r.email } : { status: "error", message: r.message }));
    } else if (mode === "verifyEmail") {
      void verifyEmail(code).then((r) =>
        finish(
          r.ok ? { status: "done", title: "이메일을 인증했어요", text: "이제 TeamKit 을 그대로 이용하면 돼요." } : { status: "error", message: r.message },
        ),
      );
    } else {
      finish({ status: "error", message: "지원하지 않는 링크예요. 메일을 다시 확인해주세요." });
    }
    return () => {
      cancelled = true;
    };
  }, [mode, code]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const found: typeof errors = {};
    const weak = validatePassword(password);
    if (weak) found.password = weak;
    if (password !== confirm) found.confirm = "비밀번호가 서로 달라요.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setPending(true);
    setSubmitError(null);
    const result = await resetPassword(code, password);
    setPending(false);
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    setView({ status: "done", title: "비밀번호를 바꿨어요", text: "새 비밀번호로 로그인해주세요." });
  }

  if (view.status === "checking") return <p className="py-12 text-center text-sm text-muted">링크를 확인하는 중…</p>;
  if (view.status === "done") return <Done title={view.title} text={view.text} />;
  if (view.status === "error") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-[26px] font-bold">링크를 열 수 없어요</h1>
        <Notice tone="error">{view.message}</Notice>
        <Link href="/reset-password" className={buttonClass("secondary", "h-9")}>
          비밀번호 재설정 다시 요청
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-bold">새 비밀번호 설정</h1>
        <p className="text-sm text-muted">
          <b className="font-medium text-ink">{view.email}</b> 계정의 비밀번호를 새로 정해요.
        </p>
      </div>
      {submitError && <Notice tone="error">{submitError}</Notice>}
      <Field
        id="new-password"
        label="새 비밀번호"
        type="password"
        autoComplete="new-password"
        autoFocus
        hint="8자 이상, 영문과 숫자를 섞어주세요"
        error={errors.password}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Field
        id="new-password-confirm"
        label="새 비밀번호 확인"
        type="password"
        autoComplete="new-password"
        error={errors.confirm}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <button type="submit" disabled={pending} className={buttonClass("primary", "h-10 w-full")}>
        {pending ? "바꾸는 중…" : "비밀번호 바꾸기"}
      </button>
    </form>
  );
}
