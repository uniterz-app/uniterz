/**
 * Pro Insight「先週 TOP 5%」— 先週の週間ランキング上位 5% の人だけの予想分布。
 * ナラティブの末尾に置く。ナラティブ未生成の試合は standalone で単体表示。
 */
import { Platform, StyleSheet, Text, View } from "react-native";
import { resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import type { SmartMoneyMarket } from "../../../../../../lib/predict/smartMoneyMarket";
import { smartMoneyMarketCopy } from "../../../../../../lib/predict/smartMoneyMarketCopy";
import { getMobileTeamName } from "../../../../../../lib/team-name-split-mobile";
import { NBA_TEAM_NAME_BY_ID } from "../../../../../../lib/nba-team-names";
import { getTeamJerseyPrimaryColor } from "../../../../../../lib/team-colors";
import { OXANIUM_700, OXANIUM_800, JP_600 } from "../../profile/reports/reportThemeNative";
import type { GamesLanguage } from "../gamesI18n";

const ACCENT = "rgba(196,181,253,0.95)";

type Props = {
  market: SmartMoneyMarket;
  language: GamesLanguage;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName?: string;
  awayTeamName?: string;
  /** ナラティブの外で単体表示するときの枠 */
  standalone?: boolean;
};

function teamNick(teamId: string, fallbackName: string): string {
  if (teamId.startsWith("nba-")) {
    const full = NBA_TEAM_NAME_BY_ID[teamId];
    if (full) return getMobileTeamName("nba", full);
  }
  return fallbackName.trim();
}

function formatPct(v: number): string {
  return `${Math.round(v)}%`;
}

export default function PredictProInsightSmartMarketNative({
  market,
  language,
  homeTeamId,
  awayTeamId,
  homeTeamName = "",
  awayTeamName = "",
  standalone = false,
}: Props) {
  const copy = smartMoneyMarketCopy(resolveLocalizedLang(language));
  const homeNick = teamNick(homeTeamId, homeTeamName).toUpperCase();
  const awayNick = teamNick(awayTeamId, awayTeamName).toUpperCase();
  const homeColor = getTeamJerseyPrimaryColor("nba", homeTeamId);
  const awayColor = getTeamJerseyPrimaryColor("nba", awayTeamId);
  const hasPicks = market.home + market.away > 0;

  return (
    <View style={[styles.root, standalone ? styles.standalone : null]}>
      <View
        collapsable={false}
        renderToHardwareTextureAndroid
        style={[styles.kindWrap, Platform.OS === "android" ? { opacity: 0.999 } : null]}
      >
        <Text style={styles.kind}>{copy.title}</Text>
      </View>
      <Text style={styles.note}>{copy.note}</Text>

      {hasPicks ? (
        <>
          <View style={styles.labels}>
            <View style={styles.side}>
              <Text style={[styles.nick, { color: homeColor }]} numberOfLines={1}>
                {homeNick}
              </Text>
              <Text style={[styles.pct, { color: homeColor }]}>
                {formatPct(market.homePct)}
              </Text>
            </View>
            <View style={[styles.side, styles.sideRight]}>
              <Text style={[styles.pct, { color: awayColor }]}>
                {formatPct(market.awayPct)}
              </Text>
              <Text style={[styles.nick, { color: awayColor }]} numberOfLines={1}>
                {awayNick}
              </Text>
            </View>
          </View>
          <View style={styles.bar}>
            {market.home > 0 ? (
              <View style={{ flex: market.home, backgroundColor: homeColor }} />
            ) : null}
            {market.away > 0 ? (
              <View style={{ flex: market.away, backgroundColor: awayColor }} />
            ) : null}
          </View>
          <Text style={styles.count}>
            {copy.count(market.predictorCount, market.cohortSize)}
          </Text>
        </>
      ) : (
        <Text style={styles.empty}>{copy.empty}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: 12,
    gap: 8,
  },
  standalone: {
    backgroundColor: "#050508",
    borderWidth: 1,
    borderColor: "rgba(212,175,90,0.35)",
    paddingHorizontal: 12,
    marginTop: 10,
  },
  kindWrap: {
    alignSelf: "flex-start",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: ACCENT,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 2,
    transform: [{ skewX: "-6deg" }],
  },
  kind: {
    fontFamily: OXANIUM_800,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    includeFontPadding: false,
    color: ACCENT,
    transform: [{ skewX: "6deg" }],
  },
  note: {
    fontFamily: JP_600,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.55)",
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 8,
  },
  side: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    flexShrink: 1,
  },
  sideRight: {
    justifyContent: "flex-end",
  },
  nick: {
    fontFamily: OXANIUM_700,
    fontSize: 12,
    letterSpacing: 1,
    flexShrink: 1,
  },
  pct: {
    fontFamily: OXANIUM_800,
    fontSize: 20,
    includeFontPadding: false,
  },
  bar: {
    flexDirection: "row",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  count: {
    fontFamily: JP_600,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.6)",
  },
  empty: {
    fontFamily: JP_600,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.6)",
  },
});
