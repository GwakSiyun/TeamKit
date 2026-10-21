import type { Metadata } from "next";
import { AuthSwitchLink } from "@/features/auth/components/AuthSwitchLink";
import { GithubButton } from "@/features/auth/components/GithubButton";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { OrDivider } from "@/features/auth/components/OrDivider";

export const metadata: Metadata = { title: "로그인" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-2 text-[26px] font-bold">로그인</h1>
      <GithubButton label="GitHub로 계속하기" />
      <OrDivider label="또는 이메일로" />
      <LoginForm />
      <p className="mt-6 border-t border-line pt-4 text-center text-[13px] text-muted">
        계정이 없나요? <AuthSwitchLink href="/signup">회원가입</AuthSwitchLink>
      </p>
    </>
  );
}
