/**
 * スタイルマップの軸（出場時の強さ・勝負どころを除く）で選手同士の近さを測る。
 * チーム次第の ORtg / DRtg、試行数の少ないクラッチ、得点の振れ幅（得点量に比例しやすい）は「スタイル」から外す。
 * リバウンドは互いに強く相関する軸が多く、全部入れると体格だけで似てしまうので競り合い・ボックスアウトの 2 マップ分だけ使う。
 */
import type { LeagueHubPlayer, LeagueHubPlayerMetric } from "@/lib/nba/leagueHub/leagueHubTypes";
import { LEAGUE_HUB_PLAYER_SCATTER_PRESETS } from "@/lib/nba/leagueHub/leagueHubScatterPresets";

const EXCLUDED_PRESETS = new Set(["onCourt", "clutch", "consistency", "glass", "rebChance"]);
const MIN_SHARED = 12;

export const LEAGUE_HUB_STYLE_METRICS: readonly LeagueHubPlayerMetric[] = [
  ...new Set(
    LEAGUE_HUB_PLAYER_SCATTER_PRESETS.filter((p) => !EXCLUDED_PRESETS.has(p.id)).flatMap((p) => [
      p.x.metric,
      p.y.metric,
    ])
  ),
];

export type LeagueHubStyleIndex = Map<string, Array<number | null>>;

/** 指標ごとに z 化した表。選手を足したら作り直す */
export function buildLeagueHubStyleIndex(players: readonly LeagueHubPlayer[]): LeagueHubStyleIndex {
  const stats = LEAGUE_HUB_STYLE_METRICS.map((metric) => {
    const vals = players.map((p) => p.m[metric]).filter((v): v is number => v != null);
    const mean = vals.reduce((s, v) => s + v, 0) / Math.max(1, vals.length);
    const sd = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, vals.length));
    return { mean, sd };
  });
  const index: LeagueHubStyleIndex = new Map();
  for (const p of players) {
    index.set(
      p.playerId,
      LEAGUE_HUB_STYLE_METRICS.map((metric, i) => {
        const v = p.m[metric];
        const { mean, sd } = stats[i]!;
        return v == null || sd <= 0 ? null : (v - mean) / sd;
      })
    );
  }
  return index;
}

export function similarLeagueHubPlayers(
  index: LeagueHubStyleIndex,
  playerId: string,
  limit = 3
): string[] {
  const base = index.get(playerId);
  if (!base) return [];
  const scored: Array<{ id: string; d: number }> = [];
  for (const [id, z] of index) {
    if (id === playerId) continue;
    let sum = 0;
    let n = 0;
    for (let i = 0; i < base.length; i++) {
      const a = base[i];
      const b = z[i];
      if (a == null || b == null) continue;
      sum += (a - b) ** 2;
      n++;
    }
    if (n < MIN_SHARED) continue;
    scored.push({ id, d: sum / n });
  }
  return scored
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((s) => s.id);
}
