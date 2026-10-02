/**
 * 直近 NY 日付の BDL box から出場プレイヤー ID を集める（日次 incremental 用）。
 */
import {
  bdlBoxScorePlayers,
  fetchBdlBoxScoresForDate,
  type BdlBoxScore,
} from "@/lib/nba/bdl/fetchBdlBoxScores";
import { nbaScheduleDateKeysAroundNow } from "@/lib/nba/ingest/nbaLiveGamesIngest";

function playerIdsFromBox(row: BdlBoxScore): string[] {
  const out: string[] = [];
  for (const block of [row.home_team, row.visitor_team]) {
    for (const p of bdlBoxScorePlayers(block)) {
      const id = p.player?.id;
      if (id == null || !Number.isFinite(id)) continue;
      out.push(String(Math.trunc(id)));
    }
  }
  return out;
}

export async function listPlayerIdsFromRecentBoxScores(
  dates?: string[]
): Promise<{ dates: string[]; playerIds: string[] }> {
  const days =
    dates?.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)) ??
    nbaScheduleDateKeysAroundNow();
  const ids = new Set<string>();
  for (const date of days) {
    try {
      const rows = await fetchBdlBoxScoresForDate(date);
      for (const row of rows) {
        for (const id of playerIdsFromBox(row)) ids.add(id);
      }
    } catch (e) {
      console.warn(
        "[listPlayerIdsFromRecentBoxScores] box_scores failed",
        date,
        e
      );
    }
  }
  return { dates: days, playerIds: [...ids] };
}
