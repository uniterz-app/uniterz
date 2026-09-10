/**
 * Unit 獲得オーバーレイ / 再生ボタン chrome（7言語）
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function unitEarnOverlayCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    defaultTitle: L(lang, {
      ja: "Unit 報酬",
      en: "Unit reward",
      ko: "Unit 보상",
      zh: "Unit 奖励",
      es: "Recompensa Unit",
      pt: "Recompensa Unit",
      fr: "Récompense Unit",
    }),
    claim: L(lang, {
      ja: "獲得する",
      en: "Claim",
      ko: "획득",
      zh: "领取",
      es: "Reclamar",
      pt: "Resgatar",
      fr: "Récupérer",
    }),
  };
}

export function unitEarnPlayButtonCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    label: L(lang, {
      ja: "Unit獲得を再生",
      en: "Play unit earn",
      ko: "Unit 획득 재생",
      zh: "播放 Unit 获得",
      es: "Reproducir Unit",
      pt: "Reproduzir Unit",
      fr: "Lire gain Unit",
    }),
  };
}
