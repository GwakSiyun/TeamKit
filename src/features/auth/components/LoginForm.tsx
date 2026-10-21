"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { nextPath } from "../redirect";
import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { signInWithEmail } from "../services";
import { validateEmail } from "../validation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const emailError = validateEmail(email.trim());
    if (emailError || !password) {
      setError(emailError ?? "비밀번호를 입력해주세요.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await signInWithEmail(email.trim(), password);
    setPending(false);
    if (result.ok) router.replace(nextPath());
    else setError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {error && <Notice tone="error">{error}</Notice>}
      <Field id="login-email" label="이메일" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field id="login-password" label="비밀번호" type="password" autoComplete="current-password" placeholder="비밀번호 입력" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "h-10 w-full")}>
        {pending ? "로그인 중…" : "이메일로 로그인"}
      </button>
      <Link href="/reset-password" className="text-center text-[13px] text-muted hover:text-ink">
        비밀번호를 잊으셨나요?
      </Link>
    </form>
  );
}
