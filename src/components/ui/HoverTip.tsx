"use client";

import { useCallback, useState, type FocusEvent, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TipState {
  content: ReactNode;
  /** 대상의 화면 좌표 (가운데 x, 위 · 아래 y) */
  x: number;
  top: number;
  bottom: number;
}

type TipHandlers = {
  onMouseEnter: (e: MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
  onFocus: (e: FocusEvent<HTMLElement>) => void;
  onBlur: () => void;
};

/** 화면 위쪽 이 거리 안이면 툴팁을 아래로 띄운다 */
const FLIP_MARGIN = 72;

/**
 * 마우스를 올리면(키보드 포커스도) 바로 뜨는 작은 설명 상자.
 * 가로 스크롤 영역(간트) 안에서도 잘리지 않게 body 에 고정 위치로 그린다.
 * 사용: const tip = useHoverTip(); <button {...tip.bind(내용)}> … {tip.node}
 */
export function useHoverTip(): { bind: (content: ReactNode) => TipHandlers; node: ReactNode } {
  const [tip, setTip] = useState<TipState | null>(null);

  const bind = useCallback((content: ReactNode): TipHandlers => {
    const show = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      setTip({ content, x: r.left + r.width / 2, top: r.top, bottom: r.bottom });
    };
    const hide = () => setTip(null);
    return { onMouseEnter: (e) => show(e.currentTarget), onMouseLeave: hide, onFocus: (e) => show(e.currentTarget), onBlur: hide };
  }, []);

  const below = tip ? tip.top < FLIP_MARGIN : false;
  const node =
    tip && typeof document !== "undefined"
      ? createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-50 max-w-[260px] rounded-md bg-[#2F2E2B] px-2.5 py-1.5 text-xs leading-relaxed text-white shadow-[0_6px_16px_rgba(15,15,15,0.18)]"
            style={{ left: tip.x, top: below ? tip.bottom + 8 : tip.top - 8, transform: `translate(-50%, ${below ? "0" : "-100%"})` }}
          >
            {tip.content}
          </div>,
          document.body,
        )
      : null;

  return { bind, node };
}
