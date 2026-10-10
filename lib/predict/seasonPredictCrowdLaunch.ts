/**
 * 締切前「みんなの予想が見られるようになりました」起動時モーダル（Web / Native 共有）。
 * 提出済みユーザーだけ。その起動で他の起動時モーダルが出ていたら出さない。1 ユーザー 1 回、締切後は出さない。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";

export type SeasonPredictCrowdLaunchVariant =
  | { kind: "both" }
  | { kind: "one"; submitted: "awards" | "standings" };

export type SeasonPredictCrowdLaunchAction = {
  mode: "awards" | "standings";
};

/** 他の起動時モーダル（Unit 獲得・スクワッドバトル）の判定が終わるのを待つ */
export const SEASON_PREDICT_CROWD_LAUNCH_DELAY_MS = 6000;

export function seasonPredictCrowdLaunchStorageKey(uid: string): string {
  return `uniterz.seasonPredictCrowdLaunch.v1.${uid}`;
}

export function resolveSeasonPredictCrowdLaunchVariant(submitted: {
  awards: boolean;
  standings: boolean;
}): SeasonPredictCrowdLaunchVariant | null {
  if (submitted.awards && submitted.standings) return { kind: "both" };
  if (submitted.standings) return { kind: "one", submitted: "standings" };
  if (submitted.awards) return { kind: "one", submitted: "awards" };
  return null;
}

export function seasonPredictCrowdLaunchAction(
  variant: SeasonPredictCrowdLaunchVariant
): SeasonPredictCrowdLaunchAction {
  return { mode: variant.kind === "one" ? variant.submitted : "standings" };
}

function kindName(lang: LocalizedLang, kind: "awards" | "standings"): string {
  return kind === "awards"
    ? L(lang, {
        ja: "アワード予想",
        en: "awards picks",
        ko: "어워드 예측",
        zh: "奖项预测",
        es: "picks de premios",
        pt: "palpites de prêmios",
        fr: "pronostics des trophées",
      })
    : L(lang, {
        ja: "順位予想",
        en: "standings picks",
        ko: "순위 예측",
        zh: "排名预测",
        es: "picks de clasificación",
        pt: "palpites de classificação",
        fr: "pronostics du classement",
      });
}

export function seasonPredictCrowdLaunchCopy(
  language: string | null | undefined,
  variant: SeasonPredictCrowdLaunchVariant
) {
  const lang = resolveLocalizedLang(language);
  const eyebrow = L(lang, {
    ja: "NEW · 開幕前限定",
    en: "NEW · Preseason only",
    ko: "NEW · 개막 전 한정",
    zh: "NEW · 开幕前限定",
    es: "NUEVO · Solo pretemporada",
    pt: "NOVO · Só na pré-temporada",
    fr: "NOUVEAU · Avant-saison",
  });
  const later = L(lang, {
    ja: "あとで",
    en: "Later",
    ko: "나중에",
    zh: "稍后",
    es: "Luego",
    pt: "Depois",
    fr: "Plus tard",
  });

  const title = L(lang, {
    ja: "みんなの予想が見られるようになりました",
    en: "Crowd picks are now unlocked",
    ko: "모두의 예측을 볼 수 있게 되었어요",
    zh: "现在可以查看大家的预测了",
    es: "Ya puedes ver los picks de la comunidad",
    pt: "Agora você pode ver os palpites da galera",
    fr: "Les choix de la communauté sont débloqués",
  });
  const primary = L(lang, {
    ja: "見る",
    en: "View",
    ko: "보기",
    zh: "查看",
    es: "Ver",
    pt: "Ver",
    fr: "Voir",
  });

  if (variant.kind === "both") {
    return {
      eyebrow,
      title,
      body: L(lang, {
        ja: "順位予想・アワード予想ともに、提出した人みんなの集計が見られます。締切まで何度でも見直せます。",
        en: "See how everyone ranked the standings and awards. You can revise your picks until the deadline.",
        ko: "순위·어워드 모두 제출한 사람들의 집계를 볼 수 있어요. 마감까지 몇 번이든 수정할 수 있어요.",
        zh: "排名和奖项都可以查看所有提交者的统计。截止前可以随时修改。",
        es: "Mira cómo votó la comunidad en clasificación y premios. Puedes cambiar tus picks hasta el cierre.",
        pt: "Veja como a galera votou na classificação e nos prêmios. Dá para mudar seus palpites até o prazo.",
        fr: "Découvre les votes de la communauté pour le classement et les trophées. Tu peux modifier tes choix jusqu’à la date limite.",
      }),
      primary,
      later,
    };
  }

  const done = kindName(lang, variant.submitted);
  const other = kindName(lang, variant.submitted === "awards" ? "standings" : "awards");
  return {
    eyebrow,
    title,
    body: L(lang, {
      ja: `${done}のみんなの集計が見られます。${other}も出すと、そちらも見られます。`,
      en: `The crowd tally for your ${done} is ready. Submit your ${other} to unlock that one too.`,
      ko: `${done}의 모두의 집계를 볼 수 있어요. ${other}도 제출하면 그쪽도 볼 수 있어요.`,
      zh: `可以查看${done}的大家统计。提交${other}后也能查看。`,
      es: `Ya puedes ver el recuento de tus ${done}. Envía tus ${other} para desbloquearlo también.`,
      pt: `A contagem dos seus ${done} está liberada. Envie seus ${other} para liberar também.`,
      fr: `Le décompte de tes ${done} est disponible. Envoie tes ${other} pour le débloquer aussi.`,
    }),
    primary,
    later,
  };
}
