/**
 * BDL stats 行 → `NbaPlayerGameLog[]`（最新 ~20 試合）。
 */
import { bdlNbaGetJson } from "@/lib/nba/bdl/bdlNbaFetch";
import {
  fetchBdlPlayerGameLogs,
  parseBdlStatMinutes,
  type BdlPlayerGameLogStatRow,
} from "@/lib/nba/bdl/fetchBdlPlayerGameLogs";
import type { BdlGame } from "@/lib/nba/bdl/fetchBdlGames";
import {
  appTeamIdFromBdlAbbreviation,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import { TEAM_SHORT } from "@/lib/team-short";
import type { NbaPlayerGameLog } from "@/lib/predict/nbaPlayerDetailPreviewMocks";

const GAME_LOG_LIMIT = 20;

function num(raw: unknown, fallback = 0): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function formatDateLabel(raw: string | null | undefined): string {
  const s = String(raw ?? "").trim();
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${Number(m[2])}/${Number(m[3])}`;
    return s.slice(0, 10);
  }
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

function gameSortKey(game: Partial<BdlGame> | null | undefined): number {
  const raw = game?.datetime ?? game?.date ?? "";
  const t = Date.parse(String(raw));
  return Number.isFinite(t) ? t : 0;
}

async function fetchGameById(gameId: number): Promise<BdlGame | null> {
  try {
    const body = await bdlNbaGetJson<{ data?: BdlGame }>(
      `/nba/v1/games/${gameId}`
    );
    return body?.data ?? null;
  } catch {
    return null;
  }
}

async function enrichGames(
  rows: BdlPlayerGameLogStatRow[]
): Promise<Map<number, BdlGame>> {
  const out = new Map<number, BdlGame>();
  const need: number[] = [];
  for (const row of rows) {
    const gid = row.game?.id;
    if (typeof gid !== "number") continue;
    const g = row.game as Partial<BdlGame>;
    const hasTeams = g.home_team?.abbreviation && g.visitor_team?.abbreviation;
    const hasScores =
      g.home_team_score != null && g.visitor_team_score != null;
    if (hasTeams && hasScores && (g.date || g.datetime)) {
      out.set(gid, g as BdlGame);
    } else if (!out.has(gid)) {
      need.push(gid);
    }
  }
  const uniqueNeed = [...new Set(need)];
  for (const gid of uniqueNeed) {
    const full = await fetchGameById(gid);
    if (full) out.set(gid, full);
  }
  return out;
}

function teamAbbrFromRow(row: BdlPlayerGameLogStatRow): string {
  return String(row.team?.abbreviation ?? "")
    .trim()
    .toUpperCase();
}

export function mapBdlStatRowToPlayerGameLog(
  row: BdlPlayerGameLogStatRow,
  game: BdlGame | null | undefined
): NbaPlayerGameLog | null {
  const gid = row.game?.id ?? game?.id;
  if (typeof gid !== "number") return null;
  const mins = parseBdlStatMinutes(row.min);
  if (mins <= 0) return null;

  const playerAbbr = teamAbbrFromRow(row);
  const homeTeam = game?.home_team;
  const visitorTeam = game?.visitor_team;
  const homeAbbr = String(homeTeam?.abbreviation ?? "")
    .trim()
    .toUpperCase();
  const awayAbbr = String(visitorTeam?.abbreviation ?? "")
    .trim()
    .toUpperCase();
  if (!playerAbbr || !homeAbbr || !awayAbbr) return null;

  const home = playerAbbr === homeAbbr;
  const oppAbbr = home ? awayAbbr : homeAbbr;
  if (homeTeam?.id != null) rememberBdlTeamId(homeTeam.id, homeAbbr);
  if (visitorTeam?.id != null) rememberBdlTeamId(visitorTeam.id, awayAbbr);

  const oppTeamId =
    appTeamIdFromBdlAbbreviation(oppAbbr) ?? `nba-${oppAbbr.toLowerCase()}`;

  const homeScore = num(game?.home_team_score, NaN);
  const awayScore = num(game?.visitor_team_score, NaN);
  let result: "W" | "L" = "L";
  if (Number.isFinite(homeScore) && Number.isFinite(awayScore)) {
    const playerScore = home ? homeScore : awayScore;
    const oppScore = home ? awayScore : homeScore;
    result = playerScore > oppScore ? "W" : "L";
  }

  return {
    gameId: String(gid),
    dateLabel: formatDateLabel(game?.datetime ?? game?.date),
    oppTeamId,
    oppAbbr: TEAM_SHORT[oppTeamId] ?? oppAbbr,
    home,
    result,
    min: Math.round(mins * 10) / 10,
    pts: num(row.pts),
    reb: num(row.reb),
    ast: num(row.ast),
    stl: num(row.stl),
    blk: num(row.blk),
    tov: num(row.turnover),
    fgm: num(row.fgm),
    fga: num(row.fga),
    fg3m: num(row.fg3m),
    fg3a: num(row.fg3a),
    ftm: num(row.ftm),
    fta: num(row.fta),
    plusMinus: num(row.plus_minus),
  };
}

/** BDL stats 行をマップ（game 詳細は不足分のみ取得） */
export async function mapBdlRowsToPlayerGameLogs(
  rows: BdlPlayerGameLogStatRow[],
  opts: { limit?: number } = {}
): Promise<NbaPlayerGameLog[]> {
  const limit = opts.limit ?? GAME_LOG_LIMIT;
  const played = rows.filter((r) => parseBdlStatMinutes(r.min) > 0);
  played.sort((a, b) => gameSortKey(b.game) - gameSortKey(a.game));
  const slice = played.slice(0, limit);
  const gamesById = await enrichGames(slice);

  const out: NbaPlayerGameLog[] = [];
  for (const row of slice) {
    const gid = row.game?.id;
    const game =
      typeof gid === "number" ? gamesById.get(gid) ?? null : null;
    const mapped = mapBdlStatRowToPlayerGameLog(row, game);
    if (mapped) out.push(mapped);
  }
  return out;
}

/** fetch + map の便利ラッパー */
export async function fetchAndMapBdlPlayerGameLogs(input: {
  bdlPlayerId: number;
  seasonYear: number;
  seasonType?: "regular" | "playoffs";
  limit?: number;
}): Promise<NbaPlayerGameLog[]> {
  const rows = await fetchBdlPlayerGameLogs(input);
  return mapBdlRowsToPlayerGameLogs(rows, { limit: input.limit });
}
