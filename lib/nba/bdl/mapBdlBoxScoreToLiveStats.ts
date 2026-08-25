/**
 * BDL box score → games.liveStats / スコア更新フィールド。
 */
import {
  bdlBoxScorePlayers,
  bdlBoxScoreTeamInfo,
  type BdlBoxScore,
  type BdlBoxScorePlayerStat,
  type BdlBoxScoreTeamBlock,
} from "@/lib/nba/bdl/fetchBdlBoxScores";
import { parseBdlStatMinutes } from "@/lib/nba/bdl/fetchBdlPlayerGameLogs";
import {
  appTeamIdFromBdlAbbreviation,
  appTeamIdFromBdlTeamId,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import type {
  LiveGameBoxPlayer,
  LiveGameStatsDoc,
} from "@/lib/games/liveGameStats";

function n(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const x = Number(v);
    if (Number.isFinite(x)) return x;
  }
  return fallback;
}

function pct100(made: number, att: number): number {
  if (att <= 0) return 0;
  return (made / att) * 100;
}

function shoots(made: number, att: number): string {
  return `${Math.round(made)}-${Math.round(att)}`;
}

function plusMinus(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const t = raw.trim().replace(/^\+/, "");
    const x = Number(t);
    return Number.isFinite(x) ? x : 0;
  }
  return 0;
}

function resolveAppTeamId(
  block: BdlBoxScoreTeamBlock | undefined
): string | null {
  const team = bdlBoxScoreTeamInfo(block);
  if (!team?.id) return null;
  return (
    rememberBdlTeamId(team.id, team.abbreviation) ??
    appTeamIdFromBdlAbbreviation(team.abbreviation) ??
    appTeamIdFromBdlTeamId(team.id)
  );
}

function mapPlayer(
  row: BdlBoxScorePlayerStat,
  starter: boolean
): LiveGameBoxPlayer | null {
  const p = row.player;
  const playerId = p?.id != null ? String(p.id) : "";
  const lastName = String(p?.last_name ?? "").trim();
  if (!playerId || !lastName) return null;
  const fgm = n(row.fgm);
  const fga = n(row.fga);
  const fg3m = n(row.fg3m);
  const fg3a = n(row.fg3a);
  const ftm = n(row.ftm);
  const fta = n(row.fta);
  return {
    playerId,
    firstName: String(p?.first_name ?? "").trim(),
    lastName,
    position: String(p?.position ?? "").trim(),
    jerseyNumber: String(p?.jersey_number ?? "").trim(),
    starter,
    min: parseBdlStatMinutes(row.min),
    pts: n(row.pts),
    reb: n(row.reb),
    ast: n(row.ast),
    stl: n(row.stl),
    blk: n(row.blk),
    tov: n(row.turnover),
    fg: shoots(fgm, fga),
    fg3: shoots(fg3m, fg3a),
    ft: shoots(ftm, fta),
    plusMinus: plusMinus(row.plus_minus),
  };
}

function mapSidePlayers(rows: BdlBoxScorePlayerStat[]): LiveGameBoxPlayer[] {
  const activeIdx = rows
    .map((r, idx) => ({
      idx,
      min: parseBdlStatMinutes(r.min),
      pts: n(r.pts),
      fga: n(r.fga),
    }))
    .filter((x) => x.min > 0 || x.pts > 0 || x.fga > 0)
    .map((x) => x.idx);
  // BDL に starter フラグが無いので、出場リスト先頭 5 を starter 扱い
  const starterIdx = new Set(activeIdx.slice(0, 5));
  const out: LiveGameBoxPlayer[] = [];
  rows.forEach((row, idx) => {
    const mapped = mapPlayer(row, starterIdx.has(idx));
    if (mapped) out.push(mapped);
  });
  return out;
}

function aggregateTeamStats(
  raw: BdlBoxScorePlayerStat[]
): Record<string, number> {
  let fgm = 0;
  let fga = 0;
  let fg3m = 0;
  let fg3a = 0;
  let ftm = 0;
  let fta = 0;
  let reb = 0;
  let ast = 0;
  let stl = 0;
  let blk = 0;
  let tov = 0;
  for (const row of raw) {
    fgm += n(row.fgm);
    fga += n(row.fga);
    fg3m += n(row.fg3m);
    fg3a += n(row.fg3a);
    ftm += n(row.ftm);
    fta += n(row.fta);
    reb += n(row.reb);
    ast += n(row.ast);
    stl += n(row.stl);
    blk += n(row.blk);
    tov += n(row.turnover);
  }
  return {
    fg: pct100(fgm, fga),
    fg3: pct100(fg3m, fg3a),
    ft: pct100(ftm, fta),
    reb,
    ast,
    stl,
    blk,
    tov,
  };
}

