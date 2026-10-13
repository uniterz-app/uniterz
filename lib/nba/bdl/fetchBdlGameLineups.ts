/**
 * BDL `/nba/v1/lineups` → 試合ごとの先発 player id。
 * box_scores には starter フラグが無く、並びも先発順ではないためこちらを正にする。
 */
import { bdlNbaGetAllPages } from "@/lib/nba/bdl/bdlNbaFetch";

type BdlLineupRow = {
  game_id?: number;
  starter?: boolean;
  player?: { id?: number };
  team?: { id?: number };
};

/** 1 リクエストに載せる game_ids の上限（1 試合 ~27 行 × ページング） */
const GAME_IDS_PER_REQUEST = 25;

/**
 * 両チーム 5 人ずつ揃った試合だけ返す（開始前・欠損は入れない → 呼び出し側で次回再取得）。
 * 値は先発 10 人の BDL player id（文字列）。
 */
export async function fetchBdlGameStarterIds(
  bdlGameIds: readonly number[]
): Promise<Map<number, string[]>> {
  const ids = [...new Set(bdlGameIds.filter((id) => Number.isFinite(id)))];
  const out = new Map<number, string[]>();
  for (let i = 0; i < ids.length; i += GAME_IDS_PER_REQUEST) {
    const chunk = ids.slice(i, i + GAME_IDS_PER_REQUEST);
    const rows = await bdlNbaGetAllPages<BdlLineupRow>("/nba/v1/lineups", {
      "game_ids[]": chunk,
    });
    const byGame = new Map<number, Map<number, string[]>>();
    for (const r of rows) {
      if (r.starter !== true) continue;
      const gid = r.game_id;
      const tid = r.team?.id;
      const pid = r.player?.id;
      if (gid == null || tid == null || pid == null) continue;
      const teams = byGame.get(gid) ?? new Map<number, string[]>();
      const list = teams.get(tid) ?? [];
      list.push(String(pid));
      teams.set(tid, list);
      byGame.set(gid, teams);
    }
    for (const [gid, teams] of byGame) {
      const sides = [...teams.values()];
      if (sides.length !== 2 || sides.some((s) => s.length !== 5)) continue;
      out.set(gid, sides.flat());
    }
  }
  return out;
}
