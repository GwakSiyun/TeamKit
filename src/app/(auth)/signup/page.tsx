import type { Metadata } from "next";
import { AuthSwitchLink } from "@/features/auth/components/AuthSwitchLink";
import { GithubButton } from "@/features/auth/components/GithubButton";
import { OrDivider } from "@/features/auth/components/OrDivider";
import { SignupForm } from "@/features/auth/components/SignupForm";

export const metadata: Metadata = { title: "회원가입" };

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-2 text-[26px] font-bold">회원가입</h1>
      <GithubButton label="GitHub로 가입하기" />
      <p className="-mt-1.5 text-xs text-muted">GitHub로 가입하면 레포 연동이 바로 돼요.</p>
      <OrDivider label="또는 이메일로" />
      <SignupForm />
      <p className="mt-6 border-t border-line pt-4 text-center text-[13px] text-muted">
        이미 계정이 있나요?{" "}
        <AuthSwitchLink href="/login">로그인</AuthSwitchLink>
      </p>
    </>
  );
}
