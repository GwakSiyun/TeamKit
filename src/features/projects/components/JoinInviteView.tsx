"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Notice } from "@/components/ui/Notice";
import { useAuth } from "@/features/auth/AuthProvider";
import { loginUrlFor } from "@/features/auth/redirect";
import { normalizeInviteCode } from "../inviteCode";
import { checkInvite, joinProject, type InviteCheck } from "../services";

type ViewState = { status: "checking" } | InviteCheck;

/**
 * 초대 링크(/join/ABC234) 화면.
 * 로그인 전 → 로그인 · 회원가입 뒤 이 화면으로 돌아옴 / 이미 멤버 → 바로 프로젝트로 / 아니면 "참여하기" 한 번 누르고 입장.
 * 링크 미리보기나 실수로 연 경우에 바로 들어가지 않도록 참여는 버튼으로만 한다.
 */
export function JoinInviteView() {
  const params = useParams<{ code: string }>();
  const code = normalizeInviteCode(decodeURIComponent(params.code ?? ""));
  const { user, loading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<ViewState>({ status: "checking" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    void checkInvite(code).then((result) => {
      if (cancelled) return;
      if (result.status === "member") router.replace(`/p/${result.projectId}`);
      else setState(result);
    });
    return () => {
      cancelled = true;
    };
  }, [loading, user, code, router]);

  async function handleJoin(): Promise<void> {
    setPending(true);
    setError(null);
    const result = await joinProject(code);
    setPending(false);
    if (result.status === "error") setError(result.message);
    else router.replace(`/p/${result.projectId}`);
  }

  const here = `/join/${code}`;
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-line px-6 py-10 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-[10px] bg-side text-muted">
        <Icon name="users" size={24} />
      </span>
      <h1 className="text-xl font-bold">프로젝트에 초대받았어요</h1>
      <p className="text-sm text-muted">
        초대 코드 <b className="font-mono tracking-[0.15em] text-ink">{code}</b>
      </p>

      {loading || (user && state.status === "checking") ? (
        <p className="text-sm text-muted">확인하는 중…</p>
      ) : !user ? (
        <>
          <p className="text-sm leading-relaxed text-sub">로그인하면 이 화면으로 돌아와서 바로 참여할 수 있어요.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href={loginUrlFor(here)} className={buttonClass("primary", "h-9 px-4")}>
              로그인
            </Link>
            <Link href={loginUrlFor(here, "/signup")} className={buttonClass("secondary", "h-9 px-4")}>
              회원가입
            </Link>
          </div>
        </>
      ) : state.status === "invalid" ? (
        <>
          <Notice tone="error">{state.message}</Notice>
          <Link href="/projects" className={buttonClass("secondary")}>
            내 프로젝트로
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-sub">참여하면 팀의 할 일 · 회의록 · 일정을 함께 볼 수 있어요.</p>
          {error && <Notice tone="error">{error}</Notice>}
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/projects" className={buttonClass("secondary", "h-9 px-4")}>
              취소
            </Link>
            <button type="button" onClick={handleJoin} disabled={pending} className={buttonClass("primary", "h-9 px-4")}>
              {pending ? "참여하는 중…" : "참여하기"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
