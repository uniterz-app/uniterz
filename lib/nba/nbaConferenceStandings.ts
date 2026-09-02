/**
 * カンファレンス順位表 — 正は Firestore `nbaStandings/{season}`（BDL ingest）。
 * 未 ingest 時のみ `teams` から組み立てるフォールバックあり。
 * L10 / 連勝 / 直近フォームは ingest 時に `games` 由来の team game logs で付与。
 */
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import {
  nbaConferenceForTeam,
  type NbaConferenceId,
} from "@/lib/nba/nbaConferenceTeams";
import { compareNbaStandingsSortRows } from "@/lib/nba/compareNbaStandingsSort";
import { nbaRegularSeasonWinsLosses } from "@/lib/nbaRegularSeasonRecord";
import { lastGameAtMillis } from "@/lib/teamLastGameAt";
import { computeStreakFromGames, type NbaTeamStreak } from "@/lib/predict/nbaTeamDetailPreviewMocks";

export type NbaStandingsWl = { wins: number; losses: number };

export type NbaConferenceStandingsRow = {
  teamId: string;
  teamName: string;
  conference: NbaConferenceId;
  rank: number;
  wins: number;
  losses: number;
  winPct: number;
  streak: NbaTeamStreak;
  last10: NbaStandingsWl;
  home: NbaStandingsWl;
  away: NbaStandingsWl;
  /** 試合カード直近フォーム（古→新、最大5）。ingest 時に game logs から付与 */
  recentForm?: ("W" | "L")[];
};

export type NbaConferenceStandingsBoard = {
  east: NbaConferenceStandingsRow[];
  west: NbaConferenceStandingsRow[];
};

export const EMPTY_NBA_CONFERENCE_STANDINGS: NbaConferenceStandingsBoard = {
  east: [],
  west: [],
};

export function formatStandingsWl(wl: NbaStandingsWl): string {
  return `${wl.wins}-${wl.losses}`;
}

export function formatStandingsWinPct(winPct: number): string {
  if (!Number.isFinite(winPct)) return "—";
  return `${(winPct * 100).toFixed(1)}%`;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function wlFromObject(raw: unknown): NbaStandingsWl | null {
  const o = asRecord(raw);
  if (!o) return null;
  const wins = num(o.wins);
  const losses = num(o.losses);
  if (wins != null && losses != null) return { wins, losses };
  return wlFromWinsGames(o.wins, o.games);
}

function wlFromWinsGames(
  winsRaw: unknown,
  gamesRaw: unknown
): NbaStandingsWl | null {
  const wins = num(winsRaw);
  const games = num(gamesRaw);
  if (wins == null || games == null || games < wins) return null;
  return { wins, losses: Math.max(0, games - wins) };
}

function lastGamesResults(raw: unknown): Array<{ result: "W" | "L"; at: number }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ result: "W" | "L"; at: number }> = [];
  for (const item of raw) {
    const row = asRecord(item);
    if (!row) continue;
    const at = lastGameAtMillis(row);
    let result: "W" | "L" | null = null;
    if (row.isWin === true || row.result === "W") result = "W";
    else if (row.isWin === false || row.result === "L") result = "L";
    if (!result) continue;
    out.push({ result, at });
  }
  return out.sort((a, b) => a.at - b.at);
}

