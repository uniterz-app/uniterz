"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";

import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";

const SEASON = "2025-26";

function toYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function useGameDays(rawLeague: League) {
  const league = normalizeLeague(rawLeague);

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const ref = collection(db, "games");

        const q = query(
          ref,
          where("league", "==", league),
          where("season", "==", SEASON),
          orderBy("startAtJst", "asc")
        );

        const snap = await getDocs(q);

        if (!alive) return;

        const list = snap.docs.map((d) => d.data());
        setRows(list);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "unknown error");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [league]);

  const gameDays = useMemo(() => {
    if (!rows.length) return [];

    const map = new Map<string, Date>();

    function toJstDateOnly(d: Date) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    for (const g of rows) {
      const t = g.startAtJst;
      if (!t) continue;

      let d: Date | null = null;

      if (t instanceof Timestamp) d = toJstDateOnly(t.toDate());
      else if (typeof t?.toDate === "function") d = toJstDateOnly(t.toDate());
      else if (t instanceof Date) d = toJstDateOnly(t);

      if (!d) continue;

      const key = toYYYYMMDD(d);

      if (!map.has(key)) {
        map.set(key, d);
      }
    }

    return [...map.values()].sort((a, b) => a.getTime() - b.getTime());
  }, [rows]);

  return { gameDays, loading, error };
}