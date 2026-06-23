import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../theme/tokens";

/** 下部タブピル分のコンテンツ余白（各 Home 画面の bottomReserveY） */
export function useBottomTabBarInsets() {
  const insets = useSafeAreaInsets();
  const tabBarBottomOffset = 10;
  const pillBottomFromScreenBottom = tabBarBottomOffset + insets.bottom;
  const bottomContentReserveY = pillBottomFromScreenBottom + 8 + 42 + 8 + 14;
  /** UNITERZ 共通ヘッダー配下 — safe area は MainTabNavigator 側で確保済み */
  const topContentPadY = spacing.sm;
  return { bottomContentReserveY, topContentPadY, insets };
}
