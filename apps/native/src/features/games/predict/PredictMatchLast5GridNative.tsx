/** 予想 LAST 5: 両チームの直近 5 試合（上段ページャーと TREND で共用） */
import { StyleSheet, Text, View } from "react-native";
import type { NbaTeamFormGame } from "../../../../../../lib/predict/nbaTeamStatsPreviewMocks";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { MATCH_CARD_METRIC_FONT } from "../matchCardTypography";

const FORM_WIN = "#F5C518";
const FORM_LOSS = "#FF2D78";
const ROWS = 5;

function FormLine({ game, align }: { game: NbaTeamFormGame; align: "left" | "right" }) {
  const win = game.result === "W";
  return (
    <View
      style={[
        styles.line,
        styles.packInner,
        align === "right" ? styles.lineRight : null,
      ]}
    >
      <Text style={[styles.result, { color: win ? FORM_WIN : FORM_LOSS }]}>{game.result}</Text>
      <Text style={styles.score}>
        {game.teamScore}-{game.oppScore}
      </Text>
      <Text style={styles.venue}>{game.home ? "vs" : "@"}</Text>
      <Text style={styles.opp} numberOfLines={1}>
        {game.oppAbbr}
      </Text>
      <Text style={styles.date}>{game.dateLabel}</Text>
    </View>
  );
}

function FormColumn({
  games,
  align,
  accent,
}: {
  games: NbaTeamFormGame[];
  align: "left" | "right";
  accent: string;
}) {
  const shown = games.slice(0, ROWS);
  const wins = shown.filter((g) => g.result === "W").length;
  /** 届くのは新しい順。上が古く下が最新になるよう反転する */
  const ordered = [...shown].reverse();
  return (
    <View style={styles.col}>
      <View
        style={[
          styles.colHead,
          styles.packInner,
          align === "right" ? styles.lineRight : null,
        ]}
      >
        <View style={[styles.colMark, { backgroundColor: accent }]} />
        <Text style={styles.colRecord}>
          {wins}-{shown.length - wins}
        </Text>
      </View>
      {Array.from({ length: ROWS }, (_, i) =>
        ordered[i] ? (
          <FormLine key={i} game={ordered[i]!} align={align} />
        ) : (
          <View key={i} style={styles.lineSpacer} />
        )
      )}
    </View>
  );
}

export default function PredictMatchLast5GridNative({
  home,
  away,
  homeAccent,
  awayAccent,
}: {
  home: NbaTeamFormGame[];
  away: NbaTeamFormGame[];
  homeAccent: string;
  awayAccent: string;
}) {
  return (
    <View>
      <Text style={styles.title}>LAST 5</Text>
      {home.length === 0 && away.length === 0 ? (
        <Text style={styles.empty}>—</Text>
      ) : (
        <View style={styles.grid}>
          <FormColumn games={home} align="left" accent={homeAccent} />
          <View style={styles.divider} />
          <FormColumn games={away} align="right" accent={awayAccent} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: CYBER_TAB_CYAN,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 4,
  },
  empty: {
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  packInner: {
    justifyContent: "flex-end",
  },
  col: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  colHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 0,
  },
  colMark: {
    width: 9,
    height: 9,
    transform: [{ skewX: "-14deg" }],
  },
  colRecord: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 17,
  },
  lineRight: {
    flexDirection: "row-reverse",
  },
  lineSpacer: {
    height: 17,
  },
  result: {
    width: 14,
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  score: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  venue: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
  },
  opp: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "700",
  },
  date: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
  },
});
