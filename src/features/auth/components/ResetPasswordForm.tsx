"use client";

import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { requestPasswordReset } from "../services";
import { validateEmail } from "../validation";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const target = email.trim();
    const emailError = validateEmail(target);
    if (emailError) {
      setError(emailError);
      return;
    }
    setPending(true);
    setError(null);
    const result = await requestPasswordReset(target);
    setPending(false);
    if (result.ok) setSentTo(target);
    else setError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field
        id="reset-email"
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        error={error}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={pending} className={buttonClass("primary", "h-10 w-full")}>
        {pending ? "보내는 중…" : sentTo ? "다시 보내기" : "재설정 링크 보내기"}
      </button>
      {sentTo && (
        <Notice tone="success">
          <b>{sentTo}</b>으로 링크를 보냈어요. 메일이 안 보이면 스팸함을 확인해주세요.
        </Notice>
      )}
    </form>
  );
}
