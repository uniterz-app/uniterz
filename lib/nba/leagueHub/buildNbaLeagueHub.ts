/**
 * 既存スナップショット → `NbaLeagueHubDoc`（純関数・RN / Node 共通）。
 */
import type { NbaPlayerGameLog, NbaPlayerShotZone } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import {
  LEAGUE_HUB_HIGH_STATS,
  LEAGUE_HUB_PLAYER_METRICS,
  LEAGUE_HUB_POSITIONS,
  type LeagueHubPosition,
  type LeagueHubZoneRow,
  type LeagueHubCountRow,
  type LeagueHubGameHigh,
  type LeagueHubHighStat,
  type LeagueHubLadderRow,
  type LeagueHubLadderWeek,
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
  type LeagueHubZoneId,
  type NbaLeagueHubDoc,
} from "@/lib/nba/leagueHub/leagueHubTypes";
import type { NbaShotAreaCounts, NbaShotAreaId } from "@/lib/nba/shotCharts/shotChartTypes";

export type LeagueHubRosterEntry = {
  name: string;
  teamId: string;
  pos: LeagueHubPosition | null;
  /** G-F なら [G, F] */
  positions: LeagueHubPosition[];
  draftYear: number | null;
  draftRound: number | null;
  draftNumber: number | null;
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
  /** shot_charts のシーズン合計。あればエリア別はこちら（45 度あり） */
  shotAreas?: Record<string, NbaShotAreaCounts> | null;
  gameLogs: Map<string, { teamId: string | null; logs: NbaPlayerGameLog[] }>;
  standings: LeagueHubStandingsEntry[];
  teamLogs: Map<string, LeagueHubTeamLogEntry>;
  closeRecords: Map<string, LeagueHubRecord>;
  /** 前季までに NBA 出場がある選手。無いときは draftYear で新人判定 */
  priorPlayerIds?: Set<string> | null;
  /** 既存 hub doc のラダー週次スナップショット */
  previousLadders?: Pick<NbaLeagueHubDoc, "ladderWeek" | "ladderPrev"> | null;
};

const SCATTER_PLAYER_LIMIT = 220;
const LIST_LIMIT = 5;
/** エリア別・シーズンハイ・好調 / 不調 */
const LONG_LIST_LIMIT = 10;
const LADDER_LIMIT = 10;
const SEASON_GAMES = 82;
/** MVP など主要賞の出場条件（2023-24〜） */
const AWARD_MIN_GAMES = 65;
const AWARD_GAME_MIN = 20;
/** 前季 ID は 2020-21 からしか無いので、それより前の指名は新人扱いしない */
const ROOKIE_OLDEST_DRAFT_YEAR = 2020;
const DAY_MS = 86_400_000;
/** 「いま続いている」とみなす最終出場からの日数 */
const ACTIVE_WITHIN_DAYS = 10;

type ZoneDef = { id: LeagueHubZoneId; short: string; minFga: number };

/** シーズン平均 by_zone（shot_charts が無いときのフォールバック） */
const ZONE_DEFS: ZoneDef[] = [
  { id: "restricted", short: "RA", minFga: 4 },
  { id: "paint", short: "PAINT", minFga: 3 },
  { id: "mid", short: "MID", minFga: 3 },
  { id: "left_corner_3", short: "LC3", minFga: 1.2 },
  { id: "right_corner_3", short: "RC3", minFga: 1.2 },
  { id: "above_break_3", short: "AB3", minFga: 4 },
];

/** shot_charts 由来。アーク上の 3P を左 45 度・トップ・右 45 度に分ける */
const AREA_ZONE_DEFS: ZoneDef[] = [
  { id: "restricted", short: "RA", minFga: 4 },
  { id: "paint", short: "PAINT", minFga: 3 },
  { id: "mid", short: "MID", minFga: 3 },
  { id: "left_corner_3", short: "LC3", minFga: 1.2 },
  { id: "right_corner_3", short: "RC3", minFga: 1.2 },
  { id: "left_wing_3", short: "LW3", minFga: 1.5 },
  { id: "top_3", short: "TOP3", minFga: 1.5 },
  { id: "right_wing_3", short: "RW3", minFga: 1.5 },
];

