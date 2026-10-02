import {
  appTeamIdFromBdlInjuryRow,
  type BdlPlayerInjuryRow,
} from "@/lib/nba/bdl/fetchBdlPlayerInjuries";
import { playerCardName } from "@/lib/predict/nbaRoster";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaTeamInjuriesBundle } from "./teamInjuryTypes";
import { mapBdlInjuryStatus } from "./injuryStatusDisplay";

function playerName(row: BdlPlayerInjuryRow): string {
  const p = row.player;
  if (!p) return "—";
  const first = (p.first_name ?? "").trim();
  const last = (p.last_name ?? "").trim();
  if (first || last) {
    return playerCardName({ firstName: first, lastName: last });
  }
  return "—";
}

export function mapBdlRowToTeamInjury(
  row: BdlPlayerInjuryRow
): NbaTeamInjuryEntry | null {
  const status = mapBdlInjuryStatus(row.status);
  if (!status) return null;
  const playerId = row.player?.id;
  if (playerId == null) return null;
  const reason =
    typeof row.description === "string" && row.description.trim()
      ? row.description.trim()
      : null;
  const returnEstimate =
    typeof row.return_date === "string" && row.return_date.trim()
      ? row.return_date.trim()
      : null;
  return {
    playerId: String(playerId),
    name: playerName(row),
    status,
    reason,
    returnEstimate,
  };
}

const STATUS_SORT: Record<NbaTeamInjuryEntry["status"], number> = {
  out: 0,
  doubtful: 1,
  questionable: 2,
  "day-to-day": 3,
  probable: 4,
};

/** BDL player_injuries → teams[teamId][] bundle */
export function buildTeamInjuriesBundleFromBdl(
  rows: BdlPlayerInjuryRow[],
  seasonKey: string
): NbaTeamInjuriesBundle {
  const teams: Record<string, NbaTeamInjuryEntry[]> = {};

  for (const row of rows) {
    const teamId = appTeamIdFromBdlInjuryRow(row);
    if (!teamId) continue;
    const entry = mapBdlRowToTeamInjury(row);
    if (!entry) continue;
    if (!teams[teamId]) teams[teamId] = [];
    if (teams[teamId]!.some((e) => e.playerId === entry.playerId)) continue;
    teams[teamId]!.push(entry);
  }

  for (const list of Object.values(teams)) {
    list.sort((a, b) => {
      const byStatus = STATUS_SORT[a.status] - STATUS_SORT[b.status];
      if (byStatus !== 0) return byStatus;
      return a.name.localeCompare(b.name);
    });
  }

  return { seasonKey, teams };
}

/** 空チーム用（ingest 前の smoke / 未登録チーム） */
export function emptyTeamInjuries(): NbaTeamInjuryEntry[] {
  return [];
}
