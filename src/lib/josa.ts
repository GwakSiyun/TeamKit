/** 받침 여부에 맞는 조사 고르기. 사용: `${word}${eulReul(word)}` → "TM-1을", "TM-2를", "TeamKit을" */

// 숫자를 한글로 읽었을 때 받침이 있는지: 0영 1일 2이 3삼 4사 5오 6육 7칠 8팔 9구
const DIGIT_HAS_FINAL = [true, true, false, true, false, false, true, true, true, false];
// 영어 끝소리가 받침처럼 읽히는 경우 (대략): Kit→킷, app→앱, book→북, team→팀, ring→링
const LATIN_HAS_FINAL = /([lmnrkpt]|ng)$/i;

function hasFinalConsonant(word: string): boolean {
  const last = word.trim().slice(-1);
  if (!last) return false;
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  if (/\d/.test(last)) return DIGIT_HAS_FINAL[Number(last)];
  return LATIN_HAS_FINAL.test(last);
}

/** 을/를 (조사만 돌려준다) */
export function eulReul(word: string): string {
  return hasFinalConsonant(word) ? "을" : "를";
}
