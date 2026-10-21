import { FirebaseError } from "firebase/app";

const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "이메일 또는 비밀번호가 맞지 않아요. 다시 확인해주세요.",
  "auth/wrong-password": "이메일 또는 비밀번호가 맞지 않아요. 다시 확인해주세요.",
  "auth/user-not-found": "이메일 또는 비밀번호가 맞지 않아요. 다시 확인해주세요.",
  "auth/invalid-email": "이메일 형식이 올바르지 않아요.",
  "auth/email-already-in-use": "이미 가입된 이메일이에요. 로그인하거나 비밀번호를 재설정하세요.",
  "auth/weak-password": "비밀번호가 너무 약해요. 8자 이상, 영문과 숫자를 섞어주세요.",
  "auth/too-many-requests": "시도가 너무 많아요. 잠시 후 다시 시도해주세요.",
  "auth/network-request-failed": "네트워크에 연결할 수 없어요. 인터넷 연결을 확인해주세요.",
  "auth/popup-closed-by-user": "GitHub 로그인 창이 닫혔어요. 다시 시도해주세요.",
  "auth/cancelled-popup-request": "GitHub 로그인 창이 닫혔어요. 다시 시도해주세요.",
  "auth/popup-blocked": "브라우저가 팝업을 막았어요. 팝업을 허용한 뒤 다시 시도해주세요.",
  "auth/account-exists-with-different-credential": "이 GitHub 계정과 같은 이메일로 가입한 계정이 있어요. 이메일로 로그인한 뒤 GitHub를 연결해주세요.",
  "auth/credential-already-in-use": "이 GitHub 계정은 이미 다른 TeamKit 계정에 연결돼 있어요.",
  "auth/provider-already-linked": "이미 GitHub가 연결돼 있어요.",
  "auth/user-mismatch": "지금 로그인한 계정과 연결된 GitHub 계정으로 인증해주세요.",
  "auth/operation-not-allowed": "이 로그인 방식이 아직 켜져 있지 않아요. Firebase 콘솔에서 로그인 방법을 확인해주세요.",
};

export function authErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return MESSAGES[error.code] ?? `요청을 처리하지 못했어요. (${error.code})`;
  }
  if (error instanceof Error) return error.message;
  return "알 수 없는 오류가 발생했어요.";
}
