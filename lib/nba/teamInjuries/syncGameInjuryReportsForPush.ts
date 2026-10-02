/**
 * チーム injury + ロスター MPG → 直近試合 doc の injuryReport（プッシュ差分用）。
 * 平均出場 25 分以上の選手だけ残す。選手名・status は英語固定。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { loadUpcomingNbaGames } from "@/lib/nba/games/loadUpcomingNbaGames";
import { loadTeamInjuriesSnapshot } from "@/lib/nba/teamInjuries/loadTeamInjuriesSnapshot";
import { loadTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";

export const GAME_INJURY_PUSH_MPG_MIN = 25;
const LOOKAHEAD_MS = 12 * 60 * 60 * 1000;
const LOOKAHEAD_LIMIT = 80;

export type GamePushInjuryPlayer = {
  playerId: string;
  name: string;
  status: string;
  teamId: string;
  mpg: number;
};

export type GamePushInjuryReport = {
  players: GamePushInjuryPlayer[];
};

function teamIdFromSide(side: unknown): string {
  if (side && typeof side === "object") {
    const id = (side as { teamId?: unknown }).teamId;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return "";
}

function englishStatusLabel(status: NbaTeamInjuryEntry["status"]): string {
  switch (status) {
    case "out":
      return "Out";
    case "doubtful":
      return "Doubtful";
    case "questionable":
      return "Questionable";
    case "probable":
      return "Probable";
    case "day-to-day":
      return "Day-To-Day";
    default:
      return "Out";
  }
}

function buildMpgByPlayerId(
  teams: Record<string, { players: Array<{ id: string | number; mpg?: number }> }>
): Map<string, number> {
  const map = new Map<string, number>();
  for (const team of Object.values(teams)) {
    for (const p of team.players ?? []) {
      const id = String(p.id ?? "").trim();
      if (!id) continue;
      const mpg = typeof p.mpg === "number" && Number.isFinite(p.mpg) ? p.mpg : 0;
      map.set(id, mpg);
    }
  }
  return map;
}

function playersForTeam(input: {
  teamId: string;
  entries: NbaTeamInjuryEntry[];
  mpgByPlayer: Map<string, number>;
}): GamePushInjuryPlayer[] {
  const out: GamePushInjuryPlayer[] = [];
  for (const entry of input.entries) {
    const playerId = String(entry.playerId ?? "").trim();
    if (!playerId) continue;
    const mpg = input.mpgByPlayer.get(playerId) ?? 0;
    if (mpg < GAME_INJURY_PUSH_MPG_MIN) continue;
    const name = String(entry.name ?? "").trim() || playerId;
    out.push({
      playerId,
      name,
      status: englishStatusLabel(entry.status),
      teamId: input.teamId,
      mpg,
    });
  }
  return out;
}

export function formatGamePushInjuryDetail(
  report: unknown
): string | undefined {
  if (!report || typeof report !== "object") return undefined;
  const players = (report as { players?: unknown }).players;
  if (!Array.isArray(players) || players.length === 0) return undefined;
  const lines: string[] = [];
  for (const raw of players.slice(0, 2)) {
    if (!raw || typeof raw !== "object") continue;
    const name = String((raw as { name?: unknown }).name ?? "").trim();
    const status = String((raw as { status?: unknown }).status ?? "").trim();
    if (!name || !status) continue;
    lines.push(`${name}: ${status}`);
  }
  if (lines.length === 0) return undefined;
  const more = players.length > 2 ? " +more" : "";
  return `${lines.join(" · ")}${more}`;
}

export async function syncGameInjuryReportsForPush(
  db: Firestore,
  input: { seasonKey?: string; nowMs?: number } = {}
): Promise<{ gamesUpdated: number; playersKept: number }> {
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const nowMs = input.nowMs ?? Date.now();

  const [games, injuries, rosters] = await Promise.all([
    loadUpcomingNbaGames(db, {
      fromMs: nowMs,
      toMs: nowMs + LOOKAHEAD_MS,
      limit: LOOKAHEAD_LIMIT,
    }),
    loadTeamInjuriesSnapshot(db, seasonKey),
    loadTeamRostersSnapshot(db, seasonKey),
  ]);

  const mpgByPlayer = buildMpgByPlayerId(rosters.bundle.teams ?? {});
  const injuryTeams = injuries.bundle.teams ?? {};

  let gamesUpdated = 0;
  let playersKept = 0;

  for (const game of games) {
    if (game.data.final === true) continue;
    const homeTeamId =
      teamIdFromSide(game.data.home) ||
      (typeof game.data.homeTeamId === "string" ? game.data.homeTeamId : "");
    const awayTeamId =
      teamIdFromSide(game.data.away) ||
      (typeof game.data.awayTeamId === "string" ? game.data.awayTeamId : "");
    if (!homeTeamId || !awayTeamId) continue;

    const players = [
      ...playersForTeam({
        teamId: homeTeamId,
        entries: injuryTeams[homeTeamId] ?? [],
        mpgByPlayer,
      }),
      ...playersForTeam({
        teamId: awayTeamId,
        entries: injuryTeams[awayTeamId] ?? [],
        mpgByPlayer,
      }),
    ].sort((a, b) => a.playerId.localeCompare(b.playerId));

    const injuryReport: GamePushInjuryReport = { players };
    playersKept += players.length;

    await db.doc(`games/${game.id}`).set(
      {
        injuryReport,
        injuryReportSyncedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    gamesUpdated += 1;
  }

  return { gamesUpdated, playersKept };
}
