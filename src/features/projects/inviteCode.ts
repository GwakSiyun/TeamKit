// 헷갈리는 0·O·1·I 를 뺀 32자. firestore.rules 의 '^[A-HJ-NP-Z2-9]{6}$' 와 같아야 한다.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const INVITE_CODE_LENGTH = 6;
const PATTERN = /^[A-HJ-NP-Z2-9]{6}$/;

export function generateInviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(INVITE_CODE_LENGTH));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** 입력값을 대문자·공백 제거로 정리 */
export function normalizeInviteCode(input: string): string {
  return input.replace(/\s/g, "").toUpperCase();
}

export function isValidInviteCode(code: string): boolean {
  return PATTERN.test(code);
}
