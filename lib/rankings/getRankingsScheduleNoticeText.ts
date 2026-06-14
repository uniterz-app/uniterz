import type { Language } from "../i18n/language";
import { t } from "../i18n/t";

/** ランキング更新・累積スコアの1行キャプション（「 / 」で連結） */
export function getRankingsScheduleNoticeText(language: Language): string {
  const m = t(language);
  return `${m.rankings.updatedDaily} / ${m.rankings.scoresCumulative}`;
}
