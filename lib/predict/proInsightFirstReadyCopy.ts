/**
 * Pro Insight 未生成時の案内文。
 * 初回は開始 24 時間前から（連戦の 2 試合目は 24h 窓の外なのでその前には出ない）。
 * 文言は Pro Insight 正の 7 言語 + アプリ追加言語 (de/ar)。
 */
import type { Language } from "@/lib/i18n/language";
import { resolveUserTimezone } from "@/lib/i18n/countryTimezone";
import { TIMEZONE_JST, zonedTimeToUtcMs } from "@/lib/time/zonedTime";

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

/** refreshPredictKits の 24h 窓と同じ。ここはクライアント用なので admin モジュールを引かない */
const HORIZON_MS = 24 * 3_600_000;

/** 開始の 24 時間前。tip 不明時はダミー日の 0:00 JST（時刻換算用） */
export function proInsightFirstReadyAtMs(tipAtMs?: number | null): number {
  if (typeof tipAtMs === "number" && Number.isFinite(tipAtMs) && tipAtMs > 0) {
    return tipAtMs - HORIZON_MS;
  }
  return zonedTimeToUtcMs({
    year: 2026,
    month: 1,
    day: 15,
    hour: 0,
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

const COPY_FROM: Record<Language, (time: string) => string> = {
  ja: (time) => `開始の 24 時間前（${time} 頃）から出ます`,
  en: (time) => `Pro Pick is available from about ${time} (24 hours before tip-off)`,
  ko: (time) => `팁오프 24시간 전（${time}경）부터 나옵니다`,
  zh: (time) => `开赛 24 小时前（约 ${time}）起提供`,
  es: (time) => `Sale desde las ${time} (24 h antes del tip-off)`,
  pt: (time) => `Sai a partir das ${time} (24 h antes do tip-off)`,
  fr: (time) => `Disponible vers ${time} (24 h avant le tip-off)`,
  de: (time) => `Ab ca. ${time} (24 Std. vor Tip-off)`,
  ar: (time) => `يتوفر حوالي ${time}（قبل 24 ساعة من الانطلاق）`,
};

const COPY_SOON: Record<Language, string> = {
  ja: "準備でき次第出ます",
  en: "Pro Pick will appear when it is ready",
  ko: "준비되는 대로 나옵니다",
  zh: "准备好后即显示",
  es: "Aparecerá en cuanto esté listo",
  pt: "Aparece assim que estiver pronto",
  fr: "Il apparaitra des qu'il sera pret",
  de: "Erscheint, sobald es bereit ist",
  ar: "يظهر فور جهوزه",
};

export function formatProInsightFirstReadyPending(input: {
  language: Language;
  countryCode?: string | null;
  /** 表示 TZ（`useUserLanguage().timeZone`）。省略時は登録国ベース */
  timeZone?: string | null;
  tipAtMs?: number | null;
}): string {
  const language = input.language;
  const timeZone =
    input.timeZone || resolveUserTimezone(input.countryCode, language);
  const tipAtMs = input.tipAtMs;
  if (
    typeof tipAtMs === "number" &&
    Number.isFinite(tipAtMs) &&
    tipAtMs > 0 &&
    Date.now() >= tipAtMs - HORIZON_MS
  ) {
    return COPY_SOON[language] ?? COPY_SOON.en;
  }
  const atMs = proInsightFirstReadyAtMs(tipAtMs);
  const time = formatLocalClock(atMs, timeZone, language);
  return (COPY_FROM[language] ?? COPY_FROM.en)(time);
}
