/**
 * リザルト連勝バッジ文言（3連勝以上）。Web / Native 共有。
 */
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import { t } from "@/lib/i18n/t";
import { normalizeWinStreak } from "@/lib/ui/normalizeWinStreak";

/** CJK は数字と語を詰める。欧米語はスペース区切り。 */
function joinStreakCount(
  lang: ReturnType<typeof resolveLocalizedLang>,
  count: number,
  word: string
): string {
  if (lang === "ja" || lang === "ko" || lang === "zh") {
    return `${count}${word}`;
  }
  return `${count} ${word}`;
}

/** 表示用ラベル。3 未満は null。 */
export function resultWinStreakBadgeLabel(
  language: string | null | undefined,
  activeWinStreak: unknown
): string | null {
  const v = normalizeWinStreak(activeWinStreak);
  if (v < 3) return null;
  const lang = resolveLocalizedLang(language);
  const word = t(lang).results.winStreakLabel;
  return joinStreakCount(lang, v, word);
}
