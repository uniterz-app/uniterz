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

/** 同じ試合とみなす開始時刻の差（延期でない限り一致する） */
const SAME_GAME_TOLERANCE_MS = 6 * 60 * 60 * 1000;

export function mapTeamInjuryEntryToPredict(
  entry: NbaTeamInjuryEntry,
  language: "ja" | "en" = "en",
  tipAtMs?: number | null
): NbaInjuryEntry {
  const { firstName, lastName } = splitPlayerName(entry.name);
  const returnsThisGame =
    tipAtMs != null &&
    Number.isFinite(tipAtMs) &&
    entry.returnGameStartMs != null &&
    Number.isFinite(entry.returnGameStartMs) &&
    Math.abs(entry.returnGameStartMs - tipAtMs) <= SAME_GAME_TOLERANCE_MS;
  return {
    player: {
      id: entry.playerId,
      firstName: firstName || "—",
      lastName: lastName || "—",
    },
    status: teamInjuryStatusToPredictStatus(entry.status) as NbaInjuryStatus,
    returnDate: returnsThisGame
      ? language === "ja"
        ? "復帰見込み"
        : "EXPECTED BACK"
      : formatInjuryReturnEstimate(
          entry.returnEstimate,
          language,
          entry.returnGameStartMs
        ),
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
  /** この試合の開始。復帰予定がこの試合なら日付を省く */
  tipAtMs?: number | null;
}): NbaInjuryReport {
  const homeId = input.homeTeamId.trim();
  const awayId = input.awayTeamId.trim();
  const language = input.language ?? "en";
  if (!homeId || !awayId) {
    return emptyInjuryReport(homeId || "home", awayId || "away");
  }

  const homeEntries = sortInjuryEntries(
    input.homeEntries.map((e) =>
      mapTeamInjuryEntryToPredict(e, language, input.tipAtMs)
    )
  );
  const awayEntries = sortInjuryEntries(
    input.awayEntries.map((e) =>
      mapTeamInjuryEntryToPredict(e, language, input.tipAtMs)
    )
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
