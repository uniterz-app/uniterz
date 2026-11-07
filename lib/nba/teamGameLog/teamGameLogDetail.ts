/**
 * チーム詳細の GAMES / SPLITS 用明細（1 チーム 1 doc）。
 * `nbaTeamGameLogs/{season}/teams/{teamId}` — 30 チーム一括 doc は 1MB 制限があるため分ける。
 *
 * 母集団は既存 game log と同じ（final・プレシーズン除外）。
 * 平均スタッツは games.liveStats.box の両チーム合計から。PTS / OPP / +/- だけは最終スコア。
 */
import {
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
} from "../../../packages/shared/src/gameRow";
import { nbaConferenceForTeam } from "@/lib/nba/nbaConferenceTeams";
import { TEAM_SHORT } from "@/lib/team-short";
import type { NbaTeamRecentGame } from "@/lib/predict/nbaTeamDetailPreviewMocks";

export const NBA_TEAM_GAME_LOG_DETAIL_SUBCOLLECTION = "teams";

export type NbaTeamSplitAverages = {
  pts: number;
  oppPts: number;
  diff: number;
  /** 以下 box 由来。box のある試合が 0 なら null */
  fgPct: number | null;
  fg3Pct: number | null;
  fg3m: number | null;
  ftPct: number | null;
  reb: number | null;
  oreb: number | null;
  ast: number | null;
  stl: number | null;
  blk: number | null;
  tov: number | null;
  pf: number | null;
  oppFgPct: number | null;
  oppFg3Pct: number | null;
};

export type NbaTeamSplitStatRow = {
  wins: number;
  losses: number;
  /** 平均スタッツに使った box ありの試合数 */
  statGames: number;
  /** 試合 0 なら null */
  avg: NbaTeamSplitAverages | null;
};

export const NBA_TEAM_SPLIT_KEYS = [
  "home",
  "away",
  "vsEast",
  "vsWest",
  "vsOver500",
  "vsUnder500",
  "b2b",
  "threeInFour",
] as const;

export type NbaTeamSplitKey = (typeof NBA_TEAM_SPLIT_KEYS)[number];

export type NbaTeamHeadToHeadStatRow = NbaTeamSplitStatRow & {
  oppTeamId: string;
  oppAbbr: string;
};

export type NbaTeamGameLogDetailGame = NbaTeamRecentGame & {
  /** 前日（米国東部）にも試合があった連戦 2 日目 */
  b2b?: boolean;
  /** 東部暦日で 4 日のうち 3 試合目（3in4。B2B と重なることがある） */
  threeInFour?: boolean;
};

export type NbaTeamGameLogDetail = {
  teamId: string;
  season: string;
  /** シーズン final 全件・新しい順 */
  games: NbaTeamGameLogDetailGame[];
  splits: Record<NbaTeamSplitKey, NbaTeamSplitStatRow>;
  /** 試合数降順 */
  headToHead: NbaTeamHeadToHeadStatRow[];
};

type RawGame = Record<string, unknown> & { id?: string };

type BoxTotals = {
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  reb: number;
  oreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
};

type Acc = {
  wins: number;
  losses: number;
  pts: number;
  oppPts: number;
  statGames: number;
  box: BoxTotals;
  oppBox: BoxTotals;
};

function emptyBox(): BoxTotals {
  return {
    fgm: 0,
    fga: 0,
    fg3m: 0,
    fg3a: 0,
    ftm: 0,
    fta: 0,
    reb: 0,
    oreb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    pf: 0,
  };
}

function emptyAcc(): Acc {
  return {
    wins: 0,
    losses: 0,
    pts: 0,
    oppPts: 0,
    statGames: 0,
    box: emptyBox(),
    oppBox: emptyBox(),
  };
}

function parseMadeAttempts(raw: unknown): { m: number; a: number } | null {
  if (typeof raw !== "string") return null;
  const hit = raw.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (!hit) return null;
  return { m: Number(hit[1]), a: Number(hit[2]) };
}

