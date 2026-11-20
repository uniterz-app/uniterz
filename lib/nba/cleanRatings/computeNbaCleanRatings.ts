/**
 * play-by-play → ガベージタイム抜きのレーティング（純関数）。
 *
 * ガベージタイム（Cleaning the Glass の点差・残り時間の条件だけ。先発の条件は使わない）:
 * 第 4Q の残り 12:00–9:00 で 25 点差以上 / 9:00–6:00 で 20 点差以上 / 6:00–0:00 で 10 点差以上。
 * プレーごとに直前のスコアで判定し、点差が縮まれば元に戻る。延長はガベージにしない。
 */
import type {
  NbaCleanRatingsSide,
  NbaGameCleanRatingsDoc,
  NbaPossessionCounts,
  NbaRatingTriple,
  NbaTeamCleanRatingsEntry,
} from "@/lib/nba/cleanRatings/nbaCleanRatingsTypes";

export type NbaPbpPlayLite = {
  order?: number;
  type?: string | null;
  period?: number | null;
  clock?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  shooting_play?: boolean | null;
  team?: { id?: number } | null;
  participants?: number[] | null;
};

/** "M:SS" / "SS.s" → 残り秒 */
export function nbaClockToSeconds(clock: string | null | undefined): number | null {
  const raw = String(clock ?? "").trim();
  if (!raw) return null;
  const parts = raw.split(":");
  if (parts.length === 2) {
    const m = Number(parts[0]);
    const s = Number(parts[1]);
    return Number.isFinite(m) && Number.isFinite(s) ? m * 60 + s : null;
  }
  const s = Number(raw);
  return Number.isFinite(s) ? s : null;
}

export function isNbaGarbageTime(
  period: number,
  clockSec: number,
  margin: number
): boolean {
  if (period !== 4) return false;
  const need = clockSec > 540 ? 25 : clockSec > 360 ? 20 : 10;
  return Math.abs(margin) >= need;
}

export function emptyPossessionCounts(): NbaPossessionCounts {
  return { pts: 0, fga: 0, fta: 0, oreb: 0, tov: 0 };
}

function emptySide(): NbaCleanRatingsSide {
  return { all: emptyPossessionCounts(), clean: emptyPossessionCounts() };
}

export function estimatePossessions(c: NbaPossessionCounts): number {
  return c.fga + 0.44 * c.fta - c.oreb + c.tov;
}

function isFreeThrow(type: string): boolean {
  return type.startsWith("Free Throw");
}

function isTurnover(type: string): boolean {
  return /turnover/i.test(type) || type === "Traveling";
}

export type NbaGameCleanRatingsCalc = {
  home: NbaCleanRatingsSide;
  away: NbaCleanRatingsSide;
  /** play-by-play 最後の累計スコア */
  pbpHome: number;
  pbpAway: number;
};

export function computeNbaGameCleanRatings(input: {
  plays: readonly NbaPbpPlayLite[];
  homeBdlTeamId: number;
  awayBdlTeamId: number;
}): NbaGameCleanRatingsCalc {
  /** BDL の `order` はブロックごとに時系列とずれる試合がある（全体の約 2 割）。クォーター → 残り時間で並べ直す */
  const plays = [...input.plays].sort(
    (a, b) =>
      (a.period ?? 0) - (b.period ?? 0) ||
      (nbaClockToSeconds(b.clock) ?? 0) - (nbaClockToSeconds(a.clock) ?? 0) ||
      (a.order ?? 0) - (b.order ?? 0)
  );
  const home = emptySide();
  const away = emptySide();
  let prevHome = 0;
  let prevAway = 0;

  for (const p of plays) {
    const period = typeof p.period === "number" ? p.period : 0;
    const clockSec = nbaClockToSeconds(p.clock);
    const garbage =
      clockSec != null && isNbaGarbageTime(period, clockSec, prevHome - prevAway);

    const add = (side: NbaCleanRatingsSide, key: keyof NbaPossessionCounts, n: number) => {
      side.all[key] += n;
      if (!garbage) side.clean[key] += n;
    };

    const h = typeof p.home_score === "number" ? p.home_score : prevHome;
    const a = typeof p.away_score === "number" ? p.away_score : prevAway;
    if (h !== prevHome) add(home, "pts", h - prevHome);
    if (a !== prevAway) add(away, "pts", a - prevAway);
    prevHome = h;
    prevAway = a;

    const teamId = p.team?.id;
    const side =
      teamId === input.homeBdlTeamId ? home : teamId === input.awayBdlTeamId ? away : null;
    if (!side) continue;
    const type = String(p.type ?? "").trim();
    if (isFreeThrow(type)) {
      add(side, "fta", 1);
    } else if (p.shooting_play && type !== "No Shot (Default Shot)") {
      add(side, "fga", 1);
    } else if (type === "Offensive Rebound") {
      /** 選手が付いていない行はチームリバウンド・FT 間のデッドボール（box の OREB に入らない） */
      if (Array.isArray(p.participants) && p.participants.length > 0) add(side, "oreb", 1);
    } else if (isTurnover(type)) {
      add(side, "tov", 1);
    }
  }

  return { home, away, pbpHome: prevHome, pbpAway: prevAway };
}

