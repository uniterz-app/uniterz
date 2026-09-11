/**
 * Pro Insight 未生成時の案内文。
 * 初回は試合前日 21:00 JST 頃 → ユーザー国のタイムゾーンで表示。
 * 文言は Pro Insight 正の 7 言語 + アプリ追加言語 (de/ar)。
 */
import type { Language } from "@/lib/i18n/language";
import { resolveUserTimezone } from "@/lib/i18n/countryTimezone";
import {
  TIMEZONE_JST,
  getZonedYMD,
  zonedTimeToUtcMs,
} from "@/lib/time/zonedTime";

/** 運用: 毎日 20:00 JST Batch → 21:00 JST までに初版 */
export const PRO_INSIGHT_FIRST_READY_HOUR_JST = 21;

const LOCALE_BY_LANG: Record<Language, string> = {
  ja: "ja-JP",
  en: "en-US",
  zh: "zh-CN",
  ko: "ko-KR",
  es: "es-ES",
  de: "de-DE",
  fr: "fr-FR",
  ar: "ar-SA",
  pt: "pt-BR",
};

function addCalendarDays(
  ymd: { year: number; month: number; day: number },
  delta: number
) {
  const utc = Date.UTC(ymd.year, ymd.month - 1, ymd.day + delta);
  const d = new Date(utc);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

/** tip の JST 暦日前日 21:00 JST。tip 不明時は任意日の 21:00 JST（時刻換算用） */
export function proInsightFirstReadyAtMs(tipAtMs?: number | null): number {
  if (typeof tipAtMs === "number" && Number.isFinite(tipAtMs) && tipAtMs > 0) {
    const tipYmd = getZonedYMD(new Date(tipAtMs), TIMEZONE_JST);
    const prev = addCalendarDays(tipYmd, -1);
    return zonedTimeToUtcMs({
      ...prev,
      hour: PRO_INSIGHT_FIRST_READY_HOUR_JST,
      minute: 0,
      timeZone: TIMEZONE_JST,
    });
  }
  return zonedTimeToUtcMs({
    year: 2026,
    month: 1,
    day: 15,
    hour: PRO_INSIGHT_FIRST_READY_HOUR_JST,
    minute: 0,
    timeZone: TIMEZONE_JST,
  });
}

function formatLocalClock(
  atMs: number,
  timeZone: string,
  language: Language
): string {
  const locale = LOCALE_BY_LANG[language] ?? "en-US";
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(atMs));
}

const COPY: Record<Language, (time: string) => string> = {
  ja: (time) => `試合前日の ${time} 頃に初回の Pro Insight が出ます`,
  en: (time) =>
    `First Pro Insight arrives around ${time} the day before tip-off`,
  ko: (time) => `경기 전날 ${time}경 첫 Pro Insight가 올라옵니다`,
  zh: (time) => `首份 Pro Insight 约在开赛前一天 ${time} 发布`,
  es: (time) =>
    `El primer Pro Insight sale hacia las ${time} el día antes del tip-off`,
  pt: (time) =>
    `O primeiro Pro Insight sai por volta de ${time} no dia anterior ao tip-off`,
  fr: (time) =>
    `Le premier Pro Insight arrive vers ${time} la veille du tip-off`,
  de: (time) =>
    `Das erste Pro Insight erscheint gegen ${time} am Tag vor dem Tip-off`,
  ar: (time) =>
    `يظهر أول Pro Insight حوالي ${time} في اليوم السابق لانطلاق المباراة`,
};

export function formatProInsightFirstReadyPending(input: {
  language: Language;
  countryCode?: string | null;
  tipAtMs?: number | null;
}): string {
  const language = input.language;
  const timeZone = resolveUserTimezone(input.countryCode, language);
  const atMs = proInsightFirstReadyAtMs(input.tipAtMs);
  const time = formatLocalClock(atMs, timeZone, language);
  return (COPY[language] ?? COPY.en)(time);
}
