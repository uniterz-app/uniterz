/** チャットの試合回答。試合一覧の線枠カードと同じ並び */
import { Pressable, StyleSheet, Text, View } from "react-native";
import MatchListLineFrameNative from "../MatchListLineFrameNative";
import MatchTeamMarkNative from "../MatchTeamMarkNative";
import MatchCardTeamNameNative from "../MatchCardTeamNameNative";
import { getGamesTexts } from "../gamesI18n";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
  MATCH_CARD_SCORE_FONT,
} from "../matchCardTypography";
import { NUMERIC_FONT_FAMILY } from "../gameCardDisplayUtils";
import { colors } from "../../../theme/tokens";
import { getTeamJerseyPrimaryColor, getTeamJerseySecondaryColor } from "../../../../../../lib/team-colors";
import type { NbaAskGameCard } from "../../../../../../lib/nba/ask/nbaAskBoard";

function palette(teamId: string) {
  return {
    primary: getTeamJerseyPrimaryColor("nba", teamId),
    secondary: getTeamJerseySecondaryColor("nba", teamId),
  };
}

function ctaLabel(status: string, language: string): string {
  if (status === "final") return "FINAL";
  const copy = getGamesTexts(language);
  return status === "live" ? copy.live : copy.predict;
}

function Side({
  label,
  teamId,
  name,
  record,
}: {
  label: string;
  teamId: string;
  name: string;
  record: string;
}) {
  return (
    <View style={styles.col}>
      <View style={styles.top}>
        <Text style={styles.sideLabel}>{label}</Text>
        <View style={styles.mark}>
          <MatchTeamMarkNative
            leagueRaw="nba"
            side={{ teamId }}
            palette={palette(teamId)}
            jerseySize={54}
            flagVariant="card"
            deferOffscreen={false}
          />
        </View>
      </View>
      <View style={styles.bottom}>
        <MatchCardTeamNameNative textStyle={styles.name}>{name}</MatchCardTeamNameNative>
        <Text style={styles.record} numberOfLines={1}>
          {record}
        </Text>
      </View>
    </View>
  );
}

export default function AskGameCardNative({
  game,
  language,
  onPress,
}: {
  game: NbaAskGameCard;
  language: string;
  onPress?: () => void;
}) {
  const scored =
    game.scoreHome != null &&
    game.scoreAway != null &&
    (game.status === "final" || game.status === "live");
  const label = ctaLabel(game.status, language);
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${game.homeName} ${label} ${game.awayName}`}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
    <MatchListLineFrameNative
      pickup={game.pickup}
      leftLabel={game.pickup ? "PICK UP" : undefined}
      topLabel={game.round || undefined}
      bottomLabel={label}
    >
      <View style={styles.interior}>
        <View style={styles.grid}>
          <Side label="HOME" teamId={game.homeTeamId} name={game.homeName} record={game.homeRecord} />
          <View style={styles.center}>
            {scored ? (
              <View style={styles.scoreRow}>
                <Text style={styles.scoreNum}>{game.scoreHome}</Text>
                <Text style={styles.scoreDash}>–</Text>
                <Text style={styles.scoreNum}>{game.scoreAway}</Text>
              </View>
            ) : (
              <Text style={styles.time} numberOfLines={1}>
                {game.start}
              </Text>
            )}
          </View>
          <Side label="AWAY" teamId={game.awayTeamId} name={game.awayName} record={game.awayRecord} />
        </View>
      </View>
    </MatchListLineFrameNative>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.86 },
  interior: {
    paddingHorizontal: 8,
    paddingTop: 20,
    paddingBottom: 18,
  },
  grid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 4,
  },
  col: {
    flex: 1,
    alignItems: "center",
    minHeight: 72,
  },
  top: {
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  bottom: {
    alignItems: "center",
    marginTop: 2,
  },
  sideLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 15,
    letterSpacing: 0.96,
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: MATCH_CARD_DISPLAY_FONT,
  },
  mark: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.6,
    lineHeight: 15,
    marginTop: 4,
    includeFontPadding: false,
    textTransform: "uppercase",
    fontFamily: "Oxanium_600SemiBold",
    maxWidth: "100%",
  },
  record: {
    color: "rgba(226,232,240,0.7)",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 11,
    letterSpacing: 0.2,
    includeFontPadding: false,
    fontFamily: MATCH_CARD_METRIC_FONT,
  },
  center: {
    flex: 1.05,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 1,
  },
  time: {
    color: "rgba(239,245,255,0.96)",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 26,
    textAlign: "center",
    letterSpacing: 0.15,
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
    fontFamily: NUMERIC_FONT_FAMILY,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 8,
  },
  scoreNum: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    fontStyle: "italic",
    lineHeight: 20,
    includeFontPadding: false,
    fontVariant: ["tabular-nums"],
    fontFamily: MATCH_CARD_SCORE_FONT,
  },
  scoreDash: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 18,
    fontWeight: "900",
    fontStyle: "italic",
    lineHeight: 20,
    fontFamily: MATCH_CARD_SCORE_FONT,
  },
});
