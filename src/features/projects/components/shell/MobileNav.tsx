"use client";

import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { useTransientState } from "@/hooks/useTransientState";
import { SidebarContent } from "./Sidebar";

/**
 * 좁은 화면(md 미만)의 메뉴: 상단바 ☰ 버튼 → 왼쪽에서 나오는 서랍.
 * <dialog> 를 써서 포커스 가두기 · ESC 닫기를 그대로 쓰고, 메뉴를 누르거나 배경을 누르면 닫힌다.
 */
export function MobileNav() {
  const [open, setOpen] = useTransientState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        className="-ml-1.5 inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-sub hover:bg-hover hover:text-ink md:hidden"
      >
        <Icon name="menu" size={18} />
      </button>
      <dialog
        ref={ref}
        aria-label="프로젝트 메뉴"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
        className="m-0 h-dvh max-h-none w-[min(280px,85vw)] max-w-none bg-side p-0 text-ink shadow-[0_16px_48px_rgba(15,15,15,0.2)] backdrop:bg-[rgba(15,15,15,0.42)] md:hidden"
      >
        {open && (
          <nav className="flex h-full flex-col gap-0.5 px-2 pt-2.5 pb-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="메뉴 닫기"
              className="mb-1 ml-auto inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-sub hover:bg-hover hover:text-ink"
            >
              <Icon name="close" size={18} />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </nav>
        )}
      </dialog>
    </>
  );
}
