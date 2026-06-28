"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
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
import WcBracketTreeFlagPair, {
  WcBracketTreeWinnerFlag,
} from "@/app/component/predict/wc/WcBracketTreeFlagPair";
import WcBracketTreeBackground from "@/app/component/predict/wc/WcBracketTreeBackground";
import WcChampionCard from "@/app/component/predict/wc/WcChampionCard";
import type { Language } from "@/lib/i18n/language";

type Props = {
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  /** 指定時は R16+ フィーダーを公式勝者で解決（サバイバー表示用） */
  officialWinners?: WcOfficialWinners;
  language?: Language;
  className?: string;
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

/** 1 つの path 文字列に複数 M がある場合、サブパスごとに分割（WebKit 描画崩れ防止） */
function splitSvgSubpaths(d: string): string[] {
  return d
    .trim()
    .split(/\s*(?=M\s)/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

/** トーナメント表（表示専用・国旗のみ） */
export default function WcBracketTreeInput({
  bracket,
  advancement,
  officialWinners,
  language = "ja",
  className = "",
}: Props) {
  const participantOptions = officialWinners
    ? { officialWinners, preferOfficialFeeders: true as const }
    : undefined;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [wrapWidth, setWrapWidth] = useState(0);

  useLayoutEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const update = () => setWrapWidth(node.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => buildWcTreeLayoutPositions(), []);
  const paths = useMemo(() => buildWcTreeConnectorPaths(layout), [layout]);

  const viewScale = wrapWidth ? wrapWidth / WC_TREE_DESIGN_W : 1;
  const crownPad = WC_TREE_CHAMPION_CARD_LABEL_OVERHANG * viewScale * 0.88;
  const treeTopPad = WC_TREE_HUD_HEADER_H + Math.max(2, crownPad * 0.92);
  const scaledHeight = WC_TREE_DESIGN_H * viewScale + treeTopPad + 2;

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
      <div
        key={matchId}
        className="absolute z-10"
        style={{ left: wcTreeSlotX(node.side, node.col), top: node.y }}
      >
        <WcBracketTreeFlagPair home={home} away={away} pickedWinner={picked} />
      </div>
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
      <div
        key={matchId}
        className="absolute z-10"
        style={{ left: wcTreeSlotX(node.side, node.col), top: node.y }}
      >
        <WcBracketTreeWinnerFlag teamId={winner} />
      </div>
    );
  };

  return (
    <div
      ref={wrapRef}
      className={["wc-bracket-tree-shell relative w-full", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="wc-bracket-tree-shell__inner overflow-hidden">
        <WcBracketTreeBackground />
        <div
          className="relative z-10 mx-auto w-full overflow-visible"
          style={{ height: scaledHeight }}
        >
          <div
            className="absolute left-1/2 origin-top"
            style={{
              width: WC_TREE_DESIGN_W,
              height: WC_TREE_DESIGN_H,
              transform: `translateX(-50%) scale(${viewScale})`,
              marginTop: treeTopPad,
            }}
          >
          <svg
            className="pointer-events-none absolute inset-0 z-0"
            width={WC_TREE_DESIGN_W}
            height={WC_TREE_DESIGN_H}
            aria-hidden
          >
            {paths.flatMap((d, pathIndex) =>
              splitSvgSubpaths(d).map((segment, segIndex) => (
                <g key={`${pathIndex}-${segIndex}`}>
                  <path
                    d={segment}
                    fill="none"
                    stroke="rgba(52, 211, 153, 0.28)"
                    strokeWidth={2.5}
                  />
                  <path
                    d={segment}
                    fill="none"
                    stroke="rgba(110, 231, 183, 0.78)"
                    strokeWidth={1}
                  />
                </g>
              ))
            )}
          </svg>

          {ALL_R32.map(renderR32Match)}
          {ALL_WINNER_NODES.map(renderWinnerMatch)}

          {champion ? (
            <div
              className="absolute z-20 -translate-x-1/2"
              style={{
                left: WC_TREE_COL.center,
                top: WC_TREE_PODIUM_CARD_TOP_Y,
              }}
            >
              <WcChampionCard teamId={champion} />
            </div>
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
