/** 採点表（固定ルールの表）+ 報酬表 */
import { StyleSheet, Text, View } from "react-native";
import { TRADE_BALLOT_SCORE } from "../../../../../../../lib/predict/nbaTradeBallotScoring";
import {
  TRADE_BALLOT_PARTICIPATION_UNITS,
  TRADE_BALLOT_RANK_UNITS_POOL,
  tradeBallotPrizeBands,
} from "../../../../../../../lib/units/tradeBallotUnitRewards";

const OX = "Oxanium_700Bold";

const RARITY_ROWS = [
  { label: "50%以上", pts: TRADE_BALLOT_SCORE.rarity.chalk },
  { label: "25–50%", pts: TRADE_BALLOT_SCORE.rarity.softChalk },
  { label: "10–25%", pts: TRADE_BALLOT_SCORE.rarity.common },
  { label: "3–10%", pts: TRADE_BALLOT_SCORE.rarity.uncommon },
  { label: "3%未満", pts: TRADE_BALLOT_SCORE.rarity.rare },
] as const;

export default function NbaTradeBallotScoreTableNative() {
  const prizes = tradeBallotPrizeBands();

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.card}>
        <Text style={styles.h2}>
          Score table · /{TRADE_BALLOT_SCORE.totalMax}
        </Text>
        <Row label="選手が移籍" value={`+${TRADE_BALLOT_SCORE.playerHit}`} />
        <Row
          label="行き先も当たり"
          value={`+${TRADE_BALLOT_SCORE.teamHitBonus}`}
        />
        <Text style={styles.subHead}>少数派ボーナス</Text>
        {RARITY_ROWS.map((r) => (
          <Row key={r.label} label={r.label} value={`+${r.pts}`} />
        ))}
        <Text style={styles.note}>
          選手外れは 0。7 枠合計が総合点。投票率は締切時点。
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>Prizes</Text>
        {prizes.map((b) => (
          <Row key={b.labelJa} label={b.labelJa} value={b.valueJa} />
        ))}
        <Text style={styles.note}>
          参加賞 {TRADE_BALLOT_PARTICIPATION_UNITS} Unit は提出完了者全員。順位
          Unit 合計（参加賞除く）{TRADE_BALLOT_RANK_UNITS_POOL}。1位はユニフォーム＋参加賞。
        </Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
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
    gap: 0,
  },
  h2: {
    fontFamily: OX,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(253,230,138,0.9)",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  subHead: {
    marginTop: 10,
    marginBottom: 4,
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  label: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  value: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(254,243,199,0.95)",
    textAlign: "right",
  },
  note: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.4)",
  },
});
