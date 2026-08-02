/**
 * Web `ResultCard`（mobile dense）のプロフィール用簡易版。
 * Result Drop 一覧向け。詳細は Result タブへ。
 */
import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "../../../../../lib/team-colors";
import { resolveResultBadgeDisplay } from "../../../../../lib/result/resultBadge";
import { resolvePostListLeague, type League } from "../../../../../lib/leagues";
import JerseyMarkAdaptive from "../games/JerseyMarkAdaptive";
import ResultGlassShellNative from "../results/ResultGlassShellNative";
import ResultHitCyberFrameNative from "../results/ResultHitCyberFrameNative";
import ResultMatchScoreLineNative from "../results/ResultMatchScoreLineNative";
import ResultOutcomeBadgesNative from "../results/ResultOutcomeBadgesNative";
import ResultStatRatingBarNative from "../results/ResultStatRatingBarNative";
import type { PostWithMillis } from "../results/nativeResultModel";
import { resultCardShellNative } from "../results/resultMobileUiNative";

type Props = {
  post: PostWithMillis;
  language: "ja" | "en";
  onPress?: () => void;
};

const JERSEY_SIZE = 36;

function toNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function toInt(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}

function scorePair(raw: unknown): { home: number; away: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const home = toNumber(o.home, NaN);
  const away = toNumber(o.away, NaN);
  if (!Number.isFinite(home) || !Number.isFinite(away)) return null;
  return { home, away };
}

