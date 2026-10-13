import type { IconName } from "@/components/ui/Icon";

export interface NavItem {
  /** 프로젝트 주소(/p/{id}) 뒤에 붙는 경로. 대시보드는 "" */
  path: string;
  label: string;
  icon: IconName;
}

export const MAIN_NAV: readonly NavItem[] = [
  { path: "", label: "대시보드", icon: "dashboard" },
  { path: "/board", label: "할 일", icon: "board" },
  { path: "/meetings", label: "회의록", icon: "mic" },
  { path: "/polls", label: "일정 맞추기", icon: "calendar" },
];

export const PROJECT_NAV: readonly NavItem[] = [
  { path: "/github", label: "GitHub 연동", icon: "github" },
  { path: "/settings", label: "프로젝트 설정", icon: "gear" },
];

export function projectBase(projectId: string): string {
  return `/p/${projectId}`;
}

/** 현재 주소에 해당하는 메뉴 (대시보드는 정확히 일치할 때만) */
export function activeNavItem(pathname: string, projectId: string): NavItem | null {
  const base = projectBase(projectId);
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : null;
  if (rest === null) return null;
  return [...MAIN_NAV, ...PROJECT_NAV].find((item) => (item.path === "" ? rest === "" || rest === "/" : rest.startsWith(item.path))) ?? null;
}
