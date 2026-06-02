"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isWcRankingStage,
  type WcRankingStage,
} from "@/lib/rankings/wcRankingStage";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";

export type PlayoffRankTrendPoint = {
  dateKey: string;
  rank: number;
  /** X 軸表示用 M/D */
  labelShort: string;
  /** Recharts 用（dateKey と同じ） */
  date: string;
};

function shortLabelFromDateKey(dateKey: string): string {
  const parts = dateKey.split("-");
  if (parts.length >= 3) return `${Number(parts[1])}/${Number(parts[2])}`;
  return dateKey;
}

/** プレーイン終了後は日次スナップショットが止まるため、推移はプレーオフを表示 */
const RANK_TREND_PHASE = "playoffs" as const;

/** rankSnapshotHistory のみ（API が返す points を整形）。 */
function rowsFromSnapshotHistory(
  history: { dateKey: string; rank: number }[]
): PlayoffRankTrendPoint[] {
  return [...history]
    .map((p) => ({
      dateKey: p.dateKey,
      rank: p.rank,
      labelShort: shortLabelFromDateKey(p.dateKey),
      date: p.dateKey,
    }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function useProfilePlayoffRankTrend(
  targetUid: string | null,
  options?: {
    enabled?: boolean;
    rankingLeague?: RankingLeagueSource;
    wcStage?: WcRankingStage;
  }
) {
  const enabled = options?.enabled ?? true;
  const rankingLeague = options?.rankingLeague ?? "nba";
  const wcStage: WcRankingStage =
    rankingLeague === "worldcup" && isWcRankingStage(options?.wcStage)
      ? options.wcStage
      : "overall";

  const [points, setPoints] = useState<PlayoffRankTrendPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !targetUid) {
      setPoints([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function run() {
      const uid = targetUid;
      if (!uid) return;

      setLoading(true);
      try {
        const qs = new URLSearchParams({
          uid,
          phase: RANK_TREND_PHASE,
        });
        if (rankingLeague === "worldcup") {
          qs.set("league", "worldcup");
          qs.set("wcStage", wcStage);
        }
        const trendUrl = `/api/profile/rank-playoff-trend?${qs.toString()}`;
        const trendRes = await fetch(trendUrl, { cache: "no-store" });
        const trendJson = (await trendRes.json()) as {
          ok?: boolean;
          points?: { dateKey: string; rank: number }[];
        };

        if (cancelled) return;

        const history =
          trendRes.ok && trendJson.ok && Array.isArray(trendJson.points)
            ? trendJson.points
            : [];

        setPoints(rowsFromSnapshotHistory(history));
      } catch {
        if (!cancelled) setPoints([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, rankingLeague, targetUid, wcStage]);

  const chartRows = useMemo(() => points, [points]);

  return { chartRows, loading, rawPoints: points };
}
