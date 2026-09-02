import { extractInjuryConciseLabel } from "@/lib/predict/nbaInjuryReport";

/**
 * BDL description → 表示用ラベル（JA は辞書ベースで要約、EN は大文字略称）。
 */
export function injuryReasonLabel(
  reason: string | null | undefined,
  language: "ja" | "en"
): string {
  const trimmed = reason?.trim();
  if (!trimmed) {
    return language === "ja" ? "詳細なし" : "No detail";
  }
  return extractInjuryConciseLabel(trimmed, language);
}

/** 長文ニュース（展開用）。concise と同一なら null */
export function injuryReasonFullNews(
  reason: string | null | undefined,
  language: "ja" | "en"
): string | null {
  const trimmed = reason?.trim();
  if (!trimmed || trimmed.length < 48) return null;
  const concise = extractInjuryConciseLabel(trimmed, language);
  if (concise === trimmed) return null;
  return trimmed;
}

/**
 * @deprecated injuryReasonLabel を使用
 */
export function availabilityReasonDisplay(
  reason: string | null | undefined,
  isJa: boolean
): string {
  return injuryReasonLabel(reason, isJa ? "ja" : "en");
}

const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** return_date / BDL 文字列 → 表示用 */
export function formatInjuryReturnEstimate(
  estimate: string | null | undefined,
  language: "ja" | "en"
): string | null {
  const raw = estimate?.trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();

  if (language === "ja") {
    if (upper === "DAY-TO-DAY" || upper === "DAY TO DAY") return "試合時判断";
    if (upper.includes("WEEK")) {
      const n = raw.match(/(\d+)/)?.[1];
      return n ? `${n}週間` : "数週間";
    }
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      return `${Number(iso[2])}/${Number(iso[3])} 復帰見込み`;
    }
    const monDay = raw.match(/^([A-Za-z]{3,9})\s+(\d{1,2})(?:,?\s*(\d{4}))?$/);
    if (monDay) {
      const monIdx = MONTHS_EN.findIndex(
        (m) => m.toLowerCase() === monDay[1]!.slice(0, 3).toLowerCase()
      );
      if (monIdx >= 0) {
        return `${monIdx + 1}/${monDay[2]} 復帰見込み`;
      }
    }
    return raw;
  }

  if (upper === "DAY-TO-DAY" || upper === "DAY TO DAY") return "DAY-TO-DAY";
  return upper;
}
