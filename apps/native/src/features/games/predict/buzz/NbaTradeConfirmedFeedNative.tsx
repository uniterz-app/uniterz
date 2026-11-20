/** 確定トレード — 公式発表のみ。受付前の移籍は表示だけ（採点に入らない） */
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  NBA_CONFIRMED_TRADES_2026_27,
  nbaConfirmedTradeCountsForBallot,
  type NbaConfirmedTrade,
} from "../../../../../../../lib/predict/nbaTradeConfirmed";
import TeamAbbrBadgeNative from "../../TeamAbbrBadgeNative";
import { nbaTeamIdFromBracketCode } from "../../../../../../../lib/nba-bracket-code";

type Props = {
  trades?: readonly NbaConfirmedTrade[];
};

const OX = "Oxanium_700Bold";

function formatWhen(t: NbaConfirmedTrade): string {
  const [, m, d] = t.day.split("-");
  const md = `${Number(m)}/${Number(d)}`;
  return t.time ? `${md} ${t.time} JST` : `${md} JST`;
}

function openSource(url: string) {
  void Linking.openURL(url).catch(() => {});
}

function TradeCard({ trade }: { trade: NbaConfirmedTrade }) {
  const counts = nbaConfirmedTradeCountsForBallot(trade);
  const fromId = nbaTeamIdFromBracketCode(trade.fromTeamAbbr);
  const toId = nbaTeamIdFromBracketCode(trade.toTeamAbbr);
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.when}>{formatWhen(trade)}</Text>
        <View style={styles.spacer} />
        <Text style={counts ? styles.tagOn : styles.tagOff}>
          {counts ? "採点対象" : "受付前 · 表示のみ"}
        </Text>
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {trade.playerName}
      </Text>

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
        <Text style={styles.source}>SOURCE · {trade.sourceLabel} →</Text>
      </Pressable>
    </View>
  );
}

export default function NbaTradeConfirmedFeedNative({
  trades = NBA_CONFIRMED_TRADES_2026_27,
}: Props) {
  const sorted = [...trades].sort((a, b) => {
    const ta = Date.parse(`${a.day}T${a.time ?? "00:00"}:00+09:00`);
    const tb = Date.parse(`${b.day}T${b.time ?? "00:00"}:00+09:00`);
    return tb - ta;
  });

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.intro}>
        <Text style={styles.introTitle}>CONFIRMED</Text>
        <Text style={styles.introBody}>
          球団・リーグが公式に発表したトレードだけを載せています。受付開始（12/15）より前の移籍は表示のみで、採点には入りません。
        </Text>
      </View>

      {sorted.length === 0 ? (
        <Text style={styles.empty}>今季の公式トレードはまだありません。</Text>
      ) : (
        sorted.map((t) => <TradeCard key={t.id} trade={t} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.2)",
    backgroundColor: "rgba(0,245,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  introTitle: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "rgba(0,245,255,0.9)",
  },
  introBody: {
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.5)",
  },
  empty: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    paddingVertical: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(6,10,16,0.96)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  when: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.6)",
  },
  spacer: {
    flex: 1,
  },
  tagOn: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(252,211,77,0.9)",
    textTransform: "uppercase",
  },
  tagOff: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  name: {
    fontFamily: "Oxanium_600SemiBold",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "#fff",
    textTransform: "uppercase",
  },
  route: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrow: {
    fontFamily: OX,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  summary: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.75)",
  },
  source: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(0,245,255,0.8)",
    textTransform: "uppercase",
  },
});
