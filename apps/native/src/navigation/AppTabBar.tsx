import { useEffect, useRef } from "react";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { colors } from "../theme/tokens";
import { useNativeNavTabNotificationBadges } from "./useNativeNavTabNotificationBadges";
import NavBarChamferShellNative from "./NavBarChamferShellNative";
import { registerTutorialTarget } from "../features/tutorial/tutorialMeasureNative";
import {
  readTutorialLivePhaseNative,
  writeTutorialLivePhaseNative,
} from "../features/tutorial/tutorialLivePhaseNative";

/** Web NavBar `data-tutorial-target` 相当 */
const TUTORIAL_TARGET_BY_ROUTE: Record<string, string> = {
  GamesTab: "nav-games",
  ResultTab: "nav-home",
  RankingsTab: "nav-ranking",
  LeaderboardsTab: "nav-leaderboards",
  ProfileTab: "nav-mypage",
};

/** 全タブ共通のカスタム PNG（透明背景・シアン発光）。ベクターフォント依存をやめる */
const TAB_ICON_SOURCES: Record<string, number> = {
  GamesTab: require("../../assets/nav-bar/games.png"),
  ResultTab: require("../../assets/nav-bar/result.png"),
  RankingsTab: require("../../assets/nav-bar/ranking.png"),
  LeaderboardsTab: require("../../assets/nav-bar/group.png"),
  ProfileTab: require("../../assets/nav-bar/profile.png"),
};

const ICON_SIZE = 26;

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
                const iconSource = TAB_ICON_SOURCES[route.name];
                const iconStyle = active
                  ? {
                      transform: [{ scale: 1.04 }],
                      opacity: 1,
                      ...(Platform.OS === "ios"
                        ? {
                            shadowColor: "rgba(186,230,253,0.42)",
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 1,
                            shadowRadius: 6,
                          }
                        : { elevation: 6 }),
                    }
                  : {
                      transform: [{ scale: 0.92 }],
                      opacity: 0.42,
                    };

                const onPress = () => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (event.defaultPrevented) return;

                  void (async () => {
                    const phase = await readTutorialLivePhaseNative();
                    if (phase === "gotoResults" && route.name === "ResultTab") {
                      await writeTutorialLivePhaseNative("results");
                    } else if (
                      phase === "gotoRankings" &&
                      route.name === "RankingsTab"
                    ) {
                      await writeTutorialLivePhaseNative("rankings");
                    } else if (
                      phase === "gotoGroups" &&
                      route.name === "LeaderboardsTab"
                    ) {
                      await writeTutorialLivePhaseNative("groups");
                    } else if (
                      phase === "gotoProfile" &&
                      route.name === "ProfileTab"
                    ) {
                      await writeTutorialLivePhaseNative("profile");
                    }
                  })();

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

                const tutorialTarget = TUTORIAL_TARGET_BY_ROUTE[route.name];

                return (
                  <TutorialTabButton
                    key={route.key}
                    tutorialTarget={tutorialTarget}
                    accessibilityState={active ? { selected: true } : {}}
                    accessibilityLabel={options.tabBarAccessibilityLabel}
                    onPress={onPress}
                    style={[styles.tabButton, active && styles.tabButtonActive]}
                  >
                    <View style={styles.iconWrap}>
                      {iconSource ? (
                        <Image
                          source={iconSource}
                          style={[
                            { width: ICON_SIZE, height: ICON_SIZE },
                            iconStyle,
                          ]}
                          resizeMode="contain"
                        />
                      ) : null}
                      {route.name === "RankingsTab" && showRankingBadge ? (
                        <View style={styles.dot} />
                      ) : null}
                      {route.name === "ResultTab" && showResultBadge ? (
                        <View style={styles.dot} />
                      ) : null}
                    </View>
                  </TutorialTabButton>
                );
              })}
            </View>
          </NavBarChamferShellNative>
        </View>
      </View>
    </View>
  );
}

/** measureInWindow 登録付きタブボタン */
function TutorialTabButton({
  tutorialTarget,
  children,
  style,
  onPress,
  accessibilityState,
  accessibilityLabel,
}: {
  tutorialTarget?: string;
  children: React.ReactNode;
  style?: object | object[];
  onPress: () => void;
  accessibilityState?: { selected?: boolean };
  accessibilityLabel?: string;
}) {
  const ref = useRef<View>(null);

  useEffect(() => {
    if (!tutorialTarget) return;
    return registerTutorialTarget(tutorialTarget, () =>
      new Promise((resolve) => {
        const node = ref.current;
        if (!node) {
          resolve(null);
          return;
        }
        node.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) resolve({ x, y, width, height });
          else resolve(null);
        });
      })
    );
  }, [tutorialTarget]);

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={style}
    >
      {children}
    </Pressable>
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
