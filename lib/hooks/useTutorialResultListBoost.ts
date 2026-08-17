/**
 * 旧: リザルト一覧にチュートリアル投稿を差し込んでいた。
 * ページ説明ツアーではモック投稿を入れないので、そのまま返す。
 */

"use client";

import type { Language } from "@/lib/i18n/language";
import type {
  ResultDayGroup,
  ResultListLeagueTab,
} from "@/lib/result/result-page-data";

export function useTutorialResultListBoost(
  _language: Language,
  grouped: ResultDayGroup[],
  _setLeagueTab: (tab: ResultListLeagueTab) => void
): {
  grouped: ResultDayGroup[];
  active: boolean;
} {
  return { grouped, active: false };
}
