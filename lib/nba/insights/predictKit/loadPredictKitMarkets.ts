/**
 * キットを書く試合だけ BDL の今のラインを取る。公開 GET からは呼ばない。
 * 取れなければ空（UNITERZ だけのキットになる）。
 */
import { fetchBdlGameOdds, fetchBdlPlayerProps } from "@/lib/nba/bdl/fetchBdlOdds";
import { nbaGameDocIdFromBdlId } from "@/lib/nba/bdl/mapBdlGameToNbaGameDoc";
import { bdlGameIdFromLogId } from "@/lib/nba/leagueWindows/bdlGameIdFromLog";
import {
  consensusMarketFromOdds,
  consensusPointsLines,
  emptyPredictKitMarketSnap,
  type PredictKitMarketSnap,
} from "@/lib/nba/insights/predictKit/predictKitMarket";

const PROP_CONCURRENCY = 4;

export async function loadPredictKitMarkets(
  gameDocIds: readonly string[],
  nowMs: number
): Promise<Map<string, PredictKitMarketSnap>> {
  const out = new Map<string, PredictKitMarketSnap>();
  const bdlIds: number[] = [];
  const docByBdl = new Map<number, string>();
  for (const id of gameDocIds) {
    const raw = bdlGameIdFromLogId(id);
    const n = raw ? Number(raw) : NaN;
    if (!Number.isFinite(n)) continue;
    bdlIds.push(n);
    docByBdl.set(n, id);
    out.set(id, emptyPredictKitMarketSnap(nowMs));
  }
  if (bdlIds.length === 0) return out;

  try {
    const odds = await fetchBdlGameOdds(bdlIds);
    const byGame = new Map<number, typeof odds>();
    for (const row of odds) {
      const gid = row.game_id;
      if (typeof gid !== "number") continue;
      const list = byGame.get(gid) ?? [];
      list.push(row);
      byGame.set(gid, list);
    }
    for (const [gid, rows] of byGame) {
      const docId = docByBdl.get(gid) ?? nbaGameDocIdFromBdlId(gid);
      const prev = out.get(docId) ?? emptyPredictKitMarketSnap(nowMs);
      const c = consensusMarketFromOdds(rows);
      out.set(docId, { ...prev, pHome: c.pHome, total: c.total, books: c.books, atMs: nowMs });
    }
  } catch (err) {
    console.warn("[predictKit] odds fetch failed", err instanceof Error ? err.message : err);
  }

  for (let i = 0; i < bdlIds.length; i += PROP_CONCURRENCY) {
    const chunk = bdlIds.slice(i, i + PROP_CONCURRENCY);
    await Promise.all(
      chunk.map(async (gid) => {
        const docId = docByBdl.get(gid);
        if (!docId) return;
        try {
          const props = await fetchBdlPlayerProps({ gameId: gid, propType: "points" });
          const prev = out.get(docId) ?? emptyPredictKitMarketSnap(nowMs);
          out.set(docId, { ...prev, pointsLines: consensusPointsLines(props), atMs: nowMs });
        } catch (err) {
          console.warn(
            `[predictKit] player props fetch failed game=${gid}`,
            err instanceof Error ? err.message : err
          );
        }
      })
    );
  }
  return out;
}
