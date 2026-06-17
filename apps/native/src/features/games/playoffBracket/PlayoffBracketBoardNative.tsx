import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import type { SeriesId } from "../../../../../../lib/playoff-bracket";
import type { BracketState } from "../../../../../../lib/playoff-bracket-firestore";
import PlayoffSeriesCardNative from "./PlayoffSeriesCardNative";
import { colors } from "../../../theme/tokens";

type Team = { code: string; seed: number };

type SeriesDef = {
  id: SeriesId;
  teams: [Team, Team];
};

type Props = {
  bracket: BracketState;
  eastR1: SeriesDef[];
  westR1: SeriesDef[];
  eastR2Top: [Team, Team] | null;
  eastR2Bottom: [Team, Team] | null;
  westR2Top: [Team, Team] | null;
  westR2Bottom: [Team, Team] | null;
  eastCF: [Team, Team] | null;
  westCF: [Team, Team] | null;
  finalsTeams: [Team, Team] | null;
  showR2E1: boolean;
  showR2E2: boolean;
  showR2W1: boolean;
  showR2W2: boolean;
  showCFE: boolean;
  showCFW: boolean;
  showFinals: boolean;
  isComplete: boolean;
  hasSubmittedBracket: boolean;
  savedBracketLoading: boolean;
  canEditBracket: boolean;
  submitButtonDisabled?: boolean;
  submitButtonLabel?: string;
  hideSubmitButton?: boolean;
  onSelectWinner: (seriesId: SeriesId, teamCode: string) => void;
  onSelectGames: (seriesId: SeriesId, games: number) => void;
  onSubmitClick: () => void;
};

const CARD_H = 116;
const CARD_PY = 10;
const ROW_GAP = 6;
const CARD_W = 230;
const R1_CARD_GAP = 14;
const ROUND_GAP_X = 56;
const FINALS_GAP_X = 88;
const LABEL_SPACE_Y = 132;
const LABEL_TOP_Y = 48;
const CHAMPION_CARD_H = 40;

const Y_R1 = [0, CARD_H + R1_CARD_GAP, (CARD_H + R1_CARD_GAP) * 2, (CARD_H + R1_CARD_GAP) * 3];
const Y_R2_TOP = (Y_R1[0] + CARD_H / 2 + (Y_R1[1] + CARD_H / 2)) / 2 - CARD_H / 2;
const Y_R2_BOTTOM = (Y_R1[2] + CARD_H / 2 + (Y_R1[3] + CARD_H / 2)) / 2 - CARD_H / 2;
const Y_CF = (Y_R2_TOP + CARD_H / 2 + (Y_R2_BOTTOM + CARD_H / 2)) / 2 - CARD_H / 2;
const Y_FINALS = Y_CF;

const LEFT_R1_X = 0;
const LEFT_R2_X = LEFT_R1_X + CARD_W + ROUND_GAP_X;
const LEFT_CF_X = LEFT_R2_X + CARD_W + ROUND_GAP_X;
const FINALS_X = LEFT_CF_X + CARD_W + FINALS_GAP_X;
const RIGHT_CF_X = FINALS_X + CARD_W + FINALS_GAP_X;
const RIGHT_R2_X = RIGHT_CF_X + CARD_W + ROUND_GAP_X;
const RIGHT_R1_X = RIGHT_R2_X + CARD_W + ROUND_GAP_X;
const CANVAS_W = RIGHT_R1_X + CARD_W;
const BRACKET_H = Y_R1[3] + CARD_H;
const CANVAS_H = BRACKET_H + LABEL_SPACE_Y;

function buildRightBracketPath(
  startX: number,
  endX: number,
  yTop: number,
  yBottom: number,
  cardH = CARD_H,
  inset = 26
) {
  const start1Y = yTop + cardH / 2;
  const start2Y = yBottom + cardH / 2;
  const endY = (start1Y + start2Y) / 2;
  const midX = startX + inset;
  return `M ${startX} ${start1Y} H ${midX} V ${endY} H ${endX} M ${startX} ${start2Y} H ${midX} V ${endY} H ${endX}`;
}

