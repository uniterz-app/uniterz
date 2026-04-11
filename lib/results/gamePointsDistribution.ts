/**
 * 試合確定後の pointsV3 分布（リザルトディテール用）。
 * 集計は Cloud Functions 等で games ドキュメントへ書き込む想定。
 *
 * ## pointsV3 の取りうる値（UI・ビン分割の前提）
 * - **勝者を外した場合は 0 点**（それ未満の小数も出ない想定）
 * - **勝者を当てた場合は 4 点を下限**に加算・調整され、ベースは **4〜10** 前後
 * - **連勝ボーナス・アップセット等で 10 を超える**ことがある（集計ビンは `10` 以上をまとめてもよい）
 * - **リザルトの分布チャートは縦軸 0〜10 で表示し、10 超は上端（10）に張り付け**
 * - **1〜3 点台は出ない**（グラフでは 0 と 4 の間が空欄になりうる）
 *
 * ビン例:
 * - 外れ専用: `lo: 0, hi: 0`（厳密に 0 のみ）
 * - 的中帯: 0.5 刻み（4.0–4.5, …）や 1 点刻み（4–5, …）など
 * - **10 超**: `lo: 10, hi: 14` のようにまとめる、または最終ビンを `10` 以上用に開区間で持つ
 *
 * 保存例（games/{gameId} に埋め込み・1 read で取得）:
 * ```ts
 * pointsDistribution?: {
 *   v: 1;
 *   bins: PointsDistBin[];
 *   n: number;
 *   median: number | null;
 *   mean: number | null;
 *   updatedAtMillis: number;
 * };
 * ```
 */

export type PointsDistBin = {
  /** ビン下限（含む）。外れ0専用は lo===hi===0 でも可 */
  lo: number;
  /** ビン上限（排他的。lo===hi の点ビンでは hi も同値でよい） */
  hi: number;
  count: number;
};

export type GamePointsDistributionV1 = {
  v: 1;
  bins: PointsDistBin[];
  /** 有効な得点の件数 */
  n: number;
  median: number | null;
  mean: number | null;
  updatedAtMillis?: number;
};

/** gamesドキュメント上のどちらのフィールド名でも受け取る（CF は `pointsDistribution`） */
export function rawPointsDistributionFromGameDoc(
  gameData: Record<string, unknown> | null | undefined
): unknown {
  if (!gameData || typeof gameData !== "object") return null;
  return (
    gameData.pointsDistribution ??
    gameData.pointsDistributionV1 ??
    null
  );
}

function isFiniteNum(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

/** Firestore `games.pointsDistribution` から安全に復元 */
export function parseGamePointsDistributionV1(
  raw: unknown
): GamePointsDistributionV1 | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1 || !Array.isArray(o.bins)) return null;
  const bins: PointsDistBin[] = [];
  for (const b of o.bins) {
    if (b == null || typeof b !== "object") return null;
    const r = b as Record<string, unknown>;
    if (
      !isFiniteNum(r.lo) ||
      !isFiniteNum(r.hi) ||
      typeof r.count !== "number" ||
      !Number.isFinite(r.count) ||
      r.count < 0
    ) {
      return null;
    }
    bins.push({ lo: r.lo, hi: r.hi, count: Math.floor(r.count) });
  }
  const n = isFiniteNum(o.n) ? Math.max(0, Math.floor(o.n)) : 0;
  const median =
    o.median === null || o.median === undefined
      ? null
      : isFiniteNum(o.median)
        ? o.median
        : null;
  const mean =
    o.mean === null || o.mean === undefined
      ? null
      : isFiniteNum(o.mean)
        ? o.mean
        : null;
  return { v: 1, bins, n, median, mean };
}
