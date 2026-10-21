"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/features/auth/AuthProvider";
import { taskKey } from "@/features/tasks/constants";
import { useTransientState } from "@/hooks/useTransientState";
import { formatRelative } from "@/lib/dates";
import { useNotifications } from "../hooks";
import { markAllRead, markRead } from "../services";
import type { AppNotification } from "../types";

/** 상단 🔔: 안 읽은 개수 + 누르면 최근 알림 목록. 알림을 누르면 읽음 처리하고 그 할 일을 연다 */
export function NotificationBell() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const items = useNotifications(uid);
  const [open, setOpen] = useTransientState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const unread = items.filter((n) => !n.read);

  // 바깥 클릭 · ESC 로 닫기 (Dropdown 과 같은 방식)
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent): void {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  if (!uid) return null;

  function openItem(n: AppNotification): void {
    setOpen(false);
    if (!n.read && uid) void markRead(uid, n.id);
    router.push(`/p/${n.projectId}/board?task=${n.taskId}`);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread.length > 0 ? `알림 ${unread.length}개 안 읽음` : "알림"}
        aria-expanded={open}
        className="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-sub hover:bg-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Icon name="bell" size={18} />
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-none font-bold text-white tabular-nums">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 z-40 mt-1.5 flex w-[min(360px,calc(100vw-32px))] flex-col overflow-hidden rounded-lg bg-white text-sm shadow-[0_8px_24px_rgba(15,15,15,0.14),0_0_0_1px_rgba(15,15,15,0.06)]">
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <span className="font-semibold">알림</span>
            {unread.length > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead(uid, unread.map((n) => n.id))}
                className="cursor-pointer rounded px-1.5 py-0.5 text-xs text-accent hover:bg-hover"
              >
                모두 읽음
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-muted">아직 알림이 없어요. 팀원이 내 할 일을 바꾸면 여기에 알려드려요.</p>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={`flex w-full cursor-pointer gap-2.5 border-b border-[#F1F1EF] px-3.5 py-2.5 text-left hover:bg-side ${n.read ? "" : "bg-[#F2F7FC]"}`}
                  >
                    <Avatar seed={n.actorId} name={n.actorName} size={26} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[13px] leading-snug break-keep text-ink">
                        <b className="font-semibold">{n.actorName}</b>님이 <b className="font-semibold">{taskKey(n.taskNumber)} {n.taskTitle}</b> {n.text}
                      </span>
                      <span className="text-xs text-muted">
                        {n.projectName}
                        {n.createdAt && ` · ${formatRelative(n.createdAt.toDate())}`}
                      </span>
                    </span>
                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" aria-label="안 읽음" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
