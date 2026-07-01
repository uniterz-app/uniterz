/** Web `WcBracketTreeInput` 相当 */
import { useMemo, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import { buildWcInputMatchView } from "@/lib/wc/wc-bracket-input-display";
import type { WcOfficialWinners } from "@/lib/wc/wc-bracket-results-types";
import {
  WC_TREE_COL,
  WC_TREE_DESIGN_H,
  WC_TREE_DESIGN_W,
  WC_TREE_CHAMPION_CARD_LABEL_OVERHANG,
  WC_TREE_CHAMPION_CARD_W,
  WC_TREE_HUD_HEADER_H,
  WC_TREE_LEFT_QF,
  WC_TREE_LEFT_R16,
  WC_TREE_LEFT_R32,
  WC_TREE_LEFT_SF,
  WC_TREE_PODIUM_CARD_TOP_Y,
  WC_TREE_RIGHT_QF,
  WC_TREE_RIGHT_R16,
  WC_TREE_RIGHT_R32,
  WC_TREE_RIGHT_SF,
  buildWcTreeConnectorPaths,
  buildWcTreeLayoutPositions,
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

const ALL_R32: readonly WcBracketPredictMatchId[] = [
  ...WC_TREE_LEFT_R32,
  ...WC_TREE_RIGHT_R32,
];
const ALL_WINNER_NODES: readonly WcBracketPredictMatchId[] = [
  ...WC_TREE_LEFT_R16,
  ...WC_TREE_RIGHT_R16,
  ...WC_TREE_LEFT_QF,
  ...WC_TREE_RIGHT_QF,
  WC_TREE_LEFT_SF,
  WC_TREE_RIGHT_SF,
];

function splitSvgSubpaths(d: string): string[] {
  return d
    .trim()
    .split(/\s*(?=M\s)/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

/** Web `.wc-bracket-tree-shell` の塗り（背景は子が担当） */
const SHELL_FILL = ["#010104", "#010104"] as const;

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

  const layout = useMemo(() => buildWcTreeLayoutPositions(), []);
  const paths = useMemo(() => buildWcTreeConnectorPaths(layout), [layout]);

  const viewScale = wrapWidth > 0 ? wrapWidth / WC_TREE_DESIGN_W : 1;
  const scaledW = WC_TREE_DESIGN_W * viewScale;
  const scaledH = WC_TREE_DESIGN_H * viewScale;
  const treeLeft = wrapWidth > 0 ? (wrapWidth - scaledW) / 2 : 0;
  const crownPad = WC_TREE_CHAMPION_CARD_LABEL_OVERHANG * viewScale * 0.88;
  const treeTopPad = WC_TREE_HUD_HEADER_H + Math.max(2, crownPad * 0.92);
  const scaledHeight = scaledH + treeTopPad + 2;

  const champion = bracket.M104?.winner?.trim() ?? null;

  const renderR32Match = (matchId: WcBracketPredictMatchId) => {
    const node = layout[matchId];
    if (!node) return null;

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
        style={[
          styles.absoluteSlot,
          { left: wcTreeSlotX(node.side, node.col), top: node.y },
        ]}
      >
        <WcBracketTreeFlagPairNative
          home={home}
          away={away}
          pickedWinner={picked}
        />
      </View>
    );
  };

  const renderWinnerMatch = (matchId: WcBracketPredictMatchId) => {
    const node = layout[matchId];
    if (!node) return null;
    const view = buildWcInputMatchView(matchId, bracket, advancement, {
      officialWinners,
      preferOfficialFeeders: Boolean(officialWinners),
    });
    const winner = view?.pickedWinner?.trim() ?? null;
    if (!winner) return null;

    return (
      <View
        key={matchId}
        style={[
          styles.absoluteSlot,
          { left: wcTreeSlotX(node.side, node.col), top: node.y },
        ]}
      >
        <WcBracketTreeWinnerFlagNative teamId={winner} />
      </View>
    );
  };

  return (
    <View style={styles.shell} onLayout={onWrapLayout}>
      <PredictOverlayChamferedFrameNative
        cut={10}
        gradientColors={SHELL_FILL}
        gradientLocations={[0, 1]}
        borderColor="rgba(34, 211, 238, 0.52)"
        borderWidth={1}
        shadowColor="rgba(34, 211, 238, 0.16)"
        shadowOpacity={1}
        shadowRadius={18}
        maskCorners
        cornerMaskColor="#010104"
        contentStyle={styles.frameContent}
      >
        <View style={styles.inner}>
          <WcBracketTreeBackgroundNative />
          <View style={[styles.treeLayer, { height: scaledHeight }]}>
            <View
              style={[
                styles.treeClip,
                {
                  left: treeLeft,
                  top: treeTopPad,
                  width: scaledW,
                  height: scaledH,
                },
              ]}
            >
              <View
                style={[
                  styles.treeCanvas,
                  {
                    transform: [{ scale: viewScale }],
                    transformOrigin: "top left",
                  },
                ]}
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

                {ALL_R32.map(renderR32Match)}
                {ALL_WINNER_NODES.map(renderWinnerMatch)}

                {champion ? (
                  <View
                    style={[
                      styles.championSlot,
                      {
                        left: WC_TREE_COL.center,
                        top: WC_TREE_PODIUM_CARD_TOP_Y,
                        transform: [{ translateX: -WC_TREE_CHAMPION_CARD_W / 2 }],
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
    backgroundColor: "#010104",
  },
  treeLayer: {
    position: "relative",
    zIndex: 10,
    width: "100%",
  },
  treeClip: {
    position: "absolute",
    overflow: "visible",
  },
  treeCanvas: {
    width: WC_TREE_DESIGN_W,
    height: WC_TREE_DESIGN_H,
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
