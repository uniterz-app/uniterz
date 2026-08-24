/**
 * BDL contracts → Firestore `nbaTeamPayrolls/{seasonKey}`。
 * クライアントは BDL を叩かない。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  bdlSeasonYearFromSeasonKey,
  requireBdlNbaApiKey,
} from "@/lib/nba/bdl/bdlNbaEnv";
import { fetchBdlAllTeamContracts } from "@/lib/nba/bdl/fetchBdlTeamContracts";
import { buildTeamPayrollsBundleFromContracts } from "@/lib/nba/teamPayroll/mapBdlToTeamPayroll";
import { writeTeamPayrollsSnapshot } from "@/lib/nba/teamPayroll/loadTeamPayrollSnapshot";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const NBA_TEAM_PAYROLL_INGEST_READY = true;

export type NbaTeamPayrollIngestInput = {
  seasonKey?: string;
  seasonYear?: number;
};

export type NbaTeamPayrollIngestResult = {
  ok: true;
  seasonKey: string;
  seasonYear: number;
  teamCount: number;
  totalSalaryAllTeams: number;
};

export async function ingestNbaTeamPayrollFromBdl(
  db: Firestore,
  input: NbaTeamPayrollIngestInput = {}
): Promise<NbaTeamPayrollIngestResult> {
  requireBdlNbaApiKey();
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const seasonYear =
    typeof input.seasonYear === "number" && Number.isFinite(input.seasonYear)
      ? Math.trunc(input.seasonYear)
      : bdlSeasonYearFromSeasonKey(seasonKey);

  const byTeam = await fetchBdlAllTeamContracts(seasonYear);
  const { teams, salaryCap, taxLine } = buildTeamPayrollsBundleFromContracts(
    byTeam,
    seasonKey
  );

  const { teamCount } = await writeTeamPayrollsSnapshot(db, seasonKey, teams, {
    seasonYear,
    salaryCap,
    taxLine,
    source: "firestore",
    serverTimestamp: FieldValue.serverTimestamp(),
  });

  return {
    ok: true,
    seasonKey,
    seasonYear,
    teamCount,
    totalSalaryAllTeams: Object.values(teams).reduce(
      (s, t) => s + t.totalSalary,
      0
    ),
  };
}
