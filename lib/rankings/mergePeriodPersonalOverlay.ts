/**
 * 期間ランキング — 共有一覧に個人 myRank/myRow を重ねる。
 */
import type { BulkMetricPayload } from "@/lib/rankings/useCumulativeRankingsBulk";

export function mergePeriodPersonalOverlay(
  shared: Record<string, BulkMetricPayload>,
  personal: Record<string, BulkMetricPayload>
): Record<string, BulkMetricPayload> {
  if (!personal || Object.keys(personal).length === 0) return shared;
  const out: Record<string, BulkMetricPayload> = { ...shared };
  for (const [metric, p] of Object.entries(personal)) {
    const s = out[metric];
    if (!s) {
      out[metric] = {
        ok: p.ok !== false,
        rows: Array.isArray(p.rows) ? p.rows : [],
        count: typeof p.count === "number" ? p.count : 0,
        myRank: p.myRank ?? null,
        myRow: p.myRow ?? null,
        myRankDeltaPlaces: p.myRankDeltaPlaces ?? null,
      };
      continue;
    }
    out[metric] = {
      ...s,
      // 順位は ranks マップ由来の personal を優先（top50 外も埋まる）
      myRank: p.myRank ?? s.myRank,
      myRankDeltaPlaces: p.myRankDeltaPlaces ?? s.myRankDeltaPlaces,
      // 行は一覧にあればそちら（表示名などが揃っている）
      myRow: s.myRow ?? p.myRow,
    };
  }
  return out;
}
