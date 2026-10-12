"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TODAY_UNITERZ_SEEN_STORAGE_KEY,
  TODAY_UNITERZ_VERSION_PATH,
  isTodayUniterzUnread,
  todayUniterzVersion,
} from "@/lib/rankings/dailyScoreLeaders/todayUniterzUnread";

const SEEN_EVENT = "uniterz:today-uniterz-seen";

function readSeen(): string | null {
  try {
    return window.localStorage.getItem(TODAY_UNITERZ_SEEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** TODAY UNITERZ が最後に見たとき以降に更新されたか */
export function useTodayUniterzUnread(pollMs?: number) {
  const [latest, setLatest] = useState<string | null>(null);
  const [seen, setSeen] = useState<string | null>(null);

  useEffect(() => {
    setSeen(readSeen());
    const sync = () => setSeen(readSeen());
    window.addEventListener(SEEN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SEEN_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(TODAY_UNITERZ_VERSION_PATH);
        if (!res.ok) return;
        const json = await res.json();
        if (alive) setLatest(todayUniterzVersion(json));
      } catch {
        // 点が出ないだけ
      }
    };
    void load();
    const id = pollMs ? window.setInterval(load, pollMs) : null;
    return () => {
      alive = false;
      if (id != null) window.clearInterval(id);
    };
  }, [pollMs]);

  const markSeen = useCallback(() => {
    if (!latest) return;
    try {
      window.localStorage.setItem(TODAY_UNITERZ_SEEN_STORAGE_KEY, latest);
    } catch {
      // ignore
    }
    setSeen(latest);
    window.dispatchEvent(new Event(SEEN_EVENT));
  }, [latest]);

  return { unread: isTodayUniterzUnread(latest, seen), latest, markSeen };
}
