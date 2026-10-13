"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "../AuthProvider";

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
    router.replace(require === "signed-in" ? "/login" : "/projects");
  }, [loading, allowed, require, router]);

  if (loading || !allowed) {
    return <p className="py-24 text-center text-sm text-muted">불러오는 중…</p>;
  }
  return <>{children}</>;
}
