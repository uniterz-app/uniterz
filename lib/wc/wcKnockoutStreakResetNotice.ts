import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import type { WcConcurrentStreakCopy } from "@/lib/wc/wcConcurrentStreakNotice";

export type WcKnockoutStreakResetCopy = WcConcurrentStreakCopy;

/** Firestore `users/{uid}/reads/{id}` — ノックアウト連勝リセット告知を生涯1回表示 */
export function wcKnockoutStreakResetNoticeId(
  season = WC_KNOCKOUT_SEASON
): string {
  return `wc-knockout-streak-reset-notice-${season}`;
}

export function resolveWcKnockoutStreakResetCopy(
  language: Language
): WcKnockoutStreakResetCopy {
  const m = t(language);
  const block = m.games.wcKnockoutStreakReset;
  return {
    tag: block.tag,
    title: block.title,
    lead: block.lead,
    bullets: block.bullets.split("\n").filter(Boolean),
    cta: block.cta,
  };
}
