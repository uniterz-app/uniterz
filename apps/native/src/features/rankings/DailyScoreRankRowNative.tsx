/** Web `DailyScoreRankRow` 相当 — TODAY UNITERZ / リザルト得点上位の行（順位・アバター・名前・国旗・PTS） */
import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { CYBER_TAB_CYAN } from "./CyberSlantedTabNative";
import { RankingsAvatarNative } from "./RankingsAvatarAndTabs";
import { rankingFlagImageUri } from "./rankingFlagUri";
import { METRIC_FONT, RANK_DISPLAY_FONT } from "./rankingsUiTheme";
import RankingListProSkinFxNative from "./RankingListProSkinFxNative";
import ProCyberBadgeNative from "../profile/kinetik/ProCyberBadgeNative";
import { rankingRowProSkinVariant } from "../../../../../lib/rankings/rankingRowProSkinVariant";
import { rankMedalFrameColor } from "../../../../../lib/rankings/cyberRankVisual";

function rankColor(rank: number): string {
  if (rank === 1) return "#FCD34D";
  if (rank <= 3) return CYBER_TAB_CYAN;
  return "rgba(255,255,255,0.45)";
}

type Props = {
  rank: number;
  name: string;
  photoURL?: string | null;
  isPro: boolean;
  /** users.planProBgVariant。未確定（undefined）の Pro はスキンを出さない */
  planProBgVariant?: string | null;
  countryCode?: string | null;
  /** 国旗の右（予想数・的中など） */
  sub?: ReactNode;
  value: string;
  valueUnit: string;
  onPress?: () => void;
  /** 不透明の背景（ぼかし backdrop 上のリザルト詳細など） */
  solid?: boolean;
  /** 名前を一段小さく（リザルト得点上位） */
  smallName?: boolean;
};

export default function DailyScoreRankRowNative({
  rank,
  name,
  photoURL,
  isPro,
  planProBgVariant,
  countryCode,
  sub,
  value,
  valueUnit,
  onPress,
  solid = false,
  smallName = false,
}: Props) {
  const flagUri = rankingFlagImageUri(countryCode ?? undefined);
  const proSkinVariant =
    typeof planProBgVariant === "string"
      ? rankingRowProSkinVariant(isPro ? "pro" : "free", planProBgVariant)
      : null;
  const medalFrame = rankMedalFrameColor(rank);
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        proSkinVariant && styles.cardSkinned,
        solid && styles.cardSolid,
        medalFrame ? [styles.cardMedal, { borderColor: medalFrame }] : null,
        pressed && styles.cardPressed,
      ]}
    >
      {proSkinVariant ? (
        <RankingListProSkinFxNative variant={proSkinVariant} intensity="medium" />
      ) : null}
      <View style={styles.cardContent}>
        <Text style={[styles.rank, { color: rankColor(rank) }]}>{rank}</Text>
        <RankingsAvatarNative photoURL={photoURL ?? undefined} label={name} size={36} square />
        <View style={styles.who}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, smallName && styles.nameSmall, styles.nameShrink]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {isPro ? <ProCyberBadgeNative compact /> : null}
          </View>
          {flagUri || sub ? (
            <View style={styles.subRow}>
              {flagUri ? (
                <Image source={{ uri: flagUri }} style={styles.flag} resizeMode="cover" />
              ) : null}
              {sub}
            </View>
          ) : null}
        </View>
        <View style={styles.valueCol}>
          <Text style={[styles.value, rank === 1 && styles.valueTop]}>{value}</Text>
          <Text style={styles.valueLabel}>{valueUnit}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export const dailyScoreRankRowSubStyles = StyleSheet.create({
  muted: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.4)",
    transform: [{ skewX: "-6deg" }],
  },
  hits: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.7)",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
});

const styles = StyleSheet.create({
  card: {
    minHeight: 60,
    overflow: "hidden",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  cardSkinned: { backgroundColor: "transparent" },
  cardSolid: { backgroundColor: "#000" },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingLeft: 14,
    paddingRight: 14,
    paddingVertical: 8,
    zIndex: 10,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, minWidth: 0 },
  nameShrink: { flexShrink: 1 },
  cardMedal: { borderWidth: 1.5 },
  cardPressed: { opacity: 0.75 },
  rank: {
    width: 26,
    textAlign: "center",
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 28,
    lineHeight: 30,
    transform: [{ skewX: "-6deg" }],
  },
  who: { flex: 1, minWidth: 0, gap: 5 },
  name: {
    fontFamily: "Oxanium_600SemiBold",
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.95)",
    textTransform: "uppercase",
    includeFontPadding: false,
    transform: [{ skewX: "-6deg" }],
  },
  nameSmall: { fontSize: 13 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  flag: {
    width: 21,
    height: 14,
    borderRadius: 1,
    opacity: 0.8,
  },
  valueCol: { alignItems: "flex-end", minWidth: 52 },
  value: {
    fontFamily: "Oxanium_800ExtraBold",
    fontSize: 26,
    lineHeight: 28,
    color: "#fff",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  valueTop: { color: CYBER_TAB_CYAN },
  valueLabel: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.4)",
    transform: [{ skewX: "-6deg" }],
  },
});
