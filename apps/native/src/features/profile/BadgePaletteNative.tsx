/**
 * Web `BadgePalette` jewel-tray / gold-frame / velvet-grid 相当
 */
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { ResolvedBadgeNative } from "../useNativeProfileBadges";

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
  cellSize: number;
  emptyLabel: string;
  onSelect: (badge: ResolvedBadgeNative) => void;
  language: "ja" | "en";
};

export default function BadgePaletteNative({
  badges,
  cellSize,
  emptyLabel,
  onSelect,
  language,
}: Props) {
  const isJa = language === "ja";
  const totalSlots = computeTotalSlots(badges.length);
  const voidCount = Math.max(0, totalSlots - badges.length);
  const rowCount = Math.ceil(totalSlots / COLS);

  return (
    <LinearGradient colors={["#2a0d08", "#5a1b10", "#180706"]} style={styles.tray}>
      <LinearGradient colors={["#6b420d", "#f3c75d", "#7b4a0d", "#ffe08a"]} style={styles.goldFrame}>
        <View style={styles.meta}>
          <Text style={styles.metaTitle}>{isJa ? "獲得バッジ" : "Earned Badges"}</Text>
          <Text style={styles.metaCount}>
            <Text style={styles.metaCountFilled}>{String(badges.length).padStart(2, "0")}</Text>
            <Text style={styles.metaCountSep}> / </Text>
            <Text style={styles.metaCountTotal}>{totalSlots}</Text>
          </Text>
        </View>

        {badges.length === 0 ? <Text style={styles.empty}>{emptyLabel}</Text> : null}

        <LinearGradient colors={["#2a0008", "#540012", "#190005"]} style={styles.velvet}>
          <View style={[styles.grid, { gap: GAP }]}>
            {Array.from({ length: rowCount }).map((_, rowIdx) => (
              <View key={`row-${rowIdx}`} style={[styles.row, { gap: GAP }]}>
                {Array.from({ length: COLS }).map((__, colIdx) => {
                  const slotIdx = rowIdx * COLS + colIdx;
                  const badge = badges[slotIdx];
                  if (badge) {
                    return (
                      <Pressable
                        key={badge.id}
                        onPress={() => onSelect(badge)}
                        style={({ pressed }) => [
                          styles.slot,
                          { width: cellSize, height: cellSize },
                          pressed && { opacity: 0.88 },
                        ]}
                      >
                        {badge.icon ? (
                          <Image source={{ uri: badge.icon }} style={styles.icon} resizeMode="contain" />
                        ) : (
                          <Text style={styles.fallback}>{badge.title.slice(0, 8)}</Text>
                        )}
                      </Pressable>
                    );
                  }
                  if (slotIdx < totalSlots) {
                    return (
                      <View
                        key={`void-${slotIdx}`}
                        style={[styles.slotVoid, { width: cellSize, height: cellSize }]}
                      />
                    );
                  }
                  return null;
                })}
              </View>
            ))}
          </View>
        </LinearGradient>
      </LinearGradient>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tray: {
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.45,
    shadowRadius: 35,
  },
  goldFrame: {
    borderRadius: 10,
    padding: 12,
  },
  meta: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(139,26,40,0.55)",
    paddingHorizontal: 4,
  },
  metaTitle: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 1.5,
    color: "rgba(240,212,200,0.9)",
  },
  metaCount: { fontSize: 11 },
  metaCountFilled: { color: "rgba(255,240,234,0.95)", fontVariant: ["tabular-nums"] },
  metaCountSep: { color: "rgba(201,160,144,0.5)" },
  metaCountTotal: { color: "rgba(201,160,144,0.65)", fontVariant: ["tabular-nums"] },
  empty: {
    textAlign: "center",
    color: "rgba(240,212,200,0.55)",
    fontSize: 13,
    marginBottom: 10,
  },
  velvet: {
    borderRadius: 8,
    padding: 16,
  },
  grid: { gap: 10 },
  row: { flexDirection: "row" },
  slot: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,200,180,0.15)",
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  slotVoid: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  icon: { width: "62%", height: "62%" },
  fallback: { fontSize: 9, color: "rgba(240,212,200,0.55)", textAlign: "center" },
});
