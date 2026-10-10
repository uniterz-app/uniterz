import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CyberHelpMarkNative from "../ui/CyberHelpMarkNative";
import {
  getAppBrandShelfHelpAction,
  subscribeAppBrandShelfHelpAction,
} from "../../../../lib/ui/appBrandShelfHelpAction";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import {
  endTabTransition,
  runAfterTabTransition,
} from "./tabTransitionLockNative";
import type { NavigationState, PartialState } from "@react-navigation/native";
import { useReducedMotion } from "react-native-reanimated";
import AppTabBar from "./AppTabBar";
import { useBrandShelfSpaceNative } from "./useBrandShelfSpaceNative";
import type { MainTabParamList } from "./types";
import {
  forTabPagerSlide,
  tabPagerTransitionSpec,
} from "./tabPagerTransition";
import NativePushNotificationsHost from "../notifications/NativePushNotificationsHost";
import UniterzBrandShelfNative from "../features/UniterzBrandShelfNative";
import { hideNativeBootSplash } from "../bootstrap/nativeBootSplash";
import { getSplashVideoGateNative } from "../features/splash/video/expoVideoModuleNative";
import { consumeSplashVideoColdStart } from "../features/splash/video/splashVideoColdStart";
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
  getAppBrandShelfHidden,
  subscribeAppBrandShelfHidden,
} from "../../../../lib/ui/appBrandShelfVisibility";
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
import { flushPendingShareDeepLink } from "./shareDeepLinkNative";
import ProfileStatsPrefetchHost from "../features/profile/ProfileStatsPrefetchHost";
import SquadBattleLaunchPromptHostNative from "../features/squads/SquadBattleLaunchPromptHostNative";
import PreseasonBonusClaimHostNative from "../features/units/PreseasonBonusClaimHostNative";

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
  const SplashGate = useMemo(() => getSplashVideoGateNative(), []);
  const [splashGateOpen, setSplashGateOpen] = useState(() => {
    if (!SplashGate) return false;
    return consumeSplashVideoColdStart();
  });
  const [wordmark, setWordmark] = useState(DEFAULT_HEADER_WORDMARK);
  const brandShelfHidden = useSyncExternalStore(
    subscribeAppBrandShelfHidden,
    getAppBrandShelfHidden,
    () => false
  );
  const wordmarkOverride = useSyncExternalStore(
    subscribeAppBrandWordmarkOverride,
    getAppBrandWordmarkOverride,
    () => null
  );
  /**
   * ナビ解決を正にする。未フォーカス画面の stale override が具体的なタブ名を上書きしない。
   * override はナビがまだデフォルトのあいだの先行表示用。
   */
  const shelfTitle =
    wordmark !== DEFAULT_HEADER_WORDMARK
      ? wordmark
      : (wordmarkOverride ?? wordmark);
  const shelfHelpAction = useSyncExternalStore(
    subscribeAppBrandShelfHelpAction,
    getAppBrandShelfHelpAction,
    () => null
  );
  const insets = useSafeAreaInsets();
  const tabTransitionQuiet = useSyncExternalStore(
    subscribeTutorialTabTransitionQuiet,
    getTutorialTabTransitionQuiet,
    () => false
  );
  /**
   * 棚は上に重ね、各スタック画面の contentStyle で棚ぶん下げる（StackNavigators）。
   * タブ / native-stack の画面枠は上にはみ出した子を切り取るため、
   * 枠の外で下げるとサブページ見出し（棚の位置まで引き上げる）が消える。
   */
  const { shelfRendered } = useBrandShelfSpaceNative();

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

  /**
   * BottomTabView はオプションが変わるたびにスライドを掛け直す。
   * 毎レンダー新しいオブジェクトを渡すと、ワードマーク更新などでスライドが途中で打ち切られる。
   */
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: { display: "none" as const },
      // AppShell のメッシュ背景を通す（不透明 #090c15 だとヘッダー下だけ塗り潰される）
      sceneStyle: { backgroundColor: "transparent" },
      // 初回だけ遅延マウント。freezeOnBlur はタブ連打で解凍が積み上がりフリーズするためオフ
      lazy: true,
      freezeOnBlur: false,
      ...tabTransitionOptions,
    }),
    [tabTransitionOptions]
  );

  const screenListeners = useMemo(
    () => ({
      state: (event: {
        data: { state: NavigationState | PartialState<NavigationState> };
      }) => {
        syncWordmarkFromTabState(event.data.state);
      },
      transitionEnd: () => {
        endTabTransition();
      },
    }),
    [syncWordmarkFromTabState]
  );

  const gamesTabListeners = useCallback(
    ({ navigation }: { navigation: Parameters<typeof resetGamesStackInBackgroundNative>[0] }) => ({
      blur: () => {
        /** スライド中に reset するとタブ画面がずれたまま止まる。着地後、まだ Games 以外なら戻す */
        runAfterTabTransition(() => {
          const s = navigation.getState();
          if (s.routes[s.index]?.name === "GamesTab") return;
          resetGamesStackInBackgroundNative(navigation);
        });
      },
    }),
    []
  );

  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => <AppTabBar {...props} />,
    []
  );

  const onSplashDone = useCallback(() => {
    setSplashGateOpen(false);
  }, []);

  useEffect(() => {
    // 動画ゲート中は OS スプラッシュ解除をゲート側に任せる
    if (!splashGateOpen) hideNativeBootSplash();
  }, [splashGateOpen]);

  useEffect(() => {
    // ログイン前に開かれた共有リンクを、Main がルートに載った次フレームで開く
    const id = requestAnimationFrame(() => flushPendingShareDeepLink());
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <ProfileStatsPrefetchHost />
      <NativePushNotificationsHost />
      <SquadBattleLaunchPromptHostNative />
      <PreseasonBonusClaimHostNative />
      <View style={styles.root}>
        <View style={styles.tabHost}>
          <Tab.Navigator
            tabBar={renderTabBar}
            screenListeners={screenListeners}
            screenOptions={screenOptions}
            initialRouteName="GamesTab"
          >
            <Tab.Screen
              name="GamesTab"
              component={GamesStackScreen}
              listeners={gamesTabListeners}
            />
            <Tab.Screen name="ResultTab" component={ResultStackScreen} />
            <Tab.Screen name="RankingsTab" component={RankingsStackScreen} />
            <Tab.Screen name="LeaderboardsTab" component={LeaderboardsStackScreen} />
            <Tab.Screen name="ProfileTab" component={ProfileStackScreen} />
          </Tab.Navigator>
        </View>
        {shelfRendered ? (
          <View
            pointerEvents="none"
            style={[styles.shelfOverlay, brandShelfHidden ? styles.shelfHold : null]}
          >
            <UniterzBrandShelfNative
              includeSafeAreaTop
              title={shelfTitle}
            />
          </View>
        ) : null}
        {shelfRendered && !brandShelfHidden && shelfHelpAction ? (
          <Pressable
            onPress={shelfHelpAction.onPress}
            accessibilityRole="button"
            accessibilityLabel="説明"
            hitSlop={6}
            style={({ pressed }) => [
              styles.shelfHelpBtn,
              { top: insets.top + 8 },
              pressed ? styles.shelfHelpBtnPressed : null,
            ]}
          >
            <CyberHelpMarkNative active={false} />
          </Pressable>
        ) : null}
        {splashGateOpen && SplashGate ? (
          <SplashGate onDone={onSplashDone} />
        ) : null}
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
  shelfOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  /** サブページ中は見た目だけ消す（タブ側の padding は残る） */
  shelfHold: {
    opacity: 0,
  },
  /** 棚のワードマーク行（U マークと同じ 40px）の右端 */
  shelfHelpBtn: {
    position: "absolute",
    right: 18,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 21,
  },
  shelfHelpBtnPressed: {
    opacity: 0.85,
  },
});
