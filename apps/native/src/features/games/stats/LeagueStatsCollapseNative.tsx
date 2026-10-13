/** STATS ハブ / TODAY'S LEADERS: 下へスクロールで上部コントロールを畳む。展開はサマリーバーのタップか先頭での引っ張り */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";

type CollapseContextValue = {
  collapsed: boolean;
  onTableScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  expand: () => void;
};

const noop = () => {};

const LeagueStatsCollapseContext = createContext<CollapseContextValue>({
  collapsed: false,
  onTableScroll: noop,
  expand: noop,
});

/** 方向が揃った移動量がこれを超えたら切り替える */
const TOGGLE_DISTANCE = 24;
/** 先頭付近では畳まない */
const TOP_ZONE = 8;
/** iOS のオーバースクロールでこれより上に引っ張ったら展開 */
const PULL_TO_EXPAND = -48;
/** 切替直後は表の高さ変化でオフセットが動くので無視する */
const TOGGLE_LOCK_MS = 320;

export function useLeagueStatsCollapseState(resetKey?: unknown) {
  const [collapsed, setCollapsed] = useState(false);
  const collapsedRef = useRef(false);
  const lastY = useRef(0);
  const acc = useRef(0);
  const lockUntil = useRef(0);

  const apply = useCallback((next: boolean) => {
    if (collapsedRef.current === next) return;
    collapsedRef.current = next;
    acc.current = 0;
    lockUntil.current = Date.now() + TOGGLE_LOCK_MS;
    setCollapsed(next);
  }, []);

  useEffect(() => {
    lastY.current = 0;
    apply(false);
  }, [resetKey, apply]);

  const onTableScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const y = contentOffset.y;
      const dy = y - lastY.current;
      lastY.current = y;
      if (Date.now() < lockUntil.current) return;
      /** iOS: 先頭からさらに引っ張ったら展開 */
      if (y <= PULL_TO_EXPAND) {
        apply(false);
        return;
      }
      if (y <= TOP_ZONE) return;
      /** 末尾のバウンスで判定しない */
      const maxY = contentSize.height - layoutMeasurement.height;
      if (y >= maxY - 1) return;
      acc.current =
        Math.sign(dy) === Math.sign(acc.current) ? acc.current + dy : dy;
      /** 上へ戻しても畳んだまま（1 位と比べるため）。展開はサマリーバーのタップか引っ張り */
      if (acc.current > TOGGLE_DISTANCE) apply(true);
    },
    [apply]
  );

  const expand = useCallback(() => apply(false), [apply]);

  return useMemo(
    () => ({ collapsed, onTableScroll, expand }),
    [collapsed, onTableScroll, expand]
  );
}

export function LeagueStatsCollapseProvider({
  value,
  children,
}: {
  value: CollapseContextValue;
  children: ReactNode;
}) {
  return (
    <LeagueStatsCollapseContext.Provider value={value}>
      {children}
    </LeagueStatsCollapseContext.Provider>
  );
}

export function useLeagueStatsCollapse() {
  return useContext(LeagueStatsCollapseContext);
}

/** 畳んでいる間だけ出す現在条件の 1 行。タップで展開 */
export function LeagueStatsCollapsedSummaryNative({ text }: { text: string }) {
  const { collapsed, expand } = useLeagueStatsCollapse();
  if (!collapsed) return null;
  return (
    <Pressable
      onPress={expand}
      hitSlop={6}
      accessibilityRole="button"
      style={({ pressed }) => [
        summaryStyles.bar,
        pressed ? summaryStyles.pressed : null,
      ]}
    >
      <Text style={summaryStyles.text} numberOfLines={1}>
        {text}
      </Text>
      <Text style={summaryStyles.chevron}>▼</Text>
    </Pressable>
  );
}

const summaryStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  pressed: {
    backgroundColor: "rgba(0,245,255,0.16)",
  },
  text: {
    flexShrink: 1,
    fontFamily: METRIC_FONT,
    color: "#00F5FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  chevron: {
    color: "#00F5FF",
    fontSize: 10,
  },
});

/** 自然な高さを測り、collapsed で高さ 0 へ畳む */
export function LeagueStatsCollapsibleNative({
  children,
  zIndex,
}: {
  children: ReactNode;
  /** 検索候補を下の表より前に出すとき */
  zIndex?: number;
}) {
  const { collapsed } = useLeagueStatsCollapse();
  const [height, setHeight] = useState(0);
  const progress = useRef(new Animated.Value(collapsed ? 1 : 0)).current;
  /**
   * 展開しきったら高さ指定を外して自然な高さに戻す（アニメの最終値が残ると下の行が潜り込む）。
   * 検索候補のドロップダウンを切らないよう、この間だけはみ出しも許す
   */
  const [settled, setSettled] = useState(!collapsed);
  const settledRef = useRef(settled);
  settledRef.current = settled;
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setSettled(false);
    Animated.timing(progress, {
      toValue: collapsed ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !collapsed) setSettled(true);
    });
  }, [collapsed, progress]);

  return (
    <Animated.View
      style={[
        zIndex != null ? { zIndex } : null,
        !settled && height > 0
          ? {
              height: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [height, 0],
              }),
              opacity: progress.interpolate({
                inputRange: [0, 0.6],
                outputRange: [1, 0],
                extrapolate: "clamp",
              }),
              overflow: "hidden",
            }
          : null,
      ]}
      pointerEvents={collapsed ? "none" : "auto"}
    >
      <View
        onLayout={(e) => {
          /** 畳み中・アニメ中の値は信用しない（未計測なら初回だけ拾う） */
          if (!settledRef.current && height > 0) return;
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - height) > 0.5) setHeight(h);
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}
