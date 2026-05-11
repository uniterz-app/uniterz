import type { Language } from "./language";

/**
 * 国コード → 代表的な IANA タイムゾーン。
 * ユーザーが国を選択している場合はそのタイムゾーンで試合時間を表示する。
 */
export const TIMEZONE_BY_COUNTRY: Record<string, string> = {
  US: "America/New_York",
  JP: "Asia/Tokyo",
  CN: "Asia/Shanghai",
  KR: "Asia/Seoul",
  TW: "Asia/Taipei",
  HK: "Asia/Hong_Kong",
  SG: "Asia/Singapore",
  TH: "Asia/Bangkok",
  VN: "Asia/Ho_Chi_Minh",
  ID: "Asia/Jakarta",
  PH: "Asia/Manila",
  MY: "Asia/Kuala_Lumpur",
  IN: "Asia/Kolkata",
  AU: "Australia/Sydney",
  NZ: "Pacific/Auckland",
  GB: "Europe/London",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  ES: "Europe/Madrid",
  IT: "Europe/Rome",
  NL: "Europe/Amsterdam",
  SE: "Europe/Stockholm",
  NO: "Europe/Oslo",
  DK: "Europe/Copenhagen",
  PL: "Europe/Warsaw",
  TR: "Europe/Istanbul",
  AE: "Asia/Dubai",
  SA: "Asia/Riyadh",
  BR: "America/Sao_Paulo",
  MX: "America/Mexico_City",
  CA: "America/Toronto",
  AR: "America/Argentina/Buenos_Aires",
  CL: "America/Santiago",
  CO: "America/Bogota",
  PE: "America/Lima",
  EG: "Africa/Cairo",
  NG: "Africa/Lagos",
  ZA: "Africa/Johannesburg",
  KE: "Africa/Nairobi",
  MA: "Africa/Casablanca",
  GH: "Africa/Accra",
  RU: "Europe/Moscow",
  UA: "Europe/Kyiv",
  AT: "Europe/Vienna",
  CH: "Europe/Zurich",
  BE: "Europe/Brussels",
  PT: "Europe/Lisbon",
  GR: "Europe/Athens",
  CZ: "Europe/Prague",
  RO: "Europe/Bucharest",
  HU: "Europe/Budapest",
  FI: "Europe/Helsinki",
  IE: "Europe/Dublin",
  IL: "Asia/Jerusalem",
  JO: "Asia/Amman",
  IQ: "Asia/Baghdad",
  IR: "Asia/Tehran",
  PK: "Asia/Karachi",
  BD: "Asia/Dhaka",
  MM: "Asia/Yangon",
  KH: "Asia/Phnom_Penh",
  LA: "Asia/Vientiane",
  NP: "Asia/Kathmandu",
  LK: "Asia/Colombo",
  QA: "Asia/Qatar",
  BH: "Asia/Bahrain",
  KW: "Asia/Kuwait",
  OM: "Asia/Muscat",
};

export const FALLBACK_TIMEZONE_BY_LANGUAGE: Record<Language, string> = {
  ja: "Asia/Tokyo",
  en: "America/New_York",
  zh: "Asia/Shanghai",
  ko: "Asia/Seoul",
  es: "Europe/Madrid",
  de: "Europe/Berlin",
  fr: "Europe/Paris",
  ar: "Asia/Riyadh",
  pt: "America/Sao_Paulo",
};

/**
 * ユーザーのタイムゾーンを解決する。
 * 国コードがあればそれを優先、なければ言語から推定。
 */
export function resolveUserTimezone(
  countryCode: string | null | undefined,
  language: Language,
): string {
  if (countryCode) {
    const tz = TIMEZONE_BY_COUNTRY[countryCode.toUpperCase()];
    if (tz) return tz;
  }
  return FALLBACK_TIMEZONE_BY_LANGUAGE[language];
}
