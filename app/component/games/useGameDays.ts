"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";

const SEASON = "2025-26";

/** yyyy-mm-dd の文字列化（試合日の uniq 抽出に使う） */
function toYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * 指定リーグの「試合がある日」のみを TS で配列として返す。
 * ［昇順］で返す。
 */
export function useGameDays(rawLeague: League) {
  const league = normalizeLeague(rawLeague);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);

    const ref = collection(db, "games");
    const q = query(
      ref,
      where("league", "==", league),
      where("season", "==", SEASON),
      orderBy("startAtJst", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => d.data());
        setRows(list);
        setLoading(false);
      },
      (e) => {
        setErr(e?.message ?? "unknown error");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [league]);

  /** ▼ rows から「試合日のみ」を抽出して昇順に */
  const gameDays = useMemo(() => {
    const map = new Map<string, Date>();

    function toJstDateOnly(d: Date) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    for (const g of rows) {
      const t = g.startAtJst;
      if (!t) continue;

      let d: Date;

      if (t instanceof Timestamp) d = toJstDateOnly(t.toDate());
      else if (typeof t?.toDate === "function") d = toJstDateOnly(t.toDate());
      else if (t instanceof Date) d = toJstDateOnly(t);
      else continue;

      const key = toYYYYMMDD(d);
      if (!map.has(key)) map.set(key, d);
    }

    return [...map.values()].sort((a, b) => a.getTime() - b.getTime());
  }, [rows]);

  return { gameDays, loading, error };
}
