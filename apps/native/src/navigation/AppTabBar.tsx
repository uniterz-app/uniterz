import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Dimensions, Platform, Pressable, StyleSheet, View } from "react-native";
import { colors } from "../theme/tokens";
import { useNativeNavTabNotificationBadges } from "./useNativeNavTabNotificationBadges";
import NavBarChamferShellNative from "./NavBarChamferShellNative";

const TAB_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  GamesTab: "sword-cross",
  ResultTab: "brain",
  RankingsTab: "trophy-outline",
  ProfileTab: "account-outline",
};

/** mobile Web NavBar と色味を揃えたカスタムタブバー */
export default function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const pillSidePad = Math.max(0, (Dimensions.get("window").width * (1 - 0.94)) / 2);

  const activeRouteName = state.routes[state.index]?.name ?? "";
  const { showRankingBadge, showResultBadge } =
    useNativeNavTabNotificationBadges({
      rankingTabActive: activeRouteName === "RankingsTab",
      resultTabActive: activeRouteName === "ResultTab",
    });

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View
        style={[styles.pillWrap, { left: pillSidePad, right: pillSidePad, bottom: 10 }]}
        pointerEvents="box-none"
      >
        <View style={styles.pillMax}>
          <NavBarChamferShellNative>
            <View style={styles.row}>
              {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const active = state.index === index;
                const iconName = TAB_ICONS[route.name] ?? "circle-outline";
                const iconColor = active ? colors.tabActive : colors.tabInactive;
                const iconStyle = active
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
                  : { transform: [{ scale: 0.92 }], opacity: 0.9 };

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
                      {route.name === "LeaderboardsTab" ? (
                        <MaterialIcons
                          name="groups"
                          size={23}
                          color={iconColor}
                          style={iconStyle}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={iconName}
                          size={23}
                          color={iconColor}
                          style={iconStyle}
                        />
                      )}
                      {route.name === "RankingsTab" && showRankingBadge ? (
                        <View style={styles.dot} />
                      ) : null}
                      {route.name === "ResultTab" && showResultBadge ? (
                        <View style={styles.dot} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </NavBarChamferShellNative>
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
  row: {
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
