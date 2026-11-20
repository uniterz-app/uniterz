/** トレードバレット提出後 — YOUR BALLOT（アワード YOUR AWARDS と同型） */
import { StyleSheet, Text, View } from "react-native";
import {
  TRADE_BALLOT_SLOT_COUNT,
  awardCandidateLabel,
  tradeBallotTeamById,
  type NbaAwardCandidate,
  type NbaTradeBallotPrediction,
} from "../../../../../../../lib/predict/nbaTradeBallotPredict";
import { AWARDS_PREVIEW_PLAYERS } from "../../../../../../../lib/predict/nbaSeasonAwardsPreviewMocks";
import { appTeamIdFromBdlAbbreviation } from "../../../../../../../lib/nba/bdl/bdlNbaTeamIdMap";
import TeamAbbrBadgeNative from "../../TeamAbbrBadgeNative";
import { TeamTint } from "../season/NbaSeasonStandingsViewPanelNative";
import UniterzLogoNative from "../../../profile/UniterzLogoNative";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
} from "../../matchCardTypography";

type Props = {
  prediction: NbaTradeBallotPrediction;
  catalog?: readonly NbaAwardCandidate[];
  showBrandLogo?: boolean;
};

const OX = "Oxanium_700Bold";

function resolvePlayer(
  id: string | null | undefined,
  catalog: readonly NbaAwardCandidate[]
): NbaAwardCandidate | null {
  if (!id) return null;
  return catalog.find((c) => c.id === id) ?? null;
}

export default function NbaTradeBallotViewPanelNative({
  prediction,
  catalog,
  showBrandLogo = false,
}: Props) {
  const list = catalog ?? (AWARDS_PREVIEW_PLAYERS as NbaAwardCandidate[]);
  const slots = Array.from({ length: TRADE_BALLOT_SLOT_COUNT }, (_, i) =>
    prediction.picks[i] ?? { playerId: null, toTeamId: null }
  );

  return (
    <View>
      <View style={styles.header}>
        {showBrandLogo ? (
          <UniterzLogoNative width={132} style={styles.brandLogo} />
        ) : null}
        <View style={styles.titleRow}>
          <Text style={styles.h2}>Your ballot</Text>
          <Text style={[styles.season, styles.seasonInline]}>
            {prediction.season}
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {slots.map((pick, index) => {
          const player = resolvePlayer(pick.playerId, list);
          const dest = tradeBallotTeamById(pick.toTeamId);
          const fromTeamId = appTeamIdFromBdlAbbreviation(player?.teamAbbr);
          const isLast = index === slots.length - 1;
          return (
            <View
              key={`view-${index}`}
              style={[styles.row, !isLast ? styles.rowBorder : null]}
            >
              <View style={styles.labelCol}>
                <Text style={styles.slotLabel}>
                  #{String(index + 1).padStart(2, "0")}
                </Text>
              </View>
              <View style={styles.pickCol}>
                <TeamTint teamId={fromTeamId} />
                {player ? (
                  <>
                    <Text style={styles.pickName} numberOfLines={1}>
                      {awardCandidateLabel(player)}
                    </Text>
                    {player.teamAbbr ? (
                      <TeamAbbrBadgeNative abbr={player.teamAbbr} />
                    ) : (
                      <View style={styles.badgeSpacer} />
                    )}
                    <Text style={styles.arrow}>→</Text>
                    {dest ? (
                      <TeamAbbrBadgeNative
                        abbr={dest.abbr}
                        teamId={dest.teamId}
                      />
                    ) : (
                      <Text style={styles.dash}>—</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.dash}>—</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: 12 },
  h2: {
    fontFamily: OX,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2.4,
    color: "#fff",
    textTransform: "uppercase",
  },
  season: {
    marginTop: 4,
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  seasonInline: {
    marginTop: 0,
    fontSize: 14,
    letterSpacing: 2.4,
  },
  brandLogo: {
    marginBottom: 10,
    opacity: 0.9,
  },
  list: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.2)",
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  labelCol: {
    width: 52,
    flexShrink: 0,
    justifyContent: "center",
    paddingLeft: 10,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.1)",
  },
  pickCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  slotLabel: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(253,230,138,0.85)",
    textTransform: "uppercase",
  },
  pickName: {
    ...MATCH_CARD_BRACKET_TEXT,
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
    color: "#fff",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  arrow: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.35)",
  },
  badgeSpacer: { width: 38, height: 22 },
  dash: { flex: 1, fontSize: 11, color: "rgba(255,255,255,0.3)" },
});
