import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { WcStandingGame } from "@/lib/wc/computeGroupStandings";

function parseWcStandingGameDoc(
  data: Record<string, unknown>
): WcStandingGame | null {
  const home = (data?.home ?? {}) as { teamId?: unknown };
  const away = (data?.away ?? {}) as { teamId?: unknown };
  const homeTeamId = typeof home.teamId === "string" ? home.teamId : "";
  const awayTeamId = typeof away.teamId === "string" ? away.teamId : "";
  if (!homeTeamId || !awayTeamId) return null;
  const homeScore =
    typeof data.homeScore === "number" ? data.homeScore : null;
  const awayScore =
    typeof data.awayScore === "number" ? data.awayScore : null;
  const status =
    typeof data.status === "string" ? data.status : "scheduled";
  return { homeTeamId, awayTeamId, homeScore, awayScore, status };
}

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
    const parsed = parseWcStandingGameDoc(d.data() as Record<string, unknown>);
    if (parsed) list.push(parsed);
  });
  return list;
}
