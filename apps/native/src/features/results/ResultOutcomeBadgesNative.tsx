import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import type { ResultOutcomeOnlyBadge } from "../../../../../lib/result/resultBadge";
import { resultStreakTier } from "../../../../../lib/result/resultGlass";
import ResultCyberBadgeNative from "./ResultCyberBadgeNative";
import type { ResultCyberBadgeKind } from "./resultCyberBadgeThemes";

type ResultBadge = "hit" | "perfect" | "upset" | "miss" | "streak" | null;

type StreakBadge = { label: string; tone?: "silver" | "platinum" | "gold" };

type Props = {
  badge: ResultBadge;
  outcomeBadge?: ResultOutcomeOnlyBadge | null;
  showStreakBadge?: boolean;
  stackBadges?: boolean;
  streakBadge: StreakBadge | null;
  activeWinStreak: number;
  showLiveMark?: boolean;
  /** Web `isMobile` */
  compact?: boolean;
  /** Web `hitBadgeSubtle`（リザルト一覧向け） */
  hitBadgeSubtle?: boolean;
  /** Predict オーバーレイ等 — 1 で 100% */
  badgeScale?: number;
};

function streakFlameColor(tone: StreakBadge["tone"]) {
  if (!tone) return "#f8fafc";
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

function resolveBadgeLayout(props: Props) {
  const { badge, outcomeBadge, showStreakBadge, stackBadges } = props;

  if (stackBadges !== undefined) {
    return {
      stackBadges,
      showStreakBadge: showStreakBadge ?? false,
      outcomeBadge: outcomeBadge ?? null,
    };
  }

  if (badge === "streak") {
    return {
      stackBadges: false,
      showStreakBadge: true,
      outcomeBadge: null,
    };
  }

  return {
    stackBadges: false,
    showStreakBadge: false,
    outcomeBadge: (badge as ResultOutcomeOnlyBadge) ?? null,
  };
}

function OutcomeBadge({
  outcome,
  compact,
  hitBadgeSubtle,
}: {
  outcome: ResultOutcomeOnlyBadge;
  compact: boolean;
  hitBadgeSubtle: boolean;
}) {
  if (outcome === "hit") {
    return (
      <ResultCyberBadgeNative kind="hit" label="HIT" compact={compact} subtle={hitBadgeSubtle} />
    );
  }
  if (outcome === "perfect") {
    return (
      <ResultCyberBadgeNative
        kind="perfect"
        label="PERFECT"
        compact={compact}
        subtle={hitBadgeSubtle}
      />
    );
  }
  if (outcome === "upset") {
    return (
      <ResultCyberBadgeNative
        kind="upset"
        label="UPSET"
        compact={compact}
        subtle={hitBadgeSubtle}
      />
    );
  }
  return (
    <ResultCyberBadgeNative kind="miss" label="MISS" compact={compact} subtle={hitBadgeSubtle} />
  );
}

/** Web `ResultOutcomeBadges` */
export default function ResultOutcomeBadgesNative({
  badge,
  outcomeBadge,
  showStreakBadge,
  stackBadges,
  streakBadge,
  activeWinStreak,
  showLiveMark = false,
  compact = true,
  hitBadgeSubtle = false,
  badgeScale = 1,
}: Props) {
  const layout = resolveBadgeLayout({
    badge,
    outcomeBadge,
    showStreakBadge,
    stackBadges,
    streakBadge,
    activeWinStreak,
    showLiveMark,
    compact,
    hitBadgeSubtle,
    badgeScale,
  });

  const displayOutcome = layout.stackBadges
    ? layout.outcomeBadge
    : layout.showStreakBadge &&
        layout.outcomeBadge !== "perfect" &&
        layout.outcomeBadge !== "upset"
      ? null
      : layout.outcomeBadge;

  const displayStreak =
    layout.showStreakBadge &&
    (layout.stackBadges ||
      (layout.outcomeBadge !== "perfect" && layout.outcomeBadge !== "upset"));

  if (!displayStreak && !displayOutcome && !showLiveMark) {
    return null;
  }

  const streakKind = displayStreak ? streakBadgeKind(activeWinStreak) : null;
  const flameSize = Math.round((compact ? 10 : 12) * badgeScale);

  const streakNode =
    displayStreak && streakKind && streakBadge ? (
      <ResultCyberBadgeNative
        kind={streakKind}
        label={streakBadge.label}
        compact={compact}
        subtle={hitBadgeSubtle}
        maxLabelWidth={120}
        leading={
          <MaterialCommunityIcons
            name="fire"
            size={flameSize}
            color={streakFlameColor(streakBadge.tone)}
          />
        }
      />
    ) : null;

  const outcomeNode = displayOutcome ? (
    <OutcomeBadge
      outcome={displayOutcome}
      compact={compact}
      hitBadgeSubtle={hitBadgeSubtle}
    />
  ) : null;

  const liveNode = showLiveMark ? (
    <ResultCyberBadgeNative kind="live" label="LIVE" compact={compact} subtle={hitBadgeSubtle} />
  ) : null;

  const scaleStyle =
    badgeScale !== 1 ? { transform: [{ scale: badgeScale }] } : undefined;

  if (layout.stackBadges) {
    return (
      <View style={[styles.stackColumn, scaleStyle]}>
        {streakNode}
        {outcomeNode}
        {liveNode}
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        gap: 4 * badgeScale,
        alignSelf: "flex-end",
        ...scaleStyle,
      }}
    >
      {streakNode}
      {outcomeNode}
      {liveNode}
    </View>
  );
}

const styles = StyleSheet.create({
  stackColumn: {
    alignItems: "flex-end",
    gap: 4,
    alignSelf: "flex-end",
  },
});