export default function ProfileSettledTodayResultCardNative({
  post,
  language,
  onPress,
}: Props) {
  const isEn = language === "en";
  const leagueKey = resolvePostListLeague({
    league: post.league as string | null | undefined,
    gameId: typeof post.gameId === "string" ? post.gameId : null,
  }) as League;
  const home = post.home as { name?: string; teamId?: string } | undefined;
  const away = post.away as { name?: string; teamId?: string } | undefined;
  const stats = post.stats as Record<string, unknown> | undefined;
  const pred = post.prediction as
    | { score?: { home?: number; away?: number }; winner?: string }
    | undefined;
  const result = post.result as { home?: number; away?: number } | undefined;

  const homeName = (home?.name ?? "HOME").trim() || "HOME";
  const awayName = (away?.name ?? "AWAY").trim() || "AWAY";
  const homeJersey = {
    primary: getTeamJerseyPrimaryColor(leagueKey, home?.teamId ?? ""),
    secondary: getTeamJerseySecondaryColor(leagueKey, home?.teamId ?? ""),
  };
  const awayJersey = {
    primary: getTeamJerseyPrimaryColor(leagueKey, away?.teamId ?? ""),
    secondary: getTeamJerseySecondaryColor(leagueKey, away?.teamId ?? ""),
  };

  const predicted = scorePair(pred?.score);
  const finalScore = scorePair(result);

  const activeWinStreak =
    toInt(
      (stats?.pointsV3Detail as { activeWinStreak?: number } | undefined)
        ?.activeWinStreak
    ) ?? 0;
  const {
    frameBadge: badge,
    outcomeBadge,
    showStreakBadge,
    stackBadges,
  } = resolveResultBadgeDisplay({
    stats: stats as never,
    prediction: pred as never,
    result: result as never,
    upsetHit: Boolean(stats?.upsetHit),
    isWin:
      stats?.isWin === true ? true : stats?.isWin === false ? false : undefined,
    activeWinStreak,
  });

  const frameStyle: ViewStyle | null =
    badge === "upset"
      ? styles.cardFrameUpset
      : badge === "perfect"
        ? styles.cardFramePerfect
        : badge === "hit"
          ? styles.cardFrameHit
          : badge === "miss"
            ? styles.cardFrameMiss
            : null;

  const shellBorderColor =
    typeof frameStyle?.borderColor === "string"
      ? frameStyle.borderColor
      : "rgba(255,255,255,0.12)";

  const upsetPoints = toNumber(stats?.upsetPoints, 0);
  const pointsV3 = toNumber(stats?.pointsV3, 0);
  const hadUpsetGame = upsetPoints > 0 || Boolean(stats?.upsetHit);

  const statRows = useMemo(
    () => [
      {
        key: "upsetPoints" as const,
        label: isEn ? "Upset Score" : "アップセット",
        value: upsetPoints,
        format: (v: number) =>
          hadUpsetGame ? `${(Math.round(v * 10) / 10).toFixed(1)}` : "--",
      },
      {
        key: "pointsV3" as const,
        label: isEn ? "Total Score" : "総合得点",
        value: pointsV3,
        format: (v: number) => `${(Math.round(v * 10) / 10).toFixed(1)}`,
      },
    ],
    [hadUpsetGame, isEn, pointsV3, upsetPoints]
  );

  return (
    <Pressable
      style={({ pressed }) => [pressed && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <ResultGlassShellNative
        borderColor={shellBorderColor}
        strokeWidth={badge === "hit" || badge === "perfect" || badge === "upset" ? 3 : 1.5}
        shellStyle={[
          styles.shell,
          frameStyle
            ? {
                shadowColor: frameStyle.shadowColor,
                shadowOpacity: frameStyle.shadowOpacity,
                shadowRadius: frameStyle.shadowRadius,
                elevation: frameStyle.elevation,
              }
            : null,
        ]}
      >
        <View style={styles.badgeAbs} pointerEvents="none">
          <ResultOutcomeBadgesNative
            badge={badge}
            outcomeBadge={outcomeBadge}
            showStreakBadge={showStreakBadge}
            stackBadges={stackBadges}
            streakBadge={
              activeWinStreak >= 3
                ? {
                    label: isEn
                      ? `${activeWinStreak} Streak`
                      : `${activeWinStreak}連勝`,
                    tone:
                      activeWinStreak >= 7
                        ? "gold"
                        : activeWinStreak >= 5
                          ? "platinum"
                          : "silver",
                  }
                : null
            }
            activeWinStreak={activeWinStreak}
            hitBadgeSubtle
          />
        </View>

        <View style={[resultCardShellNative.body, styles.body]}>
          <View style={styles.matchGrid}>
            <View style={[styles.sideCol, styles.sideHome]}>
              <JerseyMarkAdaptive
                accent={homeJersey.primary}
                accentEnd={homeJersey.secondary}
                size={JERSEY_SIZE}
              />
              <Text style={styles.teamName} numberOfLines={1}>
                {homeName}
              </Text>
            </View>

            <View style={styles.scoreCol}>
              {predicted ? (
                <ResultMatchScoreLineNative
                  home={predicted.home}
                  away={predicted.away}
                  variant="predicted"
                  density="listBasketball"
                />
              ) : null}
              {finalScore ? (
                <ResultMatchScoreLineNative
                  home={finalScore.home}
                  away={finalScore.away}
                  variant="final"
                  density="listBasketball"
                />
              ) : null}
            </View>

            <View style={[styles.sideCol, styles.sideAway]}>
              <JerseyMarkAdaptive
                accent={awayJersey.primary}
                accentEnd={awayJersey.secondary}
                size={JERSEY_SIZE}
              />
              <Text style={styles.teamName} numberOfLines={1}>
                {awayName}
              </Text>
            </View>
          </View>

          <View style={styles.statsBlock}>
            {statRows.map((row) => (
              <View key={row.key} style={styles.statRow}>
                <View style={styles.statMeta}>
                  <Text style={styles.statLabel}>{row.label}</Text>
                  <Text style={styles.statValue}>{row.format(row.value)}</Text>
                </View>
                <ResultStatRatingBarNative
                  ratio={Math.max(0, Math.min(1, row.value / 10))}
                  metricKey={row.key}
                />
              </View>
            ))}
          </View>
        </View>

        {badge === "hit" ? <ResultHitCyberFrameNative /> : null}
      </ResultGlassShellNative>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  shell: {
    position: "relative",
    overflow: "hidden",
  },
  badgeAbs: {
    position: "absolute",
    right: 8,
    top: 8,
    zIndex: 4,
  },
  body: {
    paddingHorizontal: 8,
    paddingTop: 36,
    paddingBottom: 8,
  },
  matchGrid: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sideCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 4,
  },
  sideHome: {},
  sideAway: {},
  scoreCol: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  teamName: {
    color: "rgba(248,250,252,0.92)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    maxWidth: "100%",
  },
  statsBlock: {
    marginTop: 10,
    gap: 8,
  },
  statRow: {
    gap: 4,
  },
  statMeta: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  statLabel: {
    color: "rgba(148,163,184,0.85)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  statValue: {
    color: "rgba(248,250,252,0.95)",
    fontSize: 13,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  cardFrameHit: {
    borderColor: "rgba(34,211,238,0.85)",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  cardFramePerfect: {
    borderColor: "rgba(250,204,21,0.9)",
    shadowColor: "#facc15",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  cardFrameUpset: {
    borderColor: "rgba(244,63,94,0.9)",
    shadowColor: "#f43f5e",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  cardFrameMiss: {
    borderColor: "rgba(148,163,184,0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
});
