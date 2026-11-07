/**
 * 選手の今季試合ログ → 今季ハイ・達成率・推移グラフ・次の対戦相手との対戦成績。
 * ログは新しい順（`seasonGameLogs`）。
 */
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";

export type NbaPlayerLogStatKey = "pts" | "reb" | "ast" | "fg3m" | "stl" | "blk" | "min";

export const NBA_PLAYER_LOG_STAT_LABEL: Record<NbaPlayerLogStatKey, string> = {
  pts: "PTS",
  reb: "REB",
  ast: "AST",
  fg3m: "3PM",
  stl: "STL",
  blk: "BLK",
  min: "MIN",
};

export function playerLogStatValue(log: NbaPlayerGameLog, key: NbaPlayerLogStatKey): number {
  return key === "min" ? Math.round(log.min) : log[key];
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function averagePlayerLogStat(
  logs: NbaPlayerGameLog[],
  key: NbaPlayerLogStatKey
): number | null {
  if (logs.length === 0) return null;
  let sum = 0;
  for (const log of logs) sum += playerLogStatValue(log, key);
  return round1(sum / logs.length);
}

export type NbaPlayerSeasonHigh = {
  key: NbaPlayerLogStatKey;
  value: number;
  /** 同値は一番新しい試合 */
  log: NbaPlayerGameLog;
};

const HIGH_KEYS: NbaPlayerLogStatKey[] = ["pts", "reb", "ast", "fg3m", "stl", "blk"];

export function buildPlayerSeasonHighs(logs: NbaPlayerGameLog[]): NbaPlayerSeasonHigh[] {
  const out: NbaPlayerSeasonHigh[] = [];
  for (const key of HIGH_KEYS) {
    let best: NbaPlayerGameLog | null = null;
    for (const log of logs) {
      if (!best || playerLogStatValue(log, key) > playerLogStatValue(best, key)) best = log;
    }
    if (best) out.push({ key, value: playerLogStatValue(best, key), log: best });
  }
  return out;
}

export type NbaPlayerHitRate = {
  key: NbaPlayerLogStatKey;
  threshold: number;
  season: { hits: number; games: number };
  last10: { hits: number; games: number };
};

const HIT_THRESHOLDS: Partial<Record<NbaPlayerLogStatKey, number[]>> = {
  pts: [5, 10, 15, 20, 25, 30, 35, 40],
  reb: [3, 5, 8, 10, 12, 15],
  ast: [3, 5, 8, 10, 12],
  fg3m: [1, 2, 3, 4, 5, 6],
};

const HIT_ROWS_PER_STAT = 2;

/**
 * 指標ごとに、今季平均に近い基準を最大 2 本（平均以下で一番近い 1 本 + 平均超で一番近い 1 本）。
 * 今季一度も届いていない基準は出さない。
 */
export function buildPlayerHitRates(logs: NbaPlayerGameLog[]): NbaPlayerHitRate[] {
  if (logs.length === 0) return [];
  const last10 = logs.slice(0, 10);
  const out: NbaPlayerHitRate[] = [];
  for (const key of Object.keys(HIT_THRESHOLDS) as NbaPlayerLogStatKey[]) {
    const avg = averagePlayerLogStat(logs, key) ?? 0;
    const high = Math.max(...logs.map((l) => playerLogStatValue(l, key)));
    const reachable = (HIT_THRESHOLDS[key] ?? []).filter((t) => t <= high);
    if (reachable.length === 0) continue;
    const below = reachable.filter((t) => t <= avg).slice(-1);
    const above = reachable.filter((t) => t > avg).slice(0, HIT_ROWS_PER_STAT - below.length);
    const picks = [...below, ...above];
    if (picks.length < HIT_ROWS_PER_STAT) {
      const extra = reachable.filter((t) => !picks.includes(t)).slice(-(HIT_ROWS_PER_STAT - picks.length));
      picks.push(...extra);
    }
    picks.sort((a, b) => a - b);
    for (const threshold of picks) {
      const count = (rows: NbaPlayerGameLog[]) =>
        rows.filter((l) => playerLogStatValue(l, key) >= threshold).length;
      out.push({
        key,
        threshold,
        season: { hits: count(logs), games: logs.length },
        last10: { hits: count(last10), games: last10.length },
      });
    }
  }
  return out;
}

export type NbaPlayerTrendPoint = {
  gameId: string;
  dateLabel: string;
  oppAbbr: string;
  home: boolean;
  result: "W" | "L";
  value: number;
};

/** 推移グラフ用（古い順）。直近 `limit` 試合 */
export function buildPlayerTrendPoints(
  logs: NbaPlayerGameLog[],
  key: NbaPlayerLogStatKey,
  limit = 20
): NbaPlayerTrendPoint[] {
  return logs
    .slice(0, limit)
    .reverse()
    .map((log) => ({
      gameId: log.gameId,
      dateLabel: log.dateLabel,
      oppAbbr: log.oppAbbr,
      home: log.home,
      result: log.result,
      value: playerLogStatValue(log, key),
    }));
}

export type NbaPlayerVsTeamSummary = {
  games: number;
  pts: number | null;
  reb: number | null;
  ast: number | null;
  fg3m: number | null;
  min: number | null;
  /** 新しい順 */
  meetings: NbaPlayerGameLog[];
};

export function buildPlayerVsTeamSummary(
  logs: NbaPlayerGameLog[],
  oppTeamId: string
): NbaPlayerVsTeamSummary {
  const meetings = logs.filter((l) => l.oppTeamId === oppTeamId);
  return {
    games: meetings.length,
    pts: averagePlayerLogStat(meetings, "pts"),
    reb: averagePlayerLogStat(meetings, "reb"),
    ast: averagePlayerLogStat(meetings, "ast"),
    fg3m: averagePlayerLogStat(meetings, "fg3m"),
    min: averagePlayerLogStat(meetings, "min"),
    meetings,
  };
}
