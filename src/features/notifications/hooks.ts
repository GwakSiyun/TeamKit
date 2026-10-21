"use client";

import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import type { AppNotification, NotificationDoc } from "./types";

/** 내 알림 최근 순 (실시간) */
export function useNotifications(uid: string | null, max = 30): AppNotification[] {
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!uid) return;
    const q = query(collection(firestore(), "users", uid, "notifications"), orderBy("createdAt", "desc"), limit(max));
    return onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: "estimate" }) as NotificationDoc) }))),
      () => setItems([]),
    );
  }, [uid, max]);

  return uid ? items : [];
}
