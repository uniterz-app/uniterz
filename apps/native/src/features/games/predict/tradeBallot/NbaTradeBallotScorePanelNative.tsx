/** トレードバレット採点結果（1 枠内訳 + 合計 700 点満点） */
import { StyleSheet, Text, View } from "react-native";
import {
  TRADE_BALLOT_SCORE,
  type NbaTradeBallotScoreResult,
} from "../../../../../../../lib/predict/nbaTradeBallotScoring";
import {
  awardCandidateLabel,
  tradeBallotTeamById,
  type NbaAwardCandidate,
} from "../../../../../../../lib/predict/nbaTradeBallotPredict";

type Props = {
  result: NbaTradeBallotScoreResult;
  catalog?: readonly NbaAwardCandidate[];
};

const OX = "Oxanium_700Bold";

export default function NbaTradeBallotScorePanelNative({
  result,
  catalog = [],
}: Props) {
  const byId = new Map(catalog.map((c) => [c.id, c]));

  return (
    <View style={styles.card}>
      <Text style={styles.h2}>
        Score · /{TRADE_BALLOT_SCORE.totalMax}
      </Text>
      <View style={styles.totalRow}>
        <Text style={styles.totalNum}>{String(result.total)}</Text>
        <Text style={styles.totalLabel}>total</Text>
      </View>
      <Text style={styles.lead}>
        選手 {TRADE_BALLOT_SCORE.playerHit} · チーム +
        {TRADE_BALLOT_SCORE.teamHitBonus} · 少数派 +0/+5/+10/+20/+30（50%以上は
        +0）。7 枠の合計が総合点。
      </Text>
      <Text style={styles.hits}>
        Player hits {result.playerHits}/7 · Team hits {result.teamHits}/7
      </Text>

      <View style={{ gap: 8, marginTop: 12 }}>
        {result.slots.map((slot) => {
          const player = slot.playerId ? byId.get(slot.playerId) : null;
          const dest = tradeBallotTeamById(slot.toTeamId);
          const name = player
            ? awardCandidateLabel(player)
            : slot.playerId ?? "—";
          return (
            <View key={`score-${slot.index}`} style={styles.row}>
              <View style={styles.rowTop}>
                <Text style={styles.slot}>
                  #{String(slot.index + 1).padStart(2, "0")}
                </Text>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={styles.arrow}>→</Text>
                <Text style={styles.dest}>{dest?.abbr ?? "—"}</Text>
                <Text style={styles.points}>{slot.points}</Text>
              </View>
              <Text style={styles.breakdown}>
                {slot.playerHit ? "PLAYER" : "MISS"}
                {slot.teamHit ? " · TEAM" : slot.playerHit ? " · team miss" : ""}
                {slot.playerHit
                  ? ` · rarity +${slot.rarityBonus}${
                      slot.votePct != null
                        ? ` (${slot.votePct.toFixed(1)}%)`
                        : ""
                    }`
                  : ""}
              </Text>
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
  totalRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  totalNum: {
    fontFamily: OX,
    fontSize: 36,
    fontWeight: "900",
    color: "rgba(253,230,138,0.95)",
    fontVariant: ["tabular-nums"],
  },
  totalLabel: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },
  lead: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
  },
  hits: {
    marginTop: 6,
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  row: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  slot: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(253,230,138,0.85)",
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
  },
  arrow: {
    fontFamily: OX,
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },
  dest: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
  },
  points: {
    fontFamily: OX,
    fontSize: 14,
    fontWeight: "900",
    color: "rgba(254,243,199,0.95)",
    minWidth: 28,
    textAlign: "right",
  },
  breakdown: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
});
