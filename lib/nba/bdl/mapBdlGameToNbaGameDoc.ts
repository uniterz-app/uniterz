import type {
  BdlGame,
  BdlGamesSeasonType,
} from "@/lib/nba/bdl/fetchBdlGames";
import {
  appTeamIdFromBdlAbbreviation,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";

export type NbaGameSeasonPhase =
  | "preseason"
  | "regular"
  | "play_in"
  | "playoffs";

export type MappedNbaGameDoc = {
  id: string;
  league: "nba";
  season: string;
  seasonPhase: NbaGameSeasonPhase;
  status: "scheduled" | "live" | "final";
  /** Bulk ingest では過去試合でも false（onGameFinalV2 暴発防止）。live sync で true にする */
  final: boolean;
  startAtMs: number;
  startAtJstIso: string;
  roundLabel: string;
  home: { teamId: string; name: string; wins: number; losses: number };
  away: { teamId: string; name: string; wins: number; losses: number };
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  score: { home: number; away: number } | null;
  countsForRanking: boolean;
  bdlGameId: number;
  bdlSeasonYear: number;
  postponed: boolean;
  istStage: string | null;
  source: "bdl";
};

function seasonKeyFromBdlYear(year: number): string {
  return `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
}

function teamSideFromBdl(team: BdlGame["home_team"]): {
  teamId: string;
  name: string;
} | null {
  if (!team) return null;
  const teamId =
    rememberBdlTeamId(team.id, team.abbreviation) ??
    appTeamIdFromBdlAbbreviation(team.abbreviation);
  if (!teamId) return null;
  const name =
    NBA_TEAM_NAME_BY_ID[teamId] ||
    (typeof team.full_name === "string" && team.full_name.trim()) ||
    [team.city, team.name].filter(Boolean).join(" ") ||
    teamId;
  return { teamId, name };
}

function mapLifecycle(g: BdlGame): {
  status: "scheduled" | "live" | "final";
  scoresReady: boolean;
} {
  const state = String(g.status_state ?? "").toLowerCase();
  const statusRaw = String(g.status ?? "").trim();
  const statusLower = statusRaw.toLowerCase();

  if (
    state === "final" ||
    statusLower === "final" ||
    statusLower === "ended"
  ) {
    return { status: "final", scoresReady: true };
  }

  if (
    state === "inprogress" ||
    state === "in_progress" ||
    state === "live" ||
    /(?:^|\s)(?:1st|2nd|3rd|4th)\s*qtr/i.test(statusRaw) ||
    /halftime/i.test(statusRaw) ||
    /\bot\b/i.test(statusRaw)
  ) {
    return { status: "live", scoresReady: true };
  }

  return { status: "scheduled", scoresReady: false };
}

function resolveSeasonTypeHint(
  g: BdlGame,
  forced?: BdlGamesSeasonType
): BdlGamesSeasonType | null {
  if (forced) return forced;
  const raw = String(g.season_type ?? "")
    .trim()
    .toLowerCase();
  if (
    raw === "preseason" ||
    raw === "regular" ||
    raw === "ist" ||
    raw === "playin" ||
    raw === "playoffs"
  ) {
    return raw;
  }
  return null;
}

function mapSeasonPhase(
  g: BdlGame,
  seasonType: BdlGamesSeasonType | null
): NbaGameSeasonPhase {
  if (seasonType === "preseason") return "preseason";
  if (seasonType === "playin") return "play_in";
  if (seasonType === "playoffs") return "playoffs";
  if (seasonType === "ist" || seasonType === "regular") return "regular";

  if (!g.postseason) return "regular";
  const blob = `${g.status ?? ""} ${g.ist_stage ?? ""}`.toLowerCase();
  if (blob.includes("play-in") || blob.includes("play in")) return "play_in";
  return "playoffs";
}

function roundLabelFor(
  g: BdlGame,
  phase: NbaGameSeasonPhase
): string {
  if (phase === "preseason") return "PRESEASON";
  const ist = String(g.ist_stage ?? "").trim();
  if (ist) return `NBA CUP · ${ist.toUpperCase()}`;
  if (phase === "play_in") return "PLAY-IN";
  if (phase === "playoffs") return "PLAYOFFS";
  return "REGULAR SEASON";
}

/** Firestore doc id — BDL id で安定（再 ingest で同一 doc を merge） */
export function nbaGameDocIdFromBdlId(bdlGameId: number): string {
  return `nba-bdl-${bdlGameId}`;
}

/**
 * BDL game → Uniterz games ドキュメント形（Timestamp は ingest 側で付与）。
 * `seasonType` はクエリ種別（レスポンスに season_type が無いとき用）。
 */
export function mapBdlGameToNbaGameDoc(
  g: BdlGame,
  opts?: { seasonType?: BdlGamesSeasonType }
): MappedNbaGameDoc | null {
  if (g.id == null || !Number.isFinite(g.id)) return null;

  const home = teamSideFromBdl(g.home_team);
  const away = teamSideFromBdl(g.visitor_team);
  if (!home || !away) return null;

  const seasonYear =
    typeof g.season === "number" && Number.isFinite(g.season)
      ? g.season
      : null;
  if (seasonYear == null) return null;

  const tip =
    (g.datetime && new Date(g.datetime)) ||
    (g.date ? new Date(`${g.date}T00:00:00.000Z`) : null);
  if (!tip || Number.isNaN(+tip)) return null;

  const { status, scoresReady } = mapLifecycle(g);
  const hs =
    typeof g.home_team_score === "number" ? g.home_team_score : null;
  const as =
    typeof g.visitor_team_score === "number" ? g.visitor_team_score : null;
  const score =
    scoresReady && hs != null && as != null ? { home: hs, away: as } : null;

  const seasonType = resolveSeasonTypeHint(g, opts?.seasonType);
  const seasonPhase = mapSeasonPhase(g, seasonType);
  const isPreseason = seasonPhase === "preseason";

  return {
    id: nbaGameDocIdFromBdlId(g.id),
    league: "nba",
    season: seasonKeyFromBdlYear(seasonYear),
    seasonPhase,
    status,
    final: false,
    startAtMs: tip.getTime(),
    startAtJstIso: tip.toISOString(),
    roundLabel: roundLabelFor(g, seasonPhase),
    home: { ...home, wins: 0, losses: 0 },
    away: { ...away, wins: 0, losses: 0 },
    homeTeamId: home.teamId,
    awayTeamId: away.teamId,
    homeTeamName: home.name,
    awayTeamName: away.name,
    homeScore: score?.home ?? null,
    awayScore: score?.away ?? null,
    score,
    /** プレシーズン・プレーインはランキング対象外 */
    countsForRanking: !isPreseason && seasonPhase !== "play_in",
    bdlGameId: g.id,
    bdlSeasonYear: seasonYear,
    postponed: g.postponed === true,
    istStage: g.ist_stage ?? null,
    source: "bdl",
  };
}
