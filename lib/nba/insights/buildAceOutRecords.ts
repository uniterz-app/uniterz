/**
 * 確定試合 + 選手出場 gameId 集合 → チーム別キー選手欠場時成績。
 * W–L + 平均得点 / 平均失点。1 チームに複数選手可。
 */
import {
  addLoss,
  addWin,
  emptyWl,
  type WlRecord,
} from "@/lib/nba/insights/priorSeasonRecordTypes";
import type {
  NbaAceOutPlayerSplit,
  NbaTeamAceOutRecord,
  NbaTeamAceOutRecordsBundle,
} from "@/lib/nba/insights/aceOutRecordTypes";

export type AceOutGameInput = {
  gameId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  seasonPhase?: string | null;
};

export type AceCandidate = {
  teamId: string;
  playerId: string;
  playerName: string;
  ppg: number;
  gp: number;
  source?: "auto" | "curated";
  preferAsAce?: boolean;
};

function isRegular(g: AceOutGameInput): boolean {
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

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

type PtsAcc = { forSum: number; againstSum: number; n: number };

function emptyPts(): PtsAcc {
  return { forSum: 0, againstSum: 0, n: 0 };
}

function addPts(acc: PtsAcc, ptsFor: number, ptsAgainst: number): void {
  acc.forSum += ptsFor;
  acc.againstSum += ptsAgainst;
  acc.n += 1;
}

function avgPts(acc: PtsAcc): { ptsFor: number; ptsAgainst: number } {
  if (acc.n <= 0) return { ptsFor: 0, ptsAgainst: 0 };
  return {
    ptsFor: round1(acc.forSum / acc.n),
    ptsAgainst: round1(acc.againstSum / acc.n),
  };
}

function buildPlayerSplit(
  ace: AceCandidate,
  regular: AceOutGameInput[],
  played: ReadonlySet<string>
): NbaAceOutPlayerSplit {
  const whenOut = emptyWl();
  const whenOutHome = emptyWl();
  const whenOutAway = emptyWl();
  const pts = emptyPts();
  let gamesOut = 0;

  for (const g of regular) {
    const isHome = g.homeTeamId === ace.teamId;
    const isAway = g.awayTeamId === ace.teamId;
    if (!isHome && !isAway) continue;
    if (played.has(g.gameId)) continue;

    gamesOut += 1;
    const ptsFor = isHome ? g.homeScore : g.awayScore;
    const ptsAgainst = isHome ? g.awayScore : g.homeScore;
    addPts(pts, ptsFor, ptsAgainst);
    const won = ptsFor > ptsAgainst;
    applyResult(whenOut, won);
    if (isHome) applyResult(whenOutHome, won);
    else applyResult(whenOutAway, won);
  }

  const avg = avgPts(pts);
  return {
    playerId: ace.playerId,
    playerName: ace.playerName,
    ppg: ace.ppg,
    gp: ace.gp,
    source: ace.source ?? "auto",
    whenOut,
    whenOutHome,
    whenOutAway,
    gamesOut,
    whenOutPtsFor: avg.ptsFor,
    whenOutPtsAgainst: avg.ptsAgainst,
  };
}

function pickPrimary(
  candidates: AceCandidate[],
  splits: NbaAceOutPlayerSplit[]
): NbaAceOutPlayerSplit {
  const prefer = candidates.find((c) => c.preferAsAce);
  if (prefer) {
    const hit = splits.find((s) => s.playerId === prefer.playerId);
    if (hit) return hit;
  }
  return [...splits].sort((a, b) => b.ppg - a.ppg || b.gp - a.gp)[0]!;
}

export function buildAceOutRecords(input: {
  seasonKey: string;
  games: AceOutGameInput[];
  aces: AceCandidate[];
  playedGameIdsByPlayer: Record<string, ReadonlySet<string>>;
  source?: string;
  nowMs?: number;
}): NbaTeamAceOutRecordsBundle {
  const regular = input.games.filter(
    (g) =>
      isRegular(g) &&
      g.gameId &&
      Number.isFinite(g.homeScore) &&
      Number.isFinite(g.awayScore) &&
      g.homeTeamId &&
      g.awayTeamId
  );

  const teamOverall = new Map<string, WlRecord>();
  const teamPts = new Map<string, PtsAcc>();
  const ensureOverall = (teamId: string): WlRecord => {
    if (!teamOverall.has(teamId)) teamOverall.set(teamId, emptyWl());
    return teamOverall.get(teamId)!;
  };
  const ensurePts = (teamId: string): PtsAcc => {
    if (!teamPts.has(teamId)) teamPts.set(teamId, emptyPts());
    return teamPts.get(teamId)!;
  };

  for (const g of regular) {
    const homeWon = g.homeScore > g.awayScore;
    applyResult(ensureOverall(g.homeTeamId), homeWon);
    applyResult(ensureOverall(g.awayTeamId), !homeWon);
    addPts(ensurePts(g.homeTeamId), g.homeScore, g.awayScore);
    addPts(ensurePts(g.awayTeamId), g.awayScore, g.homeScore);
  }

  const byTeam = new Map<string, AceCandidate[]>();
  for (const ace of input.aces) {
    const list = byTeam.get(ace.teamId) ?? [];
    if (!list.some((x) => x.playerId === ace.playerId)) list.push(ace);
    byTeam.set(ace.teamId, list);
  }

  const teams: Record<string, NbaTeamAceOutRecord> = {};

  for (const [teamId, candidates] of byTeam) {
    const players = candidates.map((ace) =>
      buildPlayerSplit(
        ace,
        regular,
        input.playedGameIdsByPlayer[ace.playerId] ?? new Set()
      )
    );
    if (players.length === 0) continue;
    const primary = pickPrimary(candidates, players);
    const teamAvg = avgPts(teamPts.get(teamId) ?? emptyPts());
    teams[teamId] = {
      teamId,
      acePlayerId: primary.playerId,
      acePlayerName: primary.playerName,
      acePpg: primary.ppg,
      aceGp: primary.gp,
      whenOut: primary.whenOut,
      whenOutHome: primary.whenOutHome,
      whenOutAway: primary.whenOutAway,
      gamesOut: primary.gamesOut,
      whenOutPtsFor: primary.whenOutPtsFor,
      whenOutPtsAgainst: primary.whenOutPtsAgainst,
      teamPtsFor: teamAvg.ptsFor,
      teamPtsAgainst: teamAvg.ptsAgainst,
      players,
      teamOverall: teamOverall.get(teamId) ?? emptyWl(),
    };
  }

  return {
    seasonKey: input.seasonKey,
    teams,
    gameCount: regular.length,
    builtAtMs: input.nowMs ?? Date.now(),
    source: input.source ?? "games+bdl-stats",
  };
}
