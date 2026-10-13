"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/AuthProvider";
import { logout } from "@/features/auth/services";
import { activeNavItem, MAIN_NAV, PROJECT_NAV, projectBase, type NavItem } from "../../navigation";
import { useCurrentProject } from "../../ProjectContext";

const ITEM = "flex h-[30px] items-center gap-2 rounded-md px-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent";

function NavLink({ item, href, active }: { item: NavItem; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${ITEM} ${active ? "bg-hover font-semibold text-ink" : "text-sub hover:bg-hover hover:text-ink"}`}
    >
      <Icon name={item.icon} />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
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
    <nav aria-label="프로젝트 메뉴" className="hidden w-60 shrink-0 flex-col gap-0.5 border-r border-line bg-side px-2 pt-2.5 pb-3 md:flex">
      <Link href="/projects" title="내 프로젝트 목록으로" className={`${ITEM} mb-2 h-10 text-ink hover:bg-hover`}>
        <span className="inline-flex size-[22px] shrink-0 items-center justify-center rounded-[5px] bg-ink text-xs font-bold text-white">
          {project.name.slice(0, 1)}
        </span>
        <span className="flex-1 truncate font-semibold">{project.name}</span>
        <span className="text-faint">
          <Icon name="chevronDown" size={14} />
        </span>
      </Link>

      {MAIN_NAV.map((item) => (
        <NavLink key={item.path} item={item} href={base + item.path} active={active === item} />
      ))}

      <span className="mx-2.5 mt-[18px] mb-1 text-xs font-medium text-faint">프로젝트</span>
      {PROJECT_NAV.map((item) => (
        <NavLink key={item.path} item={item} href={base + item.path} active={active === item} />
      ))}

      <div className="mt-auto flex flex-col gap-0.5 border-t border-line pt-3">
        <Link href="/account" className={`${ITEM} text-sub hover:bg-hover hover:text-ink`}>
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
    </nav>
  );
}
