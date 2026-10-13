const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email) return "이메일을 입력해주세요.";
  if (!EMAIL_RE.test(email)) return "이메일 형식이 올바르지 않아요.";
  return null;
}

/** 디자인 기준: 8자 이상, 영문과 숫자 포함 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "8자 이상 입력해주세요.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "영문과 숫자를 모두 넣어주세요.";
  return null;
}

export function validateName(name: string): string | null {
  if (!name) return "이름을 입력해주세요.";
  if (name.length > 20) return "이름은 20자 이하로 입력해주세요.";
  return null;
}
