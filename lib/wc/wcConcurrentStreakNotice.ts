import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

export type WcConcurrentStreakCopy = {
  tag: string;
  title: string;
  lead: string;
  bullets: string[];
  cta: string;
};

export function wcConcurrentStreakNoticeId(): string {
  return "wc-concurrent-streak-notice";
}

export function resolveWcConcurrentStreakCopy(
  language: Language
): WcConcurrentStreakCopy {
  const m = t(language);
  const block = m.games.wcConcurrentStreak;
  return {
    tag: block.tag,
    title: block.title,
    lead: block.lead,
    bullets: block.bullets.split("\n").filter(Boolean),
    cta: block.cta,
  };
}
