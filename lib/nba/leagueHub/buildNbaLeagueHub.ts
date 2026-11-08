/**
 * 既存スナップショット → `NbaLeagueHubDoc`（純関数・RN / Node 共通）。
 */
import type { NbaPlayerGameLog, NbaPlayerShotZone } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import {
  LEAGUE_HUB_HIGH_STATS,
  LEAGUE_HUB_PLAYER_METRICS,
  type LeagueHubCountRow,
  type LeagueHubGameHigh,
  type LeagueHubHighStat,
  type LeagueHubLadderRow,
  type LeagueHubPlayer,
  type LeagueHubPlayerMetric,
  type LeagueHubPlayerRef,
  type LeagueHubPositionDefense,
  type LeagueHubRecord,
  type LeagueHubTeamRow,
  type LeagueHubTrendRow,
  type LeagueHubWeek,
  type LeagueHubWeekRow,
  type LeagueHubZoneBoard,
  type NbaLeagueHubDoc,
} from "@/lib/nba/leagueHub/leagueHubTypes";

export type LeagueHubRosterEntry = {
  name: string;
  teamId: string;
  pos: "G" | "F" | "C" | null;
  draftYear: number | null;
};

export type LeagueHubMetricsEntry = {
  teamId: string | null;
  gp: number;
  values: Record<string, number>;
};

export type LeagueHubStandingsEntry = {
  teamId: string;
  wins: number;
  losses: number;
  streak: { kind: "W" | "L"; count: number } | null;
  last10: LeagueHubRecord | null;
  home: LeagueHubRecord | null;
  away: LeagueHubRecord | null;
};

export type LeagueHubTeamLogEntry = {
  vsOver500: LeagueHubRecord | null;
  b2b: LeagueHubRecord | null;
  posDef: LeagueHubPositionDefense | null;
};

export type BuildNbaLeagueHubInput = {
  seasonKey: string;
  nowMs: number;
  roster: Map<string, LeagueHubRosterEntry>;
  metrics: Map<string, LeagueHubMetricsEntry>;
  shotZones: Map<string, NbaPlayerShotZone[]>;
  gameLogs: Map<string, { teamId: string | null; logs: NbaPlayerGameLog[] }>;
  standings: LeagueHubStandingsEntry[];
  teamLogs: Map<string, LeagueHubTeamLogEntry>;
  closeRecords: Map<string, LeagueHubRecord>;
};

const SCATTER_PLAYER_LIMIT = 220;
const LIST_LIMIT = 5;
const LADDER_LIMIT = 10;
const DAY_MS = 86_400_000;
/** 「いま続いている」とみなす最終出場からの日数 */
const ACTIVE_WITHIN_DAYS = 10;

const ZONE_DEFS: Array<{ id: LeagueHubZoneBoard["id"]; short: string; minFga: number }> = [
  { id: "restricted", short: "RA", minFga: 4 },
  { id: "paint", short: "PAINT", minFga: 3 },
  { id: "mid", short: "MID", minFga: 3 },
  { id: "left_corner_3", short: "LC3", minFga: 1.2 },
  { id: "right_corner_3", short: "RC3", minFga: 1.2 },
  { id: "above_break_3", short: "AB3", minFga: 4 },
];

function round(v: number, digits: number): number {
  const p = 10 ** digits;
  return Math.round(v * p) / p;
}

function isPctMetric(id: string): boolean {
  return id.endsWith("_pct") || id === "usg" || id === "pie";
}

function seasonStartYear(seasonKey: string): number {
  const y = Number.parseInt(seasonKey.slice(0, 4), 10);
  return Number.isFinite(y) ? y : new Date().getUTCFullYear();
}

/** 試合ログの `M/D`（米国東部）→ その日の UTC 0 時 */
export function leagueHubLogDayMs(dateLabel: string, seasonKey: string): number | null {
  const m = /^(\d{1,2})\/(\d{1,2})$/.exec(dateLabel.trim());
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const start = seasonStartYear(seasonKey);
  const year = month >= 8 ? start : start + 1;
  return Date.UTC(year, month - 1, day);
}

