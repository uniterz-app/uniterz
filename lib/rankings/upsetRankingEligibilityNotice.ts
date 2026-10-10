import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { PERIOD_UPSET_MIN_WIN_RATE } from "@/lib/units/periodRankingUnitRewards";

/** 勝率ランキングのタブ下に出す（勝率は全期間 Unit 付与なし） */
export function winRateRankingNoUnitsNotice(
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  return L(lang, {
    ja: "勝率ランキングは UNIT の付与対象外です。",
    en: "The win-rate ranking does not award Units.",
    ko: "승률 랭킹은 UNIT 지급 대상이 아닙니다.",
    zh: "胜率榜不发放 UNIT。",
    es: "El ranking de acierto no otorga Units.",
    pt: "O ranking de acerto não concede Units.",
    fr: "Le classement au taux de réussite ne donne pas de Units.",
    de: "Das Trefferquoten-Ranking vergibt keine Units.",
    ar: "تصنيف نسبة الفوز لا يمنح وحدات UNIT.",
  });
}

/** 月間アップセットランキングのタブ下に出す参加条件（勝率条件は月間のみ） */
export function upsetRankingEligibilityNotice(
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  const pct = Math.round(PERIOD_UPSET_MIN_WIN_RATE * 100);
  return L(lang, {
    ja: `勝率${pct}%以上のユーザーが対象です`,
    en: `Only users with a win rate of ${pct}%+ are ranked`,
    ko: `승률 ${pct}% 이상 사용자가 대상입니다`,
    zh: `仅限胜率 ${pct}% 以上的用户`,
    es: `Solo usuarios con ${pct}%+ de acierto`,
    pt: `Apenas usuários com ${pct}%+ de acerto`,
    fr: `Uniquement les utilisateurs à ${pct}%+ de réussite`,
    de: `Nur Nutzer mit mindestens ${pct}% Trefferquote`,
    ar: `يشمل فقط المستخدمين بنسبة فوز ${pct}% أو أكثر`,
  });
}
