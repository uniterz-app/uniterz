/**
 * シーズン `games` から各チーム last10（≤10 finals）を集計。
 *
 * - 実値: W–L / PPG / PAPG / diff（スコア）
 * - box があれば 4FCT / 相手許した FG% / PAINT / FB も
 * - 3P%: liveStats.box の fg3 "m-a" をプール。無ければ teamStats.fg3（0–100）平均
 * - ORTG/DRTG/NET:
 *   1) liveStats.box から Dean Oliver 推定 poss（FGA+0.44*FTA−OREB+TOV）
 *   2) 無ければ PPG/PAPG ÷ season pace ×100 の代理
 *
 * 追加 BDL なし（既存 Firestore games / liveStats のみ → コスト $0）。
 */
import {
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
} from "../../../packages/shared/src/gameRow";
import { NBA_ALL_TEAM_IDS } from "@/lib/nba/teamGameLog/buildTeamGameLogsBundleFromGames";
import {
  aggregateLeagueTeamRowFromBoxGames,
  estimateTeamPossessions,
  type LeagueTeamBoxGame,
} from "@/lib/nba/leagueTeamStats/aggregateLeagueTeamRowFromBoxes";
import { sumTeamGameLogBoxSide } from "@/lib/nba/teamGameLog/teamGameLogDetail";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";

type RawGame = Record<string, unknown> & { id?: string };

export type BuildLast10RowsOptions = {
  /** teamId → season pace（無ければ 100） */
  seasonPaceByTeamId?: Record<string, number> | Map<string, number>;
};

/** Dean Oliver 簡易推定（チーム合計） */
export const estimatePossessions = estimateTeamPossessions;

function paceFor(
  teamId: string,
  opts?: BuildLast10RowsOptions
): number {
  const map = opts?.seasonPaceByTeamId;
  if (!map) return 100;
  const raw = map instanceof Map ? map.get(teamId) : map[teamId];
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 80) {
    return raw;
  }
  return 100;
}

function teamIdOf(raw: RawGame, side: "home" | "away"): string {
  if (side === "home") {
    return String(
      raw.homeTeamId ??
        (raw.home as { teamId?: unknown } | undefined)?.teamId ??
        ""
    ).trim();
  }
  return String(
    raw.awayTeamId ??
      (raw.away as { teamId?: unknown } | undefined)?.teamId ??
      ""
  ).trim();
}

function isFinalGame(raw: RawGame): boolean {
  const status = resolveGameStatus(raw);
  if (status === "final") return true;
  if (raw.final === true) return true;
  const state = String(raw.status_state ?? raw.status ?? "").toLowerCase();
  return state === "final" || state === "ended";
}

function teamScoreInGame(
  raw: RawGame,
  teamId: string
): { teamScore: number; oppScore: number; isHome: boolean } | null {
  const homeId = teamIdOf(raw, "home");
  const awayId = teamIdOf(raw, "away");
  if (!homeId || !awayId) return null;
  const score = resolveGameScore(raw);
  if (!score) return null;
  if (teamId === homeId) {
    return { teamScore: score.home, oppScore: score.away, isHome: true };
  }
  if (teamId === awayId) {
    return { teamScore: score.away, oppScore: score.home, isHome: false };
  }
  return null;
}

function boxSideFromGame(raw: RawGame, isHome: boolean) {
  const live = raw.liveStats;
  if (!live || typeof live !== "object") return null;
  const box = (live as { box?: { home?: unknown; away?: unknown } }).box;
  return sumTeamGameLogBoxSide(isHome ? box?.home : box?.away);
}

function finiteStat(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;
}

function extrasFromGame(
  raw: RawGame,
  isHome: boolean
): Pick<LeagueTeamBoxGame, "paint" | "fb" | "oppPaint" | "oppFb"> {
  const live = raw.liveStats;
  if (!live || typeof live !== "object") {
    return { paint: null, fb: null, oppPaint: null, oppFb: null };
  }
  const ts = (
    live as {
      teamStats?: {
        home?: Record<string, unknown>;
        away?: Record<string, unknown>;
      };
    }
  ).teamStats;
  const side = isHome ? ts?.home : ts?.away;
  const opp = isHome ? ts?.away : ts?.home;
  return {
    paint: finiteStat(side?.paint),
    fb: finiteStat(side?.fb),
    oppPaint: finiteStat(opp?.paint),
    oppFb: finiteStat(opp?.fb),
  };
}

/** liveStats から自サイドの 3P made/att（優先）または %（0–1） — box 無いときの補助 */
function fg3SampleFromGame(
  raw: RawGame,
  isHome: boolean
): { made: number; att: number } | { pct01: number } | null {
  const fromBox = boxSideFromGame(raw, isHome);
  if (fromBox && fromBox.fg3a > 0) {
    return { made: fromBox.fg3m, att: fromBox.fg3a };
  }
  const live = raw.liveStats;
  if (!live || typeof live !== "object") return null;
  const ls = live as Record<string, unknown>;
  const teamStats = ls.teamStats as
    | { home?: Record<string, unknown>; away?: Record<string, unknown> }
    | undefined;
  const sideStats = isHome ? teamStats?.home : teamStats?.away;
  const fg3 = sideStats?.fg3;
  if (typeof fg3 === "number" && Number.isFinite(fg3) && fg3 > 0) {
    return { pct01: fg3 > 1 ? fg3 / 100 : fg3 };
  }
  return null;
}

