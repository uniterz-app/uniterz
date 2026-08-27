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

      // 1. 各シーズンの明示 option（null の場合も含めてマップに登録）
      if (Array.isArray(contract.seasons)) {
        for (const s of contract.seasons) {
          if (s && typeof s.season === "number") {
            let sOpt = s.option ?? null;
            if (pId === "3547259") sOpt = null; // Jaden McDaniels has no option
            if (pId === "3547269") sOpt = null; // Immanuel Quickley has no option
            if (pId === "373") sOpt = null; // Jakob Poeltl has no option
            if (pId === "17896055") sOpt = null; // Scottie Barnes has no option
            if (pId === "3547287") sOpt = null; // Desmond Bane has no option
            if (pId === "210" && s.season === 2027) sOpt = "TO"; // Buddy Hield 2027-28 is Team Option
            if (pId === "17896078" && s.season === 2028) sOpt = "TO"; // Aaron Wiggins 2028-29 is Team Option
            if (pId === "85" && s.season === 2028) sOpt = "TO"; // Wendell Carter Jr. 2028-29 is Team Option
            if (pId === "17896073" && s.season === 2029) sOpt = "TO"; // Jalen Suggs 2029-30 is Team Option
            if (pId === "57" && s.season === 2027) sOpt = null; // Devin Booker 2027-28 has no option
            if (pId === "66" && s.season === 2028) sOpt = null; // Dillon Brooks 2028-29 has no option
            if (pId === "158" && s.season === 2028) sOpt = "PO"; // Dorian Finney-Smith 2028-29 is Player Option
            if (pId === "443" && s.season === 2027) sOpt = "PO"; // Klay Thompson 2027-28 is Player Option
            if (pId === "475" && s.season === 2028) sOpt = "PO"; // Andrew Wiggins 2028-29 is Player Option
            if (pId === "17896024") {
              if (s.season === 2027) sOpt = null; // Herb Jones 2027-28 has no option
              if (s.season === 2029) sOpt = "PO"; // Herb Jones 2029-30 is Player Option
            }
            if (pId === "1028047928" && s.season === 2028) sOpt = "TO"; // Quinten Post 2028-29 is Team Option
            if (pId === "324" && s.season === 2027) sOpt = "PO"; // Malik Monk 2027-28 is Player Option
            if (pId === "666743" && s.season === 2027) sOpt = null; // Terance Mann 2027-28 has no option
            if (pId === "462" && s.season === 2027) sOpt = "TO"; // Moritz Wagner 2027-28 is Team Option
            if (pId === "38017507" && s.season === 2027) sOpt = null; // Andrew Nembhard 2027-28 has no option
            if (pId === "493" && s.season === 2027) sOpt = null; // Ivica Zubac 2027-28 has no option
            if (pId === "44477085" && s.season === 2027) sOpt = "TO"; // Quenton Jackson 2027-28 is Team Option
            if (pId === "1028217445" || pId === "1057275262") {
              if (s.season === 2027 || s.season === 2028) sOpt = "TO"; // Traore 2027-28 and 2028-29 is Team Option
            }
            optMap.set(s.season, sOpt);
          }
        }
      }

      // 2. notes および契約規定から各シーズンのオプション（TO / PO / MO）を判定補完
      for (let y = seasonYear; y < seasonYear + TEAM_PAYROLL_YEAR_HORIZON; y += 1) {
        if (!optMap.has(y)) {
          const opt = resolveOptionForSeasonYear(y, notes, {
            contractType: contract.contractType,
            signedUsing: contract.signedUsing,
            startYear:
              typeof contract.seasons?.[0]?.season === "number"
                ? contract.seasons[0].season
                : null,
            contractYears: contract.contractYears,
            draftRound: (contract as Record<string, unknown>).draftRound as number | null ?? null,
            draftYear: (contract as Record<string, unknown>).draftYear as number | null ?? null,
          });
          if (opt) optMap.set(y, opt);
        }
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
