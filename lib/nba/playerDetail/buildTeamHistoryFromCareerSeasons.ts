/**
 * キャリア Regular の所属から経歴（stint）を組み立てる。
 * 連続する同一 teamId を 1 区間に潰し、最終区間は現所属（toSeason: null）。
 * シーズン途中移籍は BDL の「その季の主所属」1 行前提（試合メタ由来）。
 */
import type {
  NbaPlayerCareerSeasonRow,
  NbaPlayerTeamStint,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";

function isUsableTeam(row: NbaPlayerCareerSeasonRow): boolean {
  const id = (row.teamId ?? "").trim();
  if (!id || id === "nba-unknown") return false;
  const abbr = (row.teamAbbr ?? "").trim();
  return abbr.length > 0 && abbr !== "NBA";
}

export function buildTeamHistoryFromCareerSeasons(
  rows: readonly NbaPlayerCareerSeasonRow[] | null | undefined
): NbaPlayerTeamStint[] {
  if (!rows || rows.length === 0) return [];

  const sorted = [...rows]
    .filter(isUsableTeam)
    .sort((a, b) => a.seasonStart - b.seasonStart);
  if (sorted.length === 0) return [];

  type Open = {
    teamId: string;
    teamAbbr: string;
    fromSeason: number;
    lastSeason: number;
  };

  const first = sorted[0]!;
  let open: Open = {
    teamId: first.teamId,
    teamAbbr: first.teamAbbr,
    fromSeason: first.seasonStart,
    lastSeason: first.seasonStart,
  };
  const closed: NbaPlayerTeamStint[] = [];

  for (let i = 1; i < sorted.length; i += 1) {
    const row = sorted[i]!;
    if (row.teamId === open.teamId) {
      open.lastSeason = row.seasonStart;
      if (row.teamAbbr) open.teamAbbr = row.teamAbbr;
      continue;
    }
    closed.push({
      teamId: open.teamId,
      teamAbbr: open.teamAbbr,
      fromSeason: open.fromSeason,
      toSeason: open.lastSeason,
    });
    open = {
      teamId: row.teamId,
      teamAbbr: row.teamAbbr,
      fromSeason: row.seasonStart,
      lastSeason: row.seasonStart,
    };
  }

  closed.push({
    teamId: open.teamId,
    teamAbbr: open.teamAbbr,
    fromSeason: open.fromSeason,
    toSeason: null,
  });
  return closed;
}
