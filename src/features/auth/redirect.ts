/** 로그인 · 회원가입 뒤 돌아갈 기본 화면 */
export const AFTER_LOGIN = "/projects";

/**
 * 로그인 · 회원가입 뒤 돌아갈 주소 (?next=/join/ABC234). 우리 사이트 안의 경로만 허용 (다른 사이트로 보내는 링크 방지).
 * 브라우저 이벤트 · effect 안에서만 부른다.
 */
export function nextPath(fallback: string = AFTER_LOGIN): string {
  if (typeof window === "undefined") return fallback;
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

/** 지금 화면으로 돌아오게 하는 로그인 주소 */
export function loginUrlFor(path: string, page: "/login" | "/signup" = "/login"): string {
  return `${page}?next=${encodeURIComponent(path)}`;
}
