import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

export type WinStreakBadgeStyle = {
  label: string;
  className: string;
  iconClassName: string;
};

/** ピル共通：ハイライト＋エッジのメタリック質感 */
const PILL_METAL =
  "border shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(15,23,42,0.32)]";

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
  language: Language
): WinStreakBadgeStyle | null {
  const v = normalizeWinStreak(activeWinStreak);

  if (v < 3) return null;

  const m = t(language);
  const label =
    language === "en"
      ? `${v} ${m.results.winStreakLabel}`
      : `${v}${m.results.winStreakLabel}`;

  /** 7+：ブリushed ゴールド */
  if (v >= 7) {
    return {
      label,
      className: [
        PILL_METAL,
        "bg-[linear-gradient(152deg,#fffbeb_0%,#fcd34d_20%,#b45309_48%,#fde68a_72%,#ca8a04_100%)]",
        "text-amber-950 border-amber-200/55",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.65),inset_0_-1px_0_rgba(120,53,15,0.35),0_2px_12px_rgba(251,191,36,0.32)]",
      ].join(" "),
      iconClassName:
        "text-amber-900 drop-shadow-[0_0_5px_rgba(251,191,36,0.55)]",
    };
  }

  /** 5–6：プラチナ／スチール（シアン寄りハイライト） */
  if (v >= 5) {
    return {
      label,
      className: [
        PILL_METAL,
        "bg-[linear-gradient(152deg,#f8fafc_0%,#94a3b8_22%,#334155_50%,#cbd5e1_76%,#64748b_100%)]",
        "text-slate-100 border-slate-300/45",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(15,23,42,0.4),0_2px_10px_rgba(148,163,184,0.35)]",
      ].join(" "),
      iconClassName:
        "text-cyan-100 drop-shadow-[0_0_6px_rgba(34,211,238,0.45)]",
    };
  }

  /** 3–4：シルバー／クロム */
  return {
    label,
    className: [
      PILL_METAL,
      "bg-[linear-gradient(152deg,#ffffff_0%,#e2e8f0_18%,#64748b_45%,#f1f5f9_70%,#94a3b8_100%)]",
      "text-slate-800 border-white/50",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.62),inset_0_-1px_0_rgba(51,65,85,0.28),0_2px_8px_rgba(148,163,184,0.28)]",
    ].join(" "),
    iconClassName:
      "text-orange-700 drop-shadow-[0_0_4px_rgba(249,115,22,0.4)]",
  };
}
