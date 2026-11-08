/**
 * 試合ログ → ホーム/アウェイ・対戦相手別平均。
 * ingest 済みの今季出場試合（上限 82）ベース。
 */
import type {
  NbaPlayerGameLog,
  NbaPlayerSplitExtras,
  NbaPlayerVenueSplit,
  NbaPlayerVsOpponentSample,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function avg(sum: number, n: number): number {
  if (n <= 0) return 0;
  return round1(sum / n);
}

function pct(made: number, att: number): number | null {
  if (att <= 0) return null;
  return round1((100 * made) / att);
}

/** oreb / dreb / pf はログに無い試合があるため、値のある試合だけで平均 */
type Optional = { sum: number; n: number };

type Acc = {
  games: number;
  wins: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  plusMinus: number;
  oreb: Optional;
  dreb: Optional;
  pf: Optional;
};

function emptyAcc(): Acc {
  return {
    games: 0,
    wins: 0,
    min: 0,
    pts: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    fgm: 0,
    fga: 0,
    fg3m: 0,
    fg3a: 0,
    ftm: 0,
    fta: 0,
    plusMinus: 0,
    oreb: { sum: 0, n: 0 },
    dreb: { sum: 0, n: 0 },
    pf: { sum: 0, n: 0 },
  };
}

function addOptional(o: Optional, v: number | undefined): void {
  if (typeof v !== "number" || !Number.isFinite(v)) return;
  o.sum += v;
  o.n += 1;
}

function add(acc: Acc, log: NbaPlayerGameLog): void {
  acc.games += 1;
  if (log.result === "W") acc.wins += 1;
  acc.min += log.min;
  acc.pts += log.pts;
  acc.reb += log.reb;
  acc.ast += log.ast;
  acc.stl += log.stl;
  acc.blk += log.blk;
  acc.tov += log.tov;
  acc.fgm += log.fgm;
  acc.fga += log.fga;
  acc.fg3m += log.fg3m;
  acc.fg3a += log.fg3a;
  acc.ftm += log.ftm;
  acc.fta += log.fta;
  acc.plusMinus += log.plusMinus;
  addOptional(acc.oreb, log.oreb);
  addOptional(acc.dreb, log.dreb);
  addOptional(acc.pf, log.pf);
}

function optionalAvg(o: Optional): number | null {
  return o.n > 0 ? avg(o.sum, o.n) : null;
}

function extrasFromAcc(acc: Acc): NbaPlayerSplitExtras {
  const n = acc.games;
  return {
    wins: acc.wins,
    losses: n - acc.wins,
    stl: avg(acc.stl, n),
    blk: avg(acc.blk, n),
    tov: avg(acc.tov, n),
    oreb: optionalAvg(acc.oreb),
    dreb: optionalAvg(acc.dreb),
    pf: optionalAvg(acc.pf),
    fgPct: pct(acc.fgm, acc.fga),
    fg3m: avg(acc.fg3m, n),
    fg3Pct: pct(acc.fg3m, acc.fg3a),
    fta: avg(acc.fta, n),
    ftPct: pct(acc.ftm, acc.fta),
  };
}

function venueFromAcc(venue: "home" | "away", acc: Acc): NbaPlayerVenueSplit | null {
  if (acc.games <= 0) return null;
  return {
    ...extrasFromAcc(acc),
    venue,
    games: acc.games,
    min: avg(acc.min, acc.games),
    pts: avg(acc.pts, acc.games),
    reb: avg(acc.reb, acc.games),
    ast: avg(acc.ast, acc.games),
    plusMinus: avg(acc.plusMinus, acc.games),
  };
}

function splitRowFromAcc(acc: Acc): NbaPlayerGameSplitStats {
  return {
    ...extrasFromAcc(acc),
    games: acc.games,
    min: avg(acc.min, acc.games),
    pts: avg(acc.pts, acc.games),
    reb: avg(acc.reb, acc.games),
    ast: avg(acc.ast, acc.games),
    plusMinus: avg(acc.plusMinus, acc.games),
  };
}

export type NbaPlayerGameSplitStats = NbaPlayerSplitExtras & {
  games: number;
  min: number;
  pts: number;
  reb: number;
  ast: number;
  plusMinus: number;
};

export type NbaPlayerGameSplitKey =
  | "home"
  | "away"
  | "win"
  | "loss"
  | "vsEast"
  | "vsWest"
  | "vsOver500"
  | "vsUnder500"
  | "b2b"
  | "threeInFour"
  | `month:${number}`;

export type NbaPlayerGameSplit = {
  key: NbaPlayerGameSplitKey;
  stats: NbaPlayerGameSplitStats;
};

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

export function nbaPlayerGameSplitLabel(key: NbaPlayerGameSplitKey): string {
  if (key.startsWith("month:")) {
    return MONTH_ABBR[Number(key.slice(6)) - 1] ?? key;
  }
  switch (key) {
    case "home":
      return "HOME";
    case "away":
      return "AWAY";
    case "win":
      return "WIN";
    case "loss":
      return "LOSS";
    case "vsEast":
      return "VS EAST";
    case "vsWest":
      return "VS WEST";
    case "vsOver500":
      return "VS .500+";
    case "vsUnder500":
      return "VS SUB-.500";
    case "b2b":
      return "B2B";
    case "threeInFour":
      return "3IN4";
  }
  return key;
}

/**
 * `dateLabel`（日本時間の `M/D`）→ 通日。試合は米国の夜＝日本の翌日で揃うため、日差は米国東部と同じ。
 * 年は無いのでシーズン開始年から補う（8 月以降 = 開始年）。
 */
function dayNumberFromLabel(label: string, seasonStartYear: number): number | null {
  const m = label.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = month >= 8 ? seasonStartYear : seasonStartYear + 1;
  const t = Date.UTC(year, month - 1, day);
  return Number.isFinite(t) ? Math.round(t / 86_400_000) : null;
}

/**
 * GAMES タブのスプリット。
 * - B2B / 3IN4 はこの選手の出場日で判定（前日も出場 / 4 日間で 3 試合目）
 * - 対 .500 は相手の現在の勝率（`oppWinPctByTeam`）。無いチームは入れない
 */
export function buildPlayerGameSplits(
  gameLogs: NbaPlayerGameLog[],
  opts: {
    seasonStartYear: number;
    conferenceOf: (teamId: string) => "east" | "west" | null;
    oppWinPctByTeam?: ReadonlyMap<string, number>;
  }
): NbaPlayerGameSplit[] {
  const accs = new Map<NbaPlayerGameSplitKey, Acc>();
  const put = (key: NbaPlayerGameSplitKey, log: NbaPlayerGameLog) => {
    let acc = accs.get(key);
    if (!acc) {
      acc = emptyAcc();
      accs.set(key, acc);
    }
    add(acc, log);
  };

  const dated = gameLogs
    .map((log) => ({ log, day: dayNumberFromLabel(log.dateLabel, opts.seasonStartYear) }))
    .sort((a, b) => (a.day ?? 0) - (b.day ?? 0));

  const months: number[] = [];
  const recentDays: number[] = [];
  for (const { log, day } of dated) {
    put(log.home ? "home" : "away", log);
    put(log.result === "W" ? "win" : "loss", log);
    const conf = opts.conferenceOf(log.oppTeamId);
    if (conf === "east") put("vsEast", log);
    else if (conf === "west") put("vsWest", log);
    const oppPct = opts.oppWinPctByTeam?.get(log.oppTeamId);
    if (oppPct != null) put(oppPct >= 0.5 ? "vsOver500" : "vsUnder500", log);

    if (day != null) {
      const [prev, prevPrev] = recentDays;
      if (prev != null && day - prev === 1) put("b2b", log);
      if (prevPrev != null && day - prevPrev <= 3) put("threeInFour", log);
      recentDays.unshift(day);
      recentDays.length = Math.min(recentDays.length, 2);
      const month = new Date(day * 86_400_000).getUTCMonth() + 1;
      if (!months.includes(month)) months.push(month);
      put(`month:${month}`, log);
    }
  }

  const order: NbaPlayerGameSplitKey[] = [
    "home",
    "away",
    "win",
    "loss",
    "vsEast",
    "vsWest",
    "vsOver500",
    "vsUnder500",
    "b2b",
    "threeInFour",
    ...months.map((m) => `month:${m}` as const),
  ];
  const out: NbaPlayerGameSplit[] = [];
  for (const key of order) {
    const acc = accs.get(key);
    if (acc && acc.games > 0) out.push({ key, stats: splitRowFromAcc(acc) });
  }
  return out;
}

export type PlayerSplitsFromGameLogs = {
  venueSplits: NbaPlayerVenueSplit[];
  vsOpponentSamples: NbaPlayerVsOpponentSample[];
};

/** 直近試合ログから Home/Away・対戦相手別平均を作る */
export function buildPlayerSplitsFromGameLogs(
  gameLogs: NbaPlayerGameLog[]
): PlayerSplitsFromGameLogs {
  const home = emptyAcc();
  const away = emptyAcc();
  const byOpp = new Map<
    string,
    Acc & { oppTeamId: string; oppAbbr: string }
  >();

  for (const log of gameLogs) {
    if (log.home) add(home, log);
    else add(away, log);

    const key = log.oppTeamId || log.oppAbbr;
    if (!key) continue;
    let row = byOpp.get(key);
    if (!row) {
      row = {
        ...emptyAcc(),
        oppTeamId: log.oppTeamId,
        oppAbbr: log.oppAbbr,
      };
      byOpp.set(key, row);
    }
    add(row, log);
  }

  const venueSplits: NbaPlayerVenueSplit[] = [];
  const homeRow = venueFromAcc("home", home);
  const awayRow = venueFromAcc("away", away);
  if (homeRow) venueSplits.push(homeRow);
  if (awayRow) venueSplits.push(awayRow);

  const vsOpponentSamples: NbaPlayerVsOpponentSample[] = [...byOpp.values()]
    .filter((r) => r.games > 0)
    .sort((a, b) => b.games - a.games || b.pts - a.pts)
    .map((r) => ({
      ...extrasFromAcc(r),
      oppTeamId: r.oppTeamId,
      oppAbbr: r.oppAbbr,
      games: r.games,
      min: avg(r.min, r.games),
      pts: avg(r.pts, r.games),
      reb: avg(r.reb, r.games),
      ast: avg(r.ast, r.games),
      plusMinus: avg(r.plusMinus, r.games),
    }));

  return { venueSplits, vsOpponentSamples };
}
