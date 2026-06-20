import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { colors, radius } from "../theme/tokens";
import { nativeBlurViewExtraProps } from "../ui/nativeBlurProps";
import { useNativeNavTabNotificationBadges } from "./useNativeNavTabNotificationBadges";

const NAV_BAR_MOBILE_FILL = [colors.navBarFillStart, colors.navBarFillEnd] as const;
const NAV_BAR_MOBILE_SHEEN = [
  colors.navBarSheenStart,
  "rgba(255,255,255,0.01)",
  "rgba(255,255,255,0)",
] as const;
const NAV_BLUR_INTENSITY = Platform.OS === "ios" ? 38 : 32;

const TAB_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  GamesTab: "sword-cross",
  ResultTab: "brain",
  RankingsTab: "trophy-outline",
  LeaderboardsTab: "chart-bar",
  ProfileTab: "account-outline",
};

/** mobile Web NavBar と色味を揃えたカスタムタブバー */
export default function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const pillSidePad = Math.max(0, (Dimensions.get("window").width * (1 - 0.94)) / 2);

  const activeRouteName = state.routes[state.index]?.name ?? "";
  const { showRankingBadge, showResultBadge, showLeaderboardsBadge } =
    useNativeNavTabNotificationBadges({
      rankingTabActive: activeRouteName === "RankingsTab",
      resultTabActive: activeRouteName === "ResultTab",
      leaderboardsTabActive: activeRouteName === "LeaderboardsTab",
    });

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View
        style={[styles.pillWrap, { left: pillSidePad, right: pillSidePad, bottom: 10 }]}
        pointerEvents="box-none"
      >
        <View style={styles.pillMax}>
          <View style={styles.outer}>
            {(Platform.OS === "ios" || Platform.OS === "android") && (
              <BlurView
                intensity={NAV_BLUR_INTENSITY}
                tint="dark"
                style={styles.blur}
                {...nativeBlurViewExtraProps()}
              />
            )}
            <LinearGradient colors={[...NAV_BAR_MOBILE_FILL]} style={styles.fill} />
            <LinearGradient
              colors={["rgba(255,255,255,0.04)", "rgba(255,255,255,0)"]}
              style={styles.topInset}
            />
            <LinearGradient
              colors={[...NAV_BAR_MOBILE_SHEEN]}
              locations={[0, 0.35, 0.55]}
              style={styles.sheen}
            />
            <View style={styles.row}>
              {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const active = state.index === index;
                const iconName = TAB_ICONS[route.name] ?? "circle-outline";

                const onPress = () => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (event.defaultPrevented) return;

                  if (route.name === "ProfileTab") {
                    navigation.navigate("ProfileTab", {
                      screen: "ProfileHome",
                      params: {},
                    });
                    return;
                  }

                  if (!active) {
                    navigation.navigate(route.name);
                  }
                };

                return (
                  <Pressable
                    key={route.key}
                    accessibilityRole="button"
                    accessibilityState={active ? { selected: true } : {}}
                    accessibilityLabel={options.tabBarAccessibilityLabel}
                    onPress={onPress}
                    style={[styles.tabButton, active && styles.tabButtonActive]}
                  >
                    <View style={styles.iconWrap}>
                      <MaterialCommunityIcons
                        name={iconName}
                        size={23}
                        color={active ? colors.tabActive : colors.tabInactive}
                        style={
                          active
                            ? {
                                transform: [{ scale: 1.04 }],
                                ...(Platform.OS === "ios"
                                  ? {
                                      shadowColor: "rgba(186,230,253,0.42)",
                                      shadowOffset: { width: 0, height: 0 },
                                      shadowOpacity: 1,
                                      shadowRadius: 6,
                                    }
                                  : { elevation: 6 }),
                              }
                            : { transform: [{ scale: 0.92 }], opacity: 0.9 }
                        }
                      />
                      {route.name === "RankingsTab" && showRankingBadge ? (
                        <View style={styles.dot} />
                      ) : null}
                      {route.name === "ResultTab" && showResultBadge ? (
                        <View style={styles.dot} />
                      ) : null}
                      {route.name === "LeaderboardsTab" && showLeaderboardsBadge ? (
                        <View style={styles.dot} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    pointerEvents: "box-none",
  },
  pillWrap: {
    position: "absolute",
    alignItems: "center",
  },
  pillMax: { width: "100%", maxWidth: 960 },
  outer: {
    width: "100%",
    borderRadius: radius.tabBar,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
    overflow: "hidden",
    position: "relative",
  },
  blur: { ...StyleSheet.absoluteFillObject },
  fill: { ...StyleSheet.absoluteFillObject, borderRadius: radius.tabBar },
  topInset: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    borderTopLeftRadius: radius.tabBar,
    borderTopRightRadius: radius.tabBar,
  },
  sheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.tabBar,
  },
  row: {
    position: "relative",
    zIndex: 2,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {},
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.notificationDot,
    borderWidth: 2,
    borderColor: "rgba(10,14,24,0.85)",
  },
});
