/** プロフィール閲覧時のビジュアル演出レベル（他人プロフィールは lite で GPU 負荷を抑える） */
export type ProfileVisualEffects = "full" | "lite";

export function profileVisualEffectsForViewer(isMe: boolean): ProfileVisualEffects {
  return isMe ? "full" : "lite";
}

export function isProfileVisualLite(
  visualEffects: ProfileVisualEffects
): boolean {
  return visualEffects === "lite";
}

/** プロフィール概要のチャートは自分・他人ともアニメーションなし */
export const PROFILE_CHART_ANIMATIONS_OFF = true;

export function isProfileChartAnimationOff(
  visualEffectsLite = false
): boolean {
  return PROFILE_CHART_ANIMATIONS_OFF || visualEffectsLite;
}
