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
import {
  buildTeamPayrollsBundleFromContracts,
  buildTeamPayrollsBundleFromMultiYearContracts,
} from "@/lib/nba/teamPayroll/mapBdlToTeamPayroll";
import { resolveOptionForSeasonYear } from "@/lib/nba/playerDetail/mapBdlToPlayerContract";
import type { BdlTeamContractRow } from "@/lib/nba/bdl/fetchBdlTeamContracts";
import { writeTeamPayrollsSnapshot } from "@/lib/nba/teamPayroll/loadTeamPayrollSnapshot";
import { loadTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const NBA_TEAM_PAYROLL_INGEST_READY = true;

/** チームペイロールで取得する年数（今季 + 将来4年） */
const TEAM_PAYROLL_YEAR_HORIZON = 5;

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

  // ロスター取得（ロスターとペイロールの名簿を完全一致させるため）
  const rostersSnap = await loadTeamRostersSnapshot(db, seasonKey).catch(
    () => null
  );
  const rosterMap = new Map<string, NbaRosterPlayer[]>();
  if (rostersSnap && rostersSnap.ok && rostersSnap.bundle?.teams) {
    for (const [teamId, teamDoc] of Object.entries(rostersSnap.bundle.teams)) {
      if (Array.isArray(teamDoc.players)) {
        rosterMap.set(teamId, teamDoc.players);
      }
    }
  }

  const byTeamByYear = new Map<number, Map<string, BdlTeamContractRow[]>>();
  for (let y = seasonYear; y < seasonYear + TEAM_PAYROLL_YEAR_HORIZON; y += 1) {
    const byTeam = await fetchBdlAllTeamContracts(y);
    byTeamByYear.set(y, byTeam);
  }

  // プレイヤー契約スナップショット（BDL notes からのオプション情報）を取得
  const playerOptionMap = new Map<string, Map<number, "PO" | "TO" | "MO" | null>>();
  try {
    const playerContractsSnap = await db
      .collection("nbaPlayerContracts")
      .doc(seasonKey)
      .collection("players")
      .get();
    for (const doc of playerContractsSnap.docs) {
      const data = doc.data();
      const pId = String(data.playerId ?? doc.id).trim();
      const contract = data.contract;
      if (!pId || !contract) continue;

      const optMap = new Map<number, "PO" | "TO" | "MO" | null>();
      const notes = Array.isArray(contract.notes) ? contract.notes : [];
      const meta = {
        contractType: contract.contractType as string | null,
        signedUsing: contract.signedUsing as string | null,
        startYear:
          typeof contract.seasons?.[0]?.season === "number"
            ? (contract.seasons[0].season as number)
            : null,
        contractYears: contract.contractYears as number | null,
        draftRound:
          ((contract as Record<string, unknown>).draftRound as number | null) ??
          null,
        draftYear:
          ((contract as Record<string, unknown>).draftYear as number | null) ??
          null,
        playerId: pId,
      };

      // 各年を notes / CBA / playerId ルールで再解決（Firestore に残った誤 TO を上書き）
      const seasonYears = new Set<number>();
      if (Array.isArray(contract.seasons)) {
        for (const s of contract.seasons) {
          if (s && typeof s.season === "number") seasonYears.add(s.season);
        }
      }
      for (let y = seasonYear; y < seasonYear + TEAM_PAYROLL_YEAR_HORIZON; y += 1) {
        seasonYears.add(y);
      }

      for (const y of seasonYears) {
        // 再計算結果をそのまま採用（null も「オプションなし」。古い seasons.option は使わない）
        optMap.set(y, resolveOptionForSeasonYear(y, notes, meta));
      }

      if (optMap.size > 0) {
        playerOptionMap.set(pId, optMap);
      }
    }
  } catch (err) {
    console.warn("[nbaTeamPayrollIngest] player contracts load error:", err);
  }

  const { teams, salaryCap, taxLine } = buildTeamPayrollsBundleFromMultiYearContracts(
    byTeamByYear,
    seasonKey,
    rosterMap,
    playerOptionMap
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