function recordFromTeamDoc(raw: unknown): {
  wins: number;
  losses: number;
  home: NbaStandingsWl;
  away: NbaStandingsWl;
  last10: NbaStandingsWl;
  streak: NbaTeamStreak;
  standingsTiebreakOrder?: number;
} {
  const empty: NbaStandingsWl = { wins: 0, losses: 0 };
  const d = asRecord(raw);
  if (!d) {
    return { wins: 0, losses: 0, home: empty, away: empty, last10: empty, streak: { kind: "W", count: 0 } };
  }
  const rs = nbaRegularSeasonWinsLosses({
    wins: num(d.wins) ?? undefined,
    losses: num(d.losses) ?? undefined,
    homeGames: num(d.homeGames) ?? undefined,
    homeWins: num(d.homeWins) ?? undefined,
    awayGames: num(d.awayGames) ?? undefined,
    awayWins: num(d.awayWins) ?? undefined,
    cupFinalWins: num(d.cupFinalWins) ?? undefined,
    cupFinalLosses: num(d.cupFinalLosses) ?? undefined,
  });
  const nested = asRecord(d.homeAway);
  const home =
    wlFromWinsGames(d.homeWins, d.homeGames) ?? wlFromObject(nested?.home) ?? empty;
  const away =
    wlFromWinsGames(d.awayWins, d.awayGames) ?? wlFromObject(nested?.away) ?? empty;

  const results = lastGamesResults(d.lastGames);
  const last10Games = results.slice(-10);
  const last10: NbaStandingsWl =
    last10Games.length > 0
      ? {
          wins: last10Games.filter((g) => g.result === "W").length,
          losses: last10Games.filter((g) => g.result === "L").length,
        }
      : empty;
  const streak =
    last10Games.length > 0
      ? computeStreakFromGames(last10Games)
      : { kind: "W" as const, count: 0 };

  const tb = num(d.standingsTiebreakOrder);

  return {
    wins: rs.wins,
    losses: rs.losses,
    home,
    away,
    last10,
    streak,
    standingsTiebreakOrder: tb ?? undefined,
  };
}

/** BDL standings ingest 用 — teams から L10 / 連勝だけ補完 */
export function standingsEnrichmentFromTeamDoc(
  raw: unknown
): Pick<NbaConferenceStandingsRow, "last10" | "streak"> {
  const rec = recordFromTeamDoc(raw);
  return { last10: rec.last10, streak: rec.streak };
}

type DraftRow = Omit<NbaConferenceStandingsRow, "rank"> & {
  standingsTiebreakOrder?: number;
};

function draftFromTeamDoc(doc: Record<string, unknown>): DraftRow | null {
  const teamId = str(doc.id);
  if (!teamId) return null;
  const conference = nbaConferenceForTeam(teamId);
  if (!conference) return null;
  const rec = recordFromTeamDoc(doc);
  const gp = rec.wins + rec.losses;
  const teamName =
    NBA_TEAM_NAME_BY_ID[teamId] ||
    str(doc.name) ||
    str(doc.shortName) ||
    teamId;
  return {
    teamId,
    teamName,
    conference,
    wins: rec.wins,
    losses: rec.losses,
    winPct: gp > 0 ? rec.wins / gp : 0,
    streak: rec.streak,
    last10: rec.last10,
    home: rec.home,
    away: rec.away,
    standingsTiebreakOrder: rec.standingsTiebreakOrder,
  };
}

export function buildNbaConferenceStandings(
  teamDocs: readonly Record<string, unknown>[]
): NbaConferenceStandingsBoard {
  const draft: DraftRow[] = [];
  for (const doc of teamDocs) {
    const row = draftFromTeamDoc(doc);
    if (row) draft.push(row);
  }

  const rankConference = (conference: NbaConferenceId): NbaConferenceStandingsRow[] => {
    const rows = draft.filter((r) => r.conference === conference);
    rows.sort((a, b) =>
      compareNbaStandingsSortRows(
        {
          id: a.teamId,
          wins: a.wins,
          losses: a.losses,
          standingsTiebreakOrder: a.standingsTiebreakOrder,
        },
        {
          id: b.teamId,
          wins: b.wins,
          losses: b.losses,
          standingsTiebreakOrder: b.standingsTiebreakOrder,
        }
      )
    );
    return rows.map((row, i) => {
      const { standingsTiebreakOrder: _tb, ...rest } = row;
      return { ...rest, rank: i + 1 };
    });
  };

  return {
    east: rankConference("east"),
    west: rankConference("west"),
  };
}
