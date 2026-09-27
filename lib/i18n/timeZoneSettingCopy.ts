/** プロフィール設定「時刻の表示」の文言（Web / Native 共用） */

import type { Language } from "@/lib/i18n/language";

type TimeZoneSettingCopy = {
  label: string;
  /** 例: "自動（端末: Los Angeles）" */
  auto: (deviceCity: string | null) => string;
  hint: string;
};

const COPY: Record<Language, TimeZoneSettingCopy> = {
  ja: {
    label: "時刻の表示",
    auto: (c) => (c ? `自動（端末: ${c}）` : "自動（端末）"),
    hint: "試合の日付・開始時刻をこのタイムゾーンで表示します",
  },
  en: {
    label: "Time zone",
    auto: (c) => (c ? `Automatic (device: ${c})` : "Automatic (device)"),
    hint: "Game dates and tip-off times are shown in this time zone.",
  },
  zh: {
    label: "时区",
    auto: (c) => (c ? `自动（设备: ${c}）` : "自动（设备）"),
    hint: "比赛日期和开赛时间将按此时区显示。",
  },
  ko: {
    label: "시간대",
    auto: (c) => (c ? `자동 (기기: ${c})` : "자동 (기기)"),
    hint: "경기 날짜와 시작 시간을 이 시간대로 표시합니다.",
  },
  es: {
    label: "Zona horaria",
    auto: (c) => (c ? `Automática (dispositivo: ${c})` : "Automática (dispositivo)"),
    hint: "Las fechas y horas de los partidos se muestran en esta zona horaria.",
  },
  de: {
    label: "Zeitzone",
    auto: (c) => (c ? `Automatisch (Gerät: ${c})` : "Automatisch (Gerät)"),
    hint: "Spieldaten und Anwurfzeiten werden in dieser Zeitzone angezeigt.",
  },
  fr: {
    label: "Fuseau horaire",
    auto: (c) => (c ? `Automatique (appareil : ${c})` : "Automatique (appareil)"),
    hint: "Les dates et heures des matchs sont affichées dans ce fuseau.",
  },
  ar: {
    label: "المنطقة الزمنية",
    auto: (c) => (c ? `تلقائي (الجهاز: ${c})` : "تلقائي (الجهاز)"),
    hint: "تُعرض تواريخ المباريات وأوقات انطلاقها بهذه المنطقة الزمنية.",
  },
  pt: {
    label: "Fuso horário",
    auto: (c) => (c ? `Automático (dispositivo: ${c})` : "Automático (dispositivo)"),
    hint: "Datas e horários dos jogos são exibidos neste fuso horário.",
  },
};

export function timeZoneSettingCopy(language: Language): TimeZoneSettingCopy {
  return COPY[language] ?? COPY.en;
}
