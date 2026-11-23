import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../theme/tokens";

/** AppTabBar のピル底オフセット。コンテンツ余白と揃える */
export const TAB_BAR_BOTTOM_GAP = 2;
/** ピル上下パディング（row paddingVertical） */
export const TAB_BAR_PILL_PAD_V = 6;
/** 各タブボタンの最小高さ */
export const TAB_BAR_TAB_MIN_H = 44;
/** ピル上端からコンテンツまでの余白 */
export const TAB_BAR_CONTENT_GAP = 10;

/** 下部タブピル分のコンテンツ余白（各 Home 画面の bottomReserveY） */
export function useBottomTabBarInsets() {
  const insets = useSafeAreaInsets();
  const pillBottomFromScreenBottom = TAB_BAR_BOTTOM_GAP + insets.bottom;
  const bottomContentReserveY =
    pillBottomFromScreenBottom +
    TAB_BAR_PILL_PAD_V +
    TAB_BAR_TAB_MIN_H +
    TAB_BAR_PILL_PAD_V +
    TAB_BAR_CONTENT_GAP;
  /** UNITERZ 共通ヘッダー配下 — safe area は MainTabNavigator 側で確保済み */
  const topContentPadY = spacing.sm;
  return { bottomContentReserveY, topContentPadY, insets };
}
