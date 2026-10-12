/** Web `useTodayUniterzUnread` 相当 */
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import {
  TODAY_UNITERZ_SEEN_STORAGE_KEY,
  TODAY_UNITERZ_VERSION_PATH,
  isTodayUniterzUnread,
  todayUniterzVersion,
} from "../../../../../../lib/rankings/dailyScoreLeaders/todayUniterzUnread";

/** Games ホームと TODAY 画面で既読を共有（Games ホームはスタックに残ったまま） */
const seenListeners = new Set<(v: string | null) => void>();
let seenCache: string | null | undefined;

async function loadSeen(): Promise<string | null> {
  if (seenCache !== undefined) return seenCache;
  try {
    seenCache = await AsyncStorage.getItem(TODAY_UNITERZ_SEEN_STORAGE_KEY);
  } catch {
    seenCache = null;
  }
  return seenCache;
}

export function useTodayUniterzUnreadNative(pollMs?: number) {
  const [latest, setLatest] = useState<string | null>(null);
  const [seen, setSeen] = useState<string | null>(seenCache ?? null);

  useEffect(() => {
    let alive = true;
    void loadSeen().then((v) => {
      if (alive) setSeen(v);
    });
    seenListeners.add(setSeen);
    return () => {
      alive = false;
      seenListeners.delete(setSeen);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`${getUniterzApiBaseUrl()}${TODAY_UNITERZ_VERSION_PATH}`);
        if (!res.ok) return;
        const json = await res.json();
        if (alive) setLatest(todayUniterzVersion(json));
      } catch {
        // 点が出ないだけ
      }
    };
    void load();
    const id = pollMs ? setInterval(load, pollMs) : null;
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") void load();
    });
    return () => {
      alive = false;
      if (id != null) clearInterval(id);
      sub.remove();
    };
  }, [pollMs]);

  const markSeen = useCallback(() => {
    if (!latest) return;
    seenCache = latest;
    for (const fn of seenListeners) fn(latest);
    void AsyncStorage.setItem(TODAY_UNITERZ_SEEN_STORAGE_KEY, latest).catch(() => {});
  }, [latest]);

  return { unread: isTodayUniterzUnread(latest, seen), latest, markSeen };
}
