/** 確定トレード — 公式発表のみ。受付前の移籍は表示だけ（採点に入らない） */
import { LinearGradient } from "expo-linear-gradient";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  NBA_CONFIRMED_TRADES_2026_27,
  nbaConfirmedTradeCountsForBallot,
  type NbaConfirmedTrade,
} from "../../../../../../../lib/predict/nbaTradeConfirmed";
import { nbaConfirmedTradeMatchesTeam } from "../../../../../../../lib/predict/nbaTradeBuzzTeamFilter";
import TeamAbbrBadgeNative from "../../TeamAbbrBadgeNative";
import { nbaTeamIdFromBracketCode } from "../../../../../../../lib/nba-bracket-code";
import {
  getTeamAbbrBadgeColor,
  teamColorRgba,
} from "../../../../../../../lib/team-colors";

type Props = {
  trades?: readonly NbaConfirmedTrade[];
  teamAbbr?: string | null;
};

const OX = "Oxanium_700Bold";

function formatWhen(t: NbaConfirmedTrade): string {
  const [, m, d] = t.day.split("-");
  const md = `${Number(m)}/${Number(d)}`;
  return t.time ? `${md} ${t.time}` : md;
}

function openSource(url: string) {
  void Linking.openURL(url).catch(() => {});
}

function TradeCard({ trade }: { trade: NbaConfirmedTrade }) {
  const counts = nbaConfirmedTradeCountsForBallot(trade);
  const fromId = nbaTeamIdFromBracketCode(trade.fromTeamAbbr);
  const toId = nbaTeamIdFromBracketCode(trade.toTeamAbbr);
  const fromTint = fromId ? getTeamAbbrBadgeColor(fromId) : "#ffffff";
  const toTint = toId ? getTeamAbbrBadgeColor(toId) : "#ffffff";
  return (
    <LinearGradient
      colors={[
        teamColorRgba(fromTint, 0.42),
        teamColorRgba(toTint, 0.42),
      ]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.cardEdge}
    >
    <View style={styles.card}>
      <LinearGradient
        colors={[
          teamColorRgba(fromTint, 0.12),
          teamColorRgba(toTint, 0.12),
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        pointerEvents="none"
        style={styles.cardWash}
      />

      <View style={styles.topRow}>
        <Text style={counts ? styles.tagOn : styles.tagOff}>
          {counts ? "公式" : "受付前"}
        </Text>
        <View style={styles.rightRail}>
          <Text style={styles.age} numberOfLines={1}>
            {formatWhen(trade)}
          </Text>
        </View>
      </View>

      <View style={styles.nameRow}>
        <View style={styles.nameSlant}>
          <Text style={styles.name} numberOfLines={1}>
            {trade.playerName}
          </Text>
        </View>
      </View>

      <View style={styles.route}>
        <TeamAbbrBadgeNative
          abbr={trade.fromTeamAbbr}
          teamId={fromId ?? undefined}
        />
        <Text style={styles.arrow}>→</Text>
        <TeamAbbrBadgeNative
          abbr={trade.toTeamAbbr}
          teamId={toId ?? undefined}
        />
      </View>

      <Text style={styles.summary}>{trade.summaryJa}</Text>

      <Pressable
        onPress={() => openSource(trade.sourceUrl)}
        accessibilityRole="link"
        hitSlop={6}
      >
        <Text style={styles.source}>
          {trade.sourceLabel}
          {" →"}
        </Text>
      </Pressable>
    </View>
    </LinearGradient>
  );
}

export default function NbaTradeConfirmedFeedNative({
  trades = NBA_CONFIRMED_TRADES_2026_27,
  teamAbbr = null,
}: Props) {
  const sorted = [...trades]
    .filter((t) => nbaConfirmedTradeMatchesTeam(t, teamAbbr))
    .sort((a, b) => {
      const ta = Date.parse(`${a.day}T${a.time ?? "00:00"}:00+09:00`);
      const tb = Date.parse(`${b.day}T${b.time ?? "00:00"}:00+09:00`);
      return tb - ta;
    });

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.intro}>
        新しい順 · 公式発表のみ · 12/15前は表示だけ
        {teamAbbr ? ` · ${teamAbbr}` : ""}
      </Text>

      {sorted.length === 0 ? (
        <Text style={styles.empty}>
          {teamAbbr
            ? `${teamAbbr} の公式トレードはまだない`
            : "今季の公式トレードはまだない"}
        </Text>
      ) : (
        sorted.map((t) => <TradeCard key={t.id} trade={t} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.42)",
    marginBottom: 4,
  },
  empty: {
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.48)",
    paddingVertical: 12,
  },
  cardEdge: {
    padding: 1,
  },
  card: {
    overflow: "hidden",
    backgroundColor: "rgba(6,10,16,0.96)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  cardWash: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 16,
    marginBottom: 6,
  },
  rightRail: {
    width: 76,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  tagOn: {
    flex: 1,
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(252,211,77,0.9)",
    textTransform: "uppercase",
  },
  tagOff: {
    flex: 1,
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
  },
  age: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.45)",
    textAlign: "right",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
  },
  nameSlant: {
    flex: 1,
    minWidth: 0,
    transform: [{ skewX: "-6deg" }],
  },
  name: {
    fontFamily: "Oxanium_600SemiBold",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "#fff",
    textTransform: "uppercase",
    lineHeight: 22,
  },
  route: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  arrow: {
    fontFamily: OX,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  summary: {
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.78)",
  },
  source: {
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(0,245,255,0.85)",
  },
});
