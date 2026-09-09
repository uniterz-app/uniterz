import type { Language } from "../i18n/language";
import { t } from "../i18n/t";
import {
  formatRankingUpdateLocalTime,
  rankingsUpdatedDailySentence,
} from "./formatRankingUpdateLocalTime";

/** ランキング更新・累積スコアの1行キャプション（「 / 」で連結） */
export function getRankingsScheduleNoticeText(
  language: Language,
  countryCode?: string | null,
): string {
  const m = t(language);
  const timeLabel = formatRankingUpdateLocalTime(countryCode, language);
  const updated = rankingsUpdatedDailySentence(language, timeLabel);
  return `${updated} / ${m.rankings.scoresCumulative}`;
}
