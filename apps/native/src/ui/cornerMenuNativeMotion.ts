import { useEffect } from "react";
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

/** Web `ResultCard` コーナー FAB — `duration-300 ease-out` */
export const CORNER_MENU_FLYOUT_MS = 300;
export const CORNER_MENU_FLYOUT_EASING = Easing.out(Easing.cubic);

/** 左フライアウト（メニューが右側にあるとき — Web `translate-x-2` → `0`） */
export function useCornerMenuLeftFlyoutMotion(open: boolean) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: CORNER_MENU_FLYOUT_MS,
      easing: CORNER_MENU_FLYOUT_EASING,
    });
  }, [open, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: 8 * (1 - progress.value) }],
  }));
}

/** 右フライアウト（メニューが左側にあるとき — 画面内へ `-translate-x-2` → `0`） */
export function useCornerMenuRightFlyoutMotion(open: boolean) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: CORNER_MENU_FLYOUT_MS,
      easing: CORNER_MENU_FLYOUT_EASING,
    });
  }, [open, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: -8 * (1 - progress.value) }],
  }));
}

/** 下フライアウト（Web `-translate-y-2` → `translate-y-0`） */
export function useCornerMenuBottomFlyoutMotion(open: boolean) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: CORNER_MENU_FLYOUT_MS,
      easing: CORNER_MENU_FLYOUT_EASING,
    });
  }, [open, progress]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: -8 * (1 - progress.value) }],
  }));
}
