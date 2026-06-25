"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import { getWcTreeSfFinalistSlots } from "@/lib/wc/wc-knockout-bracket-utils";
import { buildWcInputMatchView } from "@/lib/wc/wc-bracket-input-display";
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
  WC_TREE_FLAG_H,
  WC_TREE_FLAG_W,
  WC_TREE_CHAMPION_CARD_LABEL_OVERHANG,
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
import WcBracketTreeFlagPair, {
  WcBracketTreeWinnerFlag,
} from "@/app/component/predict/wc/WcBracketTreeFlagPair";
import WcChampionCard from "@/app/component/predict/wc/WcChampionCard";
import type { Language } from "@/lib/i18n/language";

type Props = {
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  language?: Language;
  className?: string;
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

/** 左右 SF の内側を横線でつなぎ、中点から決勝へ縦線（T 字） */
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

function WinnerFlagAt({
  matchId,
  x,
  y,
  bracket,
  advancement,
}: {
  matchId: WcBracketPredictMatchId;
  x: number;
  y: number;
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
}) {
  const view = buildWcInputMatchView(matchId, bracket, advancement);
  const winner = view?.pickedWinner?.trim() ?? null;
  if (!winner) return null;

  return (
    <div className="absolute z-10" style={{ left: x, top: y }}>
      <WcBracketTreeWinnerFlag teamId={winner} />
    </div>
  );
}

/** トーナメント表（表示専用・国旗のみ） */
export default function WcBracketTreeInput({
  bracket,
  advancement,
  language = "ja",
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [wrapWidth, setWrapWidth] = useState(0);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return;
    const update = () => setWrapWidth(node.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const viewScale = wrapWidth ? wrapWidth / WC_TREE_DESIGN_W : 1;
  const crownPad = WC_TREE_CHAMPION_CARD_LABEL_OVERHANG * viewScale * 0.88;
  const scaledHeight = WC_TREE_DESIGN_H * viewScale + crownPad + 2;

  const leftR32 = wcLeftR32MatchIds();
  const rightR32 = wcRightR32MatchIds();
  const sfY = wcTreeSfY();
  const sfFinalists = getWcTreeSfFinalistSlots(bracket);
  const champion = bracket.M104?.winner?.trim() ?? null;

  const paths = useMemo(() => {
    const paths: string[] = [];

    const pushPairToSingle = (
      side: "left" | "right",
      fromCol: number,
      toCol: number,
      yTop: number,
      yBottom: number,
      yNext: number
    ) => {
      paths.push(
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
      paths.push(
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

    // ベスト4: 左山 → 左 SF、右山 → 右 SF（各 QF 2 枚から合流）
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

    paths.push(buildSfFinalTPath(sfY, WC_TREE_PODIUM_CONNECTOR_Y));

    return paths;
  }, [sfY]);

  const renderR32Match = (
    matchId: WcBracketPredictMatchId,
    side: "left" | "right",
    col: number,
    y: number
  ) => {
    const view = buildWcInputMatchView(matchId, bracket, advancement);
    const home = view?.home ?? { teamId: null, label: "" };
    const away = view?.away ?? { teamId: null, label: "" };
    const picked = view?.pickedWinner ?? null;
    if (!home.teamId && !away.teamId) return null;

    return (
      <div
        key={matchId}
        className="absolute z-10"
        style={{ left: wcTreeSlotX(side, col), top: y }}
      >
        <WcBracketTreeFlagPair home={home} away={away} pickedWinner={picked} />
      </div>
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
    />
  );

  return (
    <div ref={wrapRef} className={["w-full", className].filter(Boolean).join(" ")}>
      <div
        className="relative mx-auto w-full overflow-visible"
        style={{ height: scaledHeight }}
      >
        <div
          className="absolute left-1/2 origin-top"
          style={{
            width: WC_TREE_DESIGN_W,
            height: WC_TREE_DESIGN_H,
            transform: `translateX(-50%) scale(${viewScale})`,
            marginTop: Math.max(2, crownPad * 0.92),
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 z-0"
            width={WC_TREE_DESIGN_W}
            height={WC_TREE_DESIGN_H}
            aria-hidden
          >
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="rgba(0,245,255,0.22)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {leftR32.map((matchId, i) =>
            renderR32Match(matchId, "left", WC_TREE_COL.leftR32, wcTreeR32Y(i))
          )}
          {rightR32.map((matchId, i) =>
            renderR32Match(matchId, "right", WC_TREE_COL.rightR32, wcTreeR32Y(i))
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
            renderWinnerMatch(matchId, "left", WC_TREE_COL.leftQF, wcTreeQfY(i))
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
            <div
              className="absolute z-10"
              style={{ left: wcTreeSlotX("left", WC_TREE_COL.leftSF), top: sfY }}
            >
              <WcBracketTreeWinnerFlag teamId={sfFinalists.left} />
            </div>
          ) : null}
          {sfFinalists.right ? (
            <div
              className="absolute z-10"
              style={{ left: wcTreeSlotX("right", WC_TREE_COL.rightSF), top: sfY }}
            >
              <WcBracketTreeWinnerFlag teamId={sfFinalists.right} />
            </div>
          ) : null}

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
  );
}
