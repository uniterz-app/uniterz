import { Platform, StyleSheet, Text } from "react-native";

/**
 * モバイル `MatchCardMobile` のシリーズ行に寄せた表示:
 * リードしている側のみ強調（黄系）、同点・ビハインドはシアン系の抑えた色。
 */
const NUMERIC = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "Oxanium_700Bold",
});

type Props = {
  homeWins: number;
  awayWins: number;
  /** 一覧カード中央 vs 予想モーダル先頭 */
  variant: "card" | "preview";
};

export function PlayoffSeriesScoreInline({ homeWins, awayWins, variant }: Props) {
  const homeAhead = homeWins > awayWins;
  const awayAhead = awayWins > homeWins;
  const isPreview = variant === "preview";
  const numSize = isPreview ? 12 : 12;
  const parenSize = isPreview ? 11 : 11;
  return (
    <Text style={[s.row, isPreview ? s.rowPreview : s.rowCard]} numberOfLines={1}>
      <Text style={[s.paren, { fontSize: parenSize }]}>（</Text>
      <Text
        style={[
          s.numBase,
          { fontSize: numSize },
          homeAhead ? s.numWin : s.numMuted,
          homeAhead ? s.shadowWin : s.shadowMuted,
        ]}
      >
        {homeWins}
      </Text>
      <Text style={[s.dash, { fontSize: parenSize }]}> - </Text>
      <Text
        style={[
          s.numBase,
          { fontSize: numSize },
          awayAhead ? s.numWin : s.numMuted,
          awayAhead ? s.shadowWin : s.shadowMuted,
        ]}
      >
        {awayWins}
      </Text>
      <Text style={[s.paren, { fontSize: parenSize }]}>）</Text>
    </Text>
  );
}

const s = StyleSheet.create({
  row: {
    marginTop: 2,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
    fontFamily: NUMERIC,
    fontWeight: "800",
  },
  rowCard: {
    letterSpacing: 0.2,
    lineHeight: 13,
  },
  rowPreview: {
    lineHeight: 16,
  },
  paren: {
    color: "rgba(103, 232, 249, 0.7)",
    fontWeight: "800",
  },
  dash: {
    color: "rgba(34, 211, 238, 0.55)",
    fontWeight: "800",
  },
  numBase: {
    fontWeight: "800",
  },
  numWin: {
    color: "#fde047",
  },
  numMuted: {
    color: "rgba(236, 254, 255, 0.92)",
  },
  shadowWin: {
    textShadowColor: "rgba(253, 224, 71, 0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  shadowMuted: {
    textShadowColor: "rgba(34, 211, 238, 0.28)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
