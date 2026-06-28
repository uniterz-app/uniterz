import {
  isWcRankingStage,
  type WcRankingStage,
} from "@/lib/rankings/wcRankingStage";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { PlayoffRankTrendPoint } from "@/lib/profile/useProfilePlayoffRankTrend";

function shortLabelFromDateKey(dateKey: string): string {
  const parts = dateKey.split("-");
  if (parts.length >= 3) return `${Number(parts[1])}/${Number(parts[2])}`;
  return dateKey;
}

export async function fetchRankPlayoffTrendClient(
  uid: string,
  rankingLeague: RankingLeagueSource,
  wcStage?: WcRankingStage,
  apiBase?: string
): Promise<PlayoffRankTrendPoint[]> {
  const qs = new URLSearchParams({
    uid,
    phase: "playoffs",
  });
  if (rankingLeague === "worldcup") {
    qs.set("league", "worldcup");
    qs.set(
      "wcStage",
      isWcRankingStage(wcStage) ? wcStage : "overall"
    );
  }
  const path = `/api/profile/rank-playoff-trend?${qs.toString()}`;
  const url = apiBase ? `${apiBase.replace(/\/$/, "")}${path}` : path;
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as {
    ok?: boolean;
    points?: { dateKey: string; rank: number }[];
  };
  if (!res.ok || !json.ok || !Array.isArray(json.points)) return [];
  return [...json.points]
    .map((p) => ({
      dateKey: p.dateKey,
      rank: p.rank,
      labelShort: shortLabelFromDateKey(p.dateKey),
      date: p.dateKey,
    }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}
