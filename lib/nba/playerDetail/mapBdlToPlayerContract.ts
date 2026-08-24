/**
 * BDL player contracts → NbaPlayerContractSummary（残シーズン複数年）。
 * CURRENT に加え、署名済み UPCOMING EXTENSION も残年に含める。
 *
 * 年次行が今季しか無くても、aggregate の start/end（なければ free_agent_year）
 * から残年を埋める。SGA のように「残り1」へ落ちないようにする。
 */
import { TEAM_SHORT } from "@/lib/team-short";
import {
  appTeamIdFromBdlTeamId,
  rememberBdlTeamId,
} from "@/lib/nba/bdl/bdlNbaTeamIdMap";
import type {
  BdlPlayerContractAggregate,
  BdlPlayerContractRow,
} from "@/lib/nba/bdl/fetchBdlPlayerContracts";
import type {
  NbaPlayerContractSeason,
  NbaPlayerContractSummary,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import { bdlSeasonYearFromSeasonKey } from "@/lib/nba/bdl/bdlNbaEnv";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

function money(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) && v > 0 ? Math.round(v) : 0;
}

/** snake / camel 両対応（API 揺れ対策） */
function pickNum(obj: object | null | undefined, ...keys: string[]): number {
  if (!obj) return 0;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = money(rec[k]);
    if (v > 0) return v;
  }
  return 0;
}

