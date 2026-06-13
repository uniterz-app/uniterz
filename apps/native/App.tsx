import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useFonts } from "expo-font";
import {
  Oxanium_700Bold,
  Oxanium_800ExtraBold,
} from "@expo-google-fonts/oxanium";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import { colors, spacing } from "./src/theme/tokens";
import {
  FirebaseUserProvider,
  useFirebaseUser,
} from "./src/auth/FirebaseUserProvider";
import AuthEntryScreen from "./src/features/auth/AuthEntryScreen";
import GamesHomeScreen from "./src/features/games/GamesHomeScreen";
import ProfileHomeScreen from "./src/features/profile/ProfileHomeScreen";
import ResultHomeScreen from "./src/features/results/ResultHomeScreen";
import RankingsHomeScreen from "./src/features/rankings/RankingsHomeScreen";
import { prefetchRankingsLogoGlb } from "./src/features/rankings/rankingsLogoGlbCache";
import { useNativeNavTabNotificationBadges } from "./src/navigation/useNativeNavTabNotificationBadges";
import { useEffect, useState } from "react";

type MainTab = "games" | "insight" | "trophy" | "stats" | "profile";

const MAIN_NAV_ITEMS: Array<{
  id: MainTab;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  enabled: boolean;
}> = [
  { id: "games", icon: "sword-cross", enabled: true },
  { id: "insight", icon: "brain", enabled: true },
  { id: "trophy", icon: "trophy-outline", enabled: true },
  { id: "stats", icon: "chart-bar", enabled: false },
  { id: "profile", icon: "account-outline", enabled: true },
];

/**
 * モバイル共通ナビ（app/component/NavBar.tsx の barMobile / glassSheen）に色味を揃える
 */
const NAV_BAR_MOBILE_FILL = ["rgba(18,24,36,0.52)", "rgba(10,14,24,0.58)"] as const;
const NAV_BAR_MOBILE_SHEEN = [
  "rgba(79,247,244,0.03)",
  "rgba(255,255,255,0.01)",
  "rgba(255,255,255,0)",
] as const;
/** backdrop のうちモバイルは blur(10px) 相当を目安に弱め気味 */
const NAV_BLUR_INTENSITY = Platform.OS === "ios" ? 38 : 32;

