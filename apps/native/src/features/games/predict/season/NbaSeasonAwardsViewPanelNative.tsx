/** Web `NbaSeasonAwardsViewPanel` 相当（提出済みアワード YOUR AWARDS・1行レイアウト） */
import { StyleSheet, Text, View } from "react-native";
import {
  NBA_SEASON_AWARD_DEFS,
  awardCandidateLabel,
  type NbaAwardCandidate,
  type NbaSeasonAwardsPrediction,
} from "../../../../../../../lib/predict/nbaSeasonAwardsPredict";
import {
  AWARDS_PREVIEW_COACHES,
  AWARDS_PREVIEW_PLAYERS,
} from "../../../../../../../lib/predict/nbaSeasonAwardsPreviewMocks";
import TeamAbbrBadgeNative from "../../TeamAbbrBadgeNative";
import {
  MATCH_CARD_BRACKET_LETTER_SPACING_12,
  MATCH_CARD_BRACKET_TEXT,
} from "../../matchCardTypography";

type Props = {
  prediction: NbaSeasonAwardsPrediction;
  officialByAward?: Partial<Record<string, string | null>> | null;
  catalog?: readonly NbaAwardCandidate[];
};

const OX = "Oxanium_700Bold";

function resolveCandidate(
  id: string | null | undefined,
  catalog: readonly NbaAwardCandidate[]
): NbaAwardCandidate | null {
  if (!id) return null;
  return catalog.find((c) => c.id === id) ?? null;
}

export default function NbaSeasonAwardsViewPanelNative({
  prediction,
  officialByAward = null,
  catalog,
}: Props) {
  const list =
    catalog ??
    ([...AWARDS_PREVIEW_PLAYERS, ...AWARDS_PREVIEW_COACHES] as NbaAwardCandidate[]);

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.h2}>Your awards</Text>
        <Text style={styles.season}>{prediction.season}</Text>
      </View>

      <View style={styles.list}>
        {NBA_SEASON_AWARD_DEFS.map((def, index) => {
          const picked = resolveCandidate(prediction.picks[def.id], list);
          const officialId = officialByAward?.[def.id];
          const hit =
            officialId != null && officialId !== "" && picked
              ? officialId === picked.id
              : null;
          const isLast = index === NBA_SEASON_AWARD_DEFS.length - 1;
          return (
            <View
              key={def.id}
              style={[styles.row, !isLast ? styles.rowBorder : null]}
            >
              <Text style={styles.awardLabel}>{def.labelEn}</Text>
              {picked ? (
                <>
                  <Text style={styles.pickName} numberOfLines={1}>
                    {awardCandidateLabel(picked)}
                  </Text>
                  {picked.teamAbbr ? (
                    <TeamAbbrBadgeNative abbr={picked.teamAbbr} />
                  ) : (
                    <View style={styles.badgeSpacer} />
                  )}
                </>
              ) : (
                <Text style={styles.dash}>—</Text>
              )}
              {hit != null ? (
                <Text
                  style={[styles.resultMark, hit ? styles.hit : styles.miss]}
                >
                  {hit ? "HIT" : "MISS"}
                </Text>
              ) : null}
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
  list: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.2)",
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  awardLabel: {
    width: 52,
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
    fontSize: 13,
    letterSpacing: MATCH_CARD_BRACKET_LETTER_SPACING_12,
    color: "#fff",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  badgeSpacer: { width: 38, height: 22 },
  dash: { flex: 1, fontSize: 11, color: "rgba(255,255,255,0.3)" },
  resultMark: { fontFamily: OX, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  hit: { color: "rgba(45,255,110,0.85)" },
  miss: { color: "rgba(255,138,180,0.7)" },
});
