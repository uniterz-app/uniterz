import { Dimensions } from "react-native";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

type TabSceneStyleInterpolator = NonNullable<
  BottomTabNavigationOptions["sceneStyleInterpolator"]
>;
type TabTransitionSpec = NonNullable<BottomTabNavigationOptions["transitionSpec"]>;

/**
 * 短いスプリング着地（オーバーシュートほぼなし）。
 * AppTabBar の連打ガード（280ms）と体感を揃える。
 *
 * 注意: scene に opacity / scale を載せない。
 * welcome の BlurView + Reanimated と親の RN Animated opacity が重なると
 * iOS で画面が真っ黒になる（サイドバーからチュートリアル再開で再現）。
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
 * 全幅 translateX のみ（ホーム画面のドットタップに近い）
 */
export const forTabPagerSlide: TabSceneStyleInterpolator = ({ current }) => {
  const width = Dimensions.get("window").width;
  return {
    sceneStyle: {
      transform: [
        {
          translateX: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [-width, 0, width],
          }),
        },
      ],
    },
  };
};
