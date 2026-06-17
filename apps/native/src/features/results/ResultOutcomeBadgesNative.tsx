import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";
import { resultStreakTier } from "../../../../../lib/result/resultGlass";
import ResultCyberBadgeNative from "./ResultCyberBadgeNative";
import type { ResultCyberBadgeKind } from "./resultCyberBadgeThemes";

type ResultBadge = "hit" | "perfect" | "upset" | "miss" | "streak" | null;

type StreakBadge = { label: string; tone: "silver" | "platinum" | "gold" };

type Props = {
  badge: ResultBadge;
  streakBadge: StreakBadge | null;
  activeWinStreak: number;
  showLiveMark?: boolean;
  /** Web `isMobile` */
  compact?: boolean;
  /** Web `hitBadgeSubtle`（リザルト一覧向け） */
  hitBadgeSubtle?: boolean;
};

function streakFlameColor(tone: StreakBadge["tone"]) {
  if (tone === "gold") return "#fef08a";
  if (tone === "platinum") return "#cffafe";
  return "#f8fafc";
}

function streakBadgeKind(activeWinStreak: unknown): ResultCyberBadgeKind | null {
  const tier = resultStreakTier(activeWinStreak);
  if (tier === "gold") return "streakGold";
  if (tier === "platinum") return "streakPlatinum";
  if (tier === "silver") return "streakSilver";
  return null;
}

/** Web `ResultOutcomeBadges` */
export default function ResultOutcomeBadgesNative({
  badge,
  streakBadge,
  activeWinStreak,
  showLiveMark = false,
  compact = true,
  hitBadgeSubtle = false,
}: Props) {
  if (!badge && !showLiveMark) return null;

  const streakKind = badge === "streak" ? streakBadgeKind(activeWinStreak) : null;

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        gap: 4,
      }}
    >
      {badge === "streak" && streakKind && streakBadge ? (
        <ResultCyberBadgeNative
          kind={streakKind}
          label={streakBadge.label}
          compact={compact}
          subtle={hitBadgeSubtle}
          maxLabelWidth={120}
          leading={
            <MaterialCommunityIcons
              name="fire"
              size={compact ? 10 : 12}
              color={streakFlameColor(streakBadge.tone)}
            />
          }
        />
      ) : null}
      {badge === "hit" ? (
        <ResultCyberBadgeNative
          kind="hit"
          label="HIT"
          compact={compact}
          subtle={hitBadgeSubtle}
        />
      ) : null}
      {badge === "perfect" ? (
        <ResultCyberBadgeNative
          kind="perfect"
          label="PERFECT"
          compact={compact}
          subtle={hitBadgeSubtle}
        />
      ) : null}
      {badge === "upset" ? (
        <ResultCyberBadgeNative
          kind="upset"
          label="UPSET"
          compact={compact}
          subtle={hitBadgeSubtle}
        />
      ) : null}
      {badge === "miss" ? (
        <ResultCyberBadgeNative
          kind="miss"
          label="MISS"
          compact={compact}
          subtle={hitBadgeSubtle}
        />
      ) : null}
      {showLiveMark ? (
        <ResultCyberBadgeNative
          kind="live"
          label="LIVE"
          compact={compact}
          subtle={hitBadgeSubtle}
        />
      ) : null}
    </View>
  );
}
