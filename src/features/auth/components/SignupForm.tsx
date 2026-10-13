"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { signUpWithEmail } from "../services";
import { validateEmail, validateName, validatePassword } from "../validation";

interface SignupValues {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

type SignupErrors = Partial<Record<keyof SignupValues, string>>;

function validate(v: SignupValues): SignupErrors {
  const errors: SignupErrors = {};
  const name = validateName(v.name.trim());
  const email = validateEmail(v.email.trim());
  const password = validatePassword(v.password);
  if (name) errors.name = name;
  if (email) errors.email = email;
  if (password) errors.password = password;
  if (v.confirm !== v.password) errors.confirm = "비밀번호가 일치하지 않아요.";
  return errors;
}

export function SignupForm() {
  const router = useRouter();
  const [values, setValues] = useState<SignupValues>({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update(key: keyof SignupValues, value: string): void {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setPending(true);
    setServerError(null);
    const result = await signUpWithEmail(values.name.trim(), values.email.trim(), values.password);
    setPending(false);
    if (result.ok) router.replace("/projects");
    else setServerError(result.message);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {serverError && <Notice tone="error">{serverError}</Notice>}
      <Field id="signup-name" label="이름" autoComplete="name" placeholder="팀원에게 보일 이름" value={values.name} error={errors.name} onChange={(e) => update("name", e.target.value)} />
      <Field id="signup-email" label="이메일" type="email" autoComplete="email" placeholder="you@example.com" value={values.email} error={errors.email} onChange={(e) => update("email", e.target.value)} />
      <Field
        id="signup-password"
        label="비밀번호"
        type="password"
        autoComplete="new-password"
        hint="8자 이상, 영문과 숫자 포함"
        value={values.password}
        error={errors.password}
        onChange={(e) => update("password", e.target.value)}
      />
      <Field id="signup-confirm" label="비밀번호 확인" type="password" autoComplete="new-password" value={values.confirm} error={errors.confirm} onChange={(e) => update("confirm", e.target.value)} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "h-10 w-full")}>
        {pending ? "가입 중…" : "가입하기"}
      </button>
    </form>
  );
}
