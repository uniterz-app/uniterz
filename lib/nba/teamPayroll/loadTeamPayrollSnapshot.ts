import type { Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type {
  NbaTeamPayrollApiPayload,
  NbaTeamPayrollDocTeam,
  NbaTeamPayrollsApiPayload,
  NbaTeamPayrollsBundle,
  NbaTeamPayrollsFirestoreDoc,
  NbaTeamPayrollsSnapshotSource,
} from "./teamPayrollTypes";
import {
  buildFuturePayrollYearsFromLines,
  nbaSalaryCapLinesForSeason,
  resolveApronStatus,
} from "./mapBdlToTeamPayroll";
import type {
  NbaApronStatus,
  NbaTeamFuturePayrollYear,
  NbaTeamPayroll,
  NbaTeamPayrollLine,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";

export const NBA_TEAM_PAYROLLS_COLLECTION = "nbaTeamPayrolls";

export function normalizeTeamPayrollsSeasonKey(
  raw: string | null | undefined
): string {
  const trimmed = (raw ?? "").trim();
  return trimmed || CURRENT_NBA_SEASON_KEY;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function resolveLines(raw: unknown): NbaTeamPayrollLine[] {
  if (!Array.isArray(raw)) return [];
  const out: NbaTeamPayrollLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const playerId = String(row.playerId ?? "").trim();
    const name = String(row.name ?? "").trim();
    const salary = isFiniteNumber(row.salary) ? row.salary : 0;
    const share = isFiniteNumber(row.share) ? row.share : 0;
    const isTwoWay = row.isTwoWay === true;
    const optionRaw = String(row.option ?? "").trim().toUpperCase();
    const option =
      optionRaw === "PO" || optionRaw.includes("PLAYER")
        ? ("PO" as const)
        : optionRaw === "TO" || optionRaw.includes("TEAM") || optionRaw.includes("CLUB")
        ? ("TO" as const)
        : optionRaw === "MO" || optionRaw.includes("MUTUAL")
        ? ("MO" as const)
        : null;
    if (!playerId || !name) continue;
    out.push({ playerId, name, salary, share, isTwoWay, option });
  }
  return out;
}

function resolveFutureYears(raw: unknown): NbaTeamFuturePayrollYear[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: NbaTeamFuturePayrollYear[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const seasonKey = String(row.seasonKey ?? "").trim();
    if (!seasonKey) continue;
    const lines = resolveLines(row.lines);
    out.push({
      seasonKey,
      seasonYear: isFiniteNumber(row.seasonYear) ? row.seasonYear : 0,
      salaryCap: isFiniteNumber(row.salaryCap) ? row.salaryCap : 0,
      taxLine: isFiniteNumber(row.taxLine) ? row.taxLine : 0,
      firstApron: isFiniteNumber(row.firstApron) ? row.firstApron : 0,
      secondApron: isFiniteNumber(row.secondApron) ? row.secondApron : 0,
      committedSalary: isFiniteNumber(row.committedSalary) ? row.committedSalary : 0,
      capSpace: isFiniteNumber(row.capSpace) ? row.capSpace : 0,
      taxSpace: isFiniteNumber(row.taxSpace) ? row.taxSpace : 0,
      firstApronSpace: isFiniteNumber(row.firstApronSpace) ? row.firstApronSpace : 0,
      secondApronSpace: isFiniteNumber(row.secondApronSpace) ? row.secondApronSpace : 0,
      apronStatus: (row.apronStatus as NbaApronStatus) ?? "under_cap",
      playerCount: isFiniteNumber(row.playerCount) ? row.playerCount : lines.length,
      lines,
    });
  }
  return out.length > 0 ? out : undefined;
}

function resolvePayrollTeam(
  teamId: string,
  raw: unknown,
  fallbackCap: number,
  fallbackTax: number,
  seasonKey: string = "2026-27"
): NbaTeamPayrollDocTeam | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const lines = resolveLines(row.lines);
  const totalSalary = isFiniteNumber(row.totalSalary)
    ? row.totalSalary
    : lines.reduce((s, l) => s + l.salary, 0);
  const capInfo = nbaSalaryCapLinesForSeason(seasonKey);
  const salaryCap = isFiniteNumber(row.salaryCap) && row.salaryCap > 0 ? row.salaryCap : (fallbackCap > 0 ? fallbackCap : capInfo.salaryCap);
  const taxLine = isFiniteNumber(row.taxLine) && row.taxLine > 0 ? row.taxLine : (fallbackTax > 0 ? fallbackTax : capInfo.taxLine);
  const firstApron = isFiniteNumber(row.firstApron) && row.firstApron > 0 ? row.firstApron : capInfo.firstApron;
  const secondApron = isFiniteNumber(row.secondApron) && row.secondApron > 0 ? row.secondApron : capInfo.secondApron;

  const capSpace = isFiniteNumber(row.capSpace) ? row.capSpace : salaryCap - totalSalary;
  const taxSpace = isFiniteNumber(row.taxSpace) ? row.taxSpace : taxLine - totalSalary;
  const firstApronSpace = isFiniteNumber(row.firstApronSpace) ? row.firstApronSpace : firstApron - totalSalary;
  const secondApronSpace = isFiniteNumber(row.secondApronSpace) ? row.secondApronSpace : secondApron - totalSalary;
  const apronStatus = (row.apronStatus as NbaApronStatus) ?? resolveApronStatus(totalSalary, { salaryCap, taxLine, firstApron, secondApron });

  const rawFutureYears = resolveFutureYears(row.futureYears);
  const futureYears =
    rawFutureYears && rawFutureYears.length > 0
      ? rawFutureYears.map((fy) => {
          const lines = fy.lines
            .filter((l) => l.salary > 0)
            .map((l) => ({ ...l, isTwoWay: false }));
          return {
            ...fy,
            lines,
            playerCount: lines.length,
          };
        })
      : lines.length > 0
      ? buildFuturePayrollYearsFromLines(seasonKey, lines)
      : [];

  const payroll: NbaTeamPayroll = {
    totalSalary,
    leagueRank: isFiniteNumber(row.leagueRank) ? row.leagueRank : 30,
    salaryCap,
    taxLine,
    firstApron,
    secondApron,
    apronStatus,
    capSpace,
    taxSpace,
    firstApronSpace,
    secondApronSpace,
    taxBill: isFiniteNumber(row.taxBill) ? row.taxBill : 0,
    guaranteed: isFiniteNumber(row.guaranteed) ? row.guaranteed : totalSalary,
    lines,
    futureYears,
  };
  return {
    teamId:
      typeof row.teamId === "string" && row.teamId.trim()
        ? row.teamId.trim()
        : teamId,
    ...payroll,
  };
}

export function resolveTeamPayrollsFromFirestore(
  data: NbaTeamPayrollsFirestoreDoc | undefined | null,
  seasonKey: string
): {
  bundle: NbaTeamPayrollsBundle;
  source: NbaTeamPayrollsSnapshotSource;
  updatedAt: Date | null;
  teamCount: number;
} | null {
  if (!data || typeof data.teams !== "object" || data.teams == null) {
    return null;
  }
  const salaryCap = isFiniteNumber(data.salaryCap) ? data.salaryCap : 0;
  const taxLine = isFiniteNumber(data.taxLine) ? data.taxLine : 0;
  const seasonYear = isFiniteNumber(data.seasonYear) ? data.seasonYear : 0;
  const teams: Record<string, NbaTeamPayrollDocTeam> = {};
  for (const [teamId, raw] of Object.entries(
    data.teams as Record<string, unknown>
  )) {
    const team = resolvePayrollTeam(teamId, raw, salaryCap, taxLine, seasonKey);
    if (!team) continue;
    teams[teamId] = team;
  }
  const teamCount = Object.keys(teams).length;
  if (teamCount < 1) return null;

  const sourceRaw =
    typeof data.source === "string" ? data.source : "firestore";
  const source: NbaTeamPayrollsSnapshotSource =
    sourceRaw === "mock" || sourceRaw === "empty" || sourceRaw === "firestore"
      ? sourceRaw
      : "firestore";

  return {
    bundle: { seasonKey, seasonYear, salaryCap, taxLine, teams },
    source,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
    teamCount,
  };
}

export async function loadTeamPayrollsSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaTeamPayrollsApiPayload> {
  const key = normalizeTeamPayrollsSeasonKey(seasonKey);
  const snap = await db.collection(NBA_TEAM_PAYROLLS_COLLECTION).doc(key).get();
  const resolved = snap.exists
    ? resolveTeamPayrollsFromFirestore(
        snap.data() as NbaTeamPayrollsFirestoreDoc,
        key
      )
    : null;

  if (!resolved) {
    return {
      ok: true,
      season: key,
      bundle: {
        seasonKey: key,
        seasonYear: 0,
        salaryCap: 0,
        taxLine: 0,
        teams: {},
      },
      source: "empty",
      updatedAt: null,
      teamCount: 0,
    };
  }

  return {
    ok: true,
    season: key,
    bundle: resolved.bundle,
    source: resolved.source,
    updatedAt: resolved.updatedAt?.toISOString() ?? null,
    teamCount: resolved.teamCount,
  };
}

export async function loadTeamPayroll(
  db: Firestore,
  seasonKey: string,
  teamId: string
): Promise<NbaTeamPayrollApiPayload> {
  const payload = await loadTeamPayrollsSnapshot(db, seasonKey);
  const id = teamId.trim();
  return {
    ok: true,
    season: payload.season,
    teamId: id,
    payroll: payload.bundle.teams[id] ?? null,
    source: payload.source,
    updatedAt: payload.updatedAt,
  };
}

export async function writeTeamPayrollsSnapshot(
  db: Firestore,
  seasonKey: string,
  teams: Record<string, NbaTeamPayrollDocTeam>,
  meta: {
    seasonYear: number;
    salaryCap: number;
    taxLine: number;
    source: NbaTeamPayrollsSnapshotSource;
    serverTimestamp: unknown;
  }
): Promise<{ teamCount: number }> {
  const key = normalizeTeamPayrollsSeasonKey(seasonKey);
  const teamCount = Object.keys(teams).length;
  await db.collection(NBA_TEAM_PAYROLLS_COLLECTION).doc(key).set({
    seasonKey: key,
    seasonYear: meta.seasonYear,
    salaryCap: meta.salaryCap,
    taxLine: meta.taxLine,
    source: meta.source,
    teamCount,
    teams,
    updatedAt: meta.serverTimestamp,
  });
  return { teamCount };
}
