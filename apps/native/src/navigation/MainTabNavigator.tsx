import { StyleSheet, View } from "react-native";
import { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AppTabBar from "./AppTabBar";
import type { MainTabParamList } from "./types";
import NativePushNotificationsHost from "../notifications/NativePushNotificationsHost";
import UniterzBrandShelfNative from "../features/UniterzBrandShelfNative";
import { hideNativeBootSplash } from "../bootstrap/nativeBootSplash";
import {
  GamesStackScreen,
  ResultStackScreen,
  RankingsStackScreen,
  LeaderboardsStackScreen,
  ProfileStackScreen,
} from "./StackNavigators";

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  useEffect(() => {
    hideNativeBootSplash();
  }, []);

  return (
    <>
      <NativePushNotificationsHost />
      <View style={styles.root}>
        <UniterzBrandShelfNative includeSafeAreaTop />
        <View style={styles.tabHost}>
          <Tab.Navigator
            tabBar={(props) => <AppTabBar {...props} />}
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
