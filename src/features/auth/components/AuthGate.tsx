"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../AuthProvider";
import { loginUrlFor, nextPath } from "../redirect";

interface AuthGateProps {
  /** "signed-in": 로그인한 사람만 / "signed-out": 로그인 안 한 사람만 (로그인·회원가입 화면) */
  require: "signed-in" | "signed-out";
  children: ReactNode;
}

export function AuthGate({ require, children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = require === "signed-in" ? !!user : !user;

  useEffect(() => {
    if (loading || allowed) return;
    // 로그인 안 했으면 로그인 뒤 이 화면으로 돌아오게, 이미 로그인했으면 돌아갈 곳(?next)으로
    router.replace(require === "signed-in" ? loginUrlFor(window.location.pathname) : nextPath());
  }, [loading, allowed, require, router]);

  if (loading || !allowed) {
    return <p className="py-24 text-center text-sm text-muted">불러오는 중…</p>;
  }
  return <>{children}</>;
}
