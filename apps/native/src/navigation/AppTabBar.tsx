import { useEffect, useRef, useSyncExternalStore } from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Animated,
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
import { useFirebaseUser } from "../auth/FirebaseUserProvider";
import {
  loadProfileUserDocNative,
  peekProfileUserDocNative,
} from "../features/profile/profileUserDocCacheNative";
import {
  prefetchNativeProfileStats,
  seedNativeProfileStatsFromUserDoc,
} from "../features/profile/useNativeProfileStats";
import { registerTutorialTarget } from "../features/tutorial/tutorialMeasureNative";
import {
  getTutorialWelcomeChromeHidden,
  subscribeTutorialWelcomeChromeHidden,
} from "../../../../lib/tutorial/tutorialWelcomeChrome";
import { TUTORIAL_WELCOME_CHROME_FADE_MS } from "../../../../lib/tutorial/tutorialMotion";

/** Web NavBar `data-tutorial-target` 相当 */
const TUTORIAL_TARGET_BY_ROUTE: Record<string, string> = {
  GamesTab: "nav-games",
  ResultTab: "nav-home",
  RankingsTab: "nav-ranking",
  LeaderboardsTab: "nav-leaderboards",
  ProfileTab: "nav-mypage",
};

/** カスタム PNG 全置き換え前 — リザルトのみ画像、他はベクター */
const TAB_ICONS: Record<
  string,
  React.ComponentProps<typeof MaterialCommunityIcons>["name"]
> = {
  GamesTab: "sword-cross",
  RankingsTab: "trophy-outline",
  ProfileTab: "account-outline",
};

/** リザルトのみカスタム画像。他は従来アイコン */
const RESULT_ICON = require("../../assets/navbar/result.png") as number;

const ICON_SIZE = 23;
/** リザルト（カスタム画像）のみ大きく */
const RESULT_ICON_SIZE = 32;

/** mobile Web NavBar と色味を揃えたカスタムタブバー */
export default function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const pillSidePad = Math.max(0, (Dimensions.get("window").width * (1 - 0.94)) / 2);
  /** 連打で navigate が積み上がるのを抑える */
  const lastPressAtRef = useRef(0);
  const { fUser } = useFirebaseUser();
  const myUid = fUser?.uid?.trim() ?? "";
  const welcomeChromeHidden = useSyncExternalStore(
    subscribeTutorialWelcomeChromeHidden,
    getTutorialWelcomeChromeHidden,
    () => false
  );
  const chromeOp = useRef(new Animated.Value(welcomeChromeHidden ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(chromeOp, {
      toValue: welcomeChromeHidden ? 0 : 1,
      duration: TUTORIAL_WELCOME_CHROME_FADE_MS,
      useNativeDriver: true,
    }).start();
  }, [chromeOp, welcomeChromeHidden]);

  const activeRouteName = state.routes[state.index]?.name ?? "";
  const { showRankingBadge, showResultBadge } =
    useNativeNavTabNotificationBadges({
      rankingTabActive: activeRouteName === "RankingsTab",
      resultTabActive: activeRouteName === "ResultTab",
    });

  return (
    <View
      style={styles.overlay}
      pointerEvents={welcomeChromeHidden ? "none" : "box-none"}
    >
      <Animated.View
        style={[
          styles.pillWrap,
          {
            left: pillSidePad,
            right: pillSidePad,
            bottom: 10,
            opacity: chromeOp,
          },
        ]}
        pointerEvents={welcomeChromeHidden ? "none" : "box-none"}
      >
        <View style={styles.pillMax}>
          <NavBarChamferShellNative>
            <View style={styles.row}>
              {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const active = state.index === index;
                const iconName = TAB_ICONS[route.name] ?? "circle-outline";
                const iconColor = active ? colors.tabActive : colors.tabInactive;
                const isResult = route.name === "ResultTab";
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
                      opacity: isResult ? 0.42 : 0.9,
                    };

                const onPress = () => {
                  const now = Date.now();
                  if (now - lastPressAtRef.current < 280) return;
                  lastPressAtRef.current = now;

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

                const tutorialTarget = TUTORIAL_TARGET_BY_ROUTE[route.name];

                const warmProfileTab = () => {
                  if (route.name !== "ProfileTab" || !myUid) return;
                  const peek = peekProfileUserDocNative(myUid);
                  if (peek) seedNativeProfileStatsFromUserDoc(myUid, peek);
                  void prefetchNativeProfileStats(myUid);
                  void loadProfileUserDocNative(myUid).then((loaded) => {
                    if (loaded?.exists) {
                      seedNativeProfileStatsFromUserDoc(myUid, loaded.data);
                    }
                  });
                };

                return (
                  <TutorialTabButton
                    key={route.key}
                    tutorialTarget={tutorialTarget}
                    accessibilityState={active ? { selected: true } : {}}
                    accessibilityLabel={options.tabBarAccessibilityLabel}
                    onPressIn={warmProfileTab}
                    onPress={onPress}
                    style={[styles.tabButton, active && styles.tabButtonActive]}
                  >
                    <View style={styles.iconWrap}>
                      {isResult ? (
                        <Image
                          source={RESULT_ICON}
                          style={[
                            {
                              width: RESULT_ICON_SIZE,
                              height: RESULT_ICON_SIZE,
                            },
                            iconStyle,
                          ]}
                          resizeMode="contain"
                        />
                      ) : route.name === "LeaderboardsTab" ? (
                        <MaterialIcons
                          name="groups"
                          size={ICON_SIZE}
                          color={iconColor}
                          style={iconStyle}
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={iconName}
                          size={ICON_SIZE}
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
                  </TutorialTabButton>
                );
              })}
            </View>
          </NavBarChamferShellNative>
        </View>
      </Animated.View>
    </View>
  );
}

/** measureInWindow 登録付きタブボタン */
function TutorialTabButton({
  tutorialTarget,
  children,
  style,
  onPress,
  onPressIn,
  accessibilityState,
  accessibilityLabel,
}: {
  tutorialTarget?: string;
  children: React.ReactNode;
  style?: object | object[];
  onPress: () => void;
  onPressIn?: () => void;
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
      onPressIn={onPressIn}
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
