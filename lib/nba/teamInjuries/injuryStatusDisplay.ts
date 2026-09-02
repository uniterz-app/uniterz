import type { NbaTeamInjuryEntry } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaPlayerAvailabilityStatus } from "@/lib/predict/nbaPlayerDetailPreviewMocks";

/** Firestore スナップショットの injury ステータス（Available 以外） */
export type NbaTeamInjurySnapshotStatus = NbaTeamInjuryEntry["status"];

const SNAPSHOT_STATUSES = new Set<string>([
  "out",
  "doubtful",
  "questionable",
  "probable",
  "day-to-day",
  /** 旧 ingest 互換 */
  "gtd",
]);

export function normalizeTeamInjurySnapshotStatus(
  raw: unknown
): NbaTeamInjurySnapshotStatus | null {
  const key = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!key || !SNAPSHOT_STATUSES.has(key)) return null;
  if (key === "gtd") return "questionable";
  return key as NbaTeamInjurySnapshotStatus;
}

/** BDL → スナップショット status */
export function mapBdlInjuryStatus(
  raw: string | null | undefined
): NbaTeamInjurySnapshotStatus | null {
  const key = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!key || key === "available" || key === "healthy") return null;
  if (key === "out") return "out";
  if (key === "doubtful") return "doubtful";
  if (key === "questionable") return "questionable";
  if (key === "probable") return "probable";
  if (key === "day-to-day" || key === "day to day") return "day-to-day";
  if (key === "gtd") return "questionable";
  return "questionable";
}

export function isOutOrQuestionableInjury(
  status: NbaTeamInjurySnapshotStatus
): boolean {
  return status !== "probable";
}

/** プレイヤー詳細 availability（out | gtd） */
export function teamInjuryStatusToAvailability(
  status: NbaTeamInjurySnapshotStatus
): NbaPlayerAvailabilityStatus {
  if (status === "out" || status === "doubtful") return "out";
  return "gtd";
}

export function teamInjuryStatusColor(status: NbaTeamInjurySnapshotStatus): string {
  if (status === "out" || status === "doubtful") return "#FF2D78";
  if (status === "probable") return "#00E5FF";
  return "#F5C518";
}

export function formatTeamInjuryStatus(
  status: NbaTeamInjurySnapshotStatus,
  isJa: boolean
): string {
  if (isJa) {
    switch (status) {
      case "out":
        return "欠場";
      case "doubtful":
        return "欠場見込み";
      case "questionable":
        return "試合時判断";
      case "probable":
        return "出場見込み";
      case "day-to-day":
        return "日次判断";
      default:
        return "試合時判断";
    }
  }
  switch (status) {
    case "out":
      return "OUT";
    case "doubtful":
      return "DOUBTFUL";
    case "questionable":
      return "QUESTIONABLE";
    case "probable":
      return "PROBABLE";
    case "day-to-day":
      return "DAY-TO-DAY";
    default:
      return "GTD";
  }
}

export function formatTeamInjuryStatusShort(
  status: NbaTeamInjurySnapshotStatus,
  isJa: boolean
): string {
  if (isJa) {
    switch (status) {
      case "out":
        return "欠場";
      case "doubtful":
        return "欠場見込";
      case "questionable":
        return "試合時判断";
      case "probable":
        return "出場見込";
      case "day-to-day":
        return "日次";
      default:
        return "GTD";
    }
  }
  switch (status) {
    case "out":
      return "OUT";
    case "doubtful":
      return "DOUBT";
    case "questionable":
      return "QUES";
    case "probable":
      return "PROB";
    case "day-to-day":
      return "DTD";
    default:
      return "GTD";
  }
}

/** 予想タブ NbaInjuryStatus 文字列へ */
export function teamInjuryStatusToPredictStatus(
  status: NbaTeamInjurySnapshotStatus
): string {
  switch (status) {
    case "out":
      return "Out";
    case "doubtful":
      return "Doubtful";
    case "questionable":
      return "Questionable";
    case "probable":
      return "Probable";
    case "day-to-day":
      return "Day-To-Day";
    default:
      return "Questionable";
  }
}
