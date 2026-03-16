"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  limit,
  Timestamp,
} from "firebase/firestore";

import type { League } from "@/lib/leagues";
import { normalizeLeague } from "@/lib/leagues";

const SEASON = "2025-26";

const jstDayRange = (d: Date) => {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);

  return {
    startTs: Timestamp.fromDate(start),
    endTs: Timestamp.fromDate(end),
  };
};

export function useGamesByDate(rawLeague: League, jstDate: Date | null) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  const league = useMemo(() => normalizeLeague(rawLeague), [rawLeague]);

  const range = useMemo(() => {
    if (!jstDate) return null;
    return jstDayRange(jstDate);
  }, [jstDate]);

  useEffect(() => {
    let alive = true;

    async function load() {
if (!jstDate || !range) {
  setGames([]);
  setErr(null);
  setLoading(true);
  return;
}

      setLoading(true);
      setErr(null);

      try {
        const ref = collection(db, "games");

        const q = query(
          ref,
          where("league", "==", league),
          where("season", "==", SEASON),
          where("startAtJst", ">=", range.startTs),
          where("startAtJst", "<", range.endTs),
          orderBy("startAtJst", "asc"),
          limit(200)
        );

        const snap = await getDocs(q);

        if (!alive) return;

        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setGames(rows);
        setLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message ?? "unknown error");
        setGames([]);
        setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [league, jstDate, range]);

  return { loading, error, games };
}