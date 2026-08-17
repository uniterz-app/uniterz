import type {
  NbaTeamRecentGame,
  NbaTeamStreak,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";

export type TeamStreakMood = "hot" | "cold" | "neutral";

export type TeamStreakBadgeTier = "neutral" | "hot" | "fire" | "cold" | "freeze";

/** バッジ見た目（HOT/FIRE/COLD/FREEZE、未満は直近） */
export type TeamStreakBadgeTheme = {
  mood: TeamStreakMood;
  tier: TeamStreakBadgeTier;
  showFireIcon: boolean;
  showColdIcon: boolean;
  tagColor: string;
  headlineColor: string;
  borderColor: string;
  backgroundColor: string;
};

const STREAK_HOT_MIN = 3;
const STREAK_FIRE_MIN = 5;

const STREAK_WIN_YELLOW = "#FCD34D";
const STREAK_LOSE_RED = "#FF2D78";
const STREAK_FIRE_ORANGE = "#FF8A3D";
const STREAK_COLD_BLUE = "#6EC8FF";

export function getTeamStreakBadgeTier(
  streak: NbaTeamStreak
): TeamStreakBadgeTier {
  if (streak.count < STREAK_HOT_MIN) return "neutral";
  if (streak.kind === "W") {
    return streak.count >= STREAK_FIRE_MIN ? "fire" : "hot";
  }
  return streak.count >= STREAK_FIRE_MIN ? "freeze" : "cold";
}

export function getTeamStreakMood(streak: NbaTeamStreak): TeamStreakMood {
  const tier = getTeamStreakBadgeTier(streak);
  if (tier === "hot" || tier === "fire") return "hot";
  if (tier === "cold" || tier === "freeze") return "cold";
  return "neutral";
}

export function teamStreakBadgeTheme(streak: NbaTeamStreak): TeamStreakBadgeTheme {
  const tier = getTeamStreakBadgeTier(streak);
  const mood = getTeamStreakMood(streak);
  const winning = streak.kind === "W" && streak.count > 0;
  const losing = streak.kind === "L" && streak.count > 0;

  const headlineColor = winning
    ? STREAK_WIN_YELLOW
    : losing
      ? STREAK_LOSE_RED
      : "rgba(255,255,255,0.45)";

  if (tier === "fire") {
    return {
      mood,
      tier,
      showFireIcon: true,
      showColdIcon: false,
      tagColor: STREAK_FIRE_ORANGE,
      headlineColor,
      borderColor: "rgba(255,120,40,0.45)",
      backgroundColor: "rgba(255,120,40,0.14)",
    };
  }
  if (tier === "hot") {
    return {
      mood,
      tier,
      showFireIcon: false,
      showColdIcon: false,
      tagColor: "#FBBF24",
      headlineColor,
      borderColor: "rgba(252,211,77,0.35)",
      backgroundColor: "rgba(252,211,77,0.08)",
    };
  }
  if (tier === "freeze") {
    return {
      mood,
      tier,
      showFireIcon: false,
      showColdIcon: true,
      tagColor: STREAK_COLD_BLUE,
      headlineColor,
      borderColor: "rgba(110,200,255,0.4)",
      backgroundColor: "rgba(80,170,255,0.12)",
    };
  }
  if (tier === "cold") {
    return {
      mood,
      tier,
      showFireIcon: false,
      showColdIcon: false,
      tagColor: STREAK_COLD_BLUE,
      headlineColor,
      borderColor: "rgba(110,200,255,0.3)",
      backgroundColor: "rgba(80,170,255,0.08)",
    };
  }
  if (winning || losing) {
    return {
      mood: "neutral",
      tier,
      showFireIcon: false,
      showColdIcon: false,
      tagColor: headlineColor,
      headlineColor,
      borderColor: winning
        ? "rgba(252,211,77,0.28)"
        : "rgba(255,45,120,0.28)",
      backgroundColor: winning
        ? "rgba(252,211,77,0.06)"
        : "rgba(255,45,120,0.06)",
    };
  }
  return {
    mood: "neutral",
    tier,
    showFireIcon: false,
    showColdIcon: false,
    tagColor: "rgba(255,255,255,0.45)",
    headlineColor,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  };
}

export function teamStreakBadgeLabel(
  streak: NbaTeamStreak,
  isJa: boolean
): { headline: string; tag: string } {
  const formTag = isJa ? "直近" : "FORM";
  if (streak.count <= 0) {
    return {
      headline: "—",
      tag: formTag,
    };
  }
  const n = streak.count;
  const headline = streak.kind === "W" ? `W${n}` : `L${n}`;
  if (streak.kind === "W") {
    if (n >= STREAK_FIRE_MIN) return { headline, tag: "FIRE" };
    if (n >= STREAK_HOT_MIN) return { headline, tag: "HOT" };
    return { headline, tag: formTag };
  }
  if (n >= STREAK_FIRE_MIN) return { headline, tag: "FREEZE" };
  if (n >= STREAK_HOT_MIN) return { headline, tag: "COLD" };
  return { headline, tag: formTag };
}

export function recentFormRecord(games: NbaTeamRecentGame[]): {
  wins: number;
  losses: number;
} {
  const slice = games.slice(-10);
  const wins = slice.filter((g) => g.result === "W").length;
  return { wins, losses: slice.length - wins };
}
