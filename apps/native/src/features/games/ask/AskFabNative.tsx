import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import type { NavigationState, PartialState } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { navigationRef } from "../../../navigation/navigationRef";
import { getNavBarCompact, subscribeNavBarCompact } from "../../../navigation/navBarCompactStore";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import ScreenshotHiddenNative from "../../../ui/ScreenshotHiddenNative";

/** ASK は試合タブのスタックにだけある。ほかのタブから飛ぶと戻り先がずれるので試合タブの中だけで出す */
const SHOW_ROUTES = new Set([
  "GamesHome",
  "PlayerDetailPreview",
  "TeamDetailPreview",
  "LeagueStats",
  "Standings",
  "DailyLeaders",
]);

type AnyState = NavigationState | PartialState<NavigationState> | undefined;

function routePath(state: AnyState): string[] {
  const path: string[] = [];
  let current = state;
  while (current?.routes && current.routes.length > 0) {
    const route = current.routes[current.index ?? current.routes.length - 1];
    if (!route) break;
    path.push(route.name);
    current = route.state as AnyState;
  }
  return path;
}

function shouldShow(): boolean {
  if (!navigationRef.isReady()) return false;
  const path = routePath(navigationRef.getRootState());
  return path.includes("GamesTab") && SHOW_ROUTES.has(path[path.length - 1] ?? "");
}

/** 試合タブの右下に浮かぶ ASK の入口。タブバーが縮んだら一緒に沈み、文字を畳んでアイコンだけにする */
export default function AskFabNative() {
  const [visible, setVisible] = useState(shouldShow);
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const compact = useSyncExternalStore(subscribeNavBarCompact, getNavBarCompact, () => false);
  const anim = useRef(new Animated.Value(compact ? 1 : 0)).current;

  useEffect(() => {
    const sync = () => setVisible(shouldShow());
    sync();
    return navigationRef.addListener("state", sync);
  }, []);

  useEffect(() => {
    Animated.timing(anim, { toValue: compact ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [anim, compact]);

  if (!visible) return null;

  return (
    <ScreenshotHiddenNative pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.wrap,
          {
            bottom: bottomContentReserveY - 4,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) },
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) },
            ],
          },
        ]}
      >
        <Pressable
          onPress={() =>
            navigationRef.navigate("Main", { screen: "GamesTab", params: { screen: "NbaAsk" } })
          }
          accessibilityRole="button"
          accessibilityLabel="ASK"
          hitSlop={8}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="chat-processing-outline" size={18} color="#050508" />
          {compact ? null : <Text style={styles.label}>ASK</Text>}
        </Pressable>
      </Animated.View>
    </ScreenshotHiddenNative>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 16,
    zIndex: 30,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    minWidth: 40,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: CYBER_TAB_CYAN,
    shadowColor: CYBER_TAB_CYAN,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#050508",
  },
});
