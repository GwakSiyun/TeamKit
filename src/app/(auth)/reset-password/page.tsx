import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/ui/Notice";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = { title: "비밀번호 재설정" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-[26px] font-bold">비밀번호 재설정</h1>
      <p className="mb-1 text-sm leading-relaxed text-muted">가입한 이메일을 입력하면 재설정 링크를 보내드려요.</p>
      <ResetPasswordForm />
      <Link href="/login" className="text-center text-[13px] text-muted hover:text-ink">
        로그인으로 돌아가기
      </Link>
      <Notice tone="info">GitHub로 가입한 계정은 비밀번호가 없어요. GitHub로 로그인해주세요.</Notice>
    </>
  );
}
