export type ThemeChoice = "system" | "light" | "dark";

export const THEME_KEY = "tk-theme";

/**
 * 첫 화면을 그리기 전에 저장된 테마를 <html data-theme> 에 넣는 스크립트 (루트 레이아웃 <head> 에 그대로 넣는다).
 * React 가 뜨기 전에 실행돼야 밝은 화면이 잠깐 번쩍이지 않는다.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function readTheme(): ThemeChoice {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

/** 고른 테마 저장 + 바로 적용. 시스템이면 data-theme 을 지워 기기 설정을 따른다 */
export function applyTheme(choice: ThemeChoice): void {
  try {
    if (choice === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // 저장이 막힌 브라우저(사생활 보호 모드 등)는 이번 화면에만 적용
  }
  if (choice === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = choice;
}
