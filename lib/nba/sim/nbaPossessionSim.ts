/**
 * 試合前のスナップショットだけで回すポゼッションシミュレーション。
 * BDL は叩かない。公開 API にもまだ出さない。
 *
 * 入力は既存の Firestore から埋める:
 * - ペース / ORtg / DRtg / TOV% … リーグチーム表
 * - 5 人組の min / off / def … nbaLineupSeason
 * - 欠場の点数 … nbaPlayerOutImpact（負 = その選手がいないと得失点差が下がる）
 * - ポジション別の失点 − リーグ平均 … team game log の positionDefense
 * - 使用率・2P/3P・FTA・FT% … 選手シーズンメトリクス
 * - ホームコート … out-impact 束の homeCourt
 * - 連戦 … games の試合間隔（restDays 0 = B2B）
 *
 * プレー順の1本ずつの実況は保存していない。交代は、欠場者を除いた5人組の出場時間の割合で区切る。
 * 得点のばらつきは試合ごとに1回だけ正規乱数を足す。幅は fitSimMarginShock で過去の点差に合わせる。
 */

export type SimPos = "G" | "F" | "C";

export type SimPlayer = {
  id: string;
  name: string;
  pos: SimPos;
  /** 1試合あたりの目安分 */
  min: number;
  /** コートにいるあいだの打数の割合。0 より大きければよい */
  usage: number;
  /** シュートのうち3点の割合 0–1 */
  fg3Rate: number;
  /** 1試合あたりのフリースロー試投 */
  fta: number;
  ftPct: number;
};

export type SimLineup = {
  ids: string[];
  min: number;
  off: number;
  def: number;
};

export type SimTeamInput = {
  teamId: string;
  pace: number;
  ortg: number;
  drtg: number;
  /** ポゼッションあたりのターンオーバー率 0–1 */
  tovPct: number;
  players: SimPlayer[];
  lineups: SimLineup[];
  /** そのポジションに許している得点 − リーグ平均。正 = 守備が甘い */
  posPtsVsAvg: Record<SimPos, number>;
  /** 前日試合なら 0 */
  restDays?: number | null;
};

export type SimOutPlayer = {
  side: "home" | "away";
  playerId: string;
  /** 欠場でチームの得失点差がどれだけ下がるか。負が多いほど穴が大きい */
  impact: number;
};

export type SimMatchInput = {
  home: SimTeamInput;
  away: SimTeamInput;
  outs?: SimOutPlayer[];
  /** ホームの得失点差への上乗せ（点） */
  homeCourt?: number;
  /** リーグ平均の ORtg（相手守備の良し悪しの基準） */
  leagueOrtg?: number;
  /**
   * 点差の残りばらつき（標準偏差、点）。
   * 0 だとシーズン平均どおりに寄りすぎる。過去試合に fitSimMarginShock で合わせる。
   */
  marginShockSd?: number;
  runs?: number;
  seed?: number;
};

export type SimEvent = {
  sec: number;
  side: "home" | "away";
  playerId: string;
  playerName: string;
  kind: "fg2" | "fg3" | "ft" | "tov";
  made: boolean;
  pts: number;
  lineupIds: string[];
};

export type SimScoreBand = { p10: number; p50: number; p90: number };

export type SimMatchResult = {
  runs: number;
  homeWinPct: number;
  marginP50: number;
  home: SimScoreBand;
  away: SimScoreBand;
  /** 合計点の中央と、半分の試合が入る幅 */
  total: { p25: number; p50: number; p75: number };
  /** 中央の点差に一番近い1試合。得点の合計はこの試合のスコアと一致する */
  script: SimEvent[];
  scriptHome: number;
  scriptAway: number;
};

export type SimGameActual = {
  predictedMargin: number;
  actualMargin: number;
};

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  const u = Math.max(1e-9, rng());
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = (sorted.length - 1) * p;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sorted[lo] ?? 0;
  return (sorted[lo] ?? 0) * (hi - i) + (sorted[hi] ?? 0) * (i - lo);
}

function availableLineups(team: SimTeamInput, outIds: Set<string>): SimLineup[] {
  return team.lineups.filter(
    (unit) => unit.ids.length === 5 && unit.min > 0 && unit.ids.every((id) => !outIds.has(id))
  );
}

