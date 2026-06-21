/** ランキング指標 — NaN / 非数値を 0 に正規化（sort 破壊防止） */
export function safeRankMetricNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
