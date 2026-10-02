/**
 * リーグ表行から指標ランクを計算（1 = 最良）。
 */
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";

export type RankedMetricKey =
  | "netrtg"
  | "ortg"
  | "drtg"
  | "fg3a"
  | "fg3Pct"
  | "tovPct"
  | "ptsPaint"
  | "orebPct"
  | "ftaRate"
  | "ptsFb"
  | "ptsTov"
  | "ptsSecondChance"
  | "rimFgPct"
  | "corner3Pct"
  | "oppFg3Pct"
  | "oppTov"
  | "oppOrebPct"
  | "oppEfgPct"
  | "oppFtaRate"
  | "oppPtsPaint"
  | "oppPtsFb"
  | "oppPtsOffTov"
  | "oppPtsSecondChance"
  | "winPct";

const HIGHER_IS_BETTER: Record<RankedMetricKey, boolean> = {
  netrtg: true,
  ortg: true,
  drtg: false,
  fg3a: true,
  fg3Pct: true,
  tovPct: false,
  ptsPaint: true,
  orebPct: true,
  ftaRate: true,
  ptsFb: true,
  ptsTov: true,
  ptsSecondChance: true,
  rimFgPct: true,
  corner3Pct: true,
  oppFg3Pct: false,
  oppTov: true,
  oppOrebPct: false,
  oppEfgPct: false,
  oppFtaRate: false,
  oppPtsPaint: false,
  oppPtsFb: false,
  oppPtsOffTov: false,
  oppPtsSecondChance: false,
  winPct: true,
};

function metricValue(
  row: NbaLeagueTeamStatRow,
  key: RankedMetricKey
): number | null {
  const v = (row as Record<string, unknown>)[key];
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  // misc 未配線の 0 は欠損扱い（偽 rank を作らない）
  if (
    (key === "oppPtsPaint" ||
      key === "oppPtsFb" ||
      key === "oppPtsOffTov" ||
      key === "oppPtsSecondChance" ||
      key === "ptsSecondChance") &&
    v === 0
  ) {
    return null;
  }
  return v;
}

/** teamId → 1-based rank（欠損は null） */
export function rankTeamsByMetric(
  rows: NbaLeagueTeamStatRow[],
  key: RankedMetricKey
): Map<string, number> {
  const higher = HIGHER_IS_BETTER[key];
  const scored = rows
    .map((r) => {
      const value = metricValue(r, key);
      return value == null ? null : { teamId: r.teamId, value };
    })
    .filter((x): x is { teamId: string; value: number } => x != null);

  scored.sort((a, b) => (higher ? b.value - a.value : a.value - b.value));

  const out = new Map<string, number>();
  let prev: number | null = null;
  let rank = 0;
  scored.forEach((row, i) => {
    if (prev == null || row.value !== prev) {
      rank = i + 1;
      prev = row.value;
    }
    out.set(row.teamId, rank);
  });
  return out;
}

export function teamGamesPlayed(row: NbaLeagueTeamStatRow | null | undefined): number {
  if (!row) return 0;
  const w = Number(row.wins) || 0;
  const l = Number(row.losses) || 0;
  return Math.max(0, w + l);
}

export function findTeamRow(
  rows: NbaLeagueTeamStatRow[],
  teamId: string
): NbaLeagueTeamStatRow | null {
  return rows.find((r) => r.teamId === teamId) ?? null;
}
