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

/**
 * 초대 링크 주소에서 코드 꺼내기. 공유받은 앱이 링크 뒤에 문구를 띄어쓰기 없이 붙이는 경우가 있어서
 * ("/join/ABC234TeamKit…") 앞 6자리가 올바른 코드면 그것만 쓴다.
 */
export function inviteCodeFromLink(segment: string): string {
  let raw = segment;
  try {
    raw = decodeURIComponent(segment);
  } catch {
    // 깨진 % 인코딩이면 그대로
  }
  const code = normalizeInviteCode(raw);
  const head = code.slice(0, INVITE_CODE_LENGTH);
  return isValidInviteCode(head) ? head : code;
}
