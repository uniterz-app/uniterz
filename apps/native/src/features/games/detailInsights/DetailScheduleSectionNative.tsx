/** Web `DetailScheduleSection` 相当 */
import { StyleSheet, Text, View } from "react-native";
import type { TeamScheduleDifficulty } from "../../../../../../lib/nba/detailInsights/detailInsightTypes";
import type { NbaTeamUpcomingGame } from "../../../../../../lib/predict/nbaTeamDetailPreviewMocks";
import {
  scheduleDifficultySummaryText,
  scheduleDifficultyTierColor,
  scheduleDifficultyTierLabel,
} from "../../../../../../lib/nba/detailInsights/buildScheduleDifficulty";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";

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

const OXANIUM = "Oxanium_700Bold";

export function DetailScheduleSectionNative({
  upcomingGames,
  scheduleDifficulty,
  accent,
  language = "en",
  sectionTitle = "UPCOMING",
}: {
  upcomingGames: NbaTeamUpcomingGame[];
  scheduleDifficulty: TeamScheduleDifficulty | null;
  accent: string;
  language?: string;
  sectionTitle?: string;
}) {
  const lang = resolveLocalizedLang(language);
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
      {scheduleDifficulty ? (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>
            {scheduleDifficultySummaryText(scheduleDifficulty, lang)}
          </Text>
          <View
            style={[
              styles.overallBadge,
              {
                borderColor: `${scheduleDifficultyTierColor(scheduleDifficulty.overallTier)}88`,
              },
            ]}
          >
            <Text
              style={[
                styles.overallBadgeText,
                {
                  color: scheduleDifficultyTierColor(
                    scheduleDifficulty.overallTier
                  ),
                },
              ]}
            >
              {scheduleDifficultyTierLabel(
                scheduleDifficulty.overallTier,
                catalogJa
              )}
            </Text>
          </View>
        </View>
      ) : null}
      <View style={[styles.card, { borderColor: frame }]}>
        {upcomingGames.map((game, i) => (
          <View
            key={`${game.dateLabel}-${game.oppAbbr}-${i}`}
            style={[
              styles.row,
              i < upcomingGames.length - 1
                ? {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: line,
                  }
                : null,
            ]}
          >
            <Text style={styles.date}>{game.dateLabel}</Text>
            <Text style={styles.matchup} numberOfLines={1}>
              {game.home ? "vs" : "@"} {game.oppAbbr}
              {game.conferenceGame ? (
                <Text style={styles.confTag}> · CONF</Text>
              ) : null}
            </Text>
            <Text style={styles.tip}>{game.tipLabel}</Text>
          </View>
        ))}
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
  date: {
    width: 44,
    fontFamily: OXANIUM,
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
  },
  matchup: {
    flex: 1,
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
  confTag: {
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
  },
  tip: {
    fontFamily: OXANIUM,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
  },
});
