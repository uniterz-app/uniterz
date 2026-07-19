/**
 * Web `/mobile/rankings/gap`（Rank Intel — 差の構造）のコンパクト Native 版。
 * ボーナススライス API 未接続のため、順位帯までの得点差（rankTierGap）を可視化する。
 */
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { t } from "../../../../../lib/i18n/t";
import type { Language } from "../../../../../lib/i18n/language";
import {
  formatRankTierGapForHud,
  type RankTierGapHint,
} from "../../../../../lib/rankings/rankTierMilestone";

const GOLD = "#FFD65A";
const CYAN = "#00F5FF";

type Props = {
  visible: boolean;
  onClose: () => void;
  language: "ja" | "en";
  currentRank: number | null;
  myTotalPoints: number;
  totalEntries?: number | null;
  rankTierGap: RankTierGapHint | null;
};

export default function RankGapModalNative({
  visible,
  onClose,
  language,
  currentRank,
  myTotalPoints,
  totalEntries,
  rankTierGap,
}: Props) {
  const lang: Language = language === "en" ? "en" : "ja";
  const m = t(lang).rankings.rankGap;
  const isJa = lang === "ja";

  const hud = rankTierGap
    ? formatRankTierGapForHud(rankTierGap, lang === "en" ? "en" : "ja")
    : null;

  const isGap = rankTierGap?.kind === "gap";
  const targetTierLabel =
    rankTierGap?.kind === "gap"
      ? `TOP${rankTierGap.targetRank}`
      : rankTierGap?.kind === "inside"
        ? rankTierGap.tierLabel
        : null;
  const pointsGap =
    rankTierGap?.kind === "gap" ? Math.round(rankTierGap.pointsGap) : null;
  const cutoffPts = pointsGap != null ? myTotalPoints + pointsGap : null;

  // 進捗バー: 目標カットラインに対する現在得点の割合
  const progressPct =
    cutoffPts != null && cutoffPts > 0
      ? Math.min(100, Math.max(4, Math.round((myTotalPoints / cutoffPts) * 100)))
      : 100;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(0,245,255,0.10)", "rgba(0,0,0,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.eyebrow}>{m.cyberEyebrow}</Text>
              <Text style={styles.title} numberOfLines={1}>
                {m.title}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
              <MaterialCommunityIcons name="close" size={22} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>{m.subtitle}</Text>

          <View style={styles.statsRow}>
            <View style={[styles.statCell, styles.statCellBorderR]}>
              <Text style={styles.statLabel}>{m.yourRank}</Text>
              <Text style={styles.statValue}>{currentRank ?? "—"}</Text>
              {typeof totalEntries === "number" && totalEntries > 0 ? (
                <Text style={styles.statSub}>/ {totalEntries.toLocaleString()}</Text>
              ) : null}
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statLabel}>{m.totalPoints}</Text>
              <Text style={styles.statValue}>
                {Math.round(myTotalPoints).toLocaleString()}
              </Text>
              <Text style={styles.statSub}>{m.ptUnit}</Text>
            </View>
          </View>

          {hud ? (
            <View style={styles.gapBox}>
              <Text style={styles.gapHud} numberOfLines={2}>
                {hud.segments.map((seg, i) => (
                  <Text key={i} style={seg.tone === "tier" ? styles.gapHudGold : null}>
                    {seg.text}
                  </Text>
                ))}
              </Text>

              {isGap && targetTierLabel ? (
                <>
                  <View style={styles.progressTrack}>
                    <LinearGradient
                      colors={[CYAN, GOLD]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${progressPct}%` }]}
                    />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressYou}>
                      {Math.round(myTotalPoints).toLocaleString()}
                    </Text>
                    <Text style={styles.progressTarget}>
                      {targetTierLabel} · {cutoffPts?.toLocaleString()}
                      {m.ptUnit}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.insideBadge}>
                  <MaterialCommunityIcons name="shield-star" size={16} color={GOLD} />
                  <Text style={styles.insideText}>
                    {isJa ? "既に順位帯圏内" : "Inside the target band"}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.emptyHint}>{m.errorGeneric}</Text>
          )}

          <Text style={styles.footnote}>
            {isJa
              ? "得点内訳・上位帯との比較は日次データが溜まると表示されます。"
              : "Points breakdown and cohort comparison unlock as daily data accumulates."}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.22)",
    backgroundColor: "rgba(6,12,20,0.98)",
    padding: 18,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(0,245,255,0.7)",
    fontFamily: "Oxanium_700Bold",
  },
  title: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "Oxanium_700Bold",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(148,163,184,0.82)",
  },
  statsRow: {
    flexDirection: "row",
    marginTop: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  statCellBorderR: {
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.08)",
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
    fontFamily: "Oxanium_600SemiBold",
  },
  statValue: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: "800",
    color: CYAN,
    fontVariant: ["tabular-nums"],
    fontFamily: "Oxanium_700Bold",
  },
  statSub: {
    marginTop: 2,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontVariant: ["tabular-nums"],
  },
  gapBox: {
    marginTop: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.25)",
    backgroundColor: "rgba(251,191,36,0.06)",
    padding: 14,
  },
  gapHud: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(140,240,255,0.9)",
    textAlign: "center",
    fontFamily: "Oxanium_700Bold",
  },
  gapHudGold: {
    color: GOLD,
  },
  progressTrack: {
    marginTop: 12,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressYou: {
    fontSize: 10,
    color: CYAN,
    fontVariant: ["tabular-nums"],
    fontFamily: "Oxanium_600SemiBold",
  },
  progressTarget: {
    fontSize: 10,
    color: GOLD,
    fontVariant: ["tabular-nums"],
    fontFamily: "Oxanium_600SemiBold",
  },
  insideBadge: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  insideText: {
    fontSize: 12,
    fontWeight: "700",
    color: GOLD,
    fontFamily: "Oxanium_700Bold",
  },
  emptyHint: {
    marginTop: 14,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  footnote: {
    marginTop: 14,
    fontSize: 9,
    lineHeight: 13,
    color: "rgba(255,255,255,0.32)",
    textAlign: "center",
  },
});
