/**
 * プロフィール Result Drop（最新の試合日の確定分）— 折りたたみ枚数と「すべて表示」文言（Web mobile / Native 共通）。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

/** 折りたたみ時の枚数（Safari のメモリ対策。残りはボタンで展開） */
export const PROFILE_SETTLED_TODAY_COLLAPSED_MAX = 6;

export function profileSettledTodayShowAllLabel(
  language: string | null | undefined,
  hiddenCount: number
): string {
  const n = hiddenCount;
  return L(resolveLocalizedLang(language), {
    ja: `すべて表示（残り ${n} 件）`,
    en: `Show all (${n} more)`,
    ko: `모두 보기 (${n}개 더)`,
    zh: `显示全部（还有 ${n} 条）`,
    es: `Ver todo (${n} más)`,
    pt: `Ver tudo (mais ${n})`,
    fr: `Tout afficher (${n} de plus)`,
  });
}
