import {
  nbaRegularSeasonWinsLosses,
  type NbaTeamRecordFields,
} from "@/lib/nbaRegularSeasonRecord";

import { compareNbaStandingsSeasonTiebreak } from "./nbaStandingsSeasonTiebreak";

/** Firestore `teams` 行のうち順位ソートに使うフィールド */
export type NbaStandingsSortRow = NbaTeamRecordFields & {
  id: string;
  standingsTiebreakOrder?: number | string;
};

function readStandingsTiebreakOrder(row: NbaStandingsSortRow): number {
  const v = row.standingsTiebreakOrder;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return Number.MAX_SAFE_INTEGER;
}

/**
 * updateTeamRankings と同じ優先度で並べる（Firestore の rank は見ない）。
 * 順位パネルは勝敗とタイブレークのみで並べ、古い rank で表示がずれないようにする。
 *
 * 1. 勝率・勝ち数
 * 2. 今季固定の対戦タイブレーク
 * 3. standingsTiebreakOrder
 * 4. teamId
 */
export function compareNbaStandingsSortRows(
  a: NbaStandingsSortRow,
  b: NbaStandingsSortRow
): number {
  const { wins: aw, losses: al } = nbaRegularSeasonWinsLosses(a);
  const { wins: bw, losses: bl } = nbaRegularSeasonWinsLosses(b);
  const ar = aw + al > 0 ? aw / (aw + al) : 0;
  const br = bw + bl > 0 ? bw / (bw + bl) : 0;
  if (ar !== br) return br - ar;
  if (aw !== bw) return bw - aw;

  const seasonTb = compareNbaStandingsSeasonTiebreak(a.id, b.id);
  if (seasonTb !== 0) return seasonTb;

  const ta = readStandingsTiebreakOrder(a);
  const tb = readStandingsTiebreakOrder(b);
  if (ta !== tb) return ta - tb;

  return a.id.localeCompare(b.id);
}
