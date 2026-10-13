"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  // .env.local 이 비어 있으면 구독하지 않고 로그아웃 상태로 둔다. 로그인 시도 시 설정 안내가 화면에 뜬다.
  const [state, setState] = useState<AuthState>({ user: null, loading: isFirebaseConfigured() });

  // 데이터 페칭이 아니라 Firebase 로그인 상태 구독이다.
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    return onAuthStateChanged(firebaseAuth(), (user) => setState({ user, loading: false }));
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
