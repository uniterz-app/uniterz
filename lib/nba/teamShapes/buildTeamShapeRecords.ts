/**
 * final games + liveStats.box → チーム別 shape W–L bundle。
 */
import {
  addLoss,
  addWin,
  emptyWl,
  wlTotal,
  wlWinPct,
  type WlRecord,
} from "@/lib/nba/insights/priorSeasonRecordTypes";
import {
  TEAM_SHAPE_V1_IDS,
  type TeamShapeId,
} from "@/lib/nba/teamShapes/shapeDefs";
import {
  evalGameShapes,
  sumBoxPlayers,
  type TeamBoxTotals,
  type TeamShapeSeasonRates,
} from "@/lib/nba/teamShapes/evalGameShape";
import type {
  NbaTeamShapeRecord,
  NbaTeamShapeRecordsBundle,
  NbaTeamShapeSplit,
} from "@/lib/nba/teamShapes/teamShapeTypes";

export type TeamShapeGameInput = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  seasonPhase?: string | null;
  homeBox: TeamBoxTotals | null;
  awayBox: TeamBoxTotals | null;
};

export type TeamShapeSeasonRatesByTeam = ReadonlyMap<
  string,
  TeamShapeSeasonRates
>;

function isRegular(g: TeamShapeGameInput): boolean {
  const phase = String(g.seasonPhase ?? "regular").toLowerCase();
  if (phase === "preseason" || phase === "pre") return false;
  if (phase === "play_in" || phase === "playin") return false;
  if (phase === "playoffs" || phase === "playoff") return false;
  return true;
}

