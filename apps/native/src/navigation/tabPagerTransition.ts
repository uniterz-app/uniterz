import { Dimensions } from "react-native";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

type TabSceneStyleInterpolator = NonNullable<
  BottomTabNavigationOptions["sceneStyleInterpolator"]
>;
type TabTransitionSpec = NonNullable<BottomTabNavigationOptions["transitionSpec"]>;

/** 非フォーカス側：わずかに縮小して奥行きを出す */
const TAB_PAGER_SCALE_AWAY = 0.96;
/** 非フォーカス側：暗く見せる（完全フェードはしない） */
const TAB_PAGER_OPACITY_AWAY = 0.78;

/**
 * 短いスプリング着地（オーバーシュートほぼなし）。
 * AppTabBar の連打ガード（280ms）と体感を揃える。
 */
export const tabPagerTransitionSpec: TabTransitionSpec = {
  animation: "spring",
  config: {
    stiffness: 320,
    damping: 32,
    mass: 0.85,
    overshootClamping: true,
    restDisplacementThreshold: 0.5,
    restSpeedThreshold: 0.5,
  },
};

/**
 * progress: -1 = 左隣 / 0 = フォーカス / 1 = 右隣
 * 全幅スライド + 退場側の縮小・暗転（ホーム画面寄り＋奥行き）
 */
export const forTabPagerSlide: TabSceneStyleInterpolator = ({ current }) => {
  const width = Dimensions.get("window").width;
  return {
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [TAB_PAGER_OPACITY_AWAY, 1, TAB_PAGER_OPACITY_AWAY],
      }),
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-width, 0, width],
          }),
        },
        {
          scale: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [TAB_PAGER_SCALE_AWAY, 1, TAB_PAGER_SCALE_AWAY],
          }),
        },
      ],
    },
  };
};
