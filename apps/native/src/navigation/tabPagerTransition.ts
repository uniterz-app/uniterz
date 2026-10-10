import { Dimensions, Easing } from "react-native";
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

type TabSceneStyleInterpolator = NonNullable<
  BottomTabNavigationOptions["sceneStyleInterpolator"]
>;
type TabTransitionSpec = NonNullable<BottomTabNavigationOptions["transitionSpec"]>;

/** タブスライドの長さ。AppTabBar はこの間（transitionEnd まで）次のタブ移動を受け付けない */
export const TAB_PAGER_TRANSITION_MS = 220;

/**
 * 固定長の timing。スプリングは着地までの時間が毎回変わり、
 * 連打で途中打ち切りになると画面が横にずれたまま残ることがある。
 *
 * 注意: scene に opacity / scale を載せない。
 * welcome の BlurView + Reanimated と親の RN Animated opacity が重なると
 * iOS で画面が真っ黒になる（サイドバーからチュートリアル再開で再現）。
 */
export const tabPagerTransitionSpec: TabTransitionSpec = {
  animation: "timing",
  config: {
    duration: TAB_PAGER_TRANSITION_MS,
    easing: Easing.out(Easing.cubic),
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
