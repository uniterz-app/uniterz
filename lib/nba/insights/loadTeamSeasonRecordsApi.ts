/**
 * Firestore `nbaTeamSeasonRecords/{seasonKey}` の公開読み取り。
 */
import type { Firestore } from "firebase-admin/firestore";
import { NBA_TEAM_SEASON_RECORDS_COLLECTION } from "@/lib/nba/insights/loadPriorSeasonTeamRecords";
import type {
  NbaTeamSeasonRecordSplit,
  NbaTeamSeasonRecordsBundle,
  WlRecord,
} from "@/lib/nba/insights/priorSeasonRecordTypes";
import { formatWl, wlTotal, wlWinPct } from "@/lib/nba/insights/priorSeasonRecordTypes";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { TEAM_SHORT } from "@/lib/team-short";

export type NbaTeamSeasonRecordRow = NbaTeamSeasonRecordSplit & {
  teamName: string;
  abbr: string;
  overallPct: number;
  homePct: number;
  awayPct: number;
  vsOver500Pct: number;
  vsUnder500Pct: number;
  vsConfTop6Pct: number;
};

export type NbaTeamSeasonRecordsApiPayload = {
  ok: true;
  season: string;
  gameCount: number;
  teamCount: number;
  builtAtMs: number | null;
  source: "firestore" | "empty";
  updatedAt: string | null;
  teams: NbaTeamSeasonRecordRow[];
};

function pct(r: WlRecord): number {
  return Math.round(wlWinPct(r) * 1000) / 10;
}

function toRow(split: NbaTeamSeasonRecordSplit): NbaTeamSeasonRecordRow {
  return {
    ...split,
    teamName: NBA_TEAM_NAME_BY_ID[split.teamId] ?? split.teamId,
    abbr: (TEAM_SHORT[split.teamId] ?? split.teamId.replace(/^nba-/, "")).toUpperCase(),
    overallPct: pct(split.overall),
    homePct: pct(split.home),
    awayPct: pct(split.away),
    vsOver500Pct: pct(split.vsOver500),
    vsUnder500Pct: pct(split.vsUnder500),
    vsConfTop6Pct: pct(split.vsConfTop6),
  };
}

export async function loadTeamSeasonRecordsApiPayload(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamSeasonRecordsApiPayload> {
  const snap = await db
    .collection(NBA_TEAM_SEASON_RECORDS_COLLECTION)
    .doc(seasonKey)
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
  const teamsRaw = (data.teams ?? {}) as Record<string, NbaTeamSeasonRecordSplit>;
  const teams = Object.values(teamsRaw)
    .map(toRow)
    .sort((a, b) => {
      if (b.overall.wins !== a.overall.wins) return b.overall.wins - a.overall.wins;
      return a.overall.losses - b.overall.losses;
    });

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