function pickStr(obj: object | null | undefined, ...keys: string[]): string {
  if (!obj) return "";
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function faType(status: string | null | undefined): "UFA" | "RFA" | null {
  const s = String(status ?? "")
    .trim()
    .toUpperCase();
  if (s === "UFA" || s.includes("UNRESTRICTED")) return "UFA";
  if (s === "RFA" || s.includes("RESTRICTED")) return "RFA";
  return null;
}

function statusText(a: BdlPlayerContractAggregate): string {
  return pickStr(a, "contract_status", "contractStatus", "status").toUpperCase();
}

function startYearOf(a: BdlPlayerContractAggregate): number {
  return pickNum(a, "start_year", "startYear");
}

function endYearOf(a: BdlPlayerContractAggregate): number {
  return pickNum(a, "end_year", "endYear");
}

function freeAgentYearOf(
  a: BdlPlayerContractAggregate | null | undefined
): number {
  if (!a) return 0;
  return pickNum(a, "free_agent_year", "freeAgentYear");
}

function isExpiredStatus(a: BdlPlayerContractAggregate): boolean {
  const s = statusText(a);
  return s === "EXPIRED" || s.includes("EXPIRED");
}

function remainingAggregates(
  aggregates: readonly BdlPlayerContractAggregate[],
  currentYear: number
): BdlPlayerContractAggregate[] {
  return aggregates.filter((a) => {
    if (isExpiredStatus(a)) return false;
    const end = endYearOf(a);
    if (end > 0 && end < currentYear) return false;
    const start = startYearOf(a);
    const s = statusText(a);
    if (s.includes("CURRENT") || s.includes("ACTIVE")) {
      return end === 0 || end >= currentYear;
    }
    if (s.includes("UPCOMING") || s.includes("EXTENSION")) {
      // start/end が欠ける aggregate もある → FA 年で残判定
      return (
        end >= currentYear ||
        start >= currentYear ||
        freeAgentYearOf(a) > currentYear
      );
    }
    const fa = freeAgentYearOf(a);
    if (fa > 0) return fa > currentYear;
    return end >= currentYear;
  });
}

function coversYear(a: BdlPlayerContractAggregate, year: number): boolean {
  const start = startYearOf(a);
  const end = endYearOf(a);
  if (start > 0 && end > 0) return year >= start && year <= end;
  const fa = freeAgentYearOf(a);
  if (fa > 0 && start > 0) return year >= start && year < fa;
  if (fa > 0) return year < fa;
  return false;
}

function remainingYearsFromAggregates(
  remaining: readonly BdlPlayerContractAggregate[],
  currentYear: number
): number[] {
  const years = new Set<number>();
  for (const a of remaining) {
    const startRaw = startYearOf(a);
    const end = endYearOf(a);
    const fa = freeAgentYearOf(a);

    if (startRaw > 0 && end > 0) {
      const start = Math.max(startRaw, currentYear);
      for (let y = start; y <= end; y += 1) years.add(y);
      continue;
    }
    if (fa > currentYear) {
      const start = Math.max(startRaw > 0 ? startRaw : currentYear, currentYear);
      for (let y = start; y < fa; y += 1) years.add(y);
    }
  }
  return Array.from(years).sort((a, b) => a - b);
}

function pickCurrentAggregate(
  remaining: readonly BdlPlayerContractAggregate[],
  currentYear: number
): BdlPlayerContractAggregate | null {
  const covering = remaining.filter(
    (a) =>
      coversYear(a, currentYear) &&
      (statusText(a).includes("CURRENT") || statusText(a).includes("ACTIVE"))
  );
  if (covering.length > 0) {
    covering.sort((a, b) => endYearOf(b) - endYearOf(a));
    return covering[0] ?? null;
  }
  const anyCovering = remaining.filter((a) => coversYear(a, currentYear));
  anyCovering.sort((a, b) => endYearOf(b) - endYearOf(a));
  return anyCovering[0] ?? remaining[0] ?? null;
}

function pickFarthestAggregate(
  remaining: readonly BdlPlayerContractAggregate[]
): BdlPlayerContractAggregate | null {
  if (remaining.length === 0) return null;
  const sorted = [...remaining].sort((a, b) => {
    const aEnd = endYearOf(a) || freeAgentYearOf(a) - 1 || 0;
    const bEnd = endYearOf(b) || freeAgentYearOf(b) - 1 || 0;
    return bEnd - aEnd;
  });
  return sorted[0] ?? null;
}

function pickCoveringAggregate(
  remaining: readonly BdlPlayerContractAggregate[],
  year: number
): BdlPlayerContractAggregate | null {
  const covering = remaining.filter((a) => coversYear(a, year));
  if (covering.length === 0) return null;
  covering.sort(
    (a, b) =>
      pickNum(b, "average_salary", "averageSalary") -
      pickNum(a, "average_salary", "averageSalary")
  );
  return covering[0] ?? null;
}

function salaryFromAggregate(a: BdlPlayerContractAggregate | null): number {
  if (!a) return 0;
  const avg = pickNum(a, "average_salary", "averageSalary");
  if (avg > 0) return avg;
  const years = pickNum(a, "contract_years", "contractYears");
  const total = pickNum(a, "total_value", "totalValue");
  if (years > 0 && total > 0) return Math.round(total / years);
  const guaranteed = pickNum(a, "total_guaranteed", "totalGuaranteed");
  if (years > 0 && guaranteed > 0) return Math.round(guaranteed / years);
  return 0;
}

function pushNotes(target: string[], agg: BdlPlayerContractAggregate | null) {
  if (!agg) return;
  const signed = pickStr(agg, "signed_using", "signedUsing");
  if (signed && !target.includes(signed)) target.push(signed);
  const raw = (agg as { contract_notes?: unknown }).contract_notes;
  if (typeof raw === "string" && raw.trim()) {
    if (!target.includes(raw.trim())) target.push(raw.trim());
  } else if (Array.isArray(raw)) {
    for (const n of raw) {
      const t = String(n ?? "").trim();
      if (t && !target.includes(t)) target.push(t);
    }
  }
}

function resolveTeam(
  row: BdlPlayerContractRow,
  fallbackTeamId?: string | null
): { teamId: string; teamAbbr: string } {
  const tid = row.team?.id ?? row.team_id;
  const abbrRaw = row.team?.abbreviation;
  if (typeof tid === "number") rememberBdlTeamId(tid, abbrRaw);
  const appId =
    (typeof tid === "number" ? appTeamIdFromBdlTeamId(tid) : null) ??
    (fallbackTeamId?.trim() || null);
  const teamId = appId || "nba-unknown";
  const teamAbbr =
    (abbrRaw && String(abbrRaw).trim().toUpperCase()) ||
    TEAM_SHORT[teamId] ||
    "NBA";
  return { teamId, teamAbbr };
}

function seasonFromRow(
  row: BdlPlayerContractRow,
  fallbackTeamId?: string | null
): NbaPlayerContractSeason | null {
  const season = pickNum(row, "season");
  if (season <= 0) return null;
  const baseSalary =
    pickNum(row, "base_salary", "baseSalary") ||
    pickNum(row, "cap_hit", "capHit") ||
    pickNum(row, "total_cash", "totalCash");
  const capHit =
    pickNum(row, "cap_hit", "capHit") ||
    pickNum(row, "base_salary", "baseSalary") ||
    pickNum(row, "total_cash", "totalCash");
  if (baseSalary <= 0 && capHit <= 0) return null;
  const { teamId, teamAbbr } = resolveTeam(row, fallbackTeamId);
  return {
    season,
    baseSalary: baseSalary || capHit,
    capHit: capHit || baseSalary,
    // BDL `rank` は欠番が多いので使わない。ingest 後に年俸ソートで付ける。
    salaryRank: 0,
    teamId,
    teamAbbr,
    option: null,
  };
}

function synthesizeSeason(
  year: number,
  salary: number,
  fallbackTeamId?: string | null,
  template?: NbaPlayerContractSeason | null
): NbaPlayerContractSeason | null {
  const amount =
    salary > 0 ? salary : template?.capHit || template?.baseSalary || 0;
  if (amount <= 0) return null;
  const teamId = template?.teamId || fallbackTeamId?.trim() || "nba-unknown";
  const teamAbbr = template?.teamAbbr || TEAM_SHORT[teamId] || "NBA";
  return {
    season: year,
    baseSalary: amount,
    capHit: amount,
    salaryRank: 0,
    teamId,
    teamAbbr,
    option: null,
  };
}

/**
 * 年次行 + aggregate → UI 用サマリ。
 * 残シーズンは currentYear 以降。CURRENT と UPCOMING EXTENSION を結合する。
 */
export function mapBdlToPlayerContractSummary(
  seasonRows: readonly BdlPlayerContractRow[],
  aggregates: readonly BdlPlayerContractAggregate[],
  opts?: {
    seasonKey?: string;
    fallbackTeamId?: string | null;
  }
): NbaPlayerContractSummary | null {
  const seasonKey = (opts?.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  const currentYear = bdlSeasonYearFromSeasonKey(seasonKey);
  const remaining = remainingAggregates(aggregates, currentYear);
  const currentAgg = pickCurrentAggregate(remaining, currentYear);
  const farthestAgg = pickFarthestAggregate(remaining);
  const displayAgg = currentAgg ?? farthestAgg;

  const bySeason = new Map<number, NbaPlayerContractSeason>();
  for (const row of seasonRows) {
    const mapped = seasonFromRow(row, opts?.fallbackTeamId);
    if (!mapped) continue;
    if (mapped.season < currentYear) continue;
    const prev = bySeason.get(mapped.season);
    if (!prev || mapped.capHit >= prev.capHit) {
      bySeason.set(mapped.season, mapped);
    }
  }

  let windowYears = remainingYearsFromAggregates(remaining, currentYear);

  if (windowYears.length === 0 && bySeason.size > 0) {
    windowYears = Array.from(bySeason.keys()).sort((a, b) => a - b);
  }

  if (windowYears.length === 0 && farthestAgg) {
    const fa = freeAgentYearOf(farthestAgg);
    if (fa > currentYear) {
      for (let y = currentYear; y < fa; y += 1) windowYears.push(y);
    }
  }

  if (windowYears.length === 0) return null;

  const rowTemplate =
    bySeason.get(currentYear) ||
    Array.from(bySeason.values()).sort((a, b) => a.season - b.season)[0] ||
    null;

  const seasons: NbaPlayerContractSeason[] = [];
  for (const year of windowYears) {
    const fromRow = bySeason.get(year);
    if (fromRow) {
      seasons.push(fromRow);
      continue;
    }
    const covering = pickCoveringAggregate(remaining, year);
    const salary =
      salaryFromAggregate(covering) ||
      salaryFromAggregate(currentAgg) ||
      salaryFromAggregate(farthestAgg) ||
      rowTemplate?.capHit ||
      0;
    const synth = synthesizeSeason(
      year,
      salary,
      opts?.fallbackTeamId,
      rowTemplate
    );
    if (synth) seasons.push(synth);
  }

  if (seasons.length === 0) return null;

  const remainingSum = seasons.reduce(
    (sum, s) => sum + (s.capHit || s.baseSalary),
    0
  );
  const yearsRemaining = seasons.length;

  const freeAgencyYear =
    freeAgentYearOf(farthestAgg ?? displayAgg) ||
    (seasons.length > 0
      ? seasons[seasons.length - 1]!.season + 1
      : currentYear + 1);

  const notes: string[] = [];
  pushNotes(notes, currentAgg);
  if (farthestAgg && farthestAgg !== currentAgg) {
    pushNotes(notes, farthestAgg);
  }

  const spanYears =
    seasons.length > 0
      ? seasons[seasons.length - 1]!.season - seasons[0]!.season + 1
      : yearsRemaining;

  return {
    contractType:
      pickStr(displayAgg, "contract_type", "contractType") || "—",
    contractStatus:
      pickStr(displayAgg, "contract_status", "contractStatus") || "Active",
    contractYears:
      spanYears ||
      pickNum(displayAgg, "contract_years", "contractYears") ||
      yearsRemaining,
    yearsRemaining,
    freeAgencyYear,
    freeAgencyType: faType(
      pickStr(
        farthestAgg ?? displayAgg,
        "free_agent_status",
        "freeAgentStatus"
      )
    ),
    averageSalary:
      yearsRemaining > 0
        ? Math.round(remainingSum / yearsRemaining)
        : salaryFromAggregate(displayAgg),
    totalValue: remainingSum,
    remainingGuaranteed: remainingSum,
    notes,
    seasons,
  };
}
