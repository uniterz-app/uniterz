/** Web `NbaSeasonAwardsMarketPanel` 相当 */
import { StyleSheet, Text, View } from "react-native";
import TeamAbbrBadgeNative from "../../TeamAbbrBadgeNative";
import type { SeasonAwardsMarketSnapshot } from "../../../../../../../lib/predict/seasonPredictMarket";
import { nbaTeamIdFromBracketCode } from "../../../../../../../lib/nba-bracket-code";
import { awardName } from "../../../../../../../lib/predict/nbaSeasonAwardsPredict";
import {
  seasonPredictAwardsMarketHint,
  type SeasonPredictUiLang,
} from "../../../../../../../lib/predict/seasonPredictUiCopy";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
} from "../../matchCardTypography";

type Props = {
  market: SeasonAwardsMarketSnapshot;
  language?: SeasonPredictUiLang;
};

const OX = "Oxanium_700Bold";

export default function NbaSeasonAwardsMarketPanelNative({
  market,
  language = "ja",
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.h2}>Awards market · {market.season}</Text>
      <Text style={styles.meta}>
        {market.submissionCount.toLocaleString()} submissions
      </Text>
      <Text style={styles.lead}>
        {seasonPredictAwardsMarketHint(language)}
      </Text>

      <View style={{ gap: 16, marginTop: 12 }}>
        {market.awards.map((block) => (
          <View key={block.awardId}>
            <View style={styles.awardHead}>
              <Text style={styles.awardEn}>{block.labelEn}</Text>
              <Text style={styles.awardFullName}>
                {awardName(language, block)}
              </Text>
            </View>
            <View style={{ gap: 6 }}>
              {block.top.map((row, i) => {
                const teamId = row.teamAbbr
                  ? nbaTeamIdFromBracketCode(row.teamAbbr)
                  : null;
                return (
                  <View
                    key={`${block.awardId}-${row.candidateId}`}
                    style={styles.pickRow}
                  >
                    <Text style={styles.rank}>{i + 1}</Text>
                    <View style={styles.pickMain}>
                      <Text style={styles.name} numberOfLines={1}>
                        {row.name}
                      </Text>
                      {row.teamAbbr ? (
                        <TeamAbbrBadgeNative
                          abbr={row.teamAbbr}
                          teamId={teamId ?? undefined}
                          size="sm"
                        />
                      ) : null}
                    </View>
                    <Text style={styles.pct}>{row.pct.toFixed(1)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.25)",
    backgroundColor: "rgba(6,10,16,0.96)",
    padding: 12,
  },
  h2: {
    fontFamily: OX,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(253,230,138,0.9)",
    textTransform: "uppercase",
  },
  meta: {
    marginTop: 4,
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  lead: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
  },
  awardHead: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 6,
  },
  awardEn: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(253,230,138,0.85)",
    textTransform: "uppercase",
  },
  awardFullName: { fontSize: 10, color: "rgba(255,255,255,0.35)" },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rank: {
    width: 14,
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.35)",
  },
  pickMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    ...MATCH_CARD_BRACKET_TEXT,
    flexShrink: 1,
    fontSize: 12,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
    color: "rgba(255,255,255,0.9)",
  },
  pct: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(254,243,199,0.9)",
  },
});