function weighted<T extends { min: number }>(rows: T[], rng: () => number): T | null {
  const total = rows.reduce((sum, row) => sum + row.min, 0);
  if (total <= 0 || rows.length === 0) return null;
  let ticket = rng() * total;
  for (const row of rows) {
    ticket -= row.min;
    if (ticket <= 0) return row;
  }
  return rows[rows.length - 1] ?? null;
}

function fallbackFive(team: SimTeamInput, outIds: Set<string>): SimLineup {
  const players = team.players
    .filter((player) => !outIds.has(player.id) && player.min > 0)
    .sort((a, b) => b.min - a.min)
    .slice(0, 5);
  return {
    ids: players.map((player) => player.id),
    min: 48,
    off: team.ortg,
    def: team.drtg,
  };
}

/** 欠場を除いた5人組の、時間で重み付けした攻撃・守備。組が無ければチーム平均。 */
export function rotationRatings(team: SimTeamInput, outIds: Set<string>): { off: number; def: number } {
  const units = availableLineups(team, outIds);
  const total = units.reduce((sum, unit) => sum + unit.min, 0);
  if (total <= 0) return { off: team.ortg, def: team.drtg };
  const off = units.reduce((sum, unit) => sum + unit.off * unit.min, 0) / total;
  const def = units.reduce((sum, unit) => sum + unit.def * unit.min, 0) / total;
  return { off, def };
}

function restShift(restDays: number | null | undefined): number {
  if (restDays == null) return 0;
  if (restDays <= 0) return -1.2;
  if (restDays >= 3) return 0.4;
  return 0;
}

function ftPointShare(team: SimTeamInput): number {
  const fta = team.players.reduce((sum, player) => sum + Math.max(0, player.fta), 0);
  const makes = team.players.reduce((sum, player) => sum + Math.max(0, player.fta) * clamp(player.ftPct, 0.4, 0.95), 0);
  const ppg = Math.max(80, (team.pace * team.ortg) / 100);
  if (fta <= 0) return 0.16;
  return clamp(makes / ppg, 0.08, 0.3);
}

export type SimSideExpect = {
  meanPts: number;
  poss: number;
  ftShare: number;
  fg3Rate: number;
  tovPct: number;
};

/**
 * 1試合の期待得点。ラインナップの攻守と、欠場インパクトの半分ずつを混ぜる。
 * インパクトは得失点差なので、攻撃と相手守備に半分ずつ載せる。
 */
export function expectedTeamPoints(
  offense: SimTeamInput,
  defense: SimTeamInput,
  outIds: Set<string>,
  oppOutIds: Set<string>,
  offenseImpact: number,
  isHome: boolean,
  homeCourt: number,
  leagueOrtg = 114
): SimSideExpect {
  const offRot = rotationRatings(offense, outIds);
  const defRot = rotationRatings(defense, oppOutIds);
  const offFull = rotationRatings(offense, new Set());
  const defFull = rotationRatings(defense, new Set());
  // 5 人組は欠場で組が消えたときの差だけ使う（序盤は分数が少なく、チーム平均と比べるとノイズが大きい）
  const lineupMargin = offRot.off - offFull.off - (defRot.def - defFull.def);
  const blended = 0.5 * lineupMargin + 0.5 * offenseImpact;
  const five = availableLineups(offense, outIds);
  const unit = five.sort((a, b) => b.min - a.min)[0] ?? fallbackFive(offense, outIds);
  const byId = new Map(offense.players.map((player) => [player.id, player]));
  const posShift =
    unit.ids.reduce((sum, id) => {
      const player = byId.get(id);
      if (!player) return sum;
      return sum + (defense.posPtsVsAvg[player.pos] ?? 0);
    }, 0) / Math.max(1, unit.ids.length);
  const base = (offense.pace * offense.ortg) / 100 + (defense.drtg - leagueOrtg) * (offense.pace / 100);
  const home = isHome ? homeCourt / 2 : -homeCourt / 2;
  const meanPts = clamp(base + blended + posShift * 0.25 + home + restShift(offense.restDays), 70, 150);
  const poss = Math.max(80, Math.round((offense.pace + defense.pace) / 2));
  const fg3Rate =
    unit.ids.reduce((sum, id) => sum + (byId.get(id)?.fg3Rate ?? 0.35), 0) / Math.max(1, unit.ids.length);
  return {
    meanPts,
    poss,
    ftShare: ftPointShare(offense),
    fg3Rate: clamp(fg3Rate, 0.2, 0.55),
    tovPct: clamp(offense.tovPct, 0.08, 0.22),
  };
}

