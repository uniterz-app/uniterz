import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import { extractInjuryConciseLabel } from "@/lib/predict/nbaInjuryReport";

/**
 * BDL description → 表示用ラベル（JA は辞書ベースで要約、その他は EN 大文字略称のコンテンツ）。
 * 「詳細なし」など UI chrome は 7 言語。
 */
export function injuryReasonLabel(
  reason: string | null | undefined,
  language: LocalizedLang | string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  const trimmed = reason?.trim();
  if (!trimmed) {
    return L(lang, {
      ja: "詳細なし",
      en: "No detail",
      ko: "상세 없음",
      zh: "暂无详情",
      es: "Sin detalle",
      pt: "Sem detalhe",
      fr: "Aucun détail",
    });
  }
  // 部位・症状は ja / 非 ja(EN) のコンテンツ辞書
  return extractInjuryConciseLabel(trimmed, lang);
}

/** 長文ニュース（展開用）。concise と同一なら null */
export function injuryReasonFullNews(
  reason: string | null | undefined,
  language: LocalizedLang | string | null | undefined
): string | null {
  const lang = resolveLocalizedLang(language);
  const trimmed = reason?.trim();
  if (!trimmed || trimmed.length < 48) return null;
  const concise = extractInjuryConciseLabel(trimmed, lang);
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
  language: LocalizedLang | string | null | undefined
): string | null {
  const lang = resolveLocalizedLang(language);
  const raw = estimate?.trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();

  if (upper === "DAY-TO-DAY" || upper === "DAY TO DAY") {
    return L(lang, {
      ja: "試合時判断",
      en: "DAY-TO-DAY",
      ko: "경기 당일 판단",
      zh: "赛前再定",
      es: "DÍA A DÍA",
      pt: "DIA A DIA",
      fr: "JOUR PAR JOUR",
    });
  }

  if (lang === "ja") {
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

  if (upper.includes("WEEK")) {
    const n = raw.match(/(\d+)/)?.[1];
    return L(lang, {
      ja: n ? `${n}週間` : "数週間",
      en: n ? `${n} WEEK${n === "1" ? "" : "S"}` : "WEEKS",
      ko: n ? `${n}주` : "수주",
      zh: n ? `${n} 周` : "数周",
      es: n ? `${n} SEMANA${n === "1" ? "" : "S"}` : "SEMANAS",
      pt: n ? `${n} SEMANA${n === "1" ? "" : "S"}` : "SEMANAS",
      fr: n ? `${n} SEMAINE${n === "1" ? "" : "S"}` : "SEMAINES",
    });
  }

  return upper;
}
