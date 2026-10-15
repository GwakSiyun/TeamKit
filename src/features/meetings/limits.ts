/** 브라우저 · 서버가 같이 쓰는 제한 값 */

/** Groq 무료 플랜의 음성 파일 크기 상한 (25MB) */
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

/** 녹음 최대 길이 (초). 32kbps 기준 60분 ≈ 14MB 라 상한 안에 들어온다 */
export const MAX_RECORD_SEC = 60 * 60;

/** 직접 입력 최대 글자 수 */
export const MAX_TEXT_LENGTH = 20000;

export const MAX_TITLE_LENGTH = 60;

/** Groq Whisper 가 받는 확장자 */
export const AUDIO_EXTENSIONS = ["flac", "mp3", "mp4", "mpeg", "mpga", "m4a", "ogg", "opus", "wav", "webm"] as const;
