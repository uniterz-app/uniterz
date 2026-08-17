/**
 * プロフィール「Unit獲得を再生」用プレビューエントリ。
 * celebrate プリセットを回して、順位付きの獲得理由を見せる。
 */
import {
  UNIT_EARN_CELEBRATE_PREVIEW_PRESETS,
  unitEarnCelebrateContent,
  type UnitEarnCelebratePresetId,
} from "@/lib/units/unitEarnCelebrate";
import type { PendingUnitEarn } from "@/lib/units/pendingUnitEarn";

/** カテゴリ見出し（順位数字は別表示） */
function categoryTitle(
  presetId: UnitEarnCelebratePresetId,
  isJa: boolean
): string {
  if (isJa) {
    switch (presetId) {
      case "monthly-rank-1":
      case "monthly-rank-8":
        return "月間ランキング";
      case "weekly-rank-3":
        return "週間ランキング";
      case "referral-base":
        return "招待が成立";
      case "referral-milestone-3":
        return "招待マイルストーン";
    }
  }
  switch (presetId) {
    case "monthly-rank-1":
    case "monthly-rank-8":
      return "Monthly ranking";
    case "weekly-rank-3":
      return "Weekly ranking";
    case "referral-base":
      return "Invite confirmed";
    case "referral-milestone-3":
      return "Invite milestone";
  }
}

export type UnitEarnPreviewPlayEntry = PendingUnitEarn & { preview: true };

export function unitEarnPreviewPlayEntry(
  playIndex: number,
  isJa: boolean
): UnitEarnPreviewPlayEntry {
  const presets = UNIT_EARN_CELEBRATE_PREVIEW_PRESETS;
  const preset = presets[((playIndex % presets.length) + presets.length) % presets.length]!;
  const content = unitEarnCelebrateContent(preset.id, isJa);
  return {
    amount: content.amount,
    preview: true,
    title: categoryTitle(preset.id, isJa),
    subtitle: content.subtitle,
    rank: content.rank,
    label: content.title,
  };
}
