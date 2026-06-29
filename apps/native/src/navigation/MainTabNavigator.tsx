import { StyleSheet, View } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NavigationState, PartialState } from "@react-navigation/native";
import AppTabBar from "./AppTabBar";
import type { MainTabParamList } from "./types";
import NativePushNotificationsHost from "../notifications/NativePushNotificationsHost";
import WcKnockoutStreakResetGateNative from "../features/games/WcKnockoutStreakResetGateNative";
import UniterzBrandShelfNative from "../features/UniterzBrandShelfNative";
import { hideNativeBootSplash } from "../bootstrap/nativeBootSplash";
import {
  DEFAULT_HEADER_WORDMARK,
  resolveHeaderWordmarkFromMainTab,
} from "../../../../lib/ui/headerWordmark";
import {
  GamesStackScreen,
  ResultStackScreen,
  RankingsStackScreen,
  LeaderboardsStackScreen,
  ProfileStackScreen,
} from "./StackNavigators";

const Tab = createBottomTabNavigator<MainTabParamList>();

function resolveTabWordmark(
  state: NavigationState | PartialState<NavigationState> | undefined
): string {
  const routeName = state?.routes[state.index ?? 0]?.name;
  return resolveHeaderWordmarkFromMainTab(routeName);
}

export default function MainTabNavigator() {
  const [wordmark, setWordmark] = useState(DEFAULT_HEADER_WORDMARK);

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
      <NativePushNotificationsHost />
      <WcKnockoutStreakResetGateNative />
      <View style={styles.root}>
        <UniterzBrandShelfNative includeSafeAreaTop title={wordmark} />
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