function buildLeftBracketPath(
  startX: number,
  endX: number,
  yTop: number,
  yBottom: number,
  cardH = CARD_H,
  inset = 26
) {
  const start1Y = yTop + cardH / 2;
  const start2Y = yBottom + cardH / 2;
  const endY = (start1Y + start2Y) / 2;
  const midX = startX - inset;
  return `M ${startX} ${start1Y} H ${midX} V ${endY} H ${endX} M ${startX} ${start2Y} H ${midX} V ${endY} H ${endX}`;
}

function AnimatedSeriesSlot({
  teams,
  seriesId,
  show,
  direction,
  bracket,
  canEditBracket,
  onSelectWinner,
  onSelectGames,
}: {
  teams: [Team, Team] | null;
  seriesId: SeriesId;
  show: boolean;
  direction: "left" | "right";
  bracket: BracketState;
  canEditBracket: boolean;
  onSelectWinner: (seriesId: SeriesId, teamCode: string) => void;
  onSelectGames: (seriesId: SeriesId, games: number) => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: teams && show ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [teams, show, anim]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [direction === "right" ? 18 : -18, 0],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  if (!teams) {
    return <View style={{ width: CARD_W, height: CARD_H }} />;
  }

  return (
    <Animated.View
      style={{
        width: CARD_W,
        height: CARD_H,
        opacity: anim,
        transform: [{ translateX }, { scale }],
      }}
    >
      <PlayoffSeriesCardNative
        seriesId={seriesId}
        teams={teams}
        winner={bracket[seriesId]?.winner}
        games={bracket[seriesId]?.games}
        disabled={!canEditBracket}
        onSelectWinner={onSelectWinner}
        onSelectGames={onSelectGames}
      />
    </Animated.View>
  );
}

function RoundHeader({ left, title, winnerPts }: { left: number; title: string; winnerPts: string }) {
  return (
    <View style={[styles.roundHeader, { left, top: LABEL_TOP_Y, width: CARD_W }]}>
      <Text style={styles.roundTitle}>{title}</Text>
      <Text style={styles.roundPts}>Winner {winnerPts}</Text>
      <Text style={styles.roundBonus}>Games exact +2 pts</Text>
    </View>
  );
}

export default function PlayoffBracketBoardNative({
  bracket,
  eastR1,
  westR1,
  eastR2Top,
  eastR2Bottom,
  westR2Top,
  westR2Bottom,
  eastCF,
  westCF,
  finalsTeams,
  showR2E1,
  showR2E2,
  showR2W1,
  showR2W2,
  showCFE,
  showCFW,
  showFinals,
  isComplete,
  hasSubmittedBracket,
  savedBracketLoading,
  canEditBracket,
  submitButtonDisabled = false,
  submitButtonLabel = "Submit Bracket",
  hideSubmitButton = false,
  onSelectWinner,
  onSelectGames,
  onSubmitClick,
}: Props) {
  const champion = bracket.FINALS?.winner;

  function renderSeriesCard(seriesId: SeriesId, teams: [Team, Team]) {
    return (
      <PlayoffSeriesCardNative
        seriesId={seriesId}
        teams={teams}
        winner={bracket[seriesId]?.winner}
        games={bracket[seriesId]?.games}
        disabled={!canEditBracket}
        onSelectWinner={onSelectWinner}
        onSelectGames={onSelectGames}
      />
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <View style={{ width: CANVAS_W }}>
        <View style={styles.totalBadgeWrap}>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>Total 100 pts</Text>
          </View>
        </View>

        <View style={{ width: CANVAS_W, height: CANVAS_H }}>
          <Svg
            style={{ position: "absolute", left: 0, top: LABEL_SPACE_Y }}
            width={CANVAS_W}
            height={BRACKET_H}
            viewBox={`0 0 ${CANVAS_W} ${BRACKET_H}`}
          >
            <Path
              d={buildRightBracketPath(LEFT_R1_X + CARD_W, LEFT_R2_X, Y_R1[0], Y_R1[1])}
              stroke="#1f6feb"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
              fill="none"
            />
            <Path
              d={buildRightBracketPath(LEFT_R1_X + CARD_W, LEFT_R2_X, Y_R1[2], Y_R1[3])}
              stroke="#1f6feb"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
              fill="none"
            />
            <Path
              d={buildRightBracketPath(LEFT_R2_X + CARD_W, LEFT_CF_X, Y_R2_TOP, Y_R2_BOTTOM)}
              stroke="#1f6feb"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
              fill="none"
            />
            <Path
              d={`M ${LEFT_CF_X + CARD_W} ${Y_CF + CARD_H / 2} H ${FINALS_X}`}
              stroke="#1f6feb"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
              fill="none"
            />
            <Path
              d={buildLeftBracketPath(RIGHT_R1_X, RIGHT_R2_X + CARD_W, Y_R1[0], Y_R1[1])}
              stroke="#1f6feb"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
              fill="none"
            />
            <Path
              d={buildLeftBracketPath(RIGHT_R1_X, RIGHT_R2_X + CARD_W, Y_R1[2], Y_R1[3])}
              stroke="#1f6feb"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
              fill="none"
            />
            <Path
              d={buildLeftBracketPath(RIGHT_R2_X, RIGHT_CF_X + CARD_W, Y_R2_TOP, Y_R2_BOTTOM)}
              stroke="#1f6feb"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
              fill="none"
            />
            <Path
              d={`M ${RIGHT_CF_X} ${Y_CF + CARD_H / 2} H ${FINALS_X + CARD_W}`}
              stroke="#1f6feb"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.95}
              fill="none"
            />
          </Svg>

          {champion ? (
            <View
              style={[
                styles.championCard,
                {
                  left: FINALS_X,
                  top: LABEL_SPACE_Y + Y_FINALS - CHAMPION_CARD_H - 10,
                },
              ]}
            >
              <View style={styles.championInner}>
                <View style={styles.championLabelRow}>
                  <MaterialCommunityIcons name="crown" size={12} color="#facc15" />
                  <Text style={styles.championLabel}>Champion</Text>
                </View>
                <Text style={styles.championCode}>{champion}</Text>
              </View>
            </View>
          ) : null}

          {isComplete && !hasSubmittedBracket && !savedBracketLoading && !hideSubmitButton ? (
            <View
              style={[
                styles.submitWrap,
                { left: FINALS_X, top: LABEL_SPACE_Y + Y_FINALS + CARD_H + 14, width: CARD_W },
              ]}
            >
              <Pressable
                disabled={submitButtonDisabled}
                onPress={() => !submitButtonDisabled && onSubmitClick()}
                style={[styles.submitBtn, submitButtonDisabled && styles.submitBtnDisabled]}
              >
                <Text style={[styles.submitText, submitButtonDisabled && styles.submitTextDisabled]}>
                  {submitButtonLabel}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <RoundHeader left={LEFT_R1_X} title="1st Round" winnerPts="4 pts" />
          <RoundHeader left={LEFT_R2_X} title="Conference Semifinals" winnerPts="5 pts" />
          <RoundHeader left={LEFT_CF_X} title="Conference Finals" winnerPts="6 pts" />
          <RoundHeader left={FINALS_X} title="NBA Finals" winnerPts="6 pts" />
          <RoundHeader left={RIGHT_CF_X} title="Conference Finals" winnerPts="6 pts" />
          <RoundHeader left={RIGHT_R2_X} title="Conference Semifinals" winnerPts="5 pts" />
          <RoundHeader left={RIGHT_R1_X} title="1st Round" winnerPts="4 pts" />

          {eastR1.map((series, idx) => (
            <View
              key={series.id}
              style={{
                position: "absolute",
                left: LEFT_R1_X,
                top: LABEL_SPACE_Y + Y_R1[idx],
                width: CARD_W,
              }}
            >
              {renderSeriesCard(series.id, series.teams)}
            </View>
          ))}

          <View style={{ position: "absolute", left: LEFT_R2_X, top: LABEL_SPACE_Y + Y_R2_TOP, width: CARD_W }}>
            <AnimatedSeriesSlot
              teams={eastR2Top}
              seriesId="R2_E1"
              show={showR2E1}
              direction="right"
              bracket={bracket}
              canEditBracket={canEditBracket}
              onSelectWinner={onSelectWinner}
              onSelectGames={onSelectGames}
            />
          </View>

          <View style={{ position: "absolute", left: LEFT_R2_X, top: LABEL_SPACE_Y + Y_R2_BOTTOM, width: CARD_W }}>
            <AnimatedSeriesSlot
              teams={eastR2Bottom}
              seriesId="R2_E2"
              show={showR2E2}
              direction="right"
              bracket={bracket}
              canEditBracket={canEditBracket}
              onSelectWinner={onSelectWinner}
              onSelectGames={onSelectGames}
            />
          </View>

          <View style={{ position: "absolute", left: LEFT_CF_X, top: LABEL_SPACE_Y + Y_CF, width: CARD_W }}>
            <AnimatedSeriesSlot
              teams={eastCF}
              seriesId="CF_E"
              show={showCFE}
              direction="right"
              bracket={bracket}
              canEditBracket={canEditBracket}
              onSelectWinner={onSelectWinner}
              onSelectGames={onSelectGames}
            />
          </View>

          <View style={{ position: "absolute", left: FINALS_X, top: LABEL_SPACE_Y + Y_FINALS, width: CARD_W }}>
            <AnimatedSeriesSlot
              teams={finalsTeams}
              seriesId="FINALS"
              show={showFinals}
              direction="right"
              bracket={bracket}
              canEditBracket={canEditBracket}
              onSelectWinner={onSelectWinner}
              onSelectGames={onSelectGames}
            />
          </View>

          <View style={{ position: "absolute", left: RIGHT_CF_X, top: LABEL_SPACE_Y + Y_CF, width: CARD_W }}>
            <AnimatedSeriesSlot
              teams={westCF}
              seriesId="CF_W"
              show={showCFW}
              direction="left"
              bracket={bracket}
              canEditBracket={canEditBracket}
              onSelectWinner={onSelectWinner}
              onSelectGames={onSelectGames}
            />
          </View>

          <View style={{ position: "absolute", left: RIGHT_R2_X, top: LABEL_SPACE_Y + Y_R2_TOP, width: CARD_W }}>
            <AnimatedSeriesSlot
              teams={westR2Top}
              seriesId="R2_W1"
              show={showR2W1}
              direction="left"
              bracket={bracket}
              canEditBracket={canEditBracket}
              onSelectWinner={onSelectWinner}
              onSelectGames={onSelectGames}
            />
          </View>

          <View style={{ position: "absolute", left: RIGHT_R2_X, top: LABEL_SPACE_Y + Y_R2_BOTTOM, width: CARD_W }}>
            <AnimatedSeriesSlot
              teams={westR2Bottom}
              seriesId="R2_W2"
              show={showR2W2}
              direction="left"
              bracket={bracket}
              canEditBracket={canEditBracket}
              onSelectWinner={onSelectWinner}
              onSelectGames={onSelectGames}
            />
          </View>

          {westR1.map((series, idx) => (
            <View
              key={series.id}
              style={{
                position: "absolute",
                left: RIGHT_R1_X,
                top: LABEL_SPACE_Y + Y_R1[idx],
                width: CARD_W,
              }}
            >
              {renderSeriesCard(series.id, series.teams)}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 24,
  },
  totalBadgeWrap: {
    alignItems: "flex-end",
    marginBottom: 12,
  },
  totalBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  totalBadgeText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    fontWeight: "700",
  },
  roundHeader: {
    position: "absolute",
    alignItems: "center",
  },
  roundTitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  roundPts: {
    marginTop: 4,
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  roundBonus: {
    marginTop: 4,
    color: "rgba(255,255,255,0.52)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  championCard: {
    position: "absolute",
    width: CARD_W,
    height: CHAMPION_CARD_H,
    zIndex: 30,
  },
  championInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.8)",
    backgroundColor: "#1a1506",
    paddingHorizontal: 12,
  },
  championLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  championLabel: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  championCode: {
    color: "#fde047",
    fontSize: 18,
    fontWeight: "700",
  },
  submitWrap: {
    position: "absolute",
    alignItems: "center",
    zIndex: 30,
  },
  submitBtn: {
    borderRadius: 12,
    backgroundColor: "#163a5f",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  submitBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  submitText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  submitTextDisabled: {
    color: "rgba(255,255,255,0.55)",
  },
});
