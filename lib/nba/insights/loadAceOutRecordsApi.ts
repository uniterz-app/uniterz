/**
 * Firestore `nbaTeamAceOutRecords` の公開読み取り。
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  NBA_TEAM_ACE_OUT_RECORDS_COLLECTION,
  type NbaTeamAceOutRecord,
} from "@/lib/nba/insights/aceOutRecordTypes";
import {
  formatWl,
  wlTotal,
  wlWinPct,
  type WlRecord,
} from "@/lib/nba/insights/priorSeasonRecordTypes";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { TEAM_SHORT } from "@/lib/team-short";

export type NbaTeamAceOutRecordRow = NbaTeamAceOutRecord & {
  teamName: string;
  abbr: string;
  whenOutPct: number;
  whenOutHomePct: number;
  whenOutAwayPct: number;
  teamOverallPct: number;
  players: Array<
    NbaTeamAceOutRecord["players"][number] & {
      whenOutPct: number;
      whenOutHomePct: number;
      whenOutAwayPct: number;
    }
  >;
};

export type NbaTeamAceOutRecordsApiPayload = {
  ok: true;
  season: string;
  gameCount: number;
  teamCount: number;
  builtAtMs: number | null;
  source: "firestore" | "empty";
  updatedAt: string | null;
  teams: NbaTeamAceOutRecordRow[];
};

function pct(r: WlRecord): number {
  return Math.round(wlWinPct(r) * 1000) / 10;
}

function toRow(rec: NbaTeamAceOutRecord): NbaTeamAceOutRecordRow {
  const playersRaw =
    Array.isArray(rec.players) && rec.players.length > 0
      ? rec.players
      : [
          {
            playerId: rec.acePlayerId,
            playerName: rec.acePlayerName,
            ppg: rec.acePpg,
            gp: rec.aceGp,
            source: "auto" as const,
            whenOut: rec.whenOut,
            whenOutHome: rec.whenOutHome,
            whenOutAway: rec.whenOutAway,
            gamesOut: rec.gamesOut,
            whenOutPtsFor: rec.whenOutPtsFor ?? 0,
            whenOutPtsAgainst: rec.whenOutPtsAgainst ?? 0,
          },
        ];
  return {
    ...rec,
    teamName: NBA_TEAM_NAME_BY_ID[rec.teamId] ?? rec.teamId,
    abbr: (
      TEAM_SHORT[rec.teamId] ?? rec.teamId.replace(/^nba-/, "")
    ).toUpperCase(),
    whenOutPct: pct(rec.whenOut),
    whenOutHomePct: pct(rec.whenOutHome),
    whenOutAwayPct: pct(rec.whenOutAway),
    teamOverallPct: pct(rec.teamOverall),
    players: playersRaw.map((p) => ({
      ...p,
      whenOutPct: pct(p.whenOut),
      whenOutHomePct: pct(p.whenOutHome),
      whenOutAwayPct: pct(p.whenOutAway),
    })),
  };
}

export async function loadTeamAceOutRecordsApiPayload(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamAceOutRecordsApiPayload> {
  const snap = await db
    .collection(NBA_TEAM_ACE_OUT_RECORDS_COLLECTION)
    .doc(seasonKey.trim())
    .get();

  if (!snap.exists) {
    return {
      ok: true,
      season: seasonKey,
      gameCount: 0,
      teamCount: 0,
      builtAtMs: null,
      source: "empty",
      updatedAt: null,
      teams: [],
    };
  }

  const data = snap.data() as Record<string, unknown>;
  const teamsRaw = (data.teams ?? {}) as Record<string, NbaTeamAceOutRecord>;
  const teams = Object.values(teamsRaw)
    .map(toRow)
    .sort((a, b) => b.acePpg - a.acePpg);

  const updatedAt =
    data.updatedAt &&
    typeof (data.updatedAt as { toDate?: () => Date }).toDate === "function"
      ? (data.updatedAt as { toDate: () => Date }).toDate().toISOString()
      : null;

  return {
    ok: true,
    season: seasonKey,
    gameCount: Number(data.gameCount) || 0,
    teamCount: teams.length,
    builtAtMs: Number(data.builtAtMs) || null,
    source: "firestore",
    updatedAt,
    teams,
  };
}

export { formatWl, wlTotal };
