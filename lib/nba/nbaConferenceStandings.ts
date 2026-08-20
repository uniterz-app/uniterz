/**
 * カンファレンス順位表 — リーグ Team Stats スナップショット + teams doc から切る。
 * 試合ごとに 30 チーム分は保存しない。
 */
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import { compareNbaStandingsSortRows } from "@/lib/nba/compareNbaStandingsSort";
import { nbaRegularSeasonWinsLosses } from "@/lib/nbaRegularSeasonRecord";
import { lastGameAtMillis } from "@/lib/teamLastGameAt";
import type { NbaLeagueTeamStatsBundle } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import {
  computeStreakFromGames,
  getNbaTeamDetailPreview,
  type NbaTeamStreak,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";

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
};

export type NbaConferenceStandingsBoard = {
  east: NbaConferenceStandingsRow[];
  west: NbaConferenceStandingsRow[];
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

function overlayFromTeamDoc(raw: unknown): {
  wins?: number;
  losses?: number;
  home?: NbaStandingsWl;
  away?: NbaStandingsWl;
  last10?: NbaStandingsWl;
  streak?: NbaTeamStreak;
} {
  const d = asRecord(raw);
  if (!d) return {};
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
    wlFromWinsGames(d.homeWins, d.homeGames) ?? wlFromObject(nested?.home);
  const away =
    wlFromWinsGames(d.awayWins, d.awayGames) ?? wlFromObject(nested?.away);

  const results = lastGamesResults(d.lastGames);
  const last10Games = results.slice(-10);
  const last10: NbaStandingsWl | undefined =
    last10Games.length > 0
      ? {
          wins: last10Games.filter((g) => g.result === "W").length,
          losses: last10Games.filter((g) => g.result === "L").length,
        }
      : undefined;
  const streak =
    last10Games.length > 0 ? computeStreakFromGames(last10Games) : undefined;

  const hasRecord = rs.wins + rs.losses > 0;
  return {
    wins: hasRecord ? rs.wins : undefined,
    losses: hasRecord ? rs.losses : undefined,
    home: home ?? undefined,
    away: away ?? undefined,
    last10,
    streak,
  };
}

export function buildNbaConferenceStandings(
  bundle: NbaLeagueTeamStatsBundle,
  teamDocs: readonly Record<string, unknown>[] = []
): NbaConferenceStandingsBoard {
  const byId = new Map<string, Record<string, unknown>>();
  for (const doc of teamDocs) {
    const id = typeof doc.id === "string" ? doc.id : "";
    if (id) byId.set(id, doc);
  }

  const draft: Omit<NbaConferenceStandingsRow, "rank">[] = bundle.season.map(
    (row) => {
      const overlay = overlayFromTeamDoc(byId.get(row.teamId));
      const last10Row = bundle.last10.find((r) => r.teamId === row.teamId);
      const preview =
        overlay.home && overlay.away && overlay.streak
          ? null
          : getNbaTeamDetailPreview(row.teamId, bundle);
      const wins = overlay.wins ?? row.wins;
      const losses = overlay.losses ?? row.losses;
      const gp = wins + losses;
      return {
        teamId: row.teamId,
        teamName: row.teamName,
        conference: row.conference,
        wins,
        losses,
        winPct: gp > 0 ? wins / gp : row.winPct,
        streak: overlay.streak ?? preview?.streak ?? { kind: "W", count: 0 },
        last10: overlay.last10 ?? {
          wins: last10Row?.wins ?? preview?.last10Record.wins ?? 0,
          losses: last10Row?.losses ?? preview?.last10Record.losses ?? 0,
        },
        home: overlay.home ?? preview?.homeAwaySplit.home ?? { wins: 0, losses: 0 },
        away: overlay.away ?? preview?.homeAwaySplit.away ?? { wins: 0, losses: 0 },
      };
    }
  );

  const rankConference = (conference: NbaConferenceId): NbaConferenceStandingsRow[] => {
    const rows = draft.filter((r) => r.conference === conference);
    rows.sort((a, b) =>
      compareNbaStandingsSortRows(
        { id: a.teamId, wins: a.wins, losses: a.losses },
        { id: b.teamId, wins: b.wins, losses: b.losses }
      )
    );
    return rows.map((row, i) => ({ ...row, rank: i + 1 }));
  };

  return {
    east: rankConference("east"),
    west: rankConference("west"),
  };
}
