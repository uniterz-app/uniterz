import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { WcStandingGame } from "@/lib/wc/computeGroupStandings";

/** 指定シーズンの WC 試合を全件取得（順位集計用） */
export async function fetchWcSeasonGames(
  db: Firestore,
  season: string
): Promise<WcStandingGame[]> {
  const q = query(
    collection(db, "games"),
    where("league", "==", "wc"),
    where("season", "==", season)
  );
  const snap = await getDocs(q);
  const list: WcStandingGame[] = [];
  snap.forEach((d) => {
    const data = d.data() as Record<string, unknown>;
    const home = (data?.home ?? {}) as { teamId?: unknown };
    const away = (data?.away ?? {}) as { teamId?: unknown };
    const homeTeamId = typeof home.teamId === "string" ? home.teamId : "";
    const awayTeamId = typeof away.teamId === "string" ? away.teamId : "";
    if (!homeTeamId || !awayTeamId) return;
    const homeScore =
      typeof data.homeScore === "number" ? data.homeScore : null;
    const awayScore =
      typeof data.awayScore === "number" ? data.awayScore : null;
    const status =
      typeof data.status === "string" ? data.status : "scheduled";
    list.push({ homeTeamId, awayTeamId, homeScore, awayScore, status });
  });
  return list;
}
