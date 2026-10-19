"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/AuthProvider";
import { logout } from "@/features/auth/services";
import { activeNavItem, MAIN_NAV, PROJECT_NAV, projectBase, type NavItem } from "../../navigation";
import { useCurrentProject } from "../../ProjectContext";
import { ProjectSwitcher } from "./ProjectSwitcher";

const ITEM = "flex h-[30px] items-center gap-2 rounded-md px-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent";

function NavLink({ item, href, active, onNavigate }: { item: NavItem; href: string; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${ITEM} ${active ? "bg-hover font-semibold text-ink" : "text-sub hover:bg-hover hover:text-ink"}`}
    >
      <Icon name={item.icon} />
      {item.label}
    </Link>
  );
}

/** 메뉴 내용. 넓은 화면은 왼쪽 고정 사이드바, 좁은 화면은 ☰ 서랍(MobileNav)에서 같이 쓴다 */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { project } = useCurrentProject();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const base = projectBase(project.id);
  const active = activeNavItem(pathname, project.id);

  async function handleLogout(): Promise<void> {
    await logout();
    router.replace("/login");
  }

  return (
    <>
      <ProjectSwitcher />

      {MAIN_NAV.map((item) => (
        <NavLink key={item.path} item={item} href={base + item.path} active={active === item} onNavigate={onNavigate} />
      ))}

      <span className="mx-2.5 mt-[18px] mb-1 text-xs font-medium text-faint">프로젝트</span>
      {PROJECT_NAV.map((item) => (
        <NavLink key={item.path} item={item} href={base + item.path} active={active === item} onNavigate={onNavigate} />
      ))}

      <div className="mt-auto flex flex-col gap-0.5 border-t border-line pt-3">
        <Link href="/account" onClick={onNavigate} className={`${ITEM} text-sub hover:bg-hover hover:text-ink`}>
          <Icon name="user" />
          계정 설정
        </Link>
        {user && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-sub">
            <Avatar seed={user.uid} name={user.displayName ?? user.email ?? "?"} size={22} />
            <span className="flex-1 truncate">{user.displayName ?? user.email}</span>
            <button type="button" onClick={handleLogout} className="cursor-pointer rounded px-1 text-xs text-faint hover:text-ink">
              로그아웃
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/** 넓은 화면(md 이상)의 왼쪽 고정 사이드바 */
export function Sidebar() {
  return (
    <nav aria-label="프로젝트 메뉴" className="hidden w-60 shrink-0 flex-col gap-0.5 border-r border-line bg-side px-2 pt-2.5 pb-3 md:flex">
      <SidebarContent />
    </nav>
  );
}
