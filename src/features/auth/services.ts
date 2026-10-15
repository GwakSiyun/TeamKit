import {
  GithubAuthProvider,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  linkWithPopup,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase";
import { authErrorMessage } from "./errors";
import type { AuthResult } from "./types";

// 11주차 GitHub 연동(레포 목록·PR 조회)에 쓸 토큰 권한을 로그인 때 미리 받는다.
const GITHUB_SCOPES = ["read:user", "user:email", "repo"] as const;

async function ensureUserDoc(user: User, name: string, githubLogin: string | null): Promise<void> {
  const ref = doc(firestore(), "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    if (githubLogin) await setDoc(ref, { githubLogin }, { merge: true });
    return;
  }
  await setDoc(ref, {
    name,
    email: user.email ?? "",
    githubLogin,
    createdAt: serverTimestamp(),
  });
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<AuthResult> {
  try {
    const { user } = await createUserWithEmailAndPassword(firebaseAuth(), email, password);
    await updateProfile(user, { displayName: name });
    await ensureUserDoc(user, name, null);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: authErrorMessage(e) };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    await signInWithEmailAndPassword(firebaseAuth(), email, password);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: authErrorMessage(e) };
  }
}

function githubProvider(): GithubAuthProvider {
  const provider = new GithubAuthProvider();
  GITHUB_SCOPES.forEach((s) => provider.addScope(s));
  return provider;
}

// Firebase는 GitHub 토큰을 보관해주지 않으므로 로그인·연결 때 받은 토큰을 본인 전용 경로에 저장한다.
async function saveGithub(result: UserCredential): Promise<void> {
  const login = getAdditionalUserInfo(result)?.username ?? null;
  const name = result.user.displayName ?? login ?? "이름 없음";
  await ensureUserDoc(result.user, name, login);

  const accessToken = GithubAuthProvider.credentialFromResult(result)?.accessToken;
  if (accessToken) {
    await setDoc(doc(firestore(), "users", result.user.uid, "private", "github"), {
      accessToken,
      login,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function signInWithGithub(): Promise<AuthResult> {
  try {
    await saveGithub(await signInWithPopup(firebaseAuth(), githubProvider()));
    return { ok: true };
  } catch (e) {
    return { ok: false, message: authErrorMessage(e) };
  }
}

/** 이메일로 가입한 계정에 GitHub를 연결한다. 같은 이메일의 GitHub 계정은 이 방법으로만 붙일 수 있다. */
export async function linkGithub(): Promise<AuthResult> {
  const user = firebaseAuth().currentUser;
  if (!user) return { ok: false, message: "로그인한 뒤 연결할 수 있어요." };
  try {
    await saveGithub(await linkWithPopup(user, githubProvider()));
    return { ok: true };
  } catch (e) {
    return { ok: false, message: authErrorMessage(e) };
  }
}

/**
 * 이미 연결된 GitHub 로 다시 인증해서 새 토큰을 받는다.
 * GitHub 토큰이 만료 · 취소됐을 때(레포 목록 401) 사용. Firebase 는 토큰을 갱신해주지 않는다.
 */
export async function refreshGithubToken(): Promise<AuthResult> {
  const user = firebaseAuth().currentUser;
  if (!user) return { ok: false, message: "로그인한 뒤 다시 연결할 수 있어요." };
  try {
    await saveGithub(await reauthenticateWithPopup(user, githubProvider()));
    return { ok: true };
  } catch (e) {
    return { ok: false, message: authErrorMessage(e) };
  }
}

export function isGithubLinked(user: User): boolean {
  return user.providerData.some((p) => p.providerId === GithubAuthProvider.PROVIDER_ID);
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    await sendPasswordResetEmail(firebaseAuth(), email);
    return { ok: true };
  } catch (e) {
    // 가입 여부를 노출하지 않도록 없는 계정도 성공처럼 처리한다.
    if (e instanceof Error && "code" in e && e.code === "auth/user-not-found") return { ok: true };
    return { ok: false, message: authErrorMessage(e) };
  }
}

export async function logout(): Promise<void> {
  await signOut(firebaseAuth());
}
