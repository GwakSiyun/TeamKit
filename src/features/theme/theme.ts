export type ThemeChoice = "system" | "light" | "dark";

export const THEME_KEY = "tk-theme";

/**
 * 첫 화면을 그리기 전에 저장된 테마를 <html data-theme> 에 넣는 스크립트 (루트 레이아웃 <head> 에 그대로 넣는다).
 * React 가 뜨기 전에 실행돼야 밝은 화면이 잠깐 번쩍이지 않는다.
 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="system")document.documentElement.dataset.theme=t}catch(e){}`;

export function readTheme(): ThemeChoice {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "dark" || t === "system" ? t : "light";
  } catch {
    return "light";
  }
}

/** 고른 테마 저장 + 바로 적용. 라이트(기본)면 저장 · data-theme 을 지운다 */
export function applyTheme(choice: ThemeChoice): void {
  try {
    if (choice === "light") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // 저장이 막힌 브라우저(사생활 보호 모드 등)는 이번 화면에만 적용
  }
  if (choice === "light") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = choice;
}