type Acc = {
  games: number;
  pts: number;
  oppPts: number;
  poss: number;
  cleanPts: number;
  cleanOppPts: number;
  cleanPoss: number;
};

function rating(pts: number, poss: number): number {
  return poss > 0 ? Math.round((pts / poss) * 1000) / 10 : 0;
}

function triple(pts: number, oppPts: number, poss: number, games: number): NbaRatingTriple {
  const ortg = rating(pts, poss);
  const drtg = rating(oppPts, poss);
  return {
    ortg,
    drtg,
    net: Math.round((ortg - drtg) * 10) / 10,
    poss: games > 0 ? Math.round((poss / games) * 10) / 10 : 0,
  };
}

type CleanGameInput = Pick<NbaGameCleanRatingsDoc, "homeTeamId" | "awayTeamId" | "home" | "away"> & {
  date?: string;
};

function cleanPossAvg(g: CleanGameInput): number {
  return (estimatePossessions(g.home.clean) + estimatePossessions(g.away.clean)) / 2;
}

/**
 * SRS 方式: 各試合のガベージ抜き得失点差（100 ポゼッションあたり・ホーム有利を引く）
 * = 自分の強さ − 相手の強さ、を全試合で満たすように解く（平均 0）。
 * 戻り値はチームごとの「補正後 − 補正前の平均」。
 */
export function solveNbaCleanSosAdjustments(
  games: readonly CleanGameInput[]
): Map<string, number> {
  const rows = games
    .map((g) => {
      const poss = cleanPossAvg(g);
      return poss > 0
        ? { home: g.homeTeamId, away: g.awayTeamId, m: (100 * (g.home.clean.pts - g.away.clean.pts)) / poss }
        : null;
    })
    .filter((r): r is { home: string; away: string; m: number } => r != null);
  const out = new Map<string, number>();
  if (rows.length === 0) return out;
  const homeEdge = rows.reduce((s, r) => s + r.m, 0) / rows.length;

  const perTeam = new Map<string, { opp: string; adj: number; raw: number }[]>();
  for (const r of rows) {
    (perTeam.get(r.home) ?? perTeam.set(r.home, []).get(r.home)!).push({
      opp: r.away,
      adj: r.m - homeEdge,
      raw: r.m,
    });
    (perTeam.get(r.away) ?? perTeam.set(r.away, []).get(r.away)!).push({
      opp: r.home,
      adj: -r.m + homeEdge,
      raw: -r.m,
    });
  }
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  let rating = new Map<string, number>();
  for (const [t, list] of perTeam) rating.set(t, mean(list.map((x) => x.adj)));
  for (let iter = 0; iter < 200; iter++) {
    const next = new Map<string, number>();
    for (const [t, list] of perTeam) {
      next.set(t, mean(list.map((x) => x.adj + (rating.get(x.opp) ?? 0))));
    }
    const center = mean([...next.values()]);
    let delta = 0;
    for (const [t, v] of next) {
      const c = v - center;
      delta = Math.max(delta, Math.abs(c - (rating.get(t) ?? 0)));
      next.set(t, c);
    }
    rating = next;
    if (delta < 1e-4) break;
  }
  for (const [t, list] of perTeam) {
    out.set(t, Math.round(((rating.get(t) ?? 0) - mean(list.map((x) => x.raw))) * 10) / 10);
  }
  return out;
}

/**
 * 攻守を分けた SRS: ガベージ抜き ORTG（試合ごと・ホーム有利を引く）= リーグ平均 + 自分の攻撃 + 相手の守備（失点しやすさ）。
 * 戻り値はチームごとの「補正後 − 補正前の平均」（off は ORTG に、def は DRTG に足す）。
 */
