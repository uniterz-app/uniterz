/**
 * BDL career season averages → NbaPlayerCareerSeasonRow。
 */
import {
  bdlCareerStatNum,
  type BdlPlayerCareerAverageRow,
} from "@/lib/nba/bdl/fetchBdlPlayerCareerAverages";
import type { NbaPlayerCareerSeasonRow } from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import { TEAM_SHORT } from "@/lib/team-short";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function mapBdlCareerAverageToRow(
  row: BdlPlayerCareerAverageRow,
  opts: {
    fallbackTeamId?: string | null;
    fallbackTeamAbbr?: string | null;
    fallbackPosition?: string | null;
    /** 試合ログ由来の所属（優先） */
    teamId?: string | null;
    teamAbbr?: string | null;
    /** 試合ログ由来 GS。null のままなら stats の gs を試し、無ければ null */
    gamesStarted?: number | null;
  }
): NbaPlayerCareerSeasonRow | null {
  const seasonStart = Number(row.season);
  if (!Number.isFinite(seasonStart) || seasonStart <= 0) return null;
  const stats = row.stats ?? {};
  const games = Math.round(
    bdlCareerStatNum(stats, "games_played", "gp", "game_played")
  );
  if (games <= 0) return null;

  const teamId =
    (opts.teamId ?? "").trim() ||
    (opts.fallbackTeamId ?? "").trim() ||
    "nba-unknown";
  const teamAbbr =
    (opts.teamAbbr ?? "").trim().toUpperCase() ||
    (opts.fallbackTeamAbbr ?? "").trim().toUpperCase() ||
    TEAM_SHORT[teamId] ||
    "NBA";
  const position =
    String(row.player?.position ?? "").trim() ||
    (opts.fallbackPosition ?? "").trim() ||
    "—";

  const fgm = bdlCareerStatNum(stats, "fgm");
  const fga = bdlCareerStatNum(stats, "fga");
  const fg3m = bdlCareerStatNum(stats, "fg3m");
  const fg3a = bdlCareerStatNum(stats, "fg3a");
  const ftm = bdlCareerStatNum(stats, "ftm");
  const fta = bdlCareerStatNum(stats, "fta");

  const gsFromStats = Math.round(
    bdlCareerStatNum(stats, "gs", "games_started", "game_started")
  );
  const gamesStarted =
    opts.gamesStarted != null && Number.isFinite(opts.gamesStarted)
      ? Math.round(opts.gamesStarted)
      : gsFromStats > 0
        ? gsFromStats
        : null;

  return {
    seasonStart,
    age: Math.round(bdlCareerStatNum(stats, "age")) || 0,
    teamId,
    teamAbbr,
    position,
    games,
    gamesStarted,
    min: round1(bdlCareerStatNum(stats, "min", "minutes")),
    fgm: round1(fgm),
    fga: round1(fga),
    fgPct: round3(
      bdlCareerStatNum(stats, "fg_pct") || (fga > 0 ? fgm / fga : 0)
    ),
    fg3m: round1(fg3m),
    fg3a: round1(fg3a),
    fg3Pct: round3(
      bdlCareerStatNum(stats, "fg3_pct") || (fg3a > 0 ? fg3m / fg3a : 0)
    ),
    ftm: round1(ftm),
    fta: round1(fta),
    ftPct: round3(
      bdlCareerStatNum(stats, "ft_pct") || (fta > 0 ? ftm / fta : 0)
    ),
    reb: round1(bdlCareerStatNum(stats, "reb", "trb")),
    ast: round1(bdlCareerStatNum(stats, "ast")),
    stl: round1(bdlCareerStatNum(stats, "stl")),
    blk: round1(bdlCareerStatNum(stats, "blk")),
    tov: round1(bdlCareerStatNum(stats, "tov", "turnover")),
    pts: round1(bdlCareerStatNum(stats, "pts")),
  };
}
