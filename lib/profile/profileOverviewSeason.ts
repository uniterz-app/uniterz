/**
 * プロフィール overview チャートが参照する NBA シーズン。
 * 速度確認用に前シーズンへ一時切替できる。
 */
import {
  CURRENT_NBA_SEASON_KEY,
  previousNbaSeasonKey,
} from "@/lib/rankings/nbaSeason";
import {
  dateKeyJST,
  subtractOneDayFromDateKeyJST,
} from "@/lib/rankings/rankSnapshotDate";

/**
 * true = overview（Daily / Rank / Last20）だけ前シーズンを読む。
 * 確認が終わったら false に戻す。
 */
export const PROFILE_OVERVIEW_USE_PREVIOUS_SEASON = true;

export function profileOverviewSeasonKey(): string {
  return PROFILE_OVERVIEW_USE_PREVIOUS_SEASON
    ? previousNbaSeasonKey(CURRENT_NBA_SEASON_KEY)
    : CURRENT_NBA_SEASON_KEY;
}

/**
 * 日次・順位スナップショットを拾うための終端日。
 * 前シーズン確認時はシーズン終了（翌年6/30）側から遡る。
 */
export function profileOverviewLookbackEndDateKey(
  seasonKey: string = profileOverviewSeasonKey()
): string {
  if (seasonKey === CURRENT_NBA_SEASON_KEY) {
    return dateKeyJST();
  }
  const startYear = Number.parseInt(seasonKey.slice(0, 4), 10);
  if (!Number.isFinite(startYear)) return dateKeyJST();
  /** NBA レギュラーおおよその終端: 翌年 6/30 JST */
  return `${startYear + 1}-06-30`;
}

/**
 * 現行: 直近だけ。前シーズン確認: 開幕〜終端付近まで（末尾45日だとレギュラーが落ちる）。
 */
export function profileOverviewDailyLookbackDays(
  seasonKey: string = profileOverviewSeasonKey()
): number {
  return seasonKey === CURRENT_NBA_SEASON_KEY ? 45 : 220;
}

export function profileOverviewRankLookbackDays(
  seasonKey: string = profileOverviewSeasonKey()
): number {
  return seasonKey === CURRENT_NBA_SEASON_KEY ? 60 : 220;
}

/** endKey から days 日分の YYYY-MM-DD（新しい順ではなく古い→新しい） */
export function profileOverviewDateKeysEndingAt(
  endKey: string,
  days: number
): string[] {
  const keys: string[] = [];
  let key = endKey;
  for (let i = 0; i < days; i++) {
    keys.push(key);
    key = subtractOneDayFromDateKeyJST(key);
  }
  return keys.reverse();
}