function round(v: number, digits: number): number {
  const p = 10 ** digits;
  return Math.round(v * p) / p;
}

function metricDigits(id: string): number {
  if (
    id.endsWith("_pct") ||
    id.startsWith("pct_") ||
    id === "usg" ||
    id.endsWith("_usg") ||
    id === "pie" ||
    id === "fta_rate"
  ) {
    return 3;
  }
  return id === "drive_ppd" ? 2 : 1;
}

function playerMetricValue(id: LeagueHubPlayerMetric, values: Record<string, number>): number | undefined {
  if (id === "stocks") return (values.stl ?? 0) + (values.blk ?? 0);
  if (id === "def_activity") {
    if (values.deflections == null || values.contested_shots == null) return undefined;
    return (values.stl ?? 0) + (values.blk ?? 0) + values.deflections + values.contested_shots;
  }
  if (id === "drive_ppd") {
    const drives = values.drives ?? 0;
    return drives > 0 && values.drive_pts != null ? values.drive_pts / drives : undefined;
  }
  return values[id];
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

/** 各指標を母集団内の z にして重み付きで足す（ばらつき 0 の指標は 0 扱い） */
function blendZ<T>(pool: T[], parts: Array<[(item: T) => number, number]>): number[] {
  const out = pool.map(() => 0);
  for (const [get, weight] of parts) {
    const values = pool.map(get);
    const mean = avg(values);
    const sd = Math.sqrt(avg(values.map((v) => (v - mean) ** 2)));
    if (!(sd > 0)) continue;
    values.forEach((v, i) => {
      out[i]! += (weight * (v - mean)) / sd;
    });
  }
  return out;
}

/** 値の大きい順の順位（playerId → 1 始まり） */
function rankMap<T extends { id: string }>(pool: T[], get: (item: T) => number): Map<string, number> {
  return new Map([...pool].sort((a, b) => get(b) - get(a)).map((p, i) => [p.id, i + 1]));
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
      const v = playerMetricValue(id, entry.values);
      if (typeof v === "number" && Number.isFinite(v)) m[id] = round(v, metricDigits(id));
    }
    players.push({
      playerId,
      name: r.name,
      teamId: entry.teamId || r.teamId,
      pos: r.pos,
      positions: r.positions,
      gp: entry.gp,
      min: round(min, 1),
      m,
    });
  }
  players.sort((a, b) => b.gp * b.min - a.gp * a.min);
  players.splice(SCATTER_PLAYER_LIMIT);

  // ── エリア別ランキング ──
  const zoneMinGp = Math.max(2, Math.round(maxGp * 0.4));
  const shotAreas =
    input.shotAreas && Object.keys(input.shotAreas).length > 0 ? input.shotAreas : null;
  /** 選手のそのエリアのシーズン合計 [成功, 試投] */
  const zoneTotals = (zoneId: LeagueHubZoneId): Array<[string, number, number]> => {
    if (shotAreas) {
      return Object.entries(shotAreas).flatMap(([playerId, counts]) => {
        const c = counts[zoneId as NbaShotAreaId];
        return c && c[1] > 0 ? [[playerId, c[0], c[1]] as [string, number, number]] : [];
      });
    }
    return [...input.shotZones].flatMap(([playerId, list]) => {
      const gp = metrics.get(playerId)?.gp ?? 0;
      const z = list.find((x) => x.id === zoneId);
      if (!z || z.fga <= 0 || gp <= 0) return [];
      const fga = Math.round(z.fga * gp);
      return [[playerId, Math.round(z.fgPct * fga), fga] as [string, number, number]];
    });
  };
  const zones: LeagueHubZoneBoard[] = (shotAreas ? AREA_ZONE_DEFS : ZONE_DEFS).map((def) => {
    const rows: Array<LeagueHubZoneRow & { positions: LeagueHubPosition[] }> = [];
    const minTotal = Math.max(1, Math.round(def.minFga * maxGp));
    let leagueFgm = 0;
    let leagueFga = 0;
    for (const [playerId, fgm, fgaTotal] of zoneTotals(def.id)) {
      leagueFga += fgaTotal;
      leagueFgm += fgm;
      const gp = metrics.get(playerId)?.gp ?? 0;
      if (gp < zoneMinGp) continue;
      const ref = refOf(playerId, metrics.get(playerId)?.teamId);
      if (!ref) continue;
      rows.push({
        ...ref,
        fgPct: round(fgm / fgaTotal, 3),
        fga: round(fgaTotal / gp, 1),
        fgaTotal,
        fgm,
        positions: roster.get(playerId)?.positions ?? [],
      });
    }
    const boards = (pool: typeof rows) => {
      const strip = ({ positions: _p, ...r }: (typeof rows)[number]): LeagueHubZoneRow => r;
      return {
        byPct: pool
          .filter((r) => r.fga >= def.minFga && r.fgaTotal >= minTotal)
          .sort((a, b) => b.fgPct - a.fgPct || b.fgaTotal - a.fgaTotal)
          .slice(0, LONG_LIST_LIMIT)
          .map(strip),
        byFga: [...pool]
          .sort((a, b) => b.fgaTotal - a.fgaTotal || b.fgPct - a.fgPct)
          .slice(0, LONG_LIST_LIMIT)
          .map(strip),
      };
    };
    const byPos = Object.fromEntries(
      LEAGUE_HUB_POSITIONS.map((p) => [p, boards(rows.filter((r) => r.positions.includes(p)))])
    ) as NonNullable<LeagueHubZoneBoard["byPos"]>;
    return {
      id: def.id,
      short: def.short,
      minFga: def.minFga,
      minTotal,
      leagueFgPct: leagueFga > 0 ? round(leagueFgm / leagueFga, 3) : null,
      ...boards(rows),
      byPos,
    };
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
      .slice(0, LONG_LIST_LIMIT);
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
  const teamGamesOf = (teamId: string | null | undefined) => {
    const st = teamId ? standingsById.get(teamId) : undefined;
    return st ? st.wins + st.losses : 0;
  };
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
  const logsOf = (playerId: string) =>
    (input.gameLogs.get(playerId)?.logs ?? []).filter((g) => g.min > 0);

  // MVP: 65 試合ルール（20 分以上の出場）にまだ届く選手だけ。
  // 貢献度 PIE 5 割・効率込み得点 2 割・チーム勝率 3 割（資格者内の z）
  const mvpPool = [...metrics.entries()]
    .map(([id, e]) => {
      const teamGames = teamGamesOf(e.teamId);
      const st = e.teamId ? standingsById.get(e.teamId) : undefined;
      const pie = e.values.pie;
      const ts = e.values.ts_pct;
      if (!st || teamGames === 0 || pie == null || ts == null) return null;
      const g20 = logsOf(id).filter((g) => g.min >= AWARD_GAME_MIN).length;
      if (g20 + (SEASON_GAMES - teamGames) < AWARD_MIN_GAMES) return null;
      if (g20 < teamGames * 0.6) return null;
      return { id, e, pie, ts, pts: e.values.pts ?? 0, winPct: st.wins / teamGames };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
  const leagueTs = avg(mvpPool.map((p) => p.ts)) || 1;
  const mvpScores = blendZ(mvpPool, [
    [(p) => p.pie, 0.5],
    [(p) => (p.pts * p.ts) / leagueTs, 0.2],
    [(p) => p.winPct, 0.3],
  ]);
  const pieRankOf = rankMap(mvpPool, (p) => p.pie);
  const mvp = mvpPool
    .map((p, i) => ({ p, score: mvpScores[i]! }))
    .sort((a, b) => b.score - a.score)
    .slice(0, LADDER_LIMIT)
    .map(({ p }): LeagueHubLadderRow | null => {
      const row = ladderRow(p.id, p.e);
      return row ? { ...row, pieRank: pieRankOf.get(p.id)! } : null;
    })
    .filter((r): r is LeagueHubLadderRow => r != null);

  // 新人: 前季までに NBA 出場が無い（ドラフト外・指名後に出なかった選手も含む）。
  // チーム試合の 5 割以上・平均 12 分以上。Game Score 6 割・PIE 2 割・総出場時間 2 割
  const startYear = seasonStartYear(seasonKey);
  const priorIds = input.priorPlayerIds;
  const isRookie = (id: string) => {
    const draftYear = roster.get(id)?.draftYear ?? null;
    if (!priorIds) return draftYear === startYear;
    if (priorIds.has(id)) return false;
    return draftYear == null || draftYear >= ROOKIE_OLDEST_DRAFT_YEAR;
  };
  const rookiePool = [...metrics.entries()]
    .map(([id, e]) => {
      if (!isRookie(id)) return null;
      const teamGames = teamGamesOf(e.teamId) || maxGp;
      const min = e.values.min ?? 0;
      if (e.gp < Math.max(2, teamGames * 0.5) || min < 12) return null;
      const logs = logsOf(id);
      if (logs.length === 0) return null;
      return {
        id,
        e,
        gameScore: avg(logs.map(gameScore)),
        pie: e.values.pie ?? 0,
        totalMin: min * e.gp,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
  const rookieScores = blendZ(rookiePool, [
    [(p) => p.gameScore, 0.6],
    [(p) => p.pie, 0.2],
    [(p) => p.totalMin, 0.2],
  ]);
  const gsRankOf = rankMap(rookiePool, (p) => p.gameScore);
  const rookies = rookiePool
    .map((p, i) => ({ p, score: rookieScores[i]! }))
    .sort((a, b) => b.score - a.score)
    .slice(0, LADDER_LIMIT)
    .map(({ p }): LeagueHubLadderRow | null => {
      const row = ladderRow(p.id, p.e);
      if (!row) return null;
      const r = roster.get(p.id);
      return {
        ...row,
        gameScore: round(p.gameScore, 1),
        gameScoreRank: gsRankOf.get(p.id)!,
        draftRound: r?.draftRound ?? null,
        draftNumber: r?.draftNumber ?? null,
      };
    })
    .filter((r): r is LeagueHubLadderRow => r != null);

  // 先週からの順位変動: 週が変わったら前の週の最終順位を ladderPrev へ
  const prevLadders = input.previousLadders ?? null;
  const ladderPrev =
    prevLadders?.ladderWeek && prevLadders.ladderWeek.weekStartMs < thisMonday
      ? prevLadders.ladderWeek
      : (prevLadders?.ladderPrev ?? null);
  const withPrev = (rows: LeagueHubLadderRow[], prev: Record<string, number> | undefined) =>
    rows.map((r) => ({ ...r, prevRank: prev?.[r.playerId] ?? null }));
  const ladderWeek: LeagueHubLadderWeek = {
    weekStartMs: thisMonday,
    mvp: Object.fromEntries(mvp.map((r, i) => [r.playerId, i + 1])),
    rookies: Object.fromEntries(rookies.map((r, i) => [r.playerId, i + 1])),
  };

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
    hot: [...trends].filter((t) => t.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, LONG_LIST_LIMIT),
    cold: [...trends].filter((t) => t.diff < 0).sort((a, b) => a.diff - b.diff).slice(0, LONG_LIST_LIMIT),
    week,
    rookies: withPrev(rookies, ladderPrev?.rookies),
    mvp: withPrev(mvp, ladderPrev?.mvp),
    teams,
    ladderWeek,
    ladderPrev,
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
