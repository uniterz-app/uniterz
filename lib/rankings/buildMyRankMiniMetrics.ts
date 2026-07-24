import type { MyRankMiniMetric } from "@/app/component/rankings/MyRankCard";
import {
  dayDeltaLabelForMetric,
  type MyRankMetricValueDeltas,
} from "@/lib/rankings/myRankMetricValueDeltas";

type StatsRow = {
  totalPoints?: number;
  totalPrecision?: number;
  totalExactHits?: number;
  totalUpset?: number;
  totalGoalScorerHits?: number;
  winRate?: number;
};

function maxFromRows(
  rows: StatsRow[] | undefined,
  pick: (r: StatsRow) => number | undefined
): number {
  if (!rows?.length) return 0;
  return rows.reduce((mx, r) => Math.max(mx, Number(pick(r) ?? 0)), 0);
}

/**
 * プレイヤーカードの 4 指標セル。
 * リーダー比の max は各指標専用のランキング行から取る（現在選択中タブの rows には依存しない）。
 */
export function buildMyRankMiniMetrics(
  myRow: StatsRow | null | undefined,
  leaders: {
    ptsRows?: StatsRow[];
    precRows?: StatsRow[];
    upsetRows?: StatsRow[];
  },
  valueDeltas?: MyRankMetricValueDeltas | null,
  rankingLeague: "nba" | "worldcup" = "nba"
): MyRankMiniMetric[] | undefined {
  if (!myRow) return undefined;

  // 3 セル目: WC = 完全的中（EXACT） / NBA = 最多得点者的中（SCORER）
  const isWc = rankingLeague === "worldcup";
  const hitMetricKey = isWc ? "exactHits" : "goalScorerHits";

  const pts = myRow.totalPoints ?? 0;
  const winRaw = myRow.winRate ?? 0;
  const winPct = winRaw <= 1 ? Math.round(winRaw * 100) : Math.round(winRaw);
  const hits = isWc
    ? (myRow.totalExactHits ?? myRow.totalPrecision ?? 0)
    : (myRow.totalGoalScorerHits ?? 0);
  const upset = myRow.totalUpset ?? 0;

  const maxPts = maxFromRows(leaders.ptsRows, (r) => r.totalPoints);
  const maxHits = maxFromRows(leaders.precRows, (r) =>
    isWc ? r.totalExactHits ?? r.totalPrecision : r.totalGoalScorerHits
  );
  const maxUpset = maxFromRows(leaders.upsetRows, (r) => r.totalUpset);

  const ratio = (v: number, max: number) =>
    max > 0 ? Math.min(100, Math.max(0, (v / max) * 100)) : 0;

  return [
    {
      key: "totalScore",
      label: "totalPTS",
      value: Math.round(pts).toLocaleString("en-US"),
      pct: ratio(pts, maxPts),
      dayDelta: dayDeltaLabelForMetric("totalScore", valueDeltas),
    },
    {
      key: "winRate",
      label: "WIN%",
      value: `${winPct}`,
      pct: Math.min(100, Math.max(0, winPct)),
      dayDelta: dayDeltaLabelForMetric("winRate", valueDeltas),
    },
    {
      key: hitMetricKey,
      label: isWc ? "EXACT" : "SCORER",
      value: String(Math.round(hits)),
      pct: ratio(hits, maxHits),
      dayDelta: dayDeltaLabelForMetric(hitMetricKey, valueDeltas),
    },
    {
      key: "upsetScore",
      label: "UPSET",
      value: upset.toFixed(1),
      pct: ratio(upset, maxUpset),
      dayDelta: dayDeltaLabelForMetric("upsetScore", valueDeltas),
    },
  ];
}

/** 4 指標バーのリーダー行がすべて揃ったか（PTS / EXACT|SCORER / UPSET の max 計算用） */
export function isMyRankMiniMetricsReady(
  byMetric?: Record<string, { rows?: unknown[] } | undefined> | null,
  rankingLeague: "nba" | "worldcup" = "nba"
): boolean {
  if (!Array.isArray(byMetric?.totalPoints?.rows)) return false;
  if (!Array.isArray(byMetric?.totalUpset?.rows)) return false;
  const hitKey =
    rankingLeague === "worldcup" ? "totalExactHits" : "totalGoalScorerHits";
  return Array.isArray(byMetric?.[hitKey]?.rows);
}
