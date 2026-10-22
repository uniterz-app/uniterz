/** Web `NbaSeasonAwardsMarketPanel` 相当 */
import { StyleSheet, Text, View } from "react-native";
import TeamAbbrBadgeNative from "../../TeamAbbrBadgeNative";
import { TeamTint } from "./NbaSeasonStandingsViewPanelNative";
import {
  resolveSeasonAwardsMinePick,
  type SeasonAwardsMarketSnapshot,
  type SeasonAwardsMinePick,
} from "../../../../../../../lib/predict/seasonPredictMarket";
import { nbaTeamIdFromBracketCode } from "../../../../../../../lib/nba-bracket-code";
import {
  awardName,
  type NbaAwardCandidate,
  type NbaSeasonAwardsPrediction,
} from "../../../../../../../lib/predict/nbaSeasonAwardsPredict";
import {
  seasonPredictAwardsMarketHint,
  seasonPredictSubmissionCountLabel,
  seasonPredictYourAwardPickLabel,
  seasonPredictYourAwardPickMissing,
  type SeasonPredictUiLang,
} from "../../../../../../../lib/predict/seasonPredictUiCopy";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
} from "../../matchCardTypography";

type Props = {
  market: SeasonAwardsMarketSnapshot;
  language?: SeasonPredictUiLang;
  /** 取得済みの自分の提出。null の prediction は未提出 */
  mine?: {
    prediction: NbaSeasonAwardsPrediction | null;
    candidates?: readonly NbaAwardCandidate[];
  } | null;
};

function YourPickRow({
  pick,
  label,
}: {
  pick: SeasonAwardsMinePick;
  label: string;
}) {
  const teamId = pick.teamAbbr ? nbaTeamIdFromBracketCode(pick.teamAbbr) : null;
  return (
    <View style={styles.youRow}>
      <TeamTint teamId={teamId} />
      <Text style={styles.youLabel}>{label}</Text>
      <Text style={[styles.name, styles.youName]} numberOfLines={1}>
        {pick.name}
      </Text>
      {pick.teamAbbr ? (
        <TeamAbbrBadgeNative abbr={pick.teamAbbr} teamId={teamId ?? undefined} />
      ) : null}
    </View>
  );
}

const OX = "Oxanium_700Bold";

export default function NbaSeasonAwardsMarketPanelNative({
  market,
  language = "ja",
  mine,
}: Props) {
  const youLabel = seasonPredictYourAwardPickLabel(language);
  const showMissing = mine != null && mine.prediction == null;
  return (
    <View style={styles.card}>
      <Text style={styles.h2}>Awards market · {market.season}</Text>
      <View style={styles.countRow}>
        <Text style={styles.countNum}>
          {market.submissionCount.toLocaleString()}
        </Text>
        <Text style={styles.countLabel}>
          {seasonPredictSubmissionCountLabel(language)}
        </Text>
      </View>
      <Text style={styles.lead}>
        {seasonPredictAwardsMarketHint(language)}
      </Text>
      {showMissing ? (
        <Text style={styles.missing}>
          {seasonPredictYourAwardPickMissing(language)}
        </Text>
      ) : null}

      <View style={{ gap: 16, marginTop: 12 }}>
        {market.awards.map((block) => {
          const minePick = mine?.prediction
            ? resolveSeasonAwardsMinePick(
                block.awardId,
                block.top,
                mine.prediction,
                mine.candidates ?? []
              )
            : null;
          return (
          <View key={block.awardId}>
            <View style={styles.awardHead}>
              <Text style={styles.awardEn}>{block.labelEn}</Text>
              <Text style={styles.awardFullName}>
                {awardName(language, block)}
              </Text>
            </View>
            {minePick ? <YourPickRow pick={minePick} label={youLabel} /> : null}
            <View style={{ gap: 6 }}>
              {block.top.map((row, i) => {
                const teamId = row.teamAbbr
                  ? nbaTeamIdFromBracketCode(row.teamAbbr)
                  : null;
                const isMine = minePick?.candidateId === row.candidateId;
                return (
                  <View
                    key={`${block.awardId}-${row.candidateId}`}
                    style={[styles.pickRow, isMine ? styles.pickRowMine : null]}
                  >
                    <TeamTint teamId={teamId} />
                    <Text style={styles.rank}>{i + 1}</Text>
                    <View style={styles.pickMain}>
                      <Text style={styles.name} numberOfLines={1}>
                        {row.name}
                      </Text>
                      {row.teamAbbr ? (
                        <TeamAbbrBadgeNative
                          abbr={row.teamAbbr}
                          teamId={teamId ?? undefined}
                        />
                      ) : null}
                    </View>
                    <Text style={styles.pct}>{row.pct.toFixed(1)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.25)",
    backgroundColor: "#000000",
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
  countRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  countNum: {
    fontFamily: OX,
    fontSize: 28,
    fontWeight: "900",
    color: "rgba(253,230,138,0.95)",
    fontVariant: ["tabular-nums"],
  },
  countLabel: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.6)",
  },
  lead: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
  },
  missing: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(165,243,252,0.85)",
  },
  youRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(103,232,249,0.08)",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  youName: {
    flex: 1,
  },
  youLabel: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: "rgba(165,243,252,0.95)",
    textTransform: "uppercase",
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
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pickRowMine: {
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(103,232,249,0.06)",
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
