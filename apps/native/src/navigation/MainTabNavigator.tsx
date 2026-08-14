import { StyleSheet, View } from "react-native";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NavigationState, PartialState } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppTabBar from "./AppTabBar";
import type { MainTabParamList } from "./types";
import NativePushNotificationsHost from "../notifications/NativePushNotificationsHost";
import UniterzBrandShelfNative from "../features/UniterzBrandShelfNative";
import { hideNativeBootSplash } from "../bootstrap/nativeBootSplash";
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

  const syncWordmarkFromTabState = useCallback(
    (state: NavigationState | PartialState<NavigationState> | undefined) => {
      setWordmark(resolveTabWordmark(state));
    },
    []
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
              sceneStyle: { backgroundColor: "transparent" },
              // 初回だけ遅延マウント。freezeOnBlur はタブ連打で解凍が積み上がりフリーズするためオフ
              lazy: true,
              freezeOnBlur: false,
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