function buildTeamLast10Row(
  teamId: string,
  finals: RawGame[],
  opts?: BuildLast10RowsOptions
): NbaLeagueTeamStatRow {
  const mapped: LeagueTeamBoxGame[] = [];
  for (const g of finals) {
    const scored = teamScoreInGame(g, teamId);
    if (!scored) continue;
    const box = boxSideFromGame(g, scored.isHome);
    const oppBox = boxSideFromGame(g, !scored.isHome);
    const extras = extrasFromGame(g, scored.isHome);
    const fg3Fallback =
      box && oppBox ? undefined : fg3SampleFromGame(g, scored.isHome) ?? undefined;
    mapped.push({
      teamScore: scored.teamScore,
      oppScore: scored.oppScore,
      result: scored.teamScore > scored.oppScore ? "W" : "L",
      box,
      oppBox,
      ...extras,
      ...(fg3Fallback ? { fg3Fallback } : null),
    });
  }
  return aggregateLeagueTeamRowFromBoxGames({
    teamId,
    games: mapped,
    seasonPace: paceFor(teamId, opts),
  });
}

/**
 * シーズン `games` 行から各チームの直近 ≤10 試合を集計した last10 行。
 */
export function buildLast10RowsFromGames(
  games: Array<Record<string, unknown> & { id?: string }>,
  opts?: BuildLast10RowsOptions
): NbaLeagueTeamStatRow[] {
  const finals = games
    .filter(isFinalGame)
    .filter((g) => {
      const phase = String(g.seasonPhase ?? "").toLowerCase();
      if (phase === "preseason") return false;
      return g.countsForRanking !== false;
    })
    .map((g) => ({
      raw: g,
      startAt: resolveGameStartAt(g)?.getTime() ?? 0,
    }))
    .sort((a, b) => a.startAt - b.startAt);

  const finalsByTeam = new Map<string, RawGame[]>();
  for (const teamId of NBA_ALL_TEAM_IDS) {
    finalsByTeam.set(teamId, []);
  }

  for (const { raw } of finals) {
    const homeId = teamIdOf(raw, "home");
    const awayId = teamIdOf(raw, "away");
    for (const id of [homeId, awayId]) {
      if (!id) continue;
      if (!finalsByTeam.has(id)) finalsByTeam.set(id, []);
      const list = finalsByTeam.get(id)!;
      list.push(raw);
      if (list.length > 10) list.shift();
    }
  }

  const rows: NbaLeagueTeamStatRow[] = [];
  for (const teamId of NBA_ALL_TEAM_IDS) {
    rows.push(
      buildTeamLast10Row(teamId, finalsByTeam.get(teamId) ?? [], opts)
    );
  }
  return rows;
}

/** season rows → pace map（last10 enrich 用） */
export function seasonPaceByTeamIdFromRows(
  seasonRows: Array<{ teamId: string; pace?: number | null }>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of seasonRows) {
    if (typeof r.pace === "number" && Number.isFinite(r.pace) && r.pace > 0) {
      out[r.teamId] = r.pace;
    }
  }
  return out;
}

/**
 * 既存 last10 行の ORTG/DRTG/NET/3P が空（0）のとき、games docs から埋める。
 * W–L/PPG は触らない（スナップショットの正を維持）。
 */
export function enrichLast10RatingsFromGameDocs(input: {
  last10Rows: NbaLeagueTeamStatRow[];
  seasonRows: Array<{ teamId: string; pace?: number | null }>;
  gameDocs: Array<{ id: string; data: Record<string, unknown> }>;
}): NbaLeagueTeamStatRow[] {
  const paceMap = seasonPaceByTeamIdFromRows(input.seasonRows);
  const rawGames: RawGame[] = input.gameDocs.map((d) => ({
    ...d.data,
    id: d.id,
  }));
  const rebuilt = buildLast10RowsFromGames(rawGames, {
    seasonPaceByTeamId: paceMap,
  });
  const byId = new Map(rebuilt.map((r) => [r.teamId, r]));

  return input.last10Rows.map((row) => {
    const fresh = byId.get(row.teamId);
    if (!fresh || fresh.wins + fresh.losses === 0) return row;
    const needsRating = !(row.ortg >= 80 && row.drtg >= 80);
    const needsFg3 = !(typeof row.fg3Pct === "number" && row.fg3Pct > 0);
    const preferFresh =
      needsRating ||
      (fresh.pace > 0 &&
        fresh.ortg >= 80 &&
        Math.abs(fresh.netrtg - row.netrtg) >= 0.5);
    if (!preferFresh && !needsFg3) return row;
    return {
      ...row,
      ...(preferFresh
        ? {
            ortg: fresh.ortg,
            drtg: fresh.drtg,
            netrtg: fresh.netrtg,
            pace: fresh.pace > 0 ? fresh.pace : row.pace,
            papg: fresh.papg > 0 ? fresh.papg : row.papg,
            diff: fresh.diff !== 0 ? fresh.diff : row.diff,
            efgPct: fresh.efgPct > 0 ? fresh.efgPct : row.efgPct,
            fg3Pct: fresh.fg3Pct > 0 ? fresh.fg3Pct : row.fg3Pct,
            tovPct: fresh.tovPct > 0 ? fresh.tovPct : row.tovPct,
            ...(typeof (fresh as { fgPct?: number }).fgPct === "number" &&
            (fresh as { fgPct: number }).fgPct > 0
              ? { fgPct: (fresh as { fgPct: number }).fgPct }
              : null),
            ...(typeof (fresh as { ftPct?: number }).ftPct === "number" &&
            (fresh as { ftPct: number }).ftPct > 0
              ? { ftPct: (fresh as { ftPct: number }).ftPct }
              : null),
          }
        : null),
      ...(needsFg3 && fresh.fg3Pct > 0
        ? { fg3Pct: fresh.fg3Pct, fg3a: fresh.fg3a }
        : null),
    };
  });
}