function AppContent() {
  const { status, fUser } = useFirebaseUser();
  const [tab, setTab] = useState<MainTab>("games");
  const [profileRefreshNonce, setProfileRefreshNonce] = useState(0);
  const isAuthed = status === "ready" && fUser;
  /** safe-area ライブラリ無し時のホームインジケータ相当（ピルを物理下端から浮かせる） */
  const windowDims = Dimensions.get("window");
  const shorter = Math.min(windowDims.width, windowDims.height);
  const longer = Math.max(windowDims.width, windowDims.height);
  const estimatedBottomInset =
    Platform.OS === "ios" && shorter >= 375 && longer >= 812
      ? 34
      : Platform.OS === "android"
        ? 20
        : 0;
  const tabBarBottomOffset = 10;
  const pillBottomFromScreenBottom = tabBarBottomOffset + estimatedBottomInset;
  const bottomContentReserveY = pillBottomFromScreenBottom + 8 + 42 + 8 + 14;

  const pillSidePad = Math.max(0, (Dimensions.get("window").width * (1 - 0.94)) / 2);

  const { showRankingBadge, showResultBadge } = useNativeNavTabNotificationBadges({
    rankingTabActive: tab === "trophy",
    resultTabActive: tab === "insight",
  });

  useEffect(() => {
    if (!isAuthed) return;
    // ランキングタブを開く前に GLB と 3D キャンバス用チャンクを先読み
    prefetchRankingsLogoGlb();
  }, [isAuthed]);

  return (
    <View style={styles.windowRoot}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.screen}>
          {isAuthed ? (
            <View style={styles.mainArea}>
              {tab === "profile" ? (
                <ProfileHomeScreen
                  bottomReserveY={bottomContentReserveY}
                  onSaved={() => {
                    setProfileRefreshNonce((prev) => prev + 1);
                  }}
                />
              ) : tab === "insight" ? (
                <ResultHomeScreen bottomReserveY={bottomContentReserveY} />
              ) : tab === "trophy" ? (
                <RankingsHomeScreen bottomReserveY={bottomContentReserveY} />
              ) : (
                <GamesHomeScreen
                  key={`games-${profileRefreshNonce}`}
                  bottomReserveY={bottomContentReserveY}
                />
              )}
            </View>
          ) : (
            <AuthEntryScreen />
          )}
          <StatusBar style="light" />
        </View>
      </SafeAreaView>
      {isAuthed ? (
        <View style={styles.navOverlay} pointerEvents="box-none">
          <View
            style={[
              styles.tabBarPillWrap,
              { left: pillSidePad, right: pillSidePad, bottom: pillBottomFromScreenBottom },
            ]}
            pointerEvents="box-none"
          >
            <View style={styles.tabBarPillMax}>
              <View style={styles.tabBarOuter}>
                {(Platform.OS === "ios" || Platform.OS === "android") && (
                  <BlurView
                    intensity={NAV_BLUR_INTENSITY}
                    tint="dark"
                    blurMethod={Platform.OS === "android" ? "dimezisBlurViewSdk31Plus" : undefined}
                    blurReductionFactor={Platform.OS === "android" ? 4 : undefined}
                    style={styles.tabBarBlur}
                  />
                )}
                <LinearGradient
                  pointerEvents="none"
                  colors={[...NAV_BAR_MOBILE_FILL]}
                  style={styles.tabBarFill}
                />
                {/* box-shadow の inset 0 1px 0 rgba(255,255,255,0.04) に相当 */}
                <LinearGradient
                  pointerEvents="none"
                  colors={["rgba(255,255,255,0.04)", "rgba(255,255,255,0)"]}
                  style={styles.tabBarTopInset}
                />
                <LinearGradient
                  pointerEvents="none"
                  colors={[...NAV_BAR_MOBILE_SHEEN]}
                  locations={[0, 0.35, 0.55]}
                  style={styles.tabBarSheen}
                />
                <View style={styles.tabBarRow}>
                  {MAIN_NAV_ITEMS.map((item) => {
                    const active = tab === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        style={[styles.tabButton, active && styles.tabButtonActive]}
                        onPress={() => {
                          if (!item.enabled) {
                            Alert.alert("準備中", "このタブは次フェーズで公開します。");
                            return;
                          }
                          setTab(item.id);
                        }}
                      >
                        <View style={styles.tabIconWrap}>
                          <MaterialCommunityIcons
                            name={item.icon}
                            size={23}
                            color={active ? "#ffffff" : "rgba(226,232,240,0.42)"}
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
                          {item.id === "trophy" && showRankingBadge ? (
                            <View style={styles.tabNotificationDot} />
                          ) : null}
                          {item.id === "insight" && showResultBadge ? (
                            <View style={styles.tabNotificationDot} />
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
      ) : null}
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Oxanium_700Bold,
    Oxanium_800ExtraBold,
  });
  if (!fontsLoaded) return null;

  return (
    <FirebaseUserProvider>
      <AppContent />
    </FirebaseUserProvider>
  );
}

const styles = StyleSheet.create({
  windowRoot: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: "stretch",
    justifyContent: "flex-start",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  mainArea: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "stretch",
    minHeight: 0,
    paddingBottom: 8,
    paddingHorizontal: spacing.xs,
  },
  /** タブピルだけを載せ、背後に広いブラー帯は置かない */
  navOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBarPillWrap: {
    position: "absolute",
    alignItems: "center",
  },
  tabBarPillMax: {
    width: "100%",
    maxWidth: 960,
  },
  tabBarOuter: {
    width: "100%",
    maxWidth: 960,
    alignSelf: "center",
    borderRadius: 22,
    padding: 0,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
    marginTop: 0,
    marginBottom: 0,
    overflow: "hidden",
    position: "relative",
  },
  tabBarBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  tabBarFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  tabBarTopInset: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  tabBarSheen: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 22,
  },
  tabBarRow: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    flexDirection: "row",
    gap: 6,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  tabButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 0,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  tabButtonActive: {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  tabIconWrap: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  tabNotificationDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22d3ee",
    borderWidth: 2,
    borderColor: "rgba(10,14,24,0.85)",
  },
});
