"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  /** 이름 변경처럼 Firebase 가 알려주지 않는 프로필 변경 뒤 화면을 다시 그린다 */
  refresh: () => void;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true, refresh: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  // .env.local 이 비어 있으면 구독하지 않고 로그아웃 상태로 둔다. 로그인 시도 시 설정 안내가 화면에 뜬다.
  const [state, setState] = useState<Omit<AuthState, "refresh">>({ user: null, loading: isFirebaseConfigured() });
  // 같은 User 객체라도 새 상태 객체로 바꿔 구독하는 화면이 다시 그려지게
  const refresh = useCallback(() => setState((prev) => ({ ...prev, user: firebaseAuth().currentUser })), []);

  // 데이터 페칭이 아니라 Firebase 로그인 상태 구독이다.
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    return onAuthStateChanged(firebaseAuth(), (user) => setState({ user, loading: false }));
  }, []);

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
