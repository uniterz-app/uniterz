/**
 * BDL contracts → チームペイロール（総年俸・内訳・リーグ順位）。
 * キャップ / タックスラインはシーズン定数（公式未発表の年は概算）。
 */
import type { BdlTeamContractRow } from "@/lib/nba/bdl/fetchBdlTeamContracts";
import { playerCardName } from "@/lib/predict/nbaRoster";
import type {
  NbaTeamPayroll,
  NbaTeamPayrollLine,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaTeamPayrollDocTeam } from "./teamPayrollTypes";

export function nbaSalaryCapLinesForSeason(seasonKey: string): {
  salaryCap: number;
  taxLine: number;
} {
  switch (seasonKey) {
    case "2024-25":
      return { salaryCap: 140_588_000, taxLine: 170_814_000 };
    case "2025-26":
      return { salaryCap: 154_647_000, taxLine: 189_308_000 };
    case "2026-27":
      return { salaryCap: 166_000_000, taxLine: 203_000_000 };
    default:
      return { salaryCap: 166_000_000, taxLine: 203_000_000 };
  }
}

function money(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) && v > 0 ? Math.round(v) : 0;
}

function estimateTaxBill(totalSalary: number, taxLine: number): number {
  const overTax = Math.max(0, totalSalary - taxLine);
  if (overTax <= 0) return 0;
  return Math.round(overTax * (1.5 + Math.min(2, overTax / 20_000_000)));
}

export function linesFromContractRows(
  rows: BdlTeamContractRow[]
): NbaTeamPayrollLine[] {
  const lines: NbaTeamPayrollLine[] = [];
  for (const row of rows) {
    const salary =
      money(row.cap_hit) || money(row.base_salary) || money(row.total_cash);
    if (salary <= 0) continue;
    const first = (row.player?.first_name ?? "").trim();
    const last = (row.player?.last_name ?? "").trim();
    const playerId = String(
      row.player_id ?? row.player?.id ?? row.id ?? ""
    ).trim();
    if (!playerId) continue;
    lines.push({
      playerId,
      name: playerCardName({
        firstName: first || "Player",
        lastName: last || playerId,
      }),
      salary,
      share: 0,
    });
  }
  lines.sort((a, b) => b.salary - a.salary || a.name.localeCompare(b.name));
  return lines;
}

export function buildTeamPayrollFromLines(
  teamId: string,
  linesIn: NbaTeamPayrollLine[],
  opts: { salaryCap: number; taxLine: number; leagueRank: number }
): NbaTeamPayrollDocTeam {
  const totalSalary = linesIn.reduce((s, l) => s + l.salary, 0);
  const lines =
    totalSalary > 0
      ? linesIn.map((l) => ({ ...l, share: l.salary / totalSalary }))
      : linesIn;
  const { salaryCap, taxLine, leagueRank } = opts;
  const payroll: NbaTeamPayroll = {
    totalSalary,
    leagueRank,
    salaryCap,
    taxLine,
    capSpace: salaryCap - totalSalary,
    taxBill: estimateTaxBill(totalSalary, taxLine),
    guaranteed: totalSalary,
    lines,
  };
  return { teamId, ...payroll };
}

export function buildTeamPayrollsBundleFromContracts(
  byTeam: Map<string, BdlTeamContractRow[]>,
  seasonKey: string
): {
  teams: Record<string, NbaTeamPayrollDocTeam>;
  salaryCap: number;
  taxLine: number;
} {
  const { salaryCap, taxLine } = nbaSalaryCapLinesForSeason(seasonKey);
  const totals: {
    teamId: string;
    total: number;
    lines: NbaTeamPayrollLine[];
  }[] = [];
  for (const [teamId, rows] of byTeam) {
    const lines = linesFromContractRows(rows);
    totals.push({
      teamId,
      total: lines.reduce((s, l) => s + l.salary, 0),
      lines,
    });
  }
  totals.sort((a, b) => b.total - a.total || a.teamId.localeCompare(b.teamId));
  const teams: Record<string, NbaTeamPayrollDocTeam> = {};
  totals.forEach((t, i) => {
    teams[t.teamId] = buildTeamPayrollFromLines(t.teamId, t.lines, {
      salaryCap,
      taxLine,
      leagueRank: i + 1,
    });
  });
  return { teams, salaryCap, taxLine };
}