function applyResult(r: WlRecord, won: boolean): void {
  if (won) addWin(r);
  else addLoss(r);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

type Acc = {
  overall: WlRecord;
  when: Record<TeamShapeId, WlRecord>;
};

function emptyAcc(): Acc {
  const when = {} as Record<TeamShapeId, WlRecord>;
  for (const id of TEAM_SHAPE_V1_IDS) when[id] = emptyWl();
  return { overall: emptyWl(), when };
}

function ensureAcc(map: Map<string, Acc>, teamId: string): Acc {
  let a = map.get(teamId);
  if (!a) {
    a = emptyAcc();
    map.set(teamId, a);
  }
  return a;
}

function finalizeTeam(teamId: string, acc: Acc): NbaTeamShapeRecord {
  const baseline = wlWinPct(acc.overall);
  const shapes: Partial<Record<TeamShapeId, NbaTeamShapeSplit>> = {};
  for (const id of TEAM_SHAPE_V1_IDS) {
    const when = acc.when[id]!;
    const games = wlTotal(when);
    if (games <= 0) continue;
    const winPct = wlWinPct(when);
    shapes[id] = {
      shapeId: id,
      when: { wins: when.wins, losses: when.losses },
      games,
      winPct: round3(winPct),
      baselineWinPct: round3(baseline),
      deltaWinPct: round3(winPct - baseline),
    };
  }
  return {
    teamId,
    overall: { wins: acc.overall.wins, losses: acc.overall.losses },
    shapes,
  };
}

function ratesFor(
  map: TeamShapeSeasonRatesByTeam | undefined,
  teamId: string
): TeamShapeSeasonRates | null {
  if (!map) return null;
  return map.get(teamId) ?? null;
}

export function buildTeamShapeRecords(input: {
  seasonKey: string;
  games: TeamShapeGameInput[];
  /** 相対型（爆発・抑制・守備破壊）用。無ければ相対 shape は発火しない */
  seasonRatesByTeam?: TeamShapeSeasonRatesByTeam;
  source?: string;
  builtAtMs?: number;
}): NbaTeamShapeRecordsBundle {
  const byTeam = new Map<string, Acc>();
  let gameCount = 0;
  let gamesWithBox = 0;
  const rates = input.seasonRatesByTeam;

  for (const g of input.games) {
    if (!isRegular(g)) continue;
    if (!g.homeTeamId || !g.awayTeamId) continue;
    gameCount += 1;
    const homeWon = g.homeScore > g.awayScore;
    const hasBox = g.homeBox != null && g.awayBox != null;
    if (hasBox) gamesWithBox += 1;

    const homeAcc = ensureAcc(byTeam, g.homeTeamId);
    const awayAcc = ensureAcc(byTeam, g.awayTeamId);
    applyResult(homeAcc.overall, homeWon);
    applyResult(awayAcc.overall, !homeWon);

    const homeSeason = ratesFor(rates, g.homeTeamId);
    const awaySeason = ratesFor(rates, g.awayTeamId);

    const homeFired = evalGameShapes({
      ptsFor: g.homeScore,
      ptsAgainst: g.awayScore,
      box: g.homeBox,
      oppBox: g.awayBox,
      selfSeason: homeSeason,
      oppSeason: awaySeason,
    });
    const awayFired = evalGameShapes({
      ptsFor: g.awayScore,
      ptsAgainst: g.homeScore,
      box: g.awayBox,
      oppBox: g.homeBox,
      selfSeason: awaySeason,
      oppSeason: homeSeason,
    });
    for (const id of homeFired) {
      applyResult(homeAcc.when[id]!, homeWon);
    }
    for (const id of awayFired) {
      applyResult(awayAcc.when[id]!, !homeWon);
    }
  }

  const teams: Record<string, NbaTeamShapeRecord> = {};
  for (const [teamId, acc] of byTeam) {
    teams[teamId] = finalizeTeam(teamId, acc);
  }

  return {
    seasonKey: input.seasonKey,
    teams,
    gameCount,
    gamesWithBox,
    builtAtMs: input.builtAtMs ?? Date.now(),
    source: input.source ?? "games-liveStats",
  };
}

/** Firestore game doc → shape input（不正・非 final は null） */
export function teamShapeGameFromDoc(
  data: Record<string, unknown>
): TeamShapeGameInput | null {
  const status = String(data.status ?? "").toLowerCase();
  if (status !== "final" && status !== "ended" && data.final !== true) {
    return null;
  }

  const homeTeamId = teamIdFromSide(data.home, data.homeTeamId);
  const awayTeamId = teamIdFromSide(data.away, data.awayTeamId);
  if (!homeTeamId || !awayTeamId) return null;

  let homeScore = parseScore(data.homeScore);
  let awayScore = parseScore(data.awayScore);
  if (
    (homeScore == null || awayScore == null) &&
    data.score &&
    typeof data.score === "object"
  ) {
    const s = data.score as { home?: unknown; away?: unknown };
    homeScore = homeScore ?? parseScore(s.home);
    awayScore = awayScore ?? parseScore(s.away);
  }
  if (homeScore == null || awayScore == null) return null;

  let homeBox: TeamBoxTotals | null = null;
  let awayBox: TeamBoxTotals | null = null;
  const live = data.liveStats;
  if (live && typeof live === "object") {
    const box = (live as { box?: { home?: unknown; away?: unknown } }).box;
    homeBox = sumBoxPlayers(coerceBoxPlayers(box?.home));
    awayBox = sumBoxPlayers(coerceBoxPlayers(box?.away));
  }

  return {
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    seasonPhase: String(data.seasonPhase ?? data.season_type ?? "regular"),
    homeBox,
    awayBox,
  };
}

/** box.home がプレイヤー配列、または { players: [] } の両方に対応 */
function coerceBoxPlayers(
  side: unknown
): Array<Record<string, unknown>> | null {
  if (Array.isArray(side)) {
    return side as Array<Record<string, unknown>>;
  }
  if (side && typeof side === "object" && "players" in side) {
    const players = (side as { players?: unknown }).players;
    if (Array.isArray(players)) {
      return players as Array<Record<string, unknown>>;
    }
  }
  return null;
}

function parseScore(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function teamIdFromSide(raw: unknown, fallback?: unknown): string {
  if (raw && typeof raw === "object" && "teamId" in raw) {
    const id = String((raw as { teamId?: unknown }).teamId ?? "").trim();
    if (id) return id;
  }
  return String(fallback ?? "").trim();
}
