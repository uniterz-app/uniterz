/** ランキング: タブが画面外へ流れたら上に出す条件 + 自分の順位バー（Native のみ） */
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { PRO_LEAGUE_ATMOSPHERE } from "../../../../../lib/rankings/proLeagueAtmosphere";
import { METRIC_FONT } from "./rankingsUiTheme";

export type RankingsStickyMe = {
  rank: number;
  valueText: string;
  deltaPlaces: number | null;
};

const ACCENT = "#00F5FF";
const UP = "#4ADE80";
const DOWN = "#F87171";

export function RankingsStickyStatusBarNative({
  visible,
  top,
  conditionText,
  me,
  pro,
  onPressConditions,
  onPressMe,
}: {
  visible: boolean;
  top: number;
  conditionText: string;
  me: RankingsStickyMe | null;
  pro: boolean;
  onPressConditions: () => void;
  /** null なら自分の行へ飛べない（一覧に未掲載） */
  onPressMe: (() => void) | null;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  const accent = pro ? PRO_LEAGUE_ATMOSPHERE.panelBorder : ACCENT;

  return (
    <Animated.View
      pointerEvents={visible ? "box-none" : "none"}
      style={[
        styles.wrap,
        {
          top,
          opacity,
          transform: [
            {
              translateY: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [-6, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={[styles.bar, { borderColor: accent }]}>
        <Pressable
          onPress={onPressConditions}
          hitSlop={4}
          accessibilityRole="button"
          style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
        >
          <Text style={[styles.conditions, { color: accent }]} numberOfLines={1}>
            {conditionText}
          </Text>
          <Text style={[styles.chevron, { color: accent }]}>▲</Text>
        </Pressable>
        {me ? (
          <Pressable
            onPress={onPressMe ?? undefined}
            disabled={!onPressMe}
            hitSlop={4}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.row,
              styles.meRow,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.youLabel}>YOU</Text>
            <Text style={styles.rank}>#{me.rank}</Text>
            <Text style={styles.value} numberOfLines={1}>
              {me.valueText}
            </Text>
            {me.deltaPlaces != null && me.deltaPlaces !== 0 ? (
              <Text
                style={[
                  styles.delta,
                  { color: me.deltaPlaces > 0 ? UP : DOWN },
                ]}
              >
                {me.deltaPlaces > 0 ? "▲" : "▼"}
                {Math.abs(me.deltaPlaces)}
              </Text>
            ) : null}
            <View style={styles.spacer} />
            {onPressMe ? (
              <Text style={[styles.jump, { color: accent }]}>▼</Text>
            ) : null}
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 10,
    right: 10,
    zIndex: 5,
  },
  bar: {
    borderWidth: 1,
    backgroundColor: "rgba(5,5,8,0.94)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  meRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  pressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  conditions: {
    flex: 1,
    minWidth: 0,
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  chevron: {
    fontSize: 10,
  },
  youLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.55)",
  },
  rank: {
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  value: {
    flexShrink: 1,
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
  },
  delta: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
  },
  spacer: {
    flex: 1,
  },
  jump: {
    fontSize: 10,
  },
});
