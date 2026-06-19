import { useMemo } from "react";
import { Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import type { League } from "../../../../../../lib/leagues";
import type { SeriesId } from "../../../../../../lib/playoff-bracket";
import type { TeamSlot } from "../../../../../../lib/playoff-bracket-display";
import { slotTeamIdToBracketCode } from "../../../../../../lib/playoff-bracket-display";
import BracketCardNative from "./BracketCardNative";
import ChampionCardNative from "./ChampionCardNative";
import PlayoffBracketHeaderNative from "./PlayoffBracketHeaderNative";
import PlayoffBracketHitLegendNative from "./PlayoffBracketHitLegendNative";
import {
  buildSeriesStatusMap,
  getCardHitStatus,
  getRound1InitialTeams,
  getSeriesIdFromRound1Index,
  type BracketLike,
} from "./playoffBracketHitLogic";

export type PlayoffFullBracketNativeProps = {
  league?: League;
  score?: number | string;
  season?: string;
  leftRound1: TeamSlot[];
  leftRound2: TeamSlot[];
  leftRound3: TeamSlot[];
  leftRound4: TeamSlot[];
  rightRound1: TeamSlot[];
  rightRound2: TeamSlot[];
  rightRound3: TeamSlot[];
  rightRound4: TeamSlot[];
  champion?: TeamSlot;
  bracket?: BracketLike;
  results?: BracketLike;
  hitLegend?: { language: "ja" | "en" };
};

const DESIGN_W = 504;
const DESIGN_H = 289;
const BRACKET_OFFSET_Y = -36;
const BRACKET_OFFSET_Y_WITH_LEGEND = 4;
const MOBILE_BRACKET_BOTTOM_SLACK = 64;

const COL_X = {
  leftR1: 0,
  leftR2: 74,
  leftR3: 138,
  center: 222,
  rightR3: 306,
  rightR2: 370,
  rightR1: 444,
} as const;

const R1_Y = [6, 40, 74, 108, 160, 194, 228, 262];
const R2_Y = [40, 75, 195, 230];
const R3_Y = [110, 160];
const CENTER_TOP_Y = 115;
const CENTER_BOTTOM_Y = 150;
const CHAMPION_X = COL_X.center - 30;
const CHAMPION_Y = CENTER_TOP_Y - 70;
const SCORE_Y = CENTER_BOTTOM_Y + 72 * 0.375 + 50;

function getSafeItem(list: TeamSlot[] | undefined, index: number): TeamSlot {
  return list?.[index] ?? { teamId: null, wins: "" };
}

function CardAt({
  x,
  y,
  teamId,
  wins,
  league,
  hitStatus,
}: {
  x: number;
  y: number;
  teamId?: string | null;
  wins?: number | string;
  league: League;
  hitStatus: "none" | "winner" | "winnerAndGames";
}) {
  return (
    <View style={{ position: "absolute", left: x, top: y }}>
      <BracketCardNative teamId={teamId} wins={wins} league={league} hitStatus={hitStatus} />
    </View>
  );
}

export default function PlayoffFullBracketNative({
  league = "nba",
  score,
  season,
  leftRound1,
  leftRound2,
  leftRound3,
  leftRound4,
  rightRound1,
  rightRound2,
  rightRound3,
  rightRound4,
  champion,
  bracket,
  results,
  hitLegend,
}: PlayoffFullBracketNativeProps) {
  const { width: windowWidth } = useWindowDimensions();
  const wrapWidth = Math.min(windowWidth - 24, 520);
  const viewScale = wrapWidth / DESIGN_W;
  const bracketOffsetY = hitLegend ? BRACKET_OFFSET_Y_WITH_LEGEND : BRACKET_OFFSET_Y;
  const scaledHeight =
    (DESIGN_H + MOBILE_BRACKET_BOTTOM_SLACK + Math.max(0, bracketOffsetY)) * viewScale;

  const round1InitialTeams = useMemo(() => getRound1InitialTeams(season), [season]);
  const championRouletteTeams = useMemo(() => {
    return Array.from(
      new Set(
        Object.values(round1InitialTeams)
          .flat()
          .map((id) => String(id ?? "").trim().toUpperCase())
          .filter((id) => id.length > 0)
      )
    );
  }, [round1InitialTeams]);

  const seriesStatusMap = useMemo(
    () => buildSeriesStatusMap(bracket, results, season),
    [bracket, results, season]
  );

  const championHitStatus = useMemo(() => {
    const championCode = slotTeamIdToBracketCode(champion?.teamId);
    const predictedChampion = String(bracket?.FINALS?.winner ?? "")
      .trim()
      .toUpperCase();
    if (!championCode || !predictedChampion) return "none" as const;
    if (championCode !== predictedChampion) return "none" as const;
    return seriesStatusMap.FINALS ?? "none";
  }, [champion?.teamId, bracket?.FINALS?.winner, seriesStatusMap]);

  function cardHit(seriesId: SeriesId, teamId?: string | null) {
    return getCardHitStatus(seriesId, teamId, bracket, seriesStatusMap);
  }

  return (
    <View style={styles.shell}>
      <View style={styles.headerBlock}>
        <PlayoffBracketHeaderNative season={season} />
        {hitLegend ? (
          <PlayoffBracketHitLegendNative language={hitLegend.language} compact />
        ) : null}
      </View>

      <View style={[styles.canvasWrap, { minHeight: scaledHeight }]}>
        <View
          style={{
            position: "absolute",
            left: 0,
            top: bracketOffsetY * viewScale,
            width: DESIGN_W,
            height: DESIGN_H,
            transform: [{ scale: viewScale }],
          }}
        >
          <View style={{ position: "absolute", left: CHAMPION_X, top: CHAMPION_Y }}>
            <ChampionCardNative
              teamId={champion?.teamId}
              league={league}
              hitStatus={championHitStatus}
              rouletteTeamIds={championRouletteTeams}
            />
          </View>

          {R1_Y.map((y, i) => {
            const item = getSafeItem(leftRound1, i);
            const seriesId = getSeriesIdFromRound1Index("left", i);
            return (
              <CardAt
                key={`left-r1-${i}`}
                x={COL_X.leftR1}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                league={league}
                hitStatus={cardHit(seriesId, item.teamId)}
              />
            );
          })}

          {R2_Y.map((y, i) => {
            const item = getSafeItem(leftRound2, i);
            const seriesId = (i < 2 ? "R2_E1" : "R2_E2") as SeriesId;
            return (
              <CardAt
                key={`left-r2-${i}`}
                x={COL_X.leftR2}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                league={league}
                hitStatus={cardHit(seriesId, item.teamId)}
              />
            );
          })}

          {R3_Y.map((y, i) => {
            const item = getSafeItem(leftRound3, i);
            return (
              <CardAt
                key={`left-r3-${i}`}
                x={COL_X.leftR3}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                league={league}
                hitStatus={cardHit("CF_E", item.teamId)}
              />
            );
          })}

          <CardAt
            x={COL_X.center}
            y={CENTER_TOP_Y}
            teamId={getSafeItem(leftRound4, 0).teamId}
            wins={getSafeItem(leftRound4, 0).wins}
            league={league}
            hitStatus={cardHit("FINALS", getSafeItem(leftRound4, 0).teamId)}
          />

          <CardAt
            x={COL_X.center}
            y={CENTER_BOTTOM_Y}
            teamId={getSafeItem(rightRound4, 0).teamId}
            wins={getSafeItem(rightRound4, 0).wins}
            league={league}
            hitStatus={cardHit("FINALS", getSafeItem(rightRound4, 0).teamId)}
          />

          <Text style={[styles.score, { top: SCORE_Y }]}>
            {score ?? 0} / 100
          </Text>

          {R3_Y.map((y, i) => {
            const item = getSafeItem(rightRound3, i);
            return (
              <CardAt
                key={`right-r3-${i}`}
                x={COL_X.rightR3}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                league={league}
                hitStatus={cardHit("CF_W", item.teamId)}
              />
            );
          })}

          {R2_Y.map((y, i) => {
            const item = getSafeItem(rightRound2, i);
            const seriesId = (i < 2 ? "R2_W1" : "R2_W2") as SeriesId;
            return (
              <CardAt
                key={`right-r2-${i}`}
                x={COL_X.rightR2}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                league={league}
                hitStatus={cardHit(seriesId, item.teamId)}
              />
            );
          })}

          {R1_Y.map((y, i) => {
            const item = getSafeItem(rightRound1, i);
            const seriesId = getSeriesIdFromRound1Index("right", i);
            return (
              <CardAt
                key={`right-r1-${i}`}
                x={COL_X.rightR1}
                y={y}
                teamId={item.teamId}
                wins={item.wins}
                league={league}
                hitStatus={cardHit(seriesId, item.teamId)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const bebas = Platform.select({
  ios: "BebasNeue_400Regular",
  android: "BebasNeue_400Regular",
  default: "sans-serif",
});

const styles = StyleSheet.create({
  shell: {
    width: "100%",
    overflow: "visible",
  },
  headerBlock: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  canvasWrap: {
    width: "100%",
    alignItems: "flex-start",
    paddingBottom: 16,
    overflow: "visible",
  },
  score: {
    position: "absolute",
    left: 0,
    width: DESIGN_W,
    textAlign: "center",
    fontFamily: bebas,
    fontSize: 30,
    letterSpacing: 2.4,
    color: "#f8fbff",
    textShadowColor: "rgba(95,124,255,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    includeFontPadding: false,
  },
});
