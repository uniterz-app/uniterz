import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../theme/tokens";

/** 下部タブピル分のコンテンツ余白（各 Home 画面の bottomReserveY） */
export function useBottomTabBarInsets() {
  const insets = useSafeAreaInsets();
  /** AppTabBar の `TAB_BAR_BOTTOM_GAP` と揃える */
  const tabBarBottomOffset = 2;
  const pillBottomFromScreenBottom = tabBarBottomOffset + insets.bottom;
  /** pill: paddingVertical 10 + minHeight 48 + paddingVertical 10 + 余白 */
  const bottomContentReserveY = pillBottomFromScreenBottom + 10 + 48 + 10 + 14;
  /** UNITERZ 共通ヘッダー配下 — safe area は MainTabNavigator 側で確保済み */
  const topContentPadY = spacing.sm;
  return { bottomContentReserveY, topContentPadY, insets };
}
