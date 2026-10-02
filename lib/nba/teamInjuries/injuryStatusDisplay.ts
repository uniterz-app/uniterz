import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
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
  language: LocalizedLang | string | boolean | null | undefined
): string {
  const lang =
    typeof language === "boolean"
      ? language
        ? "ja"
        : "en"
      : resolveLocalizedLang(language);
  switch (status) {
    case "out":
      return L(lang, {
        ja: "欠場",
        en: "OUT",
        ko: "결장",
        zh: "缺阵",
        es: "OUT",
        pt: "OUT",
        fr: "OUT",
      });
    case "doubtful":
      return L(lang, {
        ja: "欠場見込み",
        en: "DOUBTFUL",
        ko: "결장 유력",
        zh: "大概率缺阵",
        es: "DOUBTFUL",
        pt: "DOUBTFUL",
        fr: "DOUBTFUL",
      });
    case "questionable":
      return L(lang, {
        ja: "試合時判断",
        en: "QUESTIONABLE",
        ko: "경기 당일 판단",
        zh: "赛前再定",
        es: "QUESTIONABLE",
        pt: "QUESTIONABLE",
        fr: "QUESTIONABLE",
      });
    case "probable":
      return L(lang, {
        ja: "出場見込み",
        en: "PROBABLE",
        ko: "출전 유력",
        zh: "大概率上场",
        es: "PROBABLE",
        pt: "PROBABLE",
        fr: "PROBABLE",
      });
    case "day-to-day":
      return L(lang, {
        ja: "日次判断",
        en: "DAY-TO-DAY",
        ko: "일일 판단",
        zh: "每日评估",
        es: "DAY-TO-DAY",
        pt: "DAY-TO-DAY",
        fr: "DAY-TO-DAY",
      });
    default:
      return L(lang, {
        ja: "試合時判断",
        en: "GTD",
        ko: "경기 당일 판단",
        zh: "赛前再定",
        es: "GTD",
        pt: "GTD",
        fr: "GTD",
      });
  }
}

export function formatTeamInjuryStatusShort(
  status: NbaTeamInjurySnapshotStatus,
  language: LocalizedLang | string | boolean | null | undefined
): string {
  const lang =
    typeof language === "boolean"
      ? language
        ? "ja"
        : "en"
      : resolveLocalizedLang(language);
  switch (status) {
    case "out":
      return L(lang, {
        ja: "欠場",
        en: "OUT",
        ko: "결장",
        zh: "缺阵",
        es: "OUT",
        pt: "OUT",
        fr: "OUT",
      });
    case "doubtful":
      return L(lang, {
        ja: "欠場見込",
        en: "DOUBT",
        ko: "결장 유력",
        zh: "大概率缺",
        es: "DOUBT",
        pt: "DOUBT",
        fr: "DOUBT",
      });
    case "questionable":
      return L(lang, {
        ja: "試合時判断",
        en: "QUES",
        ko: "당일 판단",
        zh: "赛前再定",
        es: "QUES",
        pt: "QUES",
        fr: "QUES",
      });
    case "probable":
      return L(lang, {
        ja: "出場見込",
        en: "PROB",
        ko: "출전 유력",
        zh: "大概率上",
        es: "PROB",
        pt: "PROB",
        fr: "PROB",
      });
    case "day-to-day":
      return L(lang, {
        ja: "日次",
        en: "DTD",
        ko: "일일",
        zh: "日评",
        es: "DTD",
        pt: "DTD",
        fr: "DTD",
      });
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
