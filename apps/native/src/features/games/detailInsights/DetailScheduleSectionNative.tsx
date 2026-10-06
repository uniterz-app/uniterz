/** Web `DetailScheduleSection` 相当 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { TeamScheduleDifficulty } from "../../../../../../lib/nba/detailInsights/detailInsightTypes";
import type { NbaTeamUpcomingGame } from "../../../../../../lib/predict/nbaTeamDetailPreviewMocks";
import {
  upcomingDifficultyLegend,
  upcomingDifficultyRestTag,
  upcomingDifficultyValueText,
} from "../../../../../../lib/nba/matchupDifficulty/upcomingDifficultyDisplay";
import {
  matchupDifficultyColor,
  scheduleDifficultySummaryText,
  scheduleDifficultyTierColor,
  scheduleDifficultyTierLabel,
} from "../../../../../../lib/nba/detailInsights/buildScheduleDifficulty";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserPlan } from "../../../hooks/useNativeUserPlan";
import {
  compactNbaCardNickname,
  getNbaTeamNicknameById,
} from "../../../../../../lib/nba-team-names";

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const n = Number.parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function upcomingOppLabel(game: NbaTeamUpcomingGame): string {
  const nick = getNbaTeamNicknameById(game.oppTeamId);
  return compactNbaCardNickname(nick || game.oppAbbr, game.oppTeamId);
}

const OXANIUM = "Oxanium_700Bold";

export function DetailScheduleSectionNative({
  upcomingGames,
  scheduleDifficulty,
  accent,
  language = "en",
  sectionTitle = "UPCOMING",
  onSelectTeam,
}: {
  upcomingGames: NbaTeamUpcomingGame[];
  scheduleDifficulty: TeamScheduleDifficulty | null;
  accent: string;
  language?: string;
  sectionTitle?: string;
  /** 行タップで相手チーム詳細へ */
  onSelectTeam?: (teamId: string) => void;
}) {
  const lang = resolveLocalizedLang(language);
  const { fUser } = useFirebaseUser();
  const { isPro } = useNativeUserPlan(fUser?.uid);
  const legend =
    isPro && upcomingGames.some((g) => g.difficulty)
      ? upcomingDifficultyLegend(lang)
      : null;
  const hasLowSample = upcomingGames.some((g) => g.difficulty?.lowSample);
  const summary =
    scheduleDifficulty && (isPro || scheduleDifficulty.avgDifficulty == null)
      ? scheduleDifficulty
      : null;
  const frame = hexToRgba(accent, 0.3);
  const line = hexToRgba(accent, 0.12);
  const emptyCopy = L(lang, {
    ja: "データがありません",
    en: "No data yet",
    ko: "데이터가 없습니다",
    zh: "暂无数据",
    es: "Aún no hay datos",
    pt: "Ainda sem dados",
    fr: "Pas encore de données",
  });
  const catalogJa = lang === "ja";

  if (!upcomingGames.length) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>{sectionTitle}</Text>
        <View style={[styles.card, { borderColor: frame }]}>
          <Text style={styles.empty}>{emptyCopy}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{sectionTitle}</Text>
      {summary ? (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {scheduleDifficultySummaryText(summary, lang)}
          </Text>
          <View
            style={[
              styles.overallBadge,
              {
                borderColor: `${scheduleDifficultyTierColor(summary.overallTier)}88`,
              },
            ]}
          >
            <Text
              style={[
                styles.overallBadgeText,
                {
                  color: scheduleDifficultyTierColor(summary.overallTier),
                },
              ]}
            >
              {scheduleDifficultyTierLabel(summary.overallTier, catalogJa)}
            </Text>
          </View>
        </View>
      ) : null}
      {legend ? (
        <View style={styles.legend}>
          <Text style={styles.legendText}>{legend.scale}</Text>
          <View style={styles.legendRow}>
            {(
              [
                ["tough", legend.tough],
                ["balanced", legend.balanced],
                ["soft", legend.soft],
              ] as const
            ).map(([tier, label]) => (
              <View key={tier} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: matchupDifficultyColor(tier) },
                  ]}
                />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>
          {hasLowSample ? (
            <Text style={styles.legendText}>{legend.lowSample}</Text>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.card, { borderColor: frame }]}>
        {upcomingGames.map((game, i) => {
          const difficulty = isPro ? game.difficulty : undefined;
          const restTag = game.difficulty
            ? upcomingDifficultyRestTag(game.difficulty)
            : null;
          return (
            <View
              key={`${game.dateLabel}-${game.oppTeamId}-${i}`}
              style={
                i < upcomingGames.length - 1
                  ? {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: line,
                    }
                  : null
              }
            >
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  pressed && onSelectTeam ? styles.rowPressed : null,
                ]}
                disabled={!onSelectTeam || !game.oppTeamId}
                onPress={() => onSelectTeam?.(game.oppTeamId)}
                accessibilityRole={onSelectTeam ? "button" : undefined}
              >
                <Text style={styles.date}>{game.dateLabel}</Text>
                <View style={styles.matchupSkew}>
                  <Text style={styles.matchup} numberOfLines={1}>
                    {game.home ? "vs" : "@"} {upcomingOppLabel(game)}
                    {restTag ? <Text style={styles.confTag}> · {restTag}</Text> : null}
                    {game.conferenceGame ? (
                      <Text style={styles.confTag}> · CONF</Text>
                    ) : null}
                  </Text>
                </View>
                {difficulty ? (
                  <Text
                    style={[
                      styles.difficulty,
                      {
                        color: matchupDifficultyColor(difficulty.tier),
                        opacity: difficulty.lowSample ? 0.55 : 1,
                      },
                    ]}
                  >
                    {upcomingDifficultyValueText(difficulty)}
                  </Text>
                ) : null}
                <View style={styles.tipSkew}>
                  <Text style={styles.tip}>{game.tipLabel}</Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  title: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  summaryText: {
    flex: 1,
    minWidth: 180,
    fontFamily: OXANIUM,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.72)",
  },
  overallBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  overallBadgeText: {
    fontFamily: OXANIUM,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  card: {
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    overflow: "hidden",
  },
  empty: {
    fontFamily: OXANIUM,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  rowPressed: { backgroundColor: "rgba(255,255,255,0.06)" },
  date: {
    width: 44,
    fontFamily: OXANIUM,
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
  },
  matchupSkew: {
    flex: 1,
    minWidth: 0,
    transform: [{ skewX: "-10deg" }],
  },
  matchup: {
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
    transform: [{ skewX: "4deg" }],
  },
  confTag: {
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
  },
  tipSkew: {
    transform: [{ skewX: "-10deg" }],
  },
  difficulty: {
    width: 36,
    textAlign: "right",
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  legend: { gap: 4 },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 10,
    rowGap: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: {
    fontFamily: OXANIUM,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
    color: "rgba(255,255,255,0.45)",
  },
  tip: {
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    transform: [{ skewX: "4deg" }],
  },
});
