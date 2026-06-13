import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import {
  resultStreakBadgeClass,
  resultStreakBadgeIconClass,
} from "@/lib/result/resultGlass";

export type WinStreakBadgeStyle = {
  label: string;
  className: string;
  iconClassName: string;
};

export function normalizeWinStreak(activeWinStreak: unknown): number {
  return typeof activeWinStreak === "number" && Number.isFinite(activeWinStreak)
    ? Math.max(0, Math.floor(activeWinStreak))
    : 0;
}

/** プロフィールヒーロー等：枠を走る光スイープ（リザルトカード連勝と同型） */
export function showWinStreakSweep(activeWinStreak: unknown): boolean {
  return normalizeWinStreak(activeWinStreak) >= 5;
}

/** 5連勝以上のカード／ヒーロー外枠（ResultCard 連勝 frame と同等） */
export function getWinStreakShellFrameClass(activeWinStreak: unknown): string {
  const v = normalizeWinStreak(activeWinStreak);
  if (v < 5) return "";
  if (v >= 7) {
    return "border border-red-400 ring-2 ring-red-400/70 shadow-[0_0_22px_rgba(239,68,68,0.45)]";
  }
  return "border border-orange-300 ring-2 ring-orange-300/60 shadow-[0_0_18px_rgba(249,115,22,0.38)]";
}

/** 3連勝以上で表示する連勝ピル（リザルトカード・プロフィール共通） */
export function getWinStreakBadge(
  activeWinStreak: unknown,
  language: Language,
  opts?: { compact?: boolean; subtle?: boolean }
): WinStreakBadgeStyle | null {
  const v = normalizeWinStreak(activeWinStreak);
  if (v < 3) return null;

  const compact = opts?.compact !== false;
  const className = resultStreakBadgeClass(v, compact, {
    subtle: opts?.subtle,
  });
  if (!className) return null;

  const m = t(language);
  const label =
    language === "en"
      ? `${v} ${m.results.winStreakLabel}`
      : `${v}${m.results.winStreakLabel}`;

  return {
    label,
    className,
    iconClassName: `shrink-0 ${resultStreakBadgeIconClass(v)}`,
  };
}
