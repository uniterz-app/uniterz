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
    /** 締切前・未提出（自分）向けヒント */
    submitOpenHint: L(lang, {
      ja: "提出期限前です。ここからアワード／順位予想を提出できます。",
      en: "Deadline is still open. Submit awards or standings from here.",
      ko: "제출 기한 전입니다. 여기서 어워드/순위 예측을 제출할 수 있습니다.",
      zh: "提交尚未截止。可在此提交奖项或排名预测。",
      es: "El plazo sigue abierto. Envía premios o clasificación aquí.",
      pt: "O prazo ainda está aberto. Envie prêmios ou classificação aqui.",
      fr: "La date limite est ouverte. Envoyez trophées ou classement ici.",
    }),
    submitAwardsCta: L(lang, {
      ja: "アワード予想を提出",
      en: "Submit awards",
      ko: "어워드 예측 제출",
      zh: "提交奖项预测",
      es: "Enviar premios",
      pt: "Enviar prêmios",
      fr: "Envoyer les trophées",
    }),
    submitStandingsCta: L(lang, {
      ja: "順位予想を提出",
      en: "Submit standings",
      ko: "순위 예측 제출",
      zh: "提交排名预测",
      es: "Enviar clasificación",
      pt: "Enviar classificação",
      fr: "Envoyer le classement",
    }),
    missingAwardsHint: L(lang, {
      ja: "アワード予想はまだ未提出です。",
      en: "Awards prediction not submitted yet.",
      ko: "어워드 예측이 아직 제출되지 않았습니다.",
      zh: "尚未提交奖项预测。",
      es: "Aún no has enviado los premios.",
      pt: "Previsão de prêmios ainda não enviada.",
      fr: "Prédiction trophées pas encore envoyée.",
    }),
    missingStandingsHint: L(lang, {
      ja: "順位予想はまだ未提出です。",
      en: "Standings prediction not submitted yet.",
      ko: "순위 예측이 아직 제출되지 않았습니다.",
      zh: "尚未提交排名预测。",
      es: "Aún no has enviado la clasificación.",
      pt: "Previsão de classificação ainda não enviada.",
      fr: "Prédiction classement pas encore envoyée.",
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