export function solveNbaCleanSosOffDefAdjustments(
  games: readonly CleanGameInput[]
): Map<string, { off: number; def: number }> {
  type Obs = { team: string; opp: string; ortg: number; home: boolean };
  const obs: Obs[] = [];
  for (const g of games) {
    const poss = cleanPossAvg(g);
    if (!(poss > 0)) continue;
    obs.push({ team: g.homeTeamId, opp: g.awayTeamId, ortg: (100 * g.home.clean.pts) / poss, home: true });
    obs.push({ team: g.awayTeamId, opp: g.homeTeamId, ortg: (100 * g.away.clean.pts) / poss, home: false });
  }
  const out = new Map<string, { off: number; def: number }>();
  if (obs.length === 0) return out;
  const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
  const mu = mean(obs.map((o) => o.ortg));
  const homeHalf =
    (mean(obs.filter((o) => o.home).map((o) => o.ortg)) -
      mean(obs.filter((o) => !o.home).map((o) => o.ortg))) /
    2;
  const resid = (o: Obs) => o.ortg - mu - (o.home ? homeHalf : -homeHalf);

  const offObs = new Map<string, Obs[]>();
  const defObs = new Map<string, Obs[]>();
  for (const o of obs) {
    (offObs.get(o.team) ?? offObs.set(o.team, []).get(o.team)!).push(o);
    (defObs.get(o.opp) ?? defObs.set(o.opp, []).get(o.opp)!).push(o);
  }
  let off = new Map<string, number>();
  let def = new Map<string, number>();
  for (const [t, list] of offObs) off.set(t, mean(list.map(resid)));
  for (const [t, list] of defObs) def.set(t, mean(list.map(resid)));
  const centered = (m: Map<string, number>) => {
    const c = mean([...m.values()]);
    return new Map([...m].map(([t, v]) => [t, v - c] as [string, number]));
  };
  for (let iter = 0; iter < 200; iter++) {
    const nextOff = new Map<string, number>();
    const nextDef = new Map<string, number>();
    for (const [t, list] of offObs) {
      nextOff.set(t, mean(list.map((o) => resid(o) - (def.get(o.opp) ?? 0))));
    }
    for (const [t, list] of defObs) {
      nextDef.set(t, mean(list.map((o) => resid(o) - (off.get(o.team) ?? 0))));
    }
    const o2 = centered(nextOff);
    const d2 = centered(nextDef);
    let delta = 0;
    for (const [t, v] of o2) delta = Math.max(delta, Math.abs(v - (off.get(t) ?? 0)));
    for (const [t, v] of d2) delta = Math.max(delta, Math.abs(v - (def.get(t) ?? 0)));
    off = o2;
    def = d2;
    if (delta < 1e-4) break;
  }
  const r1 = (n: number) => Math.round(n * 10) / 10;
  for (const [t, list] of offObs) {
    const rawOff = mean(list.map((o) => o.ortg));
    const rawDef = mean((defObs.get(t) ?? []).map((o) => o.ortg));
    out.set(t, {
      off: r1(mu + (off.get(t) ?? 0) - rawOff),
      def: r1(mu + (def.get(t) ?? 0) - rawDef),
    });
  }
  return out;
}

/** 直近 N 試合（日付の新しい順）のガベージ抜き NET */
function recentCleanNet(
  games: readonly CleanGameInput[],
  teamId: string,
  n: number
): { games: number; net: number } | undefined {
  const mine = games
    .filter((g) => (g.homeTeamId === teamId || g.awayTeamId === teamId) && g.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, n);
  let pts = 0;
  let oppPts = 0;
  let poss = 0;
  for (const g of mine) {
    const home = g.homeTeamId === teamId;
    pts += home ? g.home.clean.pts : g.away.clean.pts;
    oppPts += home ? g.away.clean.pts : g.home.clean.pts;
    poss += cleanPossAvg(g);
  }
  if (mine.length === 0 || poss <= 0) return undefined;
  return { games: mine.length, net: Math.round((100 * (pts - oppPts) / poss) * 10) / 10 };
}

/**
 * 試合 doc → チームごとのシーズン値。
 * ポゼッションは両チームの推定の平均（ORTG / DRTG で同じ分母を使う）。
 */
export function aggregateNbaTeamCleanRatings(
  games: readonly CleanGameInput[]
): Record<string, NbaTeamCleanRatingsEntry> {
  const acc = new Map<string, Acc>();
  const bump = (
    teamId: string,
    own: NbaCleanRatingsSide,
    opp: NbaCleanRatingsSide
  ) => {
    const a = acc.get(teamId) ?? {
      games: 0,
      pts: 0,
      oppPts: 0,
      poss: 0,
      cleanPts: 0,
      cleanOppPts: 0,
      cleanPoss: 0,
    };
    a.games += 1;
    a.pts += own.all.pts;
    a.oppPts += opp.all.pts;
    a.poss += (estimatePossessions(own.all) + estimatePossessions(opp.all)) / 2;
    a.cleanPts += own.clean.pts;
    a.cleanOppPts += opp.clean.pts;
    a.cleanPoss += (estimatePossessions(own.clean) + estimatePossessions(opp.clean)) / 2;
    acc.set(teamId, a);
  };
  for (const g of games) {
    bump(g.homeTeamId, g.home, g.away);
    bump(g.awayTeamId, g.away, g.home);
  }
  const sos = solveNbaCleanSosAdjustments(games);
  const sosOffDef = solveNbaCleanSosOffDefAdjustments(games);
  const out: Record<string, NbaTeamCleanRatingsEntry> = {};
  for (const [teamId, a] of acc) {
    const last10 = recentCleanNet(games, teamId, 10);
    const od = sosOffDef.get(teamId);
    out[teamId] = {
      games: a.games,
      all: triple(a.pts, a.oppPts, a.poss, a.games),
      clean: triple(a.cleanPts, a.cleanOppPts, a.cleanPoss, a.games),
      garbagePossPct:
        a.poss > 0 ? Math.round((1 - a.cleanPoss / a.poss) * 1000) / 1000 : 0,
      ...(sos.has(teamId) ? { sosAdj: sos.get(teamId)! } : {}),
      ...(od ? { sosOffAdj: od.off, sosDefAdj: od.def } : {}),
      ...(last10 ? { last10 } : {}),
    };
  }
  return out;
}
