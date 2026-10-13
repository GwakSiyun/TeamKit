"use client";

import Link from "next/link";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTransientState } from "@/hooks/useTransientState";

interface DropdownProps {
  /** 버튼 안에 보일 내용 */
  button: ReactNode;
  /** 버튼 접근성 이름 (예: "프로젝트 전환") */
  label: string;
  buttonClassName?: string;
  /** 펼친 내용. close() 를 불러 닫는다 */
  children: (close: () => void) => ReactNode;
  width?: number;
}

/**
 * 공통 드롭다운. 버튼을 누르면 아래로 펼쳐지고, 바깥 클릭 · ESC · 항목 선택 시 닫힌다.
 * 항목은 <DropdownLink>, <DropdownButton>, <DropdownLabel>, <DropdownDivider> 로 구성한다.
 */
export function Dropdown({ button, label, buttonClassName, children, width = 240 }: DropdownProps) {
  const [open, setOpen] = useTransientState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent): void {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`cursor-pointer ${buttonClassName ?? ""}`}
      >
        {button}
      </button>
      {open && (
        <div
          id={panelId}
          style={{ width }}
          className="absolute top-full left-0 z-30 mt-1 flex flex-col rounded-lg bg-white p-1 text-sm text-ink shadow-[0_8px_24px_rgba(15,15,15,0.14),0_0_0_1px_rgba(15,15,15,0.06)]"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

const ITEM = "flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-hover focus-visible:bg-hover focus-visible:outline-none";

export function DropdownLink({ href, onSelect, children, current }: { href: string; onSelect: () => void; children: ReactNode; current?: boolean }) {
  return (
    <Link href={href} onClick={onSelect} aria-current={current ? "page" : undefined} className={ITEM}>
      {children}
    </Link>
  );
}

export function DropdownButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`${ITEM} text-sub`}>
      {children}
    </button>
  );
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <span className="px-2 pt-1.5 pb-1 text-xs font-medium text-faint">{children}</span>;
}

export function DropdownDivider() {
  return <span className="my-1 h-px bg-line" />;
}
