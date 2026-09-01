import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";

export function teamFieldValue(
  row: NbaLeagueTeamStatRow | undefined,
  field: keyof NbaLeagueTeamStatRow
): number | null {
  if (!row) return null;
  const v = row[field];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** 1-based rank · ties → min rank slot */
export function rankTeamsByField(
  rows: NbaLeagueTeamStatRow[],
  field: keyof NbaLeagueTeamStatRow,
  higherIsBetter: boolean
): Map<string, number> {
  const scored = rows
    .map((r) => {
      const value = teamFieldValue(r, field);
      return value == null ? null : { teamId: r.teamId, value };
    })
    .filter((x): x is { teamId: string; value: number } => x != null);

  scored.sort((a, b) => {
    if (a.value === b.value) return a.teamId.localeCompare(b.teamId);
    return higherIsBetter ? b.value - a.value : a.value - b.value;
  });

  const out = new Map<string, number>();
  scored.forEach((row, i) => out.set(row.teamId, i + 1));
  return out;
}

export function teamRank(
  rows: NbaLeagueTeamStatRow[],
  teamId: string,
  field: keyof NbaLeagueTeamStatRow,
  higherIsBetter: boolean
): number | null {
  const map = rankTeamsByField(rows, field, higherIsBetter);
  return map.get(teamId) ?? null;
}

export function rankTeamsByComposite(
  rows: NbaLeagueTeamStatRow[],
  pick: (row: NbaLeagueTeamStatRow) => number | null,
  higherIsBetter: boolean
): Map<string, number> {
  const scored = rows
    .map((r) => {
      const value = pick(r);
      return value == null ? null : { teamId: r.teamId, value };
    })
    .filter((x): x is { teamId: string; value: number } => x != null);

  scored.sort((a, b) => {
    if (a.value === b.value) return a.teamId.localeCompare(b.teamId);
    return higherIsBetter ? b.value - a.value : a.value - b.value;
  });

  const out = new Map<string, number>();
  scored.forEach((row, i) => out.set(row.teamId, i + 1));
  return out;
}

export function compositeRank(
  rows: NbaLeagueTeamStatRow[],
  teamId: string,
  pick: (row: NbaLeagueTeamStatRow) => number | null,
  higherIsBetter: boolean
): number | null {
  return rankTeamsByComposite(rows, pick, higherIsBetter).get(teamId) ?? null;
}

export function avgFields(
  row: NbaLeagueTeamStatRow,
  fields: (keyof NbaLeagueTeamStatRow)[]
): number | null {
  const vals = fields
    .map((f) => teamFieldValue(row, f))
    .filter((v): v is number => v != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
