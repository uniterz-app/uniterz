"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { NBA_DIVISION_TEAM_IDS } from "@/lib/nba/nbaTeamMapCoords";
import {
  getNbaTeamGeo,
  winnerTeamIdFromPost,
  type NbaDivisionId,
} from "@/lib/nba/nbaTeamUsGeo";

export type ProfileRange = "7d" | "30d" | "all";

export type TeamAgg = {
  predictions: number;
  wins: number;
  pointsSum: number;
};

export type NbaPredictionMapAgg = {
  byTeam: Record<string, TeamAgg>;
};

/** 1 ユーザーあたり取得する投稿の上限（試合数のオーダーで十分な想定） */
export const NBA_PREDICTION_MAP_POST_LIMIT = 400;

function rangeStartMs(r: ProfileRange): number | null {
  if (r === "all") return null;
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (r === "7d") return now - 7 * day;
  return now - 30 * day;
}

function inRange(startAtMillis: number | undefined, range: ProfileRange): boolean {
  const start = rangeStartMs(range);
  if (start == null) return true;
  if (startAtMillis == null || Number.isNaN(startAtMillis)) return false;
  return startAtMillis >= start;
}

function eventMillisForRangeFilter(d: Record<string, unknown>): number | null {
  const raw = d.startAtMillis;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const sa = d.startAt;
  if (sa && typeof sa === "object" && sa !== null && "toMillis" in sa) {
    const m = (sa as { toMillis: () => number }).toMillis();
    if (Number.isFinite(m)) return m;
  }
  const c = d.createdAt;
  if (c && typeof c === "object" && c !== null && "toMillis" in c) {
    const m = (c as { toMillis: () => number }).toMillis();
    if (Number.isFinite(m)) return m;
  }
  return null;
}

export function useNbaPredictionMapData(
  uid: string | null | undefined,
  range: ProfileRange
) {
  const [loading, setLoading] = useState(true);
  const [agg, setAgg] = useState<NbaPredictionMapAgg>({ byTeam: {} });
  /** range だけ変えたときは地図を消さない（ガクつき防止） */
  const prevUidRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!uid) {
        prevUidRef.current = uid;
        setAgg({ byTeam: {} });
        setLoading(false);
        return;
      }

      const uidChanged =
        prevUidRef.current !== uid || prevUidRef.current === undefined;
      prevUidRef.current = uid;

      if (uidChanged) {
        setLoading(true);
      }

      try {
        const qref = query(
          collection(db, "posts"),
          where("authorUid", "==", uid),
          where("schemaVersion", "==", 2),
          orderBy("createdAt", "desc"),
          limit(NBA_PREDICTION_MAP_POST_LIMIT)
        );

        const snap = await getDocs(qref);
        if (cancelled) return;

        const byTeam: Record<string, TeamAgg> = {};

        for (const docSnap of snap.docs) {
          const d = docSnap.data() as any;
          if (d.league !== "nba") continue;

          const eventMs = eventMillisForRangeFilter(d);
          if (!inRange(eventMs ?? undefined, range)) continue;

          const homeTeamId = String(d?.home?.teamId ?? "");
          const awayTeamId = String(d?.away?.teamId ?? "");
          const pred = d.prediction as { winner?: string } | undefined;
          const winId = winnerTeamIdFromPost(pred, homeTeamId, awayTeamId);
          if (!winId) continue;

          if (!getNbaTeamGeo(winId)) continue;

          if (!byTeam[winId]) {
            byTeam[winId] = { predictions: 0, wins: 0, pointsSum: 0 };
          }
          byTeam[winId].predictions += 1;

          const isWin = Boolean(d.stats?.isWin);
          if (isWin) byTeam[winId].wins += 1;

          const pts = Number(d.stats?.pointsV3 ?? 0);
          if (Number.isFinite(pts)) byTeam[winId].pointsSum += pts;
        }

        setAgg({ byTeam });
      } catch (e) {
        console.error("useNbaPredictionMapData", e);
        setAgg({ byTeam: {} });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [uid, range]);

  const maxPredictions = useMemo(() => {
    let m = 0;
    for (const v of Object.values(agg.byTeam)) {
      m = Math.max(m, v.predictions);
    }
    return m;
  }, [agg.byTeam]);

  return { loading, agg, maxPredictions };
}

export function filterTeamsByDivision(
  division: NbaDivisionId | "all",
  byTeam: Record<string, TeamAgg>
): Record<string, TeamAgg> {
  if (division === "all") return byTeam;

  const allow = new Set(NBA_DIVISION_TEAM_IDS[division]);
  const out: Record<string, TeamAgg> = {};
  for (const [tid, v] of Object.entries(byTeam)) {
    if (allow.has(tid)) out[tid] = v;
  }
  return out;
}
