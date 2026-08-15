import { StyleSheet, View } from "react-native";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NavigationState, PartialState } from "@react-navigation/native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppTabBar from "./AppTabBar";
import type { MainTabParamList } from "./types";
import {
  forTabPagerSlide,
  tabPagerTransitionSpec,
} from "./tabPagerTransition";
import NativePushNotificationsHost from "../notifications/NativePushNotificationsHost";
import UniterzBrandShelfNative from "../features/UniterzBrandShelfNative";
import { hideNativeBootSplash } from "../bootstrap/nativeBootSplash";
import { colors } from "../theme/tokens";
import {
  DEFAULT_HEADER_WORDMARK,
  resolveHeaderWordmarkFromMainTab,
  type HeaderWordmark,
} from "../../../../lib/ui/headerWordmark";
import {
  getAppBrandShelfHidden,
  subscribeAppBrandShelfHidden,
} from "../../../../lib/ui/appBrandShelfVisibility";
import {
  getTutorialWelcomeBrandHidden,
  subscribeTutorialWelcomeBrandHidden,
} from "../../../../lib/tutorial/tutorialWelcomeChrome";
import {
  getTutorialTabTransitionQuiet,
  subscribeTutorialTabTransitionQuiet,
} from "../../../../lib/tutorial/tutorialTabTransitionQuiet";
import {
  GamesStackScreen,
  ResultStackScreen,
  RankingsStackScreen,
  LeaderboardsStackScreen,
  ProfileStackScreen,
} from "./StackNavigators";
import ProfileStatsPrefetchHost from "../features/profile/ProfileStatsPrefetchHost";

const Tab = createBottomTabNavigator<MainTabParamList>();

function resolveTabWordmark(
  state: NavigationState | PartialState<NavigationState> | undefined
): HeaderWordmark {
  const routeName = state?.routes[state.index ?? 0]?.name;
  return resolveHeaderWordmarkFromMainTab(routeName);
}

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion() === true;
  const [wordmark, setWordmark] = useState(DEFAULT_HEADER_WORDMARK);
  const brandShelfHidden = useSyncExternalStore(
    subscribeAppBrandShelfHidden,
    getAppBrandShelfHidden,
    () => false
  );
  const welcomeBrandHidden = useSyncExternalStore(
    subscribeTutorialWelcomeBrandHidden,
    getTutorialWelcomeBrandHidden,
    () => false
  );
  const tabTransitionQuiet = useSyncExternalStore(
    subscribeTutorialTabTransitionQuiet,
    getTutorialTabTransitionQuiet,
    () => false
  );

  const syncWordmarkFromTabState = useCallback(
    (state: NavigationState | PartialState<NavigationState> | undefined) => {
      setWordmark(resolveTabWordmark(state));
    },
    []
  );

  /**
   * animation を付けず transitionSpec のみ → hasAnimation が true（none だと遷移中に非表示になる）。
   * チュートリアル再開中は none（タブスライド × welcome 合成で iOS 黒画面になるため）。
   */
  const tabTransitionOptions = useMemo(
    () =>
      reduceMotion || tabTransitionQuiet
        ? { animation: "none" as const }
        : {
            sceneStyleInterpolator: forTabPagerSlide,
            transitionSpec: tabPagerTransitionSpec,
          },
    [reduceMotion, tabTransitionQuiet]
  );

  useEffect(() => {
    hideNativeBootSplash();
  }, []);

  return (
    <>
      <ProfileStatsPrefetchHost />
      <NativePushNotificationsHost />
      <View style={styles.root}>
        {brandShelfHidden || welcomeBrandHidden ? (
          welcomeBrandHidden ? null : (
            <View style={{ height: insets.top }} pointerEvents="none" />
          )
        ) : (
          <UniterzBrandShelfNative includeSafeAreaTop title={wordmark} />
        )}
        <View style={styles.tabHost}>
          <Tab.Navigator
            tabBar={(props) => <AppTabBar {...props} />}
            screenListeners={{
              state: (event) => {
                syncWordmarkFromTabState(event.data.state);
              },
            }}
            screenOptions={{
              headerShown: false,
              tabBarShowLabel: false,
              tabBarStyle: { display: "none" },
              // 不透明にしてスライド中に裏タブが透けないようにする
              sceneStyle: { backgroundColor: colors.bgPrimary },
              // 初回だけ遅延マウント。freezeOnBlur はタブ連打で解凍が積み上がりフリーズするためオフ
              lazy: true,
              freezeOnBlur: false,
              ...tabTransitionOptions,
            }}
            initialRouteName="GamesTab"
          >
            <Tab.Screen name="GamesTab" component={GamesStackScreen} />
            <Tab.Screen name="ResultTab" component={ResultStackScreen} />
            <Tab.Screen name="RankingsTab" component={RankingsStackScreen} />
            <Tab.Screen name="LeaderboardsTab" component={LeaderboardsStackScreen} />
            <Tab.Screen name="ProfileTab" component={ProfileStackScreen} />
          </Tab.Navigator>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  tabHost: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
