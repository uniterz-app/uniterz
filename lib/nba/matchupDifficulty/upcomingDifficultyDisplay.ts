/** UPCOMING 行の Matchup Difficulty 表示文字列（Web / Native 共通） */
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import type { NbaUpcomingMatchupDifficulty } from "@/lib/nba/matchupDifficulty/upcomingMatchupDifficulty";

/** サンプル少は `~72`（序盤の目安値） */
export function upcomingDifficultyValueText(d: NbaUpcomingMatchupDifficulty): string {
  return d.lowSample ? `~${d.value}` : String(d.value);
}

/** 相手名の後ろに添える薄字ラベル */
export function upcomingDifficultyRestTag(d: NbaUpcomingMatchupDifficulty): string | null {
  if (d.ownRest === "0" && d.oppRest !== "0") return "B2B";
  if (d.oppRest === "0" && d.ownRest !== "0") return "OPP B2B";
  return null;
}

export type UpcomingDifficultyLegend = {
  scale: string;
  tough: string;
  balanced: string;
  soft: string;
  lowSample: string;
};

/** UPCOMING サマリー下の凡例 */
export function upcomingDifficultyLegend(lang: LocalizedLang): UpcomingDifficultyLegend {
  return {
    scale: L(lang, {
      ja: "数字 = 試合の厳しさ（0〜100）。相手の強さ・ホーム/アウェイ・休養から算出、50 が平均",
      en: "Number = matchup difficulty (0–100) from opponent strength, home/away and rest. 50 = average",
      ko: "숫자 = 경기 난이도(0~100). 상대 전력·홈/원정·휴식 기준, 50 = 평균",
      zh: "数字 = 比赛难度（0–100），基于对手实力、主客场和休息，50 = 平均",
      es: "Número = dificultad (0–100) según rival, local/visitante y descanso. 50 = media",
      pt: "Número = dificuldade (0–100) por adversário, casa/fora e descanso. 50 = média",
      fr: "Chiffre = difficulté (0–100) selon l'adversaire, domicile/extérieur et repos. 50 = moyenne",
    }),
    tough: L(lang, { ja: "厳しい", en: "Tough", ko: "어려움", zh: "艰难", es: "Difícil", pt: "Difícil", fr: "Difficile" }),
    balanced: L(lang, { ja: "普通", en: "Even", ko: "보통", zh: "普通", es: "Normal", pt: "Normal", fr: "Moyen" }),
    soft: L(lang, { ja: "楽", en: "Soft", ko: "수월", zh: "轻松", es: "Fácil", pt: "Fácil", fr: "Facile" }),
    lowSample: L(lang, {
      ja: "~ = 今季の試合が少ない間の目安",
      en: "~ = early-season estimate",
      ko: "~ = 시즌 초반 추정치",
      zh: "~ = 赛季初估算",
      es: "~ = estimación de inicio de temporada",
      pt: "~ = estimativa de início de temporada",
      fr: "~ = estimation de début de saison",
    }),
  };
}
