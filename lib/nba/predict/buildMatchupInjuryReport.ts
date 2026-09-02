/**
 * Firestore team injuries → 予想タブ用 NbaInjuryReport（対戦2チーム）。
 */
import { getNbaTeamNicknameById } from "@/lib/nba-team-names";
import {
  formatInjuryReturnEstimate,
} from "@/lib/nba/teamInjuries/injuryReasonDisplay";
import { teamInjuryStatusToPredictStatus } from "@/lib/nba/teamInjuries/injuryStatusDisplay";
import {
  sortInjuryEntries,
  type NbaInjuryEntry,
  type NbaInjuryReport,
  type NbaInjuryStatus,
} from "@/lib/predict/nbaInjuryReport";
import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { emptyInjuryReport } from "@/lib/predict/nbaInjuryReportPreviewMocks";

function splitPlayerName(name: string): {
  firstName: string;
  lastName: string;
} {
  const raw = name.trim();
  if (!raw || raw === "—") return { firstName: "—", lastName: "—" };
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
  entry: NbaTeamInjuryEntry,
  language: "ja" | "en" = "en"
): NbaInjuryEntry {
  const { firstName, lastName } = splitPlayerName(entry.name);
  return {
    player: {
      id: entry.playerId,
      firstName: firstName || "—",
      lastName: lastName || "—",
    },
    status: teamInjuryStatusToPredictStatus(entry.status) as NbaInjuryStatus,
    returnDate: formatInjuryReturnEstimate(entry.returnEstimate, language),
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
  language?: "ja" | "en";
}): NbaInjuryReport {
  const homeId = input.homeTeamId.trim();
  const awayId = input.awayTeamId.trim();
  const language = input.language ?? "en";
  if (!homeId || !awayId) {
    return emptyInjuryReport(homeId || "home", awayId || "away");
  }

  const homeEntries = sortInjuryEntries(
    input.homeEntries.map((e) => mapTeamInjuryEntryToPredict(e, language))
  );
  const awayEntries = sortInjuryEntries(
    input.awayEntries.map((e) => mapTeamInjuryEntryToPredict(e, language))
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
