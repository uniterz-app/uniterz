/** チーム／プレイヤー詳細: ヒーローカードがスクロールで隠れたら上端に名前を出すコンパクトバー */
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  type LayoutChangeEvent,
} from "react-native";
import { METRIC_FONT } from "../rankings/rankingsUiTheme";

/** ScrollView の onScroll と、ヒーローの下端（コンテンツ座標）を測る onLayout を束ねる */
export function useDetailStickyTitleNative() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [threshold, setThreshold] = useState(0);
  const panelY = useRef(0);
  const heroBottom = useRef(0);

  const sync = useCallback(() => {
    if (heroBottom.current > 0) setThreshold(panelY.current + heroBottom.current);
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

  const onScroll = useRef(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: true,
    })
  ).current;

  return { scrollY, threshold, onScroll, onPanelLayout, onHeroLayout };
}

type Props = {
  scrollY: Animated.Value;
  threshold: number;
  title: string;
  /** 右に添える小さいラベル（選手のチーム略称など） */
  tag?: string | null;
  accent: string;
};

export default function DetailStickyTitleNative({
  scrollY,
  threshold,
  title,
  tag,
  accent,
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
      pointerEvents="none"
      style={[
        styles.bar,
        { borderBottomColor: accent, opacity, transform: [{ translateY }] },
      ]}
    >
      <Text style={[styles.title, { color: accent }]} numberOfLines={1}>
        {title}
      </Text>
      {tag ? (
        <Text style={styles.tag} numberOfLines={1}>
          {tag}
        </Text>
      ) : null}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: "rgba(5,5,8,0.94)",
    borderBottomWidth: 1,
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
