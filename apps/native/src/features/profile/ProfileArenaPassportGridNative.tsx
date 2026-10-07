/** Web `ProfileArenaPassportGrid` 相当 */
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  ARENA_PASSPORT_BADGE_ASPECT,
  ARENA_PASSPORT_ROWS,
  ARENA_PASSPORT_TOTAL,
  type ArenaPassportId,
} from "../../../../../lib/profile/arenaPassport";
import { arenaPassportCopy } from "../../../../../lib/profile/arenaPassportCopy";
import { arenaPassportBadgeNativeSource } from "./arenaPassportBadgesNative";

const RAJDHANI = "Rajdhani_600SemiBold";
const OXANIUM = "Oxanium_700Bold";
const GAP = 4;
const CITY_H = 14;
const BADGE_WIDTH_RATIO = 0.86;

type Props = {
  language: string;
  visited: readonly ArenaPassportId[];
  loading?: boolean;
  /** 本人のみ。タップで訪問済みをトグル */
  onToggle?: ((arenaId: ArenaPassportId) => Promise<boolean>) | null;
};

export default function ProfileArenaPassportGridNative({
  language,
  visited,
  loading = false,
  onToggle = null,
}: Props) {
  const copy = arenaPassportCopy(language);
  const visitedSet = new Set(visited);
  const [saveFailed, setSaveFailed] = useState(false);
  const [area, setArea] = useState({ width: 0, height: 0 });
  /** 裏面は表と同じ高さで固定。横幅の 86% を上限に、高さにも収まるサイズ */
  const cols = ARENA_PASSPORT_ROWS[0]?.length ?? 5;
  const rows = ARENA_PASSPORT_ROWS.length;
  const badgeWidth = Math.max(
    0,
    Math.floor(
      Math.min(
        ((area.width - GAP * (cols - 1)) / cols) * BADGE_WIDTH_RATIO,
        ((area.height - GAP * (rows - 1)) / rows - CITY_H) *
          ARENA_PASSPORT_BADGE_ASPECT
      )
    )
  );

  const handleToggle = async (id: ArenaPassportId) => {
    if (!onToggle) return;
    setSaveFailed(false);
    const ok = await onToggle(id);
    if (!ok) setSaveFailed(true);
  };

  return (
    <View style={styles.root}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.count}>
          {loading ? "–" : visited.length}/{ARENA_PASSPORT_TOTAL}
        </Text>
      </View>

      <View
        style={styles.grid}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setArea({ width, height });
        }}
      >
        {badgeWidth > 0
          ? ARENA_PASSPORT_ROWS.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row.map((arena) => {
                  const isVisited = visitedSet.has(arena.id);
                  const label = copy.badgeAria(arena.city, isVisited);
                  return (
                    <Pressable
                      key={arena.id}
                      style={({ pressed }) => [
                        { width: badgeWidth },
                        pressed && onToggle ? styles.cellPressed : null,
                      ]}
                      onPress={
                        onToggle ? () => void handleToggle(arena.id) : undefined
                      }
                      disabled={!onToggle || loading}
                      accessibilityRole={onToggle ? "button" : "image"}
                      accessibilityLabel={label}
                      accessibilityState={
                        onToggle ? { selected: isVisited } : undefined
                      }
                    >
                      <Image
                        source={arenaPassportBadgeNativeSource(arena.id, isVisited)}
                        style={[
                          styles.badge,
                          loading
                            ? styles.badgeLoading
                            : isVisited
                              ? null
                              : styles.badgeGray,
                        ]}
                        resizeMode="contain"
                      />
                      <Text
                        style={[
                          styles.city,
                          isVisited ? styles.cityVisited : null,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                        accessible={false}
                      >
                        {arena.city}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))
          : null}
      </View>

      {onToggle ? (
        <Text style={[styles.hint, saveFailed ? styles.hintError : null]}>
          {saveFailed ? copy.saveError : copy.editHint}
        </Text>
      ) : null}

      <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  titleRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontFamily: OXANIUM,
    fontSize: 15,
    letterSpacing: 2,
    color: "rgba(255,255,255,0.95)",
  },
  count: {
    fontFamily: OXANIUM,
    fontSize: 13,
    letterSpacing: 1,
    color: "rgba(165,243,252,0.85)",
    fontVariant: ["tabular-nums"],
  },
  grid: {
    flex: 1,
    minHeight: 0,
    marginTop: 10,
    gap: GAP,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  cellPressed: {
    transform: [{ scale: 0.95 }],
  },
  badge: {
    width: "100%",
    height: undefined,
    aspectRatio: ARENA_PASSPORT_BADGE_ASPECT,
  },
  city: {
    height: CITY_H,
    fontFamily: OXANIUM,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 0.3,
    textAlign: "center",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.75)",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cityVisited: {
    color: "#F6C344",
  },
  badgeGray: {
    opacity: 0.7,
  },
  badgeLoading: {
    opacity: 0.3,
  },
  hint: {
    marginTop: 12,
    textAlign: "center",
    fontFamily: RAJDHANI,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  hintError: {
    color: "rgba(253,164,175,0.9)",
  },
  disclaimer: {
    paddingTop: 12,
    fontSize: 9,
    lineHeight: 13,
    color: "rgba(255,255,255,0.35)",
  },
});