function num(p: Record<string, unknown>, key: string): number {
  const v = p[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function coercePlayers(side: unknown): Array<Record<string, unknown>> | null {
  if (Array.isArray(side)) return side as Array<Record<string, unknown>>;
  if (side && typeof side === "object" && "players" in side) {
    const players = (side as { players?: unknown }).players;
    if (Array.isArray(players)) return players as Array<Record<string, unknown>>;
  }
  return null;
}

/** box 片側 → チーム合計。シュート行が無ければ null */
function sumSide(side: unknown): BoxTotals | null {
  const players = coercePlayers(side);
  if (!players || players.length === 0) return null;
  const t = emptyBox();
  let hasShot = false;
  for (const p of players) {
    const fg = parseMadeAttempts(p.fg);
    const fg3 = parseMadeAttempts(p.fg3);
    const ft = parseMadeAttempts(p.ft);
    if (fg) {
      t.fgm += fg.m;
      t.fga += fg.a;
      if (fg.a > 0) hasShot = true;
    }
    if (fg3) {
      t.fg3m += fg3.m;
      t.fg3a += fg3.a;
    }
    if (ft) {
      t.ftm += ft.m;
      t.fta += ft.a;
    }
    t.reb += num(p, "reb");
    t.oreb += num(p, "oreb");
    t.ast += num(p, "ast");
    t.stl += num(p, "stl");
    t.blk += num(p, "blk");
    t.tov += num(p, "tov");
    t.pf += num(p, "pf");
  }
  return hasShot ? t : null;
}

function addBox(target: BoxTotals, src: BoxTotals): void {
  for (const k of Object.keys(target) as Array<keyof BoxTotals>) {
    target[k] += src[k];
  }
}

function addGame(
  acc: Acc,
  g: { win: boolean; pts: number; oppPts: number; box: BoxTotals | null; oppBox: BoxTotals | null }
): void {
  if (g.win) acc.wins += 1;
  else acc.losses += 1;
  acc.pts += g.pts;
  acc.oppPts += g.oppPts;
  if (g.box && g.oppBox) {
    acc.statGames += 1;
    addBox(acc.box, g.box);
    addBox(acc.oppBox, g.oppBox);
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pct(made: number, att: number): number | null {
  return att > 0 ? Math.round((made / att) * 1000) / 10 : null;
}

function finalizeAcc(acc: Acc): NbaTeamSplitStatRow {
  const games = acc.wins + acc.losses;
  if (games <= 0) {
    return { wins: 0, losses: 0, statGames: 0, avg: null };
  }
  const n = acc.statGames;
  const per = (v: number) => (n > 0 ? round1(v / n) : null);
  return {
    wins: acc.wins,
    losses: acc.losses,
    statGames: n,
    avg: {
      pts: round1(acc.pts / games),
      oppPts: round1(acc.oppPts / games),
      diff: round1((acc.pts - acc.oppPts) / games),
      fgPct: n > 0 ? pct(acc.box.fgm, acc.box.fga) : null,
      fg3Pct: n > 0 ? pct(acc.box.fg3m, acc.box.fg3a) : null,
      fg3m: per(acc.box.fg3m),
      ftPct: n > 0 ? pct(acc.box.ftm, acc.box.fta) : null,
      reb: per(acc.box.reb),
      oreb: per(acc.box.oreb),
      ast: per(acc.box.ast),
      stl: per(acc.box.stl),
      blk: per(acc.box.blk),
      tov: per(acc.box.tov),
      pf: per(acc.box.pf),
      oppFgPct: n > 0 ? pct(acc.oppBox.fgm, acc.oppBox.fga) : null,
      oppFg3Pct: n > 0 ? pct(acc.oppBox.fg3m, acc.oppBox.fg3a) : null,
    },
  };
}

function teamIdOf(raw: RawGame, side: "home" | "away"): string {
  const nested = raw[side] as { teamId?: unknown } | undefined;
  const flat = side === "home" ? raw.homeTeamId : raw.awayTeamId;
  return String(flat ?? nested?.teamId ?? "").trim();
}

const etDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 米国東部の暦日を通し日数に（連戦判定用） */
function etDayNumber(ms: number): number {
  const [y, m, d] = etDayFormatter.format(new Date(ms)).split("-").map(Number);
  return Math.round(Date.UTC(y!, m! - 1, d!) / 86_400_000);
}

function formatDateLabel(ms: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).format(new Date(ms));
}

type FinalGame = {
  id: string;
  startMs: number;
  /** プレーオフ・プレーインは false（対 .500 の分類と試合前成績から外す） */
  regular: boolean;
  etDay: number;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  homeBox: BoxTotals | null;
  awayBox: BoxTotals | null;
};

/** 同じ 2 チーム・同じ東部暦日の重複 doc（別 ingest 由来）は 1 試合に。box のある方を残す */
function parseFinalGames(games: RawGame[]): FinalGame[] {
  const byKey = new Map<string, FinalGame>();
  for (const raw of games) {
    if (resolveGameStatus(raw) !== "final") continue;
    const phase = String(raw.seasonPhase ?? "").toLowerCase();
    if (phase === "preseason" || raw.countsForRanking === false) continue;
    const homeId = teamIdOf(raw, "home");
    const awayId = teamIdOf(raw, "away");
    if (!homeId || !awayId) continue;
    const start = resolveGameStartAt(raw);
    const score = resolveGameScore(raw);
    if (!start || !score) continue;
    const startMs = start.getTime();
    const box = (raw.liveStats as { box?: { home?: unknown; away?: unknown } } | undefined)
      ?.box;
    const g: FinalGame = {
      id: typeof raw.id === "string" ? raw.id.trim() : "",
      startMs,
      regular: !["playoffs", "playoff", "play_in", "playin"].includes(phase),
      etDay: etDayNumber(startMs),
      homeId,
      awayId,
      homeScore: score.home,
      awayScore: score.away,
      homeBox: sumSide(box?.home),
      awayBox: sumSide(box?.away),
    };
    const key = `${homeId}|${awayId}|${g.etDay}`;
    const prev = byKey.get(key);
    if (!prev || (!(prev.homeBox && prev.awayBox) && g.homeBox && g.awayBox)) {
      byKey.set(key, g);
    }
  }
  return [...byKey.values()].sort((a, b) => a.startMs - b.startMs);
}

type TeamWork = {
  splits: Record<NbaTeamSplitKey, Acc>;
  h2h: Map<string, Acc>;
  games: NbaTeamGameLogDetailGame[];
  /** 直近 2 試合の東部暦日（新しい順） */
  recentEtDays: number[];
  wins: number;
  losses: number;
};

function newTeamWork(): TeamWork {
  return {
    splits: Object.fromEntries(
      NBA_TEAM_SPLIT_KEYS.map((k) => [k, emptyAcc()])
    ) as Record<NbaTeamSplitKey, Acc>,
    h2h: new Map(),
    games: [],
    recentEtDays: [],
    wins: 0,
    losses: 0,
  };
}

export function emptyTeamGameLogDetail(
  teamId: string,
  season: string
): NbaTeamGameLogDetail {
  return finalizeTeamWork(teamId, season, newTeamWork());
}

function finalizeTeamWork(
  teamId: string,
  season: string,
  work: TeamWork
): NbaTeamGameLogDetail {
  const splits = Object.fromEntries(
    NBA_TEAM_SPLIT_KEYS.map((k) => [k, finalizeAcc(work.splits[k])])
  ) as Record<NbaTeamSplitKey, NbaTeamSplitStatRow>;
  const headToHead: NbaTeamHeadToHeadStatRow[] = [...work.h2h.entries()]
    .map(([oppTeamId, acc]) => ({
      oppTeamId,
      oppAbbr: TEAM_SHORT[oppTeamId] ?? oppTeamId,
      ...finalizeAcc(acc),
    }))
    .sort(
      (a, b) =>
        b.wins + b.losses - (a.wins + a.losses) ||
        a.oppAbbr.localeCompare(b.oppAbbr)
    );
  return {
    teamId,
    season,
    games: [...work.games].reverse(),
    splits,
    headToHead,
  };
}

/**
 * シーズン games → 全チームの明細。
 * 対 .500 は既存 team-season-records と同じく「その試合より前の相手勝率」（相手未消化ならどちらにも入れない）。
 * レギュラーシーズンのみで分類・累計する。
 */
export function buildTeamGameLogDetailsFromGames(input: {
  seasonKey: string;
  games: RawGame[];
}): Record<string, NbaTeamGameLogDetail> {
  const season = input.seasonKey.trim();
  const work = new Map<string, TeamWork>();
  const ensure = (id: string) => {
    let w = work.get(id);
    if (!w) {
      w = newTeamWork();
      work.set(id, w);
    }
    return w;
  };

  for (const g of parseFinalGames(input.games)) {
    const home = ensure(g.homeId);
    const away = ensure(g.awayId);
    const sides = [
      { teamId: g.homeId, oppId: g.awayId, self: home, opp: away, isHome: true },
      { teamId: g.awayId, oppId: g.homeId, self: away, opp: home, isHome: false },
    ];
    const homeWon = g.homeScore > g.awayScore;

    for (const s of sides) {
      const win = s.isHome ? homeWon : !homeWon;
      const pts = s.isHome ? g.homeScore : g.awayScore;
      const oppPts = s.isHome ? g.awayScore : g.homeScore;
      const box = s.isHome ? g.homeBox : g.awayBox;
      const oppBox = s.isHome ? g.awayBox : g.homeBox;
      const line = { win, pts, oppPts, box, oppBox };
      const [prevDay, prevPrevDay] = s.self.recentEtDays;
      const b2b = prevDay != null && g.etDay - prevDay === 1;
      const threeInFour = prevPrevDay != null && g.etDay - prevPrevDay <= 3;

      addGame(s.self.splits[s.isHome ? "home" : "away"], line);
      const oppConf = nbaConferenceForTeam(s.oppId);
      if (oppConf === "east") addGame(s.self.splits.vsEast, line);
      else if (oppConf === "west") addGame(s.self.splits.vsWest, line);
      const oppGames = s.opp.wins + s.opp.losses;
      if (g.regular && oppGames > 0) {
        const oppPct = s.opp.wins / oppGames;
        addGame(
          s.self.splits[oppPct >= 0.5 ? "vsOver500" : "vsUnder500"],
          line
        );
      }
      if (b2b) addGame(s.self.splits.b2b, line);
      if (threeInFour) addGame(s.self.splits.threeInFour, line);

      let h2h = s.self.h2h.get(s.oppId);
      if (!h2h) {
        h2h = emptyAcc();
        s.self.h2h.set(s.oppId, h2h);
      }
      addGame(h2h, line);

      const selfConf = nbaConferenceForTeam(s.teamId);
      s.self.games.push({
        dateLabel: formatDateLabel(g.startMs),
        ...(g.id ? { gameId: g.id } : null),
        oppTeamId: s.oppId,
        oppAbbr: TEAM_SHORT[s.oppId] ?? s.oppId,
        home: s.isHome,
        teamScore: pts,
        oppScore: oppPts,
        result: win ? "W" : "L",
        conferenceGame: selfConf != null && selfConf === oppConf,
        ...(b2b ? { b2b: true } : null),
        ...(threeInFour ? { threeInFour: true } : null),
      });
    }

    // 試合前成績で分類し終えてから両チームを更新
    for (const s of sides) {
      s.self.recentEtDays = [g.etDay, ...s.self.recentEtDays].slice(0, 2);
      if (!g.regular) continue;
      const win = s.isHome ? homeWon : !homeWon;
      if (win) s.self.wins += 1;
      else s.self.losses += 1;
    }
  }

  const out: Record<string, NbaTeamGameLogDetail> = {};
  for (const [teamId, w] of work) {
    out[teamId] = finalizeTeamWork(teamId, season, w);
  }
  return out;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function finiteOr(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function finiteOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function resolveAvg(raw: unknown): NbaTeamSplitAverages | null {
  if (!isRecord(raw)) return null;
  return {
    pts: finiteOr(raw.pts, 0),
    oppPts: finiteOr(raw.oppPts, 0),
    diff: finiteOr(raw.diff, 0),
    fgPct: finiteOrNull(raw.fgPct),
    fg3Pct: finiteOrNull(raw.fg3Pct),
    fg3m: finiteOrNull(raw.fg3m),
    ftPct: finiteOrNull(raw.ftPct),
    reb: finiteOrNull(raw.reb),
    oreb: finiteOrNull(raw.oreb),
    ast: finiteOrNull(raw.ast),
    stl: finiteOrNull(raw.stl),
    blk: finiteOrNull(raw.blk),
    tov: finiteOrNull(raw.tov),
    pf: finiteOrNull(raw.pf),
    oppFgPct: finiteOrNull(raw.oppFgPct),
    oppFg3Pct: finiteOrNull(raw.oppFg3Pct),
  };
}

function resolveStatRow(raw: unknown): NbaTeamSplitStatRow {
  if (!isRecord(raw)) return { wins: 0, losses: 0, statGames: 0, avg: null };
  return {
    wins: finiteOr(raw.wins, 0),
    losses: finiteOr(raw.losses, 0),
    statGames: finiteOr(raw.statGames, 0),
    avg: resolveAvg(raw.avg),
  };
}

function resolveDetailGame(raw: unknown): NbaTeamGameLogDetailGame | null {
  if (!isRecord(raw)) return null;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const dateLabel = str(raw.dateLabel);
  const oppTeamId = str(raw.oppTeamId);
  const oppAbbr = str(raw.oppAbbr);
  const result = raw.result === "W" || raw.result === "L" ? raw.result : null;
  if (!dateLabel || !oppTeamId || !oppAbbr || !result) return null;
  const gameId = str(raw.gameId);
  return {
    dateLabel,
    ...(gameId ? { gameId } : null),
    oppTeamId,
    oppAbbr,
    home: raw.home === true,
    teamScore: finiteOr(raw.teamScore, 0),
    oppScore: finiteOr(raw.oppScore, 0),
    result,
    conferenceGame: raw.conferenceGame === true,
    ...(raw.b2b === true ? { b2b: true } : null),
    ...(raw.threeInFour === true ? { threeInFour: true } : null),
  };
}

/** Firestore / API の生データ → 型（壊れた行は捨てる） */
export function resolveTeamGameLogDetail(
  teamId: string,
  season: string,
  raw: unknown
): NbaTeamGameLogDetail | null {
  if (!isRecord(raw)) return null;
  const splitsRaw = isRecord(raw.splits) ? raw.splits : {};
  const splits = Object.fromEntries(
    NBA_TEAM_SPLIT_KEYS.map((k) => [k, resolveStatRow(splitsRaw[k])])
  ) as Record<NbaTeamSplitKey, NbaTeamSplitStatRow>;
  const games = Array.isArray(raw.games)
    ? raw.games
        .map(resolveDetailGame)
        .filter((g): g is NbaTeamGameLogDetailGame => g != null)
    : [];
  const headToHead: NbaTeamHeadToHeadStatRow[] = [];
  if (Array.isArray(raw.headToHead)) {
    for (const item of raw.headToHead) {
      if (!isRecord(item)) continue;
      const oppTeamId =
        typeof item.oppTeamId === "string" ? item.oppTeamId.trim() : "";
      if (!oppTeamId) continue;
      const oppAbbr =
        typeof item.oppAbbr === "string" && item.oppAbbr.trim()
          ? item.oppAbbr.trim()
          : TEAM_SHORT[oppTeamId] ?? oppTeamId;
      headToHead.push({ oppTeamId, oppAbbr, ...resolveStatRow(item) });
    }
  }
  return { teamId, season, games, splits, headToHead };
}
