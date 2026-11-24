/**
 * リザルト一覧のインフィードバナー（AdMob）。
 * リワード（PRO PICK / Buzz）とは別ユニット。Free のみ・7 枚に 1 本。
 *
 *   EXPO_PUBLIC_ADMOB_RESULT_FEED_BANNER_ANDROID
 *   EXPO_PUBLIC_ADMOB_RESULT_FEED_BANNER_IOS
 *
 * 本番の出し入れは `EXPO_PUBLIC_PRO_PICK_AD_SDK=1`（既存の広告 SDK と同じ旗）。
 */
import { Platform } from "react-native";

/** リザルトカード N 枚の直後に 1 本 */
export const RESULT_FEED_AD_EVERY_CARDS = 7;

export const RESULT_FEED_ADS_ENABLED =
  process.env.EXPO_PUBLIC_PRO_PICK_AD_SDK === "1";

export function shouldInsertResultFeedAdAfter(flatIndex: number): boolean {
  return (flatIndex + 1) % RESULT_FEED_AD_EVERY_CARDS === 0;
}

export function resultFeedBannerUnitId(testId: string): string {
  const envId =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_ADMOB_RESULT_FEED_BANNER_IOS
      : process.env.EXPO_PUBLIC_ADMOB_RESULT_FEED_BANNER_ANDROID;
  return envId?.trim() || testId;
}
