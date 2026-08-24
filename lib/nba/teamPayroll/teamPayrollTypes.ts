import type { NbaTeamPayroll } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaStatsSnapshotSource } from "@/lib/nba/nbaStatsSnapshotCacheControl";

/** Firestore `nbaTeamPayrolls/{seasonKey}` の 1 チーム分 */
export type NbaTeamPayrollDocTeam = NbaTeamPayroll & {
  teamId: string;
};

export type NbaTeamPayrollsFirestoreDoc = {
  source?: unknown;
  updatedAt?: { toDate(): Date };
  seasonKey?: unknown;
  teamCount?: unknown;
  seasonYear?: unknown;
  salaryCap?: unknown;
  taxLine?: unknown;
  teams?: unknown;
};

export type NbaTeamPayrollsBundle = {
  seasonKey: string;
  seasonYear: number;
  salaryCap: number;
  taxLine: number;
  teams: Record<string, NbaTeamPayrollDocTeam>;
};

export type NbaTeamPayrollsSnapshotSource = NbaStatsSnapshotSource;

export type NbaTeamPayrollsApiPayload = {
  ok: true;
  season: string;
  bundle: NbaTeamPayrollsBundle;
  source: NbaTeamPayrollsSnapshotSource;
  updatedAt: string | null;
  teamCount: number;
};

export type NbaTeamPayrollApiPayload = {
  ok: true;
  season: string;
  teamId: string;
  payroll: NbaTeamPayrollDocTeam | null;
  source: NbaTeamPayrollsSnapshotSource;
  updatedAt: string | null;
};
