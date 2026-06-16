import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { LiveMarkPill } from "../games/LiveMarkPill";
import {
  resultHitBadgeStyleNative,
  resultMissBadgeStyleNative,
  resultOutcomeBadgeTextNative,
  resultPerfectBadgeStyleNative,
  resultStreakBadgeStyleNative,
  resultStreakBadgeTextNative,
  resultUpsetBadgeStyleNative,
} from "./resultMobileUiNative";
import {
  resultLiveBadgeCompact,
  resultLiveBadgeCompactText,
} from "../../ui/resultLiveBadgeStyles";

type ResultBadge = "hit" | "perfect" | "upset" | "miss" | "streak" | null;

type StreakBadge = { label: string; tone: "silver" | "platinum" | "gold" };

type Props = {
  badge: ResultBadge;
  streakBadge: StreakBadge | null;
  activeWinStreak: number;
  showLiveMark?: boolean;
};

function streakFlameColor(tone: StreakBadge["tone"]) {
  if (tone === "gold") return "#fef08a";
  if (tone === "platinum") return "#cffafe";
  return "#f8fafc";
}

/** Web `ResultOutcomeBadges`（モバイル / hitBadgeSubtle） */
export default function ResultOutcomeBadgesNative({
  badge,
  streakBadge,
  activeWinStreak,
  showLiveMark = false,
}: Props) {
  if (!badge && !showLiveMark) return null;

  const streakStyle =
    badge === "streak" ? resultStreakBadgeStyleNative(activeWinStreak) : null;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 4 }}>
      {badge === "streak" && streakStyle && streakBadge ? (
        <View style={streakStyle}>
          <MaterialCommunityIcons
            name="fire"
            size={10}
            color={streakFlameColor(streakBadge.tone)}
          />
          <Text style={resultStreakBadgeTextNative()} numberOfLines={1}>
            {streakBadge.label}
          </Text>
        </View>
      ) : null}
      {badge === "hit" ? (
        <View style={resultHitBadgeStyleNative()}>
          <Text style={resultOutcomeBadgeTextNative.hit}>HIT</Text>
        </View>
      ) : null}
      {badge === "perfect" ? (
        <View style={resultPerfectBadgeStyleNative()}>
          <Text style={resultOutcomeBadgeTextNative.perfect}>PERFECT</Text>
        </View>
      ) : null}
      {badge === "upset" ? (
        <View style={resultUpsetBadgeStyleNative()}>
          <Text style={resultOutcomeBadgeTextNative.upset}>UPSET</Text>
        </View>
      ) : null}
      {badge === "miss" ? (
        <View style={resultMissBadgeStyleNative()}>
          <Text style={resultOutcomeBadgeTextNative.miss}>MISS</Text>
        </View>
      ) : null}
      {showLiveMark ? (
        <LiveMarkPill pillStyle={resultLiveBadgeCompact} textStyle={resultLiveBadgeCompactText} />
      ) : null}
    </View>
  );
}