function pickPlayer(team: SimTeamInput, lineupIds: string[], rng: () => number): SimPlayer {
  const byId = new Map(team.players.map((player) => [player.id, player]));
  const pool = lineupIds.map((id) => byId.get(id)).filter((player): player is SimPlayer => player != null);
  const usable = pool.length > 0 ? pool : team.players;
  const total = usable.reduce((sum, player) => sum + Math.max(0.05, player.usage), 0);
  let ticket = rng() * total;
  for (const player of usable) {
    ticket -= Math.max(0.05, player.usage);
    if (ticket <= 0) return player;
  }
  return usable[usable.length - 1] ?? team.players[0] ?? { id: "0", name: "", pos: "G", min: 0, usage: 1, fg3Rate: 0.35, fta: 0, ftPct: 0.75 };
}

function buildStints(team: SimTeamInput, outIds: Set<string>, rng: () => number): SimLineup[] {
  const units = availableLineups(team, outIds);
  const pool = units.length > 0 ? units : [fallbackFive(team, outIds)];
  const stints: SimLineup[] = [];
  let left = 48;
  while (left > 0.5) {
    const unit = weighted(pool, rng) ?? pool[0]!;
    const share = unit.min / Math.max(1, pool.reduce((sum, row) => sum + row.min, 0));
    const len = clamp(share * 48, 4, Math.min(12, left));
    stints.push(unit);
    left -= len;
  }
  return stints;
}

function lineupAt(stints: SimLineup[], possIndex: number, poss: number): SimLineup {
  const slot = Math.min(stints.length - 1, Math.floor((possIndex / Math.max(1, poss)) * stints.length));
  return stints[Math.max(0, slot)] ?? stints[0]!;
}

function playScript(
  side: "home" | "away",
  team: SimTeamInput,
  outIds: Set<string>,
  score: number,
  expect: SimSideExpect,
  rng: () => number
): SimEvent[] {
  const stints = buildStints(team, outIds, rng);
  const events: SimEvent[] = [];
  let left = Math.max(0, Math.round(score));
  const ftBudget = Math.round(left * expect.ftShare);
  let ftLeft = ftBudget;
  left -= ftLeft;
  const secPer = (48 * 60) / expect.poss;
  for (let i = 0; i < expect.poss; i++) {
    const lineup = lineupAt(stints, i, expect.poss);
    const player = pickPlayer(team, lineup.ids, rng);
    const sec = Math.round(i * secPer + (side === "away" ? secPer * 0.5 : 0));
    if (rng() < expect.tovPct) {
      events.push({ sec, side, playerId: player.id, playerName: player.name, kind: "tov", made: false, pts: 0, lineupIds: lineup.ids });
      continue;
    }
    if (ftLeft >= 2 && rng() < expect.ftShare + 0.05) {
      const made = rng() < clamp(player.ftPct, 0.45, 0.95) ? 2 : rng() < 0.5 ? 1 : 0;
      const pts = Math.min(ftLeft, made);
      ftLeft -= pts;
      events.push({ sec, side, playerId: player.id, playerName: player.name, kind: "ft", made: pts > 0, pts, lineupIds: lineup.ids });
      continue;
    }
    const want3 = left >= 3 && rng() < expect.fg3Rate;
    if (want3) {
      left -= 3;
      events.push({ sec, side, playerId: player.id, playerName: player.name, kind: "fg3", made: true, pts: 3, lineupIds: lineup.ids });
      continue;
    }
    if (left >= 2) {
      left -= 2;
      events.push({ sec, side, playerId: player.id, playerName: player.name, kind: "fg2", made: true, pts: 2, lineupIds: lineup.ids });
      continue;
    }
    events.push({
      sec,
      side,
      playerId: player.id,
      playerName: player.name,
      kind: rng() < expect.fg3Rate ? "fg3" : "fg2",
      made: false,
      pts: 0,
      lineupIds: lineup.ids,
    });
  }
  const lineup = stints[0] ?? fallbackFive(team, outIds);
  while (ftLeft > 0 || left > 0) {
    const player = pickPlayer(team, lineup.ids, rng);
    const fromFt = ftLeft > 0;
    const pts = fromFt ? Math.min(2, ftLeft) : Math.min(2, left);
    if (fromFt) ftLeft -= pts;
    else left -= pts;
    events.push({ sec: 48 * 60 - 20, side, playerId: player.id, playerName: player.name, kind: "ft", made: true, pts, lineupIds: lineup.ids });
  }
  return events;
}

