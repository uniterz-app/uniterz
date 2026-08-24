/**
 * Firestore team injuries → 予想タブ用 NbaInjuryReport（対戦2チーム）。
 */
import { getNbaTeamNicknameById } from "@/lib/nba-team-names";
import {
  sortInjuryEntries,
  type NbaInjuryEntry,
  type NbaInjuryReport,
  type NbaInjuryStatus,
} from "@/lib/predict/nbaInjuryReport";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { emptyInjuryReport } from "@/lib/predict/nbaInjuryReportPreviewMocks";

function mapStatus(status: NbaTeamInjuryEntry["status"]): NbaInjuryStatus {
  // スナップショットは out | gtd。UI トーンは Out / Questionable に寄せる。
  return status === "out" ? "Out" : "Questionable";
}

function splitPlayerName(name: string): {
  firstName: string;
  lastName: string;
} {
  const raw = name.trim();
  if (!raw || raw === "—") return { firstName: "—", lastName: "—" };
  // playerCardName 形式: "S.CURRY"
  const m = raw.match(/^([A-Za-z])\.(.+)$/);
  if (m) {
    return { firstName: m[1]!.toUpperCase(), lastName: m[2]!.trim() };
  }
  const parts = raw.split(/\s+/);
  if (parts.length >= 2) {
    return {
      firstName: parts[0]!,
      lastName: parts.slice(1).join(" "),
    };
  }
  return { firstName: "", lastName: raw };
}

export function mapTeamInjuryEntryToPredict(
  entry: NbaTeamInjuryEntry
): NbaInjuryEntry {
  const { firstName, lastName } = splitPlayerName(entry.name);
  return {
    player: {
      id: entry.playerId,
      firstName: firstName || "—",
      lastName: lastName || "—",
    },
    status: mapStatus(entry.status),
    returnDate: entry.returnEstimate,
    injuryDetail: entry.reason,
    description: entry.reason,
  };
}

export function buildMatchupInjuryReport(input: {
  homeTeamId: string;
  awayTeamId: string;
  homeEntries: NbaTeamInjuryEntry[];
  awayEntries: NbaTeamInjuryEntry[];
  asOfLabel?: string | null;
}): NbaInjuryReport {
  const homeId = input.homeTeamId.trim();
  const awayId = input.awayTeamId.trim();
  if (!homeId || !awayId) {
    return emptyInjuryReport(homeId || "home", awayId || "away");
  }

  const homeEntries = sortInjuryEntries(
    input.homeEntries.map(mapTeamInjuryEntryToPredict)
  );
  const awayEntries = sortInjuryEntries(
    input.awayEntries.map(mapTeamInjuryEntryToPredict)
  );

  return {
    asOfLabel: input.asOfLabel ?? null,
    home: {
      teamId: homeId,
      teamName: getNbaTeamNicknameById(homeId),
      side: "home",
      entries: homeEntries,
    },
    away: {
      teamId: awayId,
      teamName: getNbaTeamNicknameById(awayId),
      side: "away",
      entries: awayEntries,
    },
  };
}