function phaseFromBox(box: BdlBoxScore): "live" | "final" {
  const state = String(box.status_state ?? "").toLowerCase();
  const status = String(box.status ?? "").toLowerCase();
  if (
    state === "final" ||
    status === "final" ||
    status === "ended" ||
    status.includes("final")
  ) {
    return "final";
  }
  return "live";
}

function periodLabelFromBox(
  box: BdlBoxScore,
  phase: "live" | "final"
): string {
  if (phase === "final") return "FINAL";
  const status = String(box.status ?? "").trim();
  if (/halftime/i.test(status)) return "HT";
  if (/\bOT\b/i.test(status) || /overtime/i.test(status)) {
    const m = status.match(/(\d+)(?:st|nd|rd|th)?\s*OT/i);
    return m ? `OT${m[1]}` : "OT";
  }
  const period = n(box.period, 0);
  if (period >= 1 && period <= 4) return `Q${period}`;
  if (period > 4) return `OT${period - 4}`;
  if (status) return status.slice(0, 16);
  return "LIVE";
}

function clockFromBox(
  box: BdlBoxScore,
  phase: "live" | "final"
): string | null {
  if (phase === "final") return null;
  const t = String(box.time ?? "").trim();
  if (!t || /^final$/i.test(t)) return null;
  return t;
}

export type MappedLiveBoxScore = {
  bdlGameId: number | null;
  date: string | null;
  homeBdlTeamId: number;
  awayBdlTeamId: number;
  homeAppTeamId: string;
  awayAppTeamId: string;
  homeScore: number;
  awayScore: number;
  phase: "live" | "final";
  periodLabel: string;
  clock: string | null;
  liveStats: LiveGameStatsDoc;
};

export function bdlBoxMatchKey(input: {
  date?: string | null;
  homeBdlTeamId: number;
  awayBdlTeamId: number;
}): string {
  const day = String(input.date ?? "").slice(0, 10);
  return `${day}|${input.homeBdlTeamId}|${input.awayBdlTeamId}`;
}

export function mapBdlBoxScoreToLiveStats(
  box: BdlBoxScore
): MappedLiveBoxScore | null {
  const homeTeam = bdlBoxScoreTeamInfo(box.home_team);
  const awayTeam = bdlBoxScoreTeamInfo(box.visitor_team);
  if (!homeTeam?.id || !awayTeam?.id) return null;

  const homeAppTeamId = resolveAppTeamId(box.home_team);
  const awayAppTeamId = resolveAppTeamId(box.visitor_team);
  if (!homeAppTeamId || !awayAppTeamId) return null;

  const homeRaw = bdlBoxScorePlayers(box.home_team);
  const awayRaw = bdlBoxScorePlayers(box.visitor_team);
  const homePlayers = mapSidePlayers(homeRaw);
  const awayPlayers = mapSidePlayers(awayRaw);
  if (homePlayers.length === 0 && awayPlayers.length === 0) return null;

  const phase = phaseFromBox(box);
  const homeScore = n(box.home_team_score);
  const awayScore = n(box.visitor_team_score);
  const periodLabel = periodLabelFromBox(box, phase);
  const clock = clockFromBox(box, phase);

  const liveStats: LiveGameStatsDoc = {
    phase,
    periodLabel,
    clock,
    homeScore,
    awayScore,
    lineScore: null,
    teamStats: {
      home: aggregateTeamStats(homeRaw),
      away: aggregateTeamStats(awayRaw),
    },
    box: {
      home: homePlayers,
      away: awayPlayers,
    },
  };

  const bdlGameId =
    typeof box.id === "number" && Number.isFinite(box.id) ? box.id : null;

  return {
    bdlGameId,
    date: box.date ? String(box.date).slice(0, 10) : null,
    homeBdlTeamId: homeTeam.id,
    awayBdlTeamId: awayTeam.id,
    homeAppTeamId,
    awayAppTeamId,
    homeScore,
    awayScore,
    phase,
    periodLabel,
    clock,
    liveStats,
  };
}
