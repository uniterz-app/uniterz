/** Pro Insight「先週 TOP 5%」ブロックの文言 */
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";

const TITLE: UiStrings = {
  ja: "先週 TOP 5%",
  en: "LAST WEEK TOP 5%",
  ko: "지난주 TOP 5%",
  zh: "上周 TOP 5%",
  es: "TOP 5% SEMANA PASADA",
  pt: "TOP 5% SEMANA PASSADA",
  fr: "TOP 5% SEMAINE DERNIÈRE",
  de: "TOP 5% LETZTE WOCHE",
  ar: "أفضل 5% الأسبوع الماضي",
};

const NOTE: UiStrings = {
  ja: "先週の週間ランキング（Pick Up・合計ポイント）上位 5% の人が選んだ側",
  en: "Picks from last week's top 5% (Pick Up weekly ranking, total points)",
  ko: "지난주 주간 랭킹(Pick Up·총 포인트) 상위 5%의 예상",
  zh: "上周周榜（Pick Up·总积分）前 5% 用户的选择",
  es: "Picks del top 5% del ranking semanal pasado (Pick Up, puntos totales)",
  pt: "Palpites do top 5% do ranking semanal passado (Pick Up, pontos totais)",
  fr: "Choix du top 5% du classement hebdo dernier (Pick Up, points totaux)",
  de: "Tipps der Top 5% der letzten Wochenwertung (Pick Up, Gesamtpunkte)",
  ar: "توقعات أفضل 5% في ترتيب الأسبوع الماضي (Pick Up، مجموع النقاط)",
};

const COUNT_WITH_SIZE: UiStrings = {
  ja: "上位 5%（{size} 人）のうち {n} 人が予想",
  en: "{n} of the top 5% ({size}) picked this game",
  ko: "상위 5%({size}명) 중 {n}명이 예상",
  zh: "前 5%（{size} 人）中有 {n} 人预测",
  es: "{n} del top 5% ({size}) eligieron este partido",
  pt: "{n} do top 5% ({size}) palpitaram este jogo",
  fr: "{n} du top 5% ({size}) ont pronostiqué ce match",
  de: "{n} der Top 5% ({size}) haben getippt",
  ar: "{n} من أفضل 5% ({size}) توقعوا هذه المباراة",
};

const COUNT: UiStrings = {
  ja: "上位 5% のうち {n} 人が予想",
  en: "{n} of the top 5% picked this game",
  ko: "상위 5% 중 {n}명이 예상",
  zh: "前 5% 中有 {n} 人预测",
  es: "{n} del top 5% eligieron este partido",
  pt: "{n} do top 5% palpitaram este jogo",
  fr: "{n} du top 5% ont pronostiqué ce match",
  de: "{n} der Top 5% haben getippt",
  ar: "{n} من أفضل 5% توقعوا هذه المباراة",
};

const EMPTY: UiStrings = {
  ja: "まだ予想がありません",
  en: "No picks yet",
  ko: "아직 예상이 없습니다",
  zh: "暂无预测",
  es: "Aún no hay picks",
  pt: "Ainda não há palpites",
  fr: "Pas encore de pronostics",
  de: "Noch keine Tipps",
  ar: "لا توجد توقعات بعد",
};

export function smartMoneyMarketCopy(lang: LocalizedLang) {
  return {
    title: L(lang, TITLE),
    note: L(lang, NOTE),
    empty: L(lang, EMPTY),
    count: (n: number, size: number | null) =>
      (size != null ? L(lang, COUNT_WITH_SIZE) : L(lang, COUNT))
        .replace("{n}", String(n))
        .replace("{size}", String(size ?? "")),
  };
}
