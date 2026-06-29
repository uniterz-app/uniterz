/** Web `WcBracketTreeInput` 相当 */
import { useMemo, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import { getWcTreeSfFinalistSlots } from "@/lib/wc/wc-knockout-bracket-utils";
import { buildWcInputMatchView } from "@/lib/wc/wc-bracket-input-display";
import type { WcOfficialWinners } from "@/lib/wc/wc-bracket-results-types";
import {
  WC_BRACKET_LEFT_QF,
  WC_BRACKET_LEFT_R16,
  WC_BRACKET_RIGHT_QF,
  WC_BRACKET_RIGHT_R16_TREE,
  wcLeftR32MatchIds,
  wcRightR32MatchIds,
} from "@/lib/wc/wc-bracket-layout";
import {
  WC_TREE_COL,
  WC_TREE_DESIGN_H,
  WC_TREE_DESIGN_W,
  WC_TREE_CHAMPION_CARD_LABEL_OVERHANG,
  WC_TREE_CHAMPION_CARD_W,
  WC_TREE_HUD_HEADER_H,
  WC_TREE_PODIUM_CARD_TOP_Y,
  WC_TREE_PODIUM_CONNECTOR_Y,
  wcTreeConnectorMidX,
  wcTreeQfY,
  wcTreeR16Y,
  wcTreeR32Y,
  wcTreeSfY,
  wcTreeSingleFlagCenterY,
  wcTreeSlotBetweenFlagsY,
  wcTreeSlotEntryEdgeX,
  wcTreeSlotExitX,
  wcTreeSlotX,
} from "@/lib/wc/wc-bracket-tree-layout";
import type { Language } from "@/lib/i18n/language";
import PredictOverlayChamferedFrameNative from "../../PredictOverlayChamferedFrameNative";
import WcBracketTreeBackgroundNative from "./WcBracketTreeBackgroundNative";
import WcBracketTreeFlagPairNative, {
  WcBracketTreeWinnerFlagNative,
} from "./WcBracketTreeFlagPairNative";
import WcBracketChampionCardNative from "./WcBracketChampionCardNative";

type Props = {
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  officialWinners?: WcOfficialWinners;
  language?: Language;
};

function buildForkPath(
  side: "left" | "right",
  fromCol: number,
  toCol: number,
  yA: number,
  yB: number,
  endY: number
) {
  const exitX = wcTreeSlotExitX(side, fromCol);
  const entryX = wcTreeSlotEntryEdgeX(side, toCol);
  const midX = wcTreeConnectorMidX(side, exitX, entryX);

  return `
    M ${exitX} ${yA} H ${midX} V ${endY} H ${entryX}
    M ${exitX} ${yB} H ${midX} V ${endY} H ${entryX}
  `;
}

function buildPairToSinglePath(
  side: "left" | "right",
  fromCol: number,
  toCol: number,
  yTop: number,
  yBottom: number,
  yNext: number
) {
  const endY = wcTreeSingleFlagCenterY(yNext);
  return buildForkPath(
    side,
    fromCol,
    toCol,
    wcTreeSlotBetweenFlagsY(yTop),
    wcTreeSlotBetweenFlagsY(yBottom),
    endY
  );
}

function buildSingleToSinglePath(
  side: "left" | "right",
  fromCol: number,
  toCol: number,
  yTop: number,
  yBottom: number,
  yNext: number
) {
  const endY = wcTreeSingleFlagCenterY(yNext);
  return buildForkPath(
    side,
    fromCol,
    toCol,
    wcTreeSingleFlagCenterY(yTop),
    wcTreeSingleFlagCenterY(yBottom),
    endY
  );
}

function buildSfFinalTPath(sfY: number, finalCenterY: number) {
  const leftInnerX = wcTreeSlotExitX("left", WC_TREE_COL.leftSF);
  const rightInnerX = wcTreeSlotExitX("right", WC_TREE_COL.rightSF);
  const joinX = (leftInnerX + rightInnerX) / 2;
  const sfCY = wcTreeSingleFlagCenterY(sfY);

  return `
    M ${leftInnerX} ${sfCY} H ${rightInnerX}
    M ${joinX} ${sfCY} V ${finalCenterY}
  `;
}

function splitSvgSubpaths(d: string): string[] {
  return d
    .trim()
    .split(/\s*(?=M\s)/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function WinnerFlagAt({
  matchId,
  x,
  y,
  bracket,
  advancement,
  officialWinners,
}: {
  matchId: WcBracketPredictMatchId;
  x: number;
  y: number;
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  officialWinners?: WcOfficialWinners;
}) {
  const view = buildWcInputMatchView(matchId, bracket, advancement, {
    officialWinners,
    preferOfficialFeeders: Boolean(officialWinners),
  });
  const winner = view?.pickedWinner?.trim() ?? null;
  if (!winner) return null;

  return (
    <View style={[styles.absoluteSlot, { left: x, top: y }]}>
      <WcBracketTreeWinnerFlagNative teamId={winner} />
    </View>
  );
}

const HUD_GRADIENT = [
  "#03343f",
  "#044a52",
  "#055a5e",
  "#0d6b42",
  "#3f7f0f",
  "#6faa12",
  "#84cc16",
] as const;

export default function WcBracketTreeInputNative({
  bracket,
  advancement,
  officialWinners,
}: Props) {
  const participantOptions = officialWinners
    ? { officialWinners, preferOfficialFeeders: true as const }
    : undefined;
  const [wrapWidth, setWrapWidth] = useState(0);

  function onWrapLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (Math.abs(w - wrapWidth) > 0.5) setWrapWidth(w);
  }

  const viewScale =
    wrapWidth > 0 ? wrapWidth / WC_TREE_DESIGN_W : 360 / WC_TREE_DESIGN_W;
  const crownPad = WC_TREE_CHAMPION_CARD_LABEL_OVERHANG * viewScale * 0.88;
  const treeTopPad = WC_TREE_HUD_HEADER_H + Math.max(2, crownPad * 0.92);
  const scaledHeight = WC_TREE_DESIGN_H * viewScale + treeTopPad + 2;

  const leftR32 = wcLeftR32MatchIds();
  const rightR32 = wcRightR32MatchIds();
  const sfY = wcTreeSfY();
  const sfFinalists = getWcTreeSfFinalistSlots(bracket);
  const champion = bracket.M104?.winner?.trim() ?? null;

  const paths = useMemo(() => {
    const result: string[] = [];

    const pushPairToSingle = (
      side: "left" | "right",
      fromCol: number,
      toCol: number,
      yTop: number,
      yBottom: number,
      yNext: number
    ) => {
      result.push(
        buildPairToSinglePath(side, fromCol, toCol, yTop, yBottom, yNext)
      );
    };

    const pushSingleToSingle = (
      side: "left" | "right",
      fromCol: number,
      toCol: number,
      yTop: number,
      yBottom: number,
      yNext: number
    ) => {
      result.push(
        buildSingleToSinglePath(side, fromCol, toCol, yTop, yBottom, yNext)
      );
    };

    for (let i = 0; i < 4; i++) {
      const yNext = wcTreeR16Y(i);
      pushPairToSingle(
        "left",
        WC_TREE_COL.leftR32,
        WC_TREE_COL.leftR16,
        wcTreeR32Y(i * 2),
        wcTreeR32Y(i * 2 + 1),
        yNext
      );
      pushPairToSingle(
        "right",
        WC_TREE_COL.rightR32,
        WC_TREE_COL.rightR16,
        wcTreeR32Y(i * 2),
        wcTreeR32Y(i * 2 + 1),
        yNext
      );
    }

    for (let i = 0; i < 2; i++) {
      const yNext = wcTreeQfY(i);
      pushSingleToSingle(
        "left",
        WC_TREE_COL.leftR16,
        WC_TREE_COL.leftQF,
        wcTreeR16Y(i * 2),
        wcTreeR16Y(i * 2 + 1),
        yNext
      );
      pushSingleToSingle(
        "right",
        WC_TREE_COL.rightR16,
        WC_TREE_COL.rightQF,
        wcTreeR16Y(i * 2),
        wcTreeR16Y(i * 2 + 1),
        yNext
      );
    }

    pushSingleToSingle(
      "left",
      WC_TREE_COL.leftQF,
      WC_TREE_COL.leftSF,
      wcTreeQfY(0),
      wcTreeQfY(1),
      sfY
    );
    pushSingleToSingle(
      "right",
      WC_TREE_COL.rightQF,
      WC_TREE_COL.rightSF,
      wcTreeQfY(0),
      wcTreeQfY(1),
      sfY
    );

    result.push(buildSfFinalTPath(sfY, WC_TREE_PODIUM_CONNECTOR_Y));

    return result;
  }, [sfY]);

  const renderR32Match = (
    matchId: WcBracketPredictMatchId,
    side: "left" | "right",
    col: number,
    y: number
  ) => {
    const view = buildWcInputMatchView(
      matchId,
      bracket,
      advancement,
      participantOptions
    );
    const home = view?.home ?? { teamId: null, label: "" };
    const away = view?.away ?? { teamId: null, label: "" };
    const picked = view?.pickedWinner ?? null;
    if (!home.teamId && !away.teamId) return null;

    return (
      <View
        key={matchId}
        style={[styles.absoluteSlot, { left: wcTreeSlotX(side, col), top: y }]}
      >
        <WcBracketTreeFlagPairNative
          home={home}
          away={away}
          pickedWinner={picked}
        />
      </View>
    );
  };

  const renderWinnerMatch = (
    matchId: WcBracketPredictMatchId,
    side: "left" | "right",
    col: number,
    y: number
  ) => (
    <WinnerFlagAt
      key={matchId}
      matchId={matchId}
      x={wcTreeSlotX(side, col)}
      y={y}
      bracket={bracket}
      advancement={advancement}
      officialWinners={officialWinners}
    />
  );

  const scaledTreeLeft =
    wrapWidth > 0 ? (wrapWidth - WC_TREE_DESIGN_W * viewScale) / 2 : 0;

  return (
    <View style={styles.shell} onLayout={onWrapLayout}>
      <PredictOverlayChamferedFrameNative
        cut={10}
        gradientColors={HUD_GRADIENT}
        gradientLocations={[0, 0.14, 0.32, 0.58, 0.78, 0.92, 1]}
        borderColor="rgba(34, 211, 238, 0.52)"
        borderWidth={1}
        shadowColor="rgba(34, 211, 238, 0.16)"
        shadowOpacity={1}
        shadowRadius={18}
        maskCorners
        cornerMaskColor="rgba(3,52,63,1)"
        contentStyle={styles.frameContent}
      >
        <View style={styles.inner}>
          <WcBracketTreeBackgroundNative />
          <View style={[styles.treeViewport, { height: scaledHeight }]}>
            <View
              style={[
                styles.scaledTree,
                {
                  top: treeTopPad,
                  left: scaledTreeLeft,
                  width: WC_TREE_DESIGN_W * viewScale,
                  height: WC_TREE_DESIGN_H * viewScale,
                },
              ]}
            >
              <View
                style={{
                  width: WC_TREE_DESIGN_W,
                  height: WC_TREE_DESIGN_H,
                  transform: [{ scale: viewScale }],
                }}
              >
                <Svg
                  width={WC_TREE_DESIGN_W}
                  height={WC_TREE_DESIGN_H}
                  style={StyleSheet.absoluteFillObject}
                  pointerEvents="none"
                >
                  {paths.flatMap((d, pathIndex) =>
                    splitSvgSubpaths(d).map((segment, segIndex) => (
                      <G key={`${pathIndex}-${segIndex}`}>
                        <Path
                          d={segment}
                          fill="none"
                          stroke="rgba(52, 211, 153, 0.28)"
                          strokeWidth={2.5}
                        />
                        <Path
                          d={segment}
                          fill="none"
                          stroke="rgba(110, 231, 183, 0.78)"
                          strokeWidth={1}
                        />
                      </G>
                    ))
                  )}
                </Svg>

                {leftR32.map((matchId, i) =>
                  renderR32Match(
                    matchId,
                    "left",
                    WC_TREE_COL.leftR32,
                    wcTreeR32Y(i)
                  )
                )}
                {rightR32.map((matchId, i) =>
                  renderR32Match(
                    matchId,
                    "right",
                    WC_TREE_COL.rightR32,
                    wcTreeR32Y(i)
                  )
                )}
                {WC_BRACKET_LEFT_R16.map((matchId, i) =>
                  renderWinnerMatch(
                    matchId,
                    "left",
                    WC_TREE_COL.leftR16,
                    wcTreeR16Y(i)
                  )
                )}
                {WC_BRACKET_RIGHT_R16_TREE.map((matchId, i) =>
                  renderWinnerMatch(
                    matchId,
                    "right",
                    WC_TREE_COL.rightR16,
                    wcTreeR16Y(i)
                  )
                )}
                {WC_BRACKET_LEFT_QF.map((matchId, i) =>
                  renderWinnerMatch(
                    matchId,
                    "left",
                    WC_TREE_COL.leftQF,
                    wcTreeQfY(i)
                  )
                )}
                {WC_BRACKET_RIGHT_QF.map((matchId, i) =>
                  renderWinnerMatch(
                    matchId,
                    "right",
                    WC_TREE_COL.rightQF,
                    wcTreeQfY(i)
                  )
                )}
                {sfFinalists.left ? (
                  <View
                    style={[
                      styles.absoluteSlot,
                      { left: wcTreeSlotX("left", WC_TREE_COL.leftSF), top: sfY },
                    ]}
                  >
                    <WcBracketTreeWinnerFlagNative teamId={sfFinalists.left} />
                  </View>
                ) : null}
                {sfFinalists.right ? (
                  <View
                    style={[
                      styles.absoluteSlot,
                      {
                        left: wcTreeSlotX("right", WC_TREE_COL.rightSF),
                        top: sfY,
                      },
                    ]}
                  >
                    <WcBracketTreeWinnerFlagNative teamId={sfFinalists.right} />
                  </View>
                ) : null}

                {champion ? (
                  <View
                    style={[
                      styles.championSlot,
                      {
                        left: WC_TREE_COL.center - WC_TREE_CHAMPION_CARD_W / 2,
                        top: WC_TREE_PODIUM_CARD_TOP_Y,
                      },
                    ]}
                  >
                    <WcBracketChampionCardNative teamId={champion} />
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </PredictOverlayChamferedFrameNative>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: "100%",
  },
  frameContent: {
    overflow: "hidden",
  },
  inner: {
    position: "relative",
    overflow: "hidden",
  },
  treeViewport: {
    position: "relative",
    width: "100%",
    overflow: "visible",
  },
  scaledTree: {
    position: "absolute",
    overflow: "visible",
  },
  absoluteSlot: {
    position: "absolute",
    zIndex: 10,
  },
  championSlot: {
    position: "absolute",
    zIndex: 20,
  },
});
