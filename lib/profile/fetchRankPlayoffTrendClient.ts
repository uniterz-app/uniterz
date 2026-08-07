import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { fetchNbaSeasonRankTrendFirestore } from "@/lib/profile/fetchNbaSeasonRankTrendFirestore";
import { auth } from "@/lib/firebase";
import type { PlayoffRankTrendPoint } from "@/lib/profile/useProfilePlayoffRankTrend";

function shortLabelFromDateKey(dateKey: string): string {
  const parts = dateKey.split("-");
  if (parts.length >= 3) return `${Number(parts[1])}/${Number(parts[2])}`;
  return dateKey;
}

export async function fetchRankPlayoffTrendClient(
  uid: string,
  rankingLeague: RankingLeagueSource,
  _wcStage?: unknown,
  apiBase?: string
): Promise<PlayoffRankTrendPoint[]> {
  if (rankingLeague === "nba" && auth.currentUser?.uid === uid) {
    return fetchNbaSeasonRankTrendFirestore(uid);
  }

  const qs = new URLSearchParams({
    uid,
    league: rankingLeague,
  });
  const path = `/api/profile/rank-playoff-trend?${qs.toString()}`;
  const url = apiBase ? `${apiBase.replace(/\/$/, "")}${path}` : path;
  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json()) as {
    ok?: boolean;
    seasonKey?: string | null;
    points?: { dateKey: string; rank: number }[];
  };
  if (!res.ok || !json.ok || !Array.isArray(json.points)) return [];
  if (
    rankingLeague === "nba" &&
    typeof json.seasonKey === "string" &&
    json.seasonKey !== CURRENT_NBA_SEASON_KEY
  ) {
    return [];
  }
  return [...json.points]
    .map((p) => ({
      dateKey: p.dateKey,
      rank: p.rank,
      labelShort: shortLabelFromDateKey(p.dateKey),
      date: p.dateKey,
    }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}
