"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** 최대 너비(px). 기본 480 */
  width?: number;
  children: ReactNode;
}

/**
 * 공통 모달. 브라우저 기본 <dialog> 를 써서 포커스 가두기 · ESC 닫기 · 배경 위 레이어를 그대로 쓴다.
 * 바깥(배경) 클릭으로 닫히고, 열려 있는 동안 뒤 페이지 스크롤을 막는다.
 * 본문은 <ModalBody>, 하단 버튼은 <ModalFooter> 로 감싼다.
 */
export function Modal({ open, onClose, title, description, width = 480, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

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
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ maxWidth: width }}
      className="mx-auto mt-[88px] w-[calc(100%-32px)] rounded-[10px] bg-white p-0 text-sm text-ink shadow-[0_16px_48px_rgba(15,15,15,0.2),0_0_0_1px_rgba(15,15,15,0.05)] backdrop:bg-[rgba(15,15,15,0.42)]"
    >
      {open && (
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-3 px-6 pt-5">
            <div>
              <h2 id={titleId} className="text-lg font-bold">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-[13px] text-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="inline-flex size-7 items-center justify-center rounded-md text-sub hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function ModalBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 px-6 pt-5 pb-2">{children}</div>;
}

export function ModalFooter({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-2 border-t border-line px-6 py-4">
      <div className="text-xs text-muted">{hint}</div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}
