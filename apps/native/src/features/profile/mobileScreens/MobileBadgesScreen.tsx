/**
 * Web `app/mobile/badges/page.tsx` に相当。
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MobilePageShell from "./MobilePageShell";
import ProfileBadgeDetailModal from "../ProfileBadgeDetailModal";
import {
  useNativeProfileBadges,
  type ResolvedBadgeNative,
} from "../useNativeProfileBadges";
import { colors, fonts } from "../../../theme/tokens";

const COLS = 4;
const GAP = 10;
const MIN_ROWS = 4;

function computeTotalSlots(badgeCount: number, cols: number, minRows: number): number {
  const minSlots = cols * minRows;
  if (badgeCount === 0) return minSlots;
  const filledRows = Math.ceil(badgeCount / cols);
  const withPadRows = filledRows + 1;
  return Math.max(minSlots, withPadRows * cols);
}

type Props = {
  language: "ja" | "en";
  uid: string | undefined;
  onClose: () => void;
};

export default function MobileBadgesScreen({ language, uid, onClose }: Props) {
  const isJa = language === "ja";
  const { width } = useWindowDimensions();
  const { resolvedBadges, loading } = useNativeProfileBadges(uid);
  const [selected, setSelected] = useState<ResolvedBadgeNative | null>(null);

  const cell = useMemo(() => {
    const inner = width - 32 - (COLS - 1) * GAP;
    return Math.floor(inner / COLS);
  }, [width]);

  const slots = useMemo(() => {
    const total = computeTotalSlots(resolvedBadges.length, COLS, MIN_ROWS);
    const rows: (ResolvedBadgeNative | "void")[][] = [];
    let i = 0;
    for (let r = 0; r < total / COLS; r++) {
      const row: (ResolvedBadgeNative | "void")[] = [];
      for (let c = 0; c < COLS; c++) {
        row.push(i < resolvedBadges.length ? resolvedBadges[i]! : "void");
        i++;
      }
      rows.push(row);
    }
    return rows;
  }, [resolvedBadges]);

  const totalSlots = useMemo(
    () => computeTotalSlots(resolvedBadges.length, COLS, MIN_ROWS),
    [resolvedBadges.length]
  );

  if (loading) {
    return (
      <MobilePageShell
        title={isJa ? "バッジパレット" : "Badge Palette"}
        appBackground
        onClose={onClose}
      >
        <View style={styles.center}>
          <ActivityIndicator color="#67e8f9" />
          <Text style={styles.muted}>{isJa ? "読み込み中…" : "Loading..."}</Text>
        </View>
      </MobilePageShell>
    );
  }

  return (
    <MobilePageShell title={isJa ? "バッジパレット" : "Badge Palette"} appBackground onClose={onClose}>
      <FlatList
        data={slots}
        keyExtractor={(_, idx) => `row-${idx}`}
        contentContainerStyle={styles.listPad}
        renderItem={({ item: row }) => (
          <View style={[styles.row, { gap: GAP }]}>
            {row.map((cellItem, j) => {
              if (cellItem === "void") {
                return (
                  <View
                    key={`v-${j}`}
                    style={[
                      styles.slotVoid,
                      { width: cell, height: cell, borderRadius: 10 },
                    ]}
                  />
                );
              }
              const b = cellItem;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => setSelected(b)}
                  style={({ pressed }) => [
                    styles.slotFilled,
                    { width: cell, height: cell, borderRadius: 10 },
                    pressed && { opacity: 0.88 },
                  ]}
                >
                  <LinearGradient
                    colors={["rgba(34,211,238,0.12)", "rgba(15,23,42,0.95)"]}
                    style={[StyleSheet.absoluteFillObject, { borderRadius: 10 }]}
                  />
                  {b.icon ? (
                    <Image source={{ uri: b.icon }} style={styles.iconImg} resizeMode="contain" />
                  ) : (
                    <Text style={styles.iconFallback}>?</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.trayHeader}>
            <View>
              <Text style={styles.trayTitle}>獲得バッジ</Text>
              {resolvedBadges.length === 0 ? (
                <Text style={styles.empty}>{isJa ? "まだ獲得バッジがありません。" : "No badges yet."}</Text>
              ) : null}
            </View>
            <Text style={styles.trayCount}>
              {String(resolvedBadges.length).padStart(2, "0")}
              <Text style={styles.trayCountSlash}> / </Text>
              <Text style={styles.trayCountTotal}>{totalSlots}</Text>
            </Text>
          </View>
        }
      />
      <ProfileBadgeDetailModal
        visible={!!selected}
        badge={selected}
        language={language}
        onClose={() => setSelected(null)}
      />
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  listPad: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
    backgroundColor: "#0A1118",
  },
  row: {
    flexDirection: "row",
  },
  slotVoid: {
    backgroundColor: "rgba(31,16,22,0.34)",
    borderWidth: 1,
    borderColor: "rgba(201,160,144,0.16)",
  },
  slotFilled: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.34)",
    backgroundColor: "rgba(25,15,24,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconImg: { width: "62%", height: "62%" },
  iconFallback: { color: "rgba(226,232,240,0.5)", fontSize: 22, fontWeight: "700" },
  empty: {
    textAlign: "center",
    color: "rgba(201,160,144,0.72)",
    fontSize: 14,
    marginTop: 4,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  muted: { color: "rgba(248,250,252,0.5)", fontSize: 14 },
  trayHeader: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.22)",
    backgroundColor: "rgba(20,12,20,0.78)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trayTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  trayCount: {
    color: "rgba(255,240,234,0.95)",
    fontFamily: fonts.metric,
    fontSize: 15,
    fontWeight: "800",
  },
  trayCountSlash: { color: "rgba(201,160,144,0.5)" },
  trayCountTotal: { color: "rgba(201,160,144,0.65)" },
});
