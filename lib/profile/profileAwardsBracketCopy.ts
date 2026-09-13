/**
 * プロフィール AWARDS / BRACKET タブ空状態（7言語）。
 * Web ProfileAwardsTab / ProfileViewV2 · Native ProfileAwardsTabNative / ProfileBracketTabNative 共有。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function profileAwardsBracketCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    noSeasonPredictions: L(lang, {
      ja: "提出済みのシーズン予想がありません",
      en: "No season predictions submitted",
      ko: "제출된 시즌 예측이 없습니다",
      zh: "尚无已提交的赛季预测",
      es: "No hay predicciones de temporada",
      pt: "Nenhuma previsão de temporada",
      fr: "Aucune prédiction de saison",
    }),
    noPlayoffBracket: L(lang, {
      ja: "提出済みのプレーオフブラケットがありません",
      en: "No playoff bracket submitted",
      ko: "제출된 플레이오프 브래킷이 없습니다",
      zh: "尚未提交季后赛对阵表",
      es: "No hay bracket de playoffs enviado",
      pt: "Nenhum bracket de playoffs enviado",
      fr: "Aucun bracket playoffs soumis",
    }),
    signInRequired: L(lang, {
      ja: "ログインが必要です",
      en: "Sign in required",
      ko: "로그인이 필요합니다",
      zh: "需要登录",
      es: "Inicia sesión",
      pt: "Faça login",
      fr: "Connexion requise",
    }),
  };
}
