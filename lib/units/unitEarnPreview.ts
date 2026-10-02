/**
 * プロフィール「Unit獲得を再生」用プレビューエントリ。
 * celebrate プリセットを回して、順位付きの獲得理由を見せる。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import {
  UNIT_EARN_CELEBRATE_PREVIEW_PRESETS,
  unitEarnCelebrateContent,
  type UnitEarnCelebratePresetId,
} from "@/lib/units/unitEarnCelebrate";
import type { PendingUnitEarn } from "@/lib/units/pendingUnitEarn";

/** カテゴリ見出し（順位数字は別表示） */
function categoryTitle(
  presetId: UnitEarnCelebratePresetId,
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  switch (presetId) {
    case "monthly-rank-1":
    case "monthly-rank-8":
      return L(lang, {
        ja: "月間ランキング",
        en: "Monthly ranking",
        ko: "월간 랭킹",
        zh: "月榜",
        es: "Ranking mensual",
        pt: "Ranking mensal",
        fr: "Classement mensuel",
      });
    case "weekly-rank-3":
      return L(lang, {
        ja: "週間ランキング",
        en: "Weekly ranking",
        ko: "주간 랭킹",
        zh: "周榜",
        es: "Ranking semanal",
        pt: "Ranking semanal",
        fr: "Classement hebdo",
      });
    case "referral-base":
      return L(lang, {
        ja: "招待が成立",
        en: "Invite confirmed",
        ko: "초대 성사",
        zh: "邀请成功",
        es: "Invitación confirmada",
        pt: "Convite confirmado",
        fr: "Invitation confirmée",
      });
    case "referral-milestone-3":
      return L(lang, {
        ja: "招待マイルストーン",
        en: "Invite milestone",
        ko: "초대 마일스톤",
        zh: "邀请里程碑",
        es: "Hito de referidos",
        pt: "Marco de indicação",
        fr: "Jalon de parrainage",
      });
  }
}

export type UnitEarnPreviewPlayEntry = PendingUnitEarn & { preview: true };

export function unitEarnPreviewPlayEntry(
  playIndex: number,
  language: string | null | undefined
): UnitEarnPreviewPlayEntry {
  const presets = UNIT_EARN_CELEBRATE_PREVIEW_PRESETS;
  const preset = presets[((playIndex % presets.length) + presets.length) % presets.length]!;
  const content = unitEarnCelebrateContent(preset.id, language);
  return {
    amount: content.amount,
    preview: true,
    title: categoryTitle(preset.id, language),
    subtitle: content.subtitle,
    rank: content.rank,
    label: content.title,
  };
}
