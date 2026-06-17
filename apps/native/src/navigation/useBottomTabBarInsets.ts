import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../theme/tokens";

/** 下部タブピル分のコンテンツ余白（各 Home 画面の bottomReserveY） */
export function useBottomTabBarInsets() {
  const insets = useSafeAreaInsets();
  const tabBarBottomOffset = 10;
  const pillBottomFromScreenBottom = tabBarBottomOffset + insets.bottom;
  const bottomContentReserveY = pillBottomFromScreenBottom + 8 + 42 + 8 + 14;
  /** ノッチ下の上余白（GamesHomeScreen と同じ: safe area + spacing.sm） */
  const topContentPadY = insets.top + spacing.sm;
  return { bottomContentReserveY, topContentPadY, insets };
}
