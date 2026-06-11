import type { MyRankMiniMetric } from "@/app/component/rankings/MyRankCard";
import {
  dayDeltaLabelForMetric,
  type MyRankMetricValueDeltas,
} from "@/lib/rankings/myRankMetricValueDeltas";

type StatsRow = {
  totalPoints?: number;
  totalPrecision?: number;
  totalUpset?: number;
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
  valueDeltas?: MyRankMetricValueDeltas | null
): MyRankMiniMetric[] | undefined {
  if (!myRow) return undefined;

  const pts = myRow.totalPoints ?? 0;
  const winRaw = myRow.winRate ?? 0;
  const winPct = winRaw <= 1 ? Math.round(winRaw * 100) : Math.round(winRaw);
  const prec = myRow.totalPrecision ?? 0;
  const upset = myRow.totalUpset ?? 0;

  const maxPts = maxFromRows(leaders.ptsRows, (r) => r.totalPoints);
  const maxPrec = maxFromRows(leaders.precRows, (r) => r.totalPrecision);
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
      key: "marginPrecision",
      label: "PREC",
      value: prec.toFixed(1),
      pct: ratio(prec, maxPrec),
      dayDelta: dayDeltaLabelForMetric("marginPrecision", valueDeltas),
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

/** 4 指標バーのリーダー行がすべて揃ったか（PTS / PREC / UPSET の max 計算用） */
export function isMyRankMiniMetricsReady(
  byMetric?: Record<string, { rows?: unknown[] } | undefined> | null
): boolean {
  return (
    Array.isArray(byMetric?.totalPoints?.rows) &&
    Array.isArray(byMetric?.totalPrecision?.rows) &&
    Array.isArray(byMetric?.totalUpset?.rows)
  );
}
