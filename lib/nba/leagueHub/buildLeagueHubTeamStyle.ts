/**
 * チームのスタイルマップ（ROSTER）用の数字（純関数）。
 * 選手のシーズン平均・選手試合ログ × 先発・チーム試合の得点・ペイロールから。BDL なし。
 */
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type {
  LeagueHubRecord,
  LeagueHubTeamStyleMetric,
} from "@/lib/nba/leagueHub/leagueHubTypes";

export type LeagueHubRosterTeamPlayer = {
  gp: number;
  mpg: number;
  ppg: number;
  /** インチ。不明は null */
  heightIn: number | null;
  draftYear: number | null;
};

export type LeagueHubTeamStyleInput = {
  teamId: string;
  wins: number;
  losses: number;
  /** 自チームの得点（試合ごと） */
  scores: number[];
  roster: LeagueHubRosterTeamPlayer[];
  payrollUsd: number | null;
  /** 先発がわかる試合の得点（ベンチ / 先発） */
  benchPts: number;
  starterPts: number;
};

/** エース・得点源に数える選手: チーム試合の半分以上・平均 10 分以上 */
const ROTATION_GAME_SHARE = 0.5;
const ROTATION_MIN_MPG = 10;

/** "6-11" → 83 */
export function parseHeightInches(v: unknown): number | null {
  const m = /^(\d+)-(\d+)$/.exec(String(v ?? "").trim());
  if (!m) return null;
  const inches = Number(m[1]) * 12 + Number(m[2]);
  return inches > 60 && inches < 100 ? inches : null;
}

function pct(r: LeagueHubRecord | null): number | null {
  if (!r) return null;
  const g = r.wins + r.losses;
  return g > 0 ? r.wins / g : null;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function weighted(rows: { v: number; w: number }[]): number | null {
  const total = rows.reduce((a, r) => a + r.w, 0);
  return total > 0 ? rows.reduce((a, r) => a + r.v * r.w, 0) / total : null;
}

/** 選手の試合ログを今のチームへ寄せ、先発がわかる試合だけベンチ / 先発の得点を足す */
export function sumBenchPoints(
  gameLogs: Map<string, { teamId: string | null; logs: NbaPlayerGameLog[] }>,
  starterIdsByGame: Map<string, Set<string>> | null | undefined
): Map<string, { bench: number; starter: number }> {
  const out = new Map<string, { bench: number; starter: number }>();
  if (!starterIdsByGame) return out;
  for (const [playerId, { teamId, logs }] of gameLogs) {
    if (!teamId) continue;
    const acc = out.get(teamId) ?? { bench: 0, starter: 0 };
    for (const g of logs) {
      const starters = starterIdsByGame.get(g.gameId);
      if (!starters) continue;
      if (starters.has(playerId)) acc.starter += g.pts;
      else acc.bench += g.pts;
    }
    out.set(teamId, acc);
  }
  return out;
}

export function buildLeagueHubTeamStyle(
  input: LeagueHubTeamStyleInput,
  seasonStartYear: number
): Partial<Record<LeagueHubTeamStyleMetric, number>> {
  const m: Partial<Record<LeagueHubTeamStyleMetric, number>> = {};
  const set = (k: LeagueHubTeamStyleMetric, v: number | null, digits: number) => {
    if (v == null || !Number.isFinite(v)) return;
    const p = 10 ** digits;
    m[k] = Math.round(v * p) / p;
  };

  set("winPct", pct({ wins: input.wins, losses: input.losses }), 3);

  const played = input.roster.filter((p) => p.gp > 0);
  const teamGames = input.wins + input.losses;
  const rotation = played.filter(
    (p) => p.gp >= teamGames * ROTATION_GAME_SHARE && p.mpg >= ROTATION_MIN_MPG
  );
  const teamPpg = input.scores.length > 0 ? mean(input.scores) : 0;
  if (rotation.length > 0 && teamPpg > 0) {
    set("aceShare", Math.max(...rotation.map((p) => p.ppg)) / teamPpg, 3);
    const rotationPts = rotation.reduce((a, p) => a + p.ppg, 0);
    if (rotationPts > 0) {
      set(
        "scorerCount",
        1 / rotation.reduce((a, p) => a + (p.ppg / rotationPts) ** 2, 0),
        1
      );
    }
  }
  const heightIn = weighted(
    played.flatMap((p) => (p.heightIn != null ? [{ v: p.heightIn, w: p.mpg * p.gp }] : []))
  );
  set("heightCm", heightIn != null ? heightIn * 2.54 : null, 1);
  set(
    "experience",
    weighted(
      played.flatMap((p) =>
        p.draftYear != null && p.draftYear <= seasonStartYear
          ? [{ v: seasonStartYear - p.draftYear, w: p.mpg * p.gp }]
          : []
      )
    ),
    1
  );

  const benchTotal = input.benchPts + input.starterPts;
  set("benchShare", benchTotal > 0 ? input.benchPts / benchTotal : null, 3);
  set("payrollM", input.payrollUsd != null ? input.payrollUsd / 1_000_000 : null, 1);
  return m;
}