function drawScore(mean: number, shockSd: number, rng: () => number): number {
  return Math.round(clamp(mean + gaussian(rng) * shockSd, 60, 170));
}

export function simulateNbaPossessionGame(input: SimMatchInput): SimMatchResult {
  const runs = Math.max(1, Math.min(20000, input.runs ?? 5000));
  const seed = input.seed ?? 1;
  const homeCourt = input.homeCourt ?? 2.4;
  const marginShockSd = input.marginShockSd ?? 11;
  const teamShock = marginShockSd / Math.SQRT2;
  const homeOut = new Set((input.outs ?? []).filter((out) => out.side === "home").map((out) => out.playerId));
  const awayOut = new Set((input.outs ?? []).filter((out) => out.side === "away").map((out) => out.playerId));
  const homeImpact = (input.outs ?? []).filter((out) => out.side === "home").reduce((sum, out) => sum + out.impact, 0);
  const awayImpact = (input.outs ?? []).filter((out) => out.side === "away").reduce((sum, out) => sum + out.impact, 0);
  const leagueOrtg = input.leagueOrtg ?? 114;
  const homeExpect = expectedTeamPoints(input.home, input.away, homeOut, awayOut, homeImpact, true, homeCourt, leagueOrtg);
  const awayExpect = expectedTeamPoints(input.away, input.home, awayOut, homeOut, awayImpact, false, homeCourt, leagueOrtg);

  const homeScores: number[] = [];
  const awayScores: number[] = [];
  const margins: number[] = [];
  let homeWins = 0;
  for (let i = 0; i < runs; i++) {
    const rng = mulberry32(seed + i * 997);
    const homeScore = drawScore(homeExpect.meanPts, teamShock, rng);
    const awayScore = drawScore(awayExpect.meanPts, teamShock, rng);
    homeScores.push(homeScore);
    awayScores.push(awayScore);
    margins.push(homeScore - awayScore);
    if (homeScore > awayScore) homeWins += 1;
    else if (homeScore === awayScore) homeWins += 0.5;
  }
  const marginSorted = [...margins].sort((a, b) => a - b);
  const homeSorted = [...homeScores].sort((a, b) => a - b);
  const awaySorted = [...awayScores].sort((a, b) => a - b);
  const totalSorted = homeScores.map((h, i) => h + (awayScores[i] ?? 0)).sort((a, b) => a - b);
  const marginP50 = percentile(marginSorted, 0.5);
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < margins.length; i++) {
    const dist = Math.abs((margins[i] ?? 0) - marginP50);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  const scriptRng = mulberry32(seed + best * 997);
  const scriptHome = homeScores[best] ?? 0;
  const scriptAway = awayScores[best] ?? 0;
  drawScore(homeExpect.meanPts, teamShock, scriptRng);
  drawScore(awayExpect.meanPts, teamShock, scriptRng);
  const homeEvents = playScript("home", input.home, homeOut, scriptHome, homeExpect, scriptRng);
  const awayEvents = playScript("away", input.away, awayOut, scriptAway, awayExpect, scriptRng);
  const script = [...homeEvents, ...awayEvents].sort((a, b) => a.sec - b.sec || (a.side === "home" ? -1 : 1));
  return {
    runs,
    homeWinPct: homeWins / runs,
    marginP50,
    home: { p10: percentile(homeSorted, 0.1), p50: percentile(homeSorted, 0.5), p90: percentile(homeSorted, 0.9) },
    away: { p10: percentile(awaySorted, 0.1), p50: percentile(awaySorted, 0.5), p90: percentile(awaySorted, 0.9) },
    total: {
      p25: percentile(totalSorted, 0.25),
      p50: percentile(totalSorted, 0.5),
      p75: percentile(totalSorted, 0.75),
    },
    script,
    scriptHome,
    scriptAway,
  };
}

/** 予測点差と実際の点差の残差から、次に使う marginShockSd を返す。 */
export function fitSimMarginShock(games: SimGameActual[]): number {
  if (games.length < 8) return 11;
  const mean = games.reduce((sum, game) => sum + (game.actualMargin - game.predictedMargin), 0) / games.length;
  const variance =
    games.reduce((sum, game) => {
      const residual = game.actualMargin - game.predictedMargin - mean;
      return sum + residual * residual;
    }, 0) / (games.length - 1);
  return clamp(Math.sqrt(variance), 6, 18);
}
