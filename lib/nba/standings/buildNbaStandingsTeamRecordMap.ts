import type { MatchCardTeamRecord } from "@/lib/games/useMatchCardTeamRecords";
import type { NbaConferenceStandingsBoard } from "@/lib/nba/nbaConferenceStandings";

/** BDL standings ボード → 試合カード用 teamId マップ */
export function buildNbaStandingsTeamRecordMap(
  board: NbaConferenceStandingsBoard
): Record<string, MatchCardTeamRecord> {
  const map: Record<string, MatchCardTeamRecord> = {};
  for (const row of [...board.east, ...board.west]) {
    map[row.teamId] = {
      wins: row.wins,
      losses: row.losses,
      rank: row.rank,
      recentForm: row.recentForm,
    };
  }
  return map;
}

/** 試合カードの W/L ドット — recentForm（古→新）を左右の「最新側」に合わせて並べ替え */
export function matchCardRecentFormDisplay(
  recentForm: readonly ("W" | "L")[] | undefined,
  latestSide: "left" | "right"
): ("W" | "L")[] {
  if (!recentForm?.length) return [];
  const last5 = recentForm.slice(-5);
  return latestSide === "right" ? last5 : [...last5].reverse();
}