/** 米国東部の今日（UTC 0 時表現） */
function easternTodayMs(nowMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(nowMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return Date.UTC(get("year"), get("month") - 1, get("day"));
}

function mdLabel(dayMs: number): string {
  const d = new Date(dayMs);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

function doubleCount(g: NbaPlayerGameLog): number {
  return [g.pts, g.reb, g.ast, g.stl, g.blk].filter((v) => v >= 10).length;
}

function gameScore(g: NbaPlayerGameLog): number {
  const oreb = g.oreb ?? g.reb * 0.25;
  const dreb = g.dreb ?? g.reb * 0.75;
  return (
    g.pts +
    0.4 * g.fgm -
    0.7 * g.fga -
    0.4 * (g.fta - g.ftm) +
    0.7 * oreb +
    0.3 * dreb +
    g.stl +
    0.7 * g.ast +
    0.7 * g.blk -
    0.4 * (g.pf ?? 0) -
    g.tov
  );
}

function avg(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

export function buildNbaLeagueHub(input: BuildNbaLeagueHubInput): NbaLeagueHubDoc {
  const { seasonKey, roster, metrics } = input;

  const refOf = (playerId: string, fallbackTeamId?: string | null): LeagueHubPlayerRef | null => {
    const r = roster.get(playerId);
    if (!r) return null;
    return { playerId, name: r.name, teamId: fallbackTeamId || r.teamId };
  };

  const maxGp = Math.max(0, ...[...metrics.values()].map((m) => m.gp));

  // ── 散布図用の選手 ──
  const minGp = Math.max(2, Math.round(maxGp * 0.3));
  const players: LeagueHubPlayer[] = [];
  for (const [playerId, entry] of metrics) {
    const r = roster.get(playerId);
    if (!r) continue;
    const min = entry.values.min ?? 0;
    if (entry.gp < minGp || min < 12) continue;
    const m: Partial<Record<LeagueHubPlayerMetric, number>> = {};
    for (const id of LEAGUE_HUB_PLAYER_METRICS) {
      const v =
        id === "stocks"
          ? (entry.values.stl ?? 0) + (entry.values.blk ?? 0)
          : entry.values[id];
      if (typeof v === "number" && Number.isFinite(v)) m[id] = round(v, isPctMetric(id) ? 3 : 1);
    }
    players.push({
      playerId,
      name: r.name,
      teamId: entry.teamId || r.teamId,
      pos: r.pos,
      gp: entry.gp,
      min: round(min, 1),
      m,
    });
  }
  players.sort((a, b) => b.gp * b.min - a.gp * a.min);
  players.splice(SCATTER_PLAYER_LIMIT);

  // ── エリアの王 ──
  const zoneMinGp = Math.max(2, Math.round(maxGp * 0.4));
  const zones: LeagueHubZoneBoard[] = ZONE_DEFS.map((def) => {
    const rows: LeagueHubZoneBoard["byPct"] = [];
    for (const [playerId, list] of input.shotZones) {
      const gp = metrics.get(playerId)?.gp ?? 0;
      if (gp < zoneMinGp) continue;
      const z = list.find((x) => x.id === def.id);
      const ref = refOf(playerId, metrics.get(playerId)?.teamId);
      if (!z || !ref || z.fga <= 0) continue;
      const fgaTotal = Math.round(z.fga * gp);
      rows.push({
        ...ref,
        fgPct: round(z.fgPct, 3),
        fga: round(z.fga, 1),
        fgaTotal,
        fgm: Math.round(z.fgPct * fgaTotal),
      });
    }
    const byPct = rows
      .filter((r) => r.fga >= def.minFga)
      .sort((a, b) => b.fgPct - a.fgPct || b.fgaTotal - a.fgaTotal)
      .slice(0, LIST_LIMIT);
    const byFga = [...rows]
      .sort((a, b) => b.fgaTotal - a.fgaTotal || b.fgPct - a.fgPct)
      .slice(0, LIST_LIMIT);
    return { id: def.id, short: def.short, minFga: def.minFga, byPct, byFga };
  });

  // ── 試合ログ由来（シーズンハイ・連続・回数・ホット / コールド・週間） ──
  const highs = Object.fromEntries(
    LEAGUE_HUB_HIGH_STATS.map((s) => [s, [] as LeagueHubGameHigh[]])
  ) as Record<LeagueHubHighStat, LeagueHubGameHigh[]>;
  const pts20: LeagueHubCountRow[] = [];
  const ddStreak: LeagueHubCountRow[] = [];
  const pts30: LeagueHubCountRow[] = [];
  const ddCount: LeagueHubCountRow[] = [];
  const tdCount: LeagueHubCountRow[] = [];
  const trends: LeagueHubTrendRow[] = [];

  const todayMs = easternTodayMs(input.nowMs);
  const weekday = (new Date(todayMs).getUTCDay() + 6) % 7; // 月 = 0
  const thisMonday = todayMs - weekday * DAY_MS;
  const lastMonday = thisMonday - 7 * DAY_MS;
  const weekAcc = {
    last: new Map<string, NbaPlayerGameLog[]>(),
    current: new Map<string, NbaPlayerGameLog[]>(),
  };

  for (const [playerId, { teamId, logs }] of input.gameLogs) {
    const ref = refOf(playerId, teamId);
    if (!ref || logs.length === 0) continue;
    const dated = logs
      .map((g) => ({ g, day: leagueHubLogDayMs(g.dateLabel, seasonKey) }))
      .filter((x): x is { g: NbaPlayerGameLog; day: number } => x.day != null)
      .sort((a, b) => b.day - a.day);
    if (dated.length === 0) continue;
    const newest = dated.map((x) => x.g);
    const active = todayMs - dated[0]!.day <= ACTIVE_WITHIN_DAYS * DAY_MS;

    for (const { g } of dated) {
      for (const stat of LEAGUE_HUB_HIGH_STATS) {
        const value = g[stat];
        if (!(value > 0)) continue;
        highs[stat].push({
          ...ref,
          value,
          oppAbbr: g.oppAbbr,
          dateLabel: g.dateLabel,
          gameId: g.gameId,
          pts: g.pts,
          reb: g.reb,
          ast: g.ast,
        });
      }
    }

    if (active) {
      let s20 = 0;
      for (const g of newest) {
        if (g.pts >= 20) s20 += 1;
        else break;
      }
      if (s20 >= 3) pts20.push({ ...ref, count: s20 });
      let sdd = 0;
      for (const g of newest) {
        if (doubleCount(g) >= 2) sdd += 1;
        else break;
      }
      if (sdd >= 3) ddStreak.push({ ...ref, count: sdd });
    }

    const c30 = newest.filter((g) => g.pts >= 30).length;
    if (c30 > 0) pts30.push({ ...ref, count: c30 });
    const cdd = newest.filter((g) => doubleCount(g) >= 2).length;
    if (cdd > 0) ddCount.push({ ...ref, count: cdd });
    const ctd = newest.filter((g) => doubleCount(g) >= 3).length;
    if (ctd > 0) tdCount.push({ ...ref, count: ctd });

    if (active && newest.length >= 9) {
      const recent = avg(newest.slice(0, 5).map((g) => g.pts));
      const before = avg(newest.slice(5).map((g) => g.pts));
      if (avg(newest.map((g) => g.pts)) >= 10) {
        trends.push({
          ...ref,
          recent: round(recent, 1),
          before: round(before, 1),
          diff: round(recent - before, 1),
        });
      }
    }

    for (const { g, day } of dated) {
      const bucket =
        day >= thisMonday && day <= todayMs
          ? weekAcc.current
          : day >= lastMonday && day < thisMonday
            ? weekAcc.last
            : null;
      if (!bucket) continue;
      const list = bucket.get(playerId) ?? [];
      list.push(g);
      bucket.set(playerId, list);
    }
  }

  for (const stat of LEAGUE_HUB_HIGH_STATS) {
    highs[stat] = highs[stat]
      .sort((a, b) => b.value - a.value || b.pts - a.pts)
      .slice(0, LIST_LIMIT);
  }
  const topCount = (rows: LeagueHubCountRow[]) =>
    rows.sort((a, b) => b.count - a.count).slice(0, LIST_LIMIT);

  const week = buildWeek(weekAcc, {
    lastMonday,
    thisMonday,
    todayMs,
    refOf: (id) => refOf(id, input.gameLogs.get(id)?.teamId),
  });

  // ── ラダー ──
  const standingsById = new Map(input.standings.map((s) => [s.teamId, s]));
  const ladderRow = (playerId: string, entry: LeagueHubMetricsEntry): LeagueHubLadderRow | null => {
    const ref = refOf(playerId, entry.teamId);
    if (!ref) return null;
    const st = standingsById.get(ref.teamId);
    return {
      ...ref,
      gp: entry.gp,
      pts: round(entry.values.pts ?? 0, 1),
      reb: round(entry.values.reb ?? 0, 1),
      ast: round(entry.values.ast ?? 0, 1),
      teamWins: st?.wins ?? null,
      teamLosses: st?.losses ?? null,
    };
  };

  const startYear = seasonStartYear(seasonKey);
  const rookies = [...metrics.entries()]
    .filter(([id, e]) => roster.get(id)?.draftYear === startYear && e.gp >= Math.max(2, Math.round(maxGp * 0.4)))
    .sort(([, a], [, b]) => (b.values.eff ?? 0) - (a.values.eff ?? 0))
    .slice(0, LADDER_LIMIT)
    .map(([id, e]) => ladderRow(id, e))
    .filter((r): r is LeagueHubLadderRow => r != null);

  // MVP（試作）: PIE × チーム勝率。チーム試合の 6 割以上・25 分以上
  const mvp = [...metrics.entries()]
    .map(([id, e]) => {
      const st = e.teamId ? standingsById.get(e.teamId) : undefined;
      const teamGames = st ? st.wins + st.losses : 0;
      if (!st || teamGames === 0) return null;
      if (e.gp < teamGames * 0.6 || (e.values.min ?? 0) < 25) return null;
      const score = (e.values.pie ?? 0) * (0.5 + st.wins / teamGames);
      return { id, e, score };
    })
    .filter((x): x is { id: string; e: LeagueHubMetricsEntry; score: number } => x != null)
    .sort((a, b) => b.score - a.score)
    .slice(0, LADDER_LIMIT)
    .map(({ id, e }) => ladderRow(id, e))
    .filter((r): r is LeagueHubLadderRow => r != null);

  // ── チーム ──
  const teams: LeagueHubTeamRow[] = input.standings.map((s) => {
    const log = input.teamLogs.get(s.teamId);
    return {
      teamId: s.teamId,
      conference: nbaConferenceForTeam(s.teamId),
      wins: s.wins,
      losses: s.losses,
      streak: s.streak,
      last10: s.last10,
      home: s.home,
      away: s.away,
      vsOver500: log?.vsOver500 ?? null,
      b2b: log?.b2b ?? null,
      close: input.closeRecords.get(s.teamId) ?? null,
      posDef: log?.posDef ?? null,
    };
  });

  return {
    seasonKey,
    builtAtMs: input.nowMs,
    players,
    zones,
    highs,
    streaks: { pts20: topCount(pts20), doubleDouble: topCount(ddStreak) },
    counts: {
      pts30: topCount(pts30),
      doubleDouble: topCount(ddCount),
      tripleDouble: topCount(tdCount),
    },
    hot: [...trends].filter((t) => t.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, LIST_LIMIT),
    cold: [...trends].filter((t) => t.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, LIST_LIMIT),
    week,
    rookies,
    mvp,
    teams,
  };
}

function buildWeek(
  acc: { last: Map<string, NbaPlayerGameLog[]>; current: Map<string, NbaPlayerGameLog[]> },
  ctx: {
    lastMonday: number;
    thisMonday: number;
    todayMs: number;
    refOf: (playerId: string) => LeagueHubPlayerRef | null;
  }
): LeagueHubWeek | null {
  const useLast = acc.last.size > 0;
  const bucket = useLast ? acc.last : acc.current;
  if (bucket.size === 0) return null;
  const rows: LeagueHubWeekRow[] = [];
  for (const [playerId, games] of bucket) {
    if (games.length < 2) continue;
    const ref = ctx.refOf(playerId);
    if (!ref) continue;
    rows.push({
      ...ref,
      games: games.length,
      wins: games.filter((g) => g.result === "W").length,
      pts: round(avg(games.map((g) => g.pts)), 1),
      reb: round(avg(games.map((g) => g.reb)), 1),
      ast: round(avg(games.map((g) => g.ast)), 1),
      gameScore: round(avg(games.map(gameScore)), 1),
    });
  }
  rows.sort((a, b) => b.gameScore - a.gameScore || b.games - a.games);
  const startMs = useLast ? ctx.lastMonday : ctx.thisMonday;
  const endMs = useLast ? ctx.thisMonday - DAY_MS : ctx.todayMs;
  return {
    startLabel: mdLabel(startMs),
    endLabel: mdLabel(endMs),
    inProgress: !useLast,
    east: rows.find((r) => nbaConferenceForTeam(r.teamId) === "east") ?? null,
    west: rows.find((r) => nbaConferenceForTeam(r.teamId) === "west") ?? null,
    top: rows.slice(0, LIST_LIMIT),
  };
}
