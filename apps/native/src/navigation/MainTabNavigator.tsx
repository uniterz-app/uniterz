import { StyleSheet, View } from "react-native";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NavigationState, PartialState } from "@react-navigation/native";
import { useReducedMotion } from "react-native-reanimated";
import AppTabBar from "./AppTabBar";
import type { MainTabParamList } from "./types";
import {
  forTabPagerSlide,
  tabPagerTransitionSpec,
} from "./tabPagerTransition";
import NativePushNotificationsHost from "../notifications/NativePushNotificationsHost";
import UniterzBrandShelfNative from "../features/UniterzBrandShelfNative";
import { hideNativeBootSplash } from "../bootstrap/nativeBootSplash";
import {
  DEFAULT_HEADER_WORDMARK,
  getAppBrandWordmarkOverride,
  resolveHeaderWordmarkFromGamesStack,
  resolveHeaderWordmarkFromMainTab,
  resolveHeaderWordmarkFromSquadBattleStack,
  subscribeAppBrandWordmarkOverride,
  type HeaderWordmark,
} from "../../../../lib/ui/headerWordmark";
import {
  getAppBrandShelfCollapsed,
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
import { resetGamesStackInBackgroundNative } from "./resetGamesTabHomeNative";
import ProfileStatsPrefetchHost from "../features/profile/ProfileStatsPrefetchHost";
import SquadBattleLaunchPromptHostNative from "../features/squads/SquadBattleLaunchPromptHostNative";

const Tab = createBottomTabNavigator<MainTabParamList>();

function resolveTabWordmark(
  state: NavigationState | PartialState<NavigationState> | undefined
): HeaderWordmark {
  let tabName: string | undefined;
  let current: NavigationState | PartialState<NavigationState> | undefined =
    state;
  while (current?.routes && typeof current.index === "number") {
    const route = current.routes[current.index];
    if (!route) break;
    if (!tabName) tabName = route.name;
    const fromGames = resolveHeaderWordmarkFromGamesStack(
      route.name,
      route.params as { mode?: string } | undefined
    );
    if (fromGames) return fromGames;
    const fromSquadBattle = resolveHeaderWordmarkFromSquadBattleStack(
      route.name
    );
    if (fromSquadBattle) return fromSquadBattle;
    current = route.state;
  }
  return resolveHeaderWordmarkFromMainTab(tabName);
}

export default function MainTabNavigator() {
  const reduceMotion = useReducedMotion() === true;
  const [wordmark, setWordmark] = useState(DEFAULT_HEADER_WORDMARK);
  const brandShelfHidden = useSyncExternalStore(
    subscribeAppBrandShelfHidden,
    getAppBrandShelfHidden,
    () => false
  );
  const brandShelfCollapsed = useSyncExternalStore(
    subscribeAppBrandShelfHidden,
    getAppBrandShelfCollapsed,
    () => false
  );
  const wordmarkOverride = useSyncExternalStore(
    subscribeAppBrandWordmarkOverride,
    getAppBrandWordmarkOverride,
    () => null
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
      <SquadBattleLaunchPromptHostNative />
      <View style={styles.root}>
        {welcomeBrandHidden || brandShelfCollapsed ? null : (
          <View
            pointerEvents="none"
            style={brandShelfHidden ? styles.shelfHold : undefined}
          >
            <UniterzBrandShelfNative
              includeSafeAreaTop
              title={wordmarkOverride ?? wordmark}
            />
          </View>
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
              // AppShell のメッシュ背景を通す（不透明 #090c15 だとヘッダー下だけ塗り潰される）
              sceneStyle: { backgroundColor: "transparent" },
              // 初回だけ遅延マウント。freezeOnBlur はタブ連打で解凍が積み上がりフリーズするためオフ
              lazy: true,
              freezeOnBlur: false,
              ...tabTransitionOptions,
            }}
            initialRouteName="GamesTab"
          >
            <Tab.Screen
              name="GamesTab"
              component={GamesStackScreen}
              listeners={({ navigation }) => ({
                blur: () => {
                  resetGamesStackInBackgroundNative(navigation);
                },
              })}
            />
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
    overflow: "visible",
  },
  tabHost: {
    flex: 1,
    backgroundColor: "transparent",
    overflow: "visible",
  },
  /** サブページ中も高さを残す（タブ全体が上に跳ねない） */
  shelfHold: {
    opacity: 0,
  },
});
