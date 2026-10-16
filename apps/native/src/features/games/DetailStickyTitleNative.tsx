/** チーム／プレイヤー詳細: ヒーローカードがスクロールで隠れたら上端に名前（+ タブ）を出すコンパクトバー */
import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { METRIC_FONT } from "../rankings/rankingsUiTheme";

/** 固定バーの名前行の高さ（タブ切替時、本体のタブがこの下に来るよう戻す） */
const TITLE_ROW_H = 37;

/** ScrollView の onScroll と、ヒーローの下端（コンテンツ座標）を測る onLayout を束ねる */
export function useDetailStickyTitleNative() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const [threshold, setThreshold] = useState(0);
  const [pinned, setPinned] = useState(false);
  const thresholdRef = useRef(0);
  const currentY = useRef(0);
  const panelY = useRef(0);
  const heroBottom = useRef(0);
  const tabsY = useRef(0);

  const sync = useCallback(() => {
    if (heroBottom.current > 0) {
      const next = panelY.current + heroBottom.current;
      thresholdRef.current = next;
      setThreshold(next);
    }
  }, []);

  const onPanelLayout = useCallback(
    (e: LayoutChangeEvent) => {
      panelY.current = e.nativeEvent.layout.y;
      sync();
    },
    [sync]
  );

  const onHeroLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { y, height } = e.nativeEvent.layout;
      heroBottom.current = y + height;
      sync();
    },
    [sync]
  );

  /** パネル直下に置いた本体タブの位置 */
  const onTabsLayout = useCallback((e: LayoutChangeEvent) => {
    tabsY.current = e.nativeEvent.layout.y;
  }, []);

  const onScroll = useRef(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: true,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        currentY.current = y;
        const next = thresholdRef.current > 0 && y >= thresholdRef.current;
        setPinned((prev) => (prev === next ? prev : next));
      },
    })
  ).current;

  /** タブ切替: 下までスクロールしていたら、新しいタブの先頭が見える位置へ戻す */
  const scrollToTabs = useCallback(() => {
    const top = Math.max(0, panelY.current + tabsY.current - TITLE_ROW_H);
    if (currentY.current > top) {
      scrollRef.current?.scrollTo({ y: top, animated: false });
    }
  }, []);

  return {
    scrollY,
    scrollRef,
    threshold,
    pinned,
    onScroll,
    onPanelLayout,
    onHeroLayout,
    onTabsLayout,
    scrollToTabs,
  };
}

type Props = {
  scrollY: Animated.Value;
  threshold: number;
  title: string;
  /** 右に添える小さいラベル（選手のチーム略称など） */
  tag?: string | null;
  accent: string;
  /** 名前の下に出すタブ。表示中だけ押せる */
  children?: ReactNode;
  pinned?: boolean;
};

export default function DetailStickyTitleNative({
  scrollY,
  threshold,
  title,
  tag,
  accent,
  children,
  pinned = false,
}: Props) {
  if (threshold <= 0) return null;
  const opacity = scrollY.interpolate({
    inputRange: [threshold - 12, threshold],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const translateY = scrollY.interpolate({
    inputRange: [threshold - 12, threshold],
    outputRange: [-6, 0],
    extrapolate: "clamp",
  });
  return (
    <Animated.View
      pointerEvents={children && pinned ? "box-none" : "none"}
      style={[
        styles.bar,
        { borderBottomColor: accent, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.titleRow} pointerEvents="none">
        <Text style={[styles.title, { color: accent }]} numberOfLines={1}>
          {title}
        </Text>
        {tag ? (
          <Text style={styles.tag} numberOfLines={1}>
            {tag}
          </Text>
        ) : null}
      </View>
      {children ? <View style={styles.tabs}>{children}</View> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(5,5,8,0.94)",
    borderBottomWidth: 1,
  },
  titleRow: {
    height: TITLE_ROW_H,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  tabs: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  title: {
    flexShrink: 1,
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    transform: [{ skewX: "-6deg" }],
  },
  tag: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
