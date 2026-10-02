/**
 * 招待スタンプラリー / 達成オーバーレイ文言（7言語）。
 * Web `ReferralStampBoard` / Native `ReferralStampBoardNative` 共有。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import {
  REFERRAL_MILESTONES,
  REFERRAL_REFERRER_MAX_COMPLETED,
  REFERRAL_REFERRER_UNITS_PER_COMPLETED,
} from "@/lib/referral/referralRewards";
import {
  referralStampToneForSlot,
  type ReferralStampToneId,
} from "@/lib/referral/referralStampBoard";

export function referralStampBoardCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    eyebrow: L(lang, {
      ja: "招待スタンプラリー",
      en: "Invite stamp rally",
      ko: "초대 스탬프 랠리",
      zh: "邀请盖章活动",
      es: "Rally de sellos de invitación",
      pt: "Rally de carimbos de convite",
      fr: "Rallye de tampons d’invitation",
    }),
    lockedSuffix: L(lang, {
      ja: " 達成",
      en: " locked",
      ko: " 달성",
      zh: " 达成",
      es: " bloqueado",
      pt: " bloqueado",
      fr: " verrouillé",
    }),
    earned: L(lang, {
      ja: "獲得",
      en: "Earned",
      ko: "획득",
      zh: "已获得",
      es: "Ganado",
      pt: "Ganho",
      fr: "Gagné",
    }),
    stampsAria: L(lang, {
      ja: "招待スタンプ 1から10",
      en: "Invite stamps 1 to 10",
      ko: "초대 스탬프 1부터 10",
      zh: "邀请盖章 1 到 10",
      es: "Sellos de invitación 1 a 10",
      pt: "Carimbos de convite 1 a 10",
      fr: "Tampons d’invitation 1 à 10",
    }),
    nextHint: (target: number, remaining: number, bonusUnits: number) =>
      L(lang, {
        ja: `次のスタンプ目標: ${target} 人目（あと ${remaining}）· ボーナス +${bonusUnits} Unit`,
        en: `Next stamp: #${target} (need ${remaining}) · bonus +${bonusUnits}`,
        ko: `다음 스탬프: ${target}번째（남은 ${remaining}）· 보너스 +${bonusUnits} Unit`,
        zh: `下一盖章目标：第 ${target} 人（还差 ${remaining}）· 奖励 +${bonusUnits} Unit`,
        es: `Próximo sello: #${target} (faltan ${remaining}) · bonus +${bonusUnits}`,
        pt: `Próximo carimbo: #${target} (faltam ${remaining}) · bônus +${bonusUnits}`,
        fr: `Prochain tampon : #${target} (reste ${remaining}) · bonus +${bonusUnits}`,
      }),
    completeHint: L(lang, {
      ja: "10 枠すべて INVITE。マイルストーン上限到達",
      en: "All 10 slots INVITE. Milestone cap reached",
      ko: "10칸 모두 INVITE. 마일스톤 상한 도달",
      zh: "10 格全部 INVITE。已达里程碑上限",
      es: "10 slots INVITE. Tope de hito alcanzado",
      pt: "10 slots INVITE. Teto de marco atingido",
      fr: "10 emplacements INVITE. Cap de jalon atteint",
    }),
    breakdown: (base: number, milestones: number) =>
      L(lang, {
        ja: `内訳: 基本 ${base} + マイルストーン ${milestones} · 3 LIME / 5 AMBER / 10 INK`,
        en: `Base ${base} + milestones ${milestones} · 3 LIME / 5 AMBER / 10 INK`,
        ko: `내역: 기본 ${base} + 마일스톤 ${milestones} · 3 LIME / 5 AMBER / 10 INK`,
        zh: `明细：基础 ${base} + 里程碑 ${milestones} · 3 LIME / 5 AMBER / 10 INK`,
        es: `Base ${base} + hitos ${milestones} · 3 LIME / 5 AMBER / 10 INK`,
        pt: `Base ${base} + marcos ${milestones} · 3 LIME / 5 AMBER / 10 INK`,
        fr: `Base ${base} + jalons ${milestones} · 3 LIME / 5 AMBER / 10 INK`,
      }),
  };
}

export type ReferralStampCelebrateContent7 = {
  slotIndex: number;
  tone: ReferralStampToneId;
  baseUnits: number;
  bonusUnits: number;
  totalUnits: number;
  title: string;
  description: string;
  unitsLine: string;
  ctaLabel: string;
  dismissLabel: string;
};

/** 達成スロット N（1…10）の表示内容。最新1枚用。 */
export function referralStampCelebrateContentLocalized(
  slotIndex: number,
  language: string | null | undefined
): ReferralStampCelebrateContent7 {
  const lang = resolveLocalizedLang(language);
  const capped = Math.min(
    Math.max(1, Math.floor(slotIndex)),
    REFERRAL_REFERRER_MAX_COMPLETED
  );
  const baseUnits = REFERRAL_REFERRER_UNITS_PER_COMPLETED;
  const milestone = REFERRAL_MILESTONES.find((m) => m.completedCount === capped);
  const bonusUnits = milestone?.bonusUnits ?? 0;
  const totalUnits = baseUnits + bonusUnits;
  const tone = referralStampToneForSlot(capped);

  return {
    slotIndex: capped,
    tone,
    baseUnits,
    bonusUnits,
    totalUnits,
    title: L(lang, {
      ja: "招待が成立しました",
      en: "Invite confirmed",
      ko: "초대가 성사되었습니다",
      zh: "邀请已成立",
      es: "Invitación confirmada",
      pt: "Convite confirmado",
      fr: "Invitation confirmée",
    }),
    description: L(lang, {
      ja: `${capped}人目`,
      en: `Invite #${capped}`,
      ko: `${capped}번째`,
      zh: `第 ${capped} 人`,
      es: `Invitación #${capped}`,
      pt: `Convite #${capped}`,
      fr: `Invitation #${capped}`,
    }),
    unitsLine:
      bonusUnits > 0
        ? L(lang, {
            ja: `基本 +${baseUnits} · ボーナス +${bonusUnits} Unit`,
            en: `Base +${baseUnits} · Bonus +${bonusUnits} Unit`,
            ko: `기본 +${baseUnits} · 보너스 +${bonusUnits} Unit`,
            zh: `基础 +${baseUnits} · 奖励 +${bonusUnits} Unit`,
            es: `Base +${baseUnits} · Bonus +${bonusUnits} Unit`,
            pt: `Base +${baseUnits} · Bônus +${bonusUnits} Unit`,
            fr: `Base +${baseUnits} · Bonus +${bonusUnits} Unit`,
          })
        : L(lang, {
            ja: `+${baseUnits} Unit`,
            en: `+${baseUnits} Unit`,
            ko: `+${baseUnits} Unit`,
            zh: `+${baseUnits} Unit`,
            es: `+${baseUnits} Unit`,
            pt: `+${baseUnits} Unit`,
            fr: `+${baseUnits} Unit`,
          }),
    ctaLabel: L(lang, {
      ja: "スタンプラリーを見る",
      en: "View stamp rally",
      ko: "스탬프 랠리 보기",
      zh: "查看盖章活动",
      es: "Ver rally de sellos",
      pt: "Ver rally de carimbos",
      fr: "Voir le rallye de tampons",
    }),
    dismissLabel: L(lang, {
      ja: "閉じる",
      en: "Close",
      ko: "닫기",
      zh: "关闭",
      es: "Cerrar",
      pt: "Fechar",
      fr: "Fermer",
    }),
  };
}
