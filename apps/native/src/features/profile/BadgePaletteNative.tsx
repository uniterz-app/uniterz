/**
 * Web `BadgePalette` 相当。キルトはページ背景。ここはバッジだけ。
 */
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ResolvedBadgeNative } from "./useNativeProfileBadges";

const COLS = 4;
const GAP = 10;
const MIN_ROWS = 5;

function computeTotalSlots(badgeCount: number): number {
  const minSlots = COLS * MIN_ROWS;
  if (badgeCount === 0) return minSlots;
  const filledRows = Math.ceil(badgeCount / COLS);
  return Math.max(minSlots, (filledRows + 1) * COLS);
}

type Props = {
  badges: ResolvedBadgeNative[];
  emptyLabel: string;
  onSelect: (badge: ResolvedBadgeNative) => void;
  language: "ja" | "en";
};

export default function BadgePaletteNative({
  badges,
  emptyLabel,
  onSelect,
}: Props) {
  const totalSlots = computeTotalSlots(badges.length);
  const rowCount = Math.ceil(totalSlots / COLS);

  return (
    <View>
      {badges.length === 0 ? <Text style={styles.empty}>{emptyLabel}</Text> : null}

      <View style={styles.grid}>
        {Array.from({ length: rowCount }).map((_, rowIdx) => (
          <View key={`row-${rowIdx}`} style={styles.row}>
            {Array.from({ length: COLS }).map((__, colIdx) => {
              const slotIdx = rowIdx * COLS + colIdx;
              const badge = badges[slotIdx];
              if (badge) {
                return (
                  <Pressable
                    key={badge.id}
                    onPress={() => onSelect(badge)}
                    style={({ pressed }) => [styles.slot, pressed && styles.slotPressed]}
                  >
                    <View pointerEvents="none" style={styles.groundShadow} />
                    {badge.icon ? (
                      <Image
                        source={{ uri: badge.icon }}
                        style={styles.icon}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.fallback}>{badge.title.slice(0, 8)}</Text>
                    )}
                  </Pressable>
                );
              }
              if (slotIdx < totalSlots) {
                return <View key={`void-${slotIdx}`} style={styles.slotVoid} />;
              }
              return null;
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    textAlign: "center",
    color: "rgba(232,214,168,0.78)",
    fontSize: 13,
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  grid: {
    gap: GAP,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
  },
  slot: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  slotPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }, { translateY: 1 }],
  },
  slotVoid: {
    flex: 1,
    aspectRatio: 1,
  },
  groundShadow: {
    position: "absolute",
    left: "18%",
    right: "18%",
    bottom: "8%",
    height: "22%",
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  icon: {
    width: "82%",
    height: "82%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.58,
    shadowRadius: 10,
  },
  fallback: {
    fontSize: 9,
    color: "rgba(232,214,168,0.7)",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
