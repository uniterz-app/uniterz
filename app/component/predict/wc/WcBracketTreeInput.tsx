"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CountryFlag from "@/app/component/games/CountryFlag";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import { WC_BRACKET_PREDICT_MATCH_IDS } from "@/lib/wc/wc-knockout-bracket";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import { buildWcInputMatchView } from "@/lib/wc/wc-bracket-input-display";
import {
  WC_BRACKET_LEFT_QF,
  WC_BRACKET_LEFT_R16,
  WC_BRACKET_RIGHT_QF,
  WC_BRACKET_RIGHT_R16,
  wcLeftR32MatchIds,
  wcRightR32MatchIds,
} from "@/lib/wc/wc-bracket-layout";
import {
  WC_TREE_COL,
  WC_TREE_DESIGN_H,
  WC_TREE_DESIGN_W,
  WC_TREE_PODIUM_RUNNER_Y,
  WC_TREE_PODIUM_TROPHY_Y,
  WC_TREE_PODIUM_WINNER_Y,
  wcTreeCenterBridgeX,
  wcTreeConnectorMidX,
  wcTreeQfY,
  wcTreeR16Y,
  wcTreeR32Y,
  wcTreeSfY,
  wcTreeSlotCenterY,
  wcTreeSlotEntryX,
  wcTreeSlotExitX,
  wcTreeSlotX,
} from "@/lib/wc/wc-bracket-tree-layout";
import WcBracketTreeFlagPair from "@/app/component/predict/wc/WcBracketTreeFlagPair";
import type { Language } from "@/lib/i18n/language";

type Props = {
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  language?: Language;
  className?: string;
};

function buildLeftBracketPath(
  exitX: number,
  entryX: number,
  yTop: number,
  yBottom: number,
  endY: number
) {
  const start1Y = wcTreeSlotCenterY(yTop);
  const start2Y = wcTreeSlotCenterY(yBottom);
  const midX = wcTreeConnectorMidX("left", exitX, entryX);

  return `
    M ${exitX} ${start1Y} H ${midX} V ${endY} H ${entryX}
    M ${exitX} ${start2Y} H ${midX} V ${endY} H ${entryX}
  `;
}

function buildRightBracketPath(
  exitX: number,
  entryX: number,
  yTop: number,
  yBottom: number,
  endY: number
) {
  const start1Y = wcTreeSlotCenterY(yTop);
  const start2Y = wcTreeSlotCenterY(yBottom);
  const midX = wcTreeConnectorMidX("right", exitX, entryX);

  return `
    M ${exitX} ${start1Y} H ${midX} V ${endY} H ${entryX}
    M ${exitX} ${start2Y} H ${midX} V ${endY} H ${entryX}
  `;
}

function singleHPath(startX: number, endX: number, y: number) {
  return `M ${startX} ${y} H ${endX}`;
}

function FlagPairAt({
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
  const home = view?.home ?? { teamId: null, label: "" };
  const away = view?.away ?? { teamId: null, label: "" };
  const picked = view?.pickedWinner ?? null;

  if (!home.teamId && !away.teamId) return null;

  return (
    <div className="absolute" style={{ left: x, top: y }}>
      <WcBracketTreeFlagPair home={home} away={away} pickedWinner={picked} />
    </div>
  );
}

function AdvanceFlag({
  teamId,
  x,
  y,
  large = false,
}: {
  teamId: string;
  x: number;
  y: number;
  large?: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
    >
      <CountryFlag
        teamId={teamId}
        className={large ? "aspect-4/3 w-9" : "aspect-4/3 w-8"}
        variant="inline"
      />
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
  const isJa = language === "ja";
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
  const scaledHeight = WC_TREE_DESIGN_H * viewScale + 8;

  const pickedCount = useMemo(
    () =>
      WC_BRACKET_PREDICT_MATCH_IDS.filter((id) =>
        Boolean(bracket[id]?.winner?.trim())
      ).length,
    [bracket]
  );

  const leftR32 = wcLeftR32MatchIds();
  const rightR32 = wcRightR32MatchIds();
  const leftSfY = wcTreeSfY();
  const rightSfY = wcTreeSfY();

  const finalView = buildWcInputMatchView("M104", bracket, advancement);
  const champion = bracket.M104?.winner?.trim() ?? null;
  const homeFinalist = finalView?.home.teamId ?? null;
  const awayFinalist = finalView?.away.teamId ?? null;
  const runnerUp =
    champion && homeFinalist && awayFinalist
      ? champion === homeFinalist
        ? awayFinalist
        : homeFinalist
      : null;

  const winnerPodiumTeam = champion ?? homeFinalist;
  const runnerPodiumTeam = champion ? runnerUp : awayFinalist;

  const paths = useMemo(() => {
    const paths: string[] = [];

    const pushPair = (
      fromCol: number,
      toCol: number,
      yTop: number,
      yBottom: number,
      yNext: number,
      side: "left" | "right"
    ) => {
      const exitX = wcTreeSlotExitX(side, fromCol);
      const entryX = wcTreeSlotEntryX(side, toCol);
      const endY = wcTreeSlotCenterY(yNext);

      if (side === "left") {
        paths.push(
          buildLeftBracketPath(exitX, entryX, yTop, yBottom, endY)
        );
      } else {
        paths.push(
          buildRightBracketPath(exitX, entryX, yTop, yBottom, endY)
        );
      }
    };

    for (let i = 0; i < 4; i++) {
      const yNext = wcTreeR16Y(i);
      pushPair(
        WC_TREE_COL.leftR32,
        WC_TREE_COL.leftR16,
        wcTreeR32Y(i * 2),
        wcTreeR32Y(i * 2 + 1),
        yNext,
        "left"
      );
      pushPair(
        WC_TREE_COL.rightR32,
        WC_TREE_COL.rightR16,
        wcTreeR32Y(i * 2),
        wcTreeR32Y(i * 2 + 1),
        yNext,
        "right"
      );
    }

    for (let i = 0; i < 2; i++) {
      const yNext = wcTreeQfY(i);
      pushPair(
        WC_TREE_COL.leftR16,
        WC_TREE_COL.leftQF,
        wcTreeR16Y(i * 2),
        wcTreeR16Y(i * 2 + 1),
        yNext,
        "left"
      );
      pushPair(
        WC_TREE_COL.rightR16,
        WC_TREE_COL.rightQF,
        wcTreeR16Y(i * 2),
        wcTreeR16Y(i * 2 + 1),
        yNext,
        "right"
      );
    }

    pushPair(
      WC_TREE_COL.leftQF,
      WC_TREE_COL.leftSF,
      wcTreeQfY(0),
      wcTreeQfY(1),
      leftSfY,
      "left"
    );
    pushPair(
      WC_TREE_COL.rightQF,
      WC_TREE_COL.rightSF,
      wcTreeQfY(0),
      wcTreeQfY(1),
      rightSfY,
      "right"
    );

    const sfMidY = wcTreeSlotCenterY(leftSfY);
    const leftBridgeX = wcTreeCenterBridgeX("left", WC_TREE_COL.leftSF);
    const rightBridgeX = wcTreeCenterBridgeX("right", WC_TREE_COL.rightSF);

    paths.push(
      singleHPath(wcTreeSlotExitX("left", WC_TREE_COL.leftSF), leftBridgeX, sfMidY)
    );
    paths.push(
      singleHPath(wcTreeSlotExitX("right", WC_TREE_COL.rightSF), rightBridgeX, sfMidY)
    );

    return paths;
  }, [leftSfY, rightSfY]);

  const renderMatch = (
    matchId: WcBracketPredictMatchId,
    side: "left" | "right",
    col: number,
    y: number
  ) => (
    <FlagPairAt
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
        className="relative mx-auto w-full overflow-hidden"
        style={{ height: scaledHeight }}
      >
        <div
          className="absolute left-1/2 origin-top"
          style={{
            width: WC_TREE_DESIGN_W,
            height: WC_TREE_DESIGN_H,
            transform: `translateX(-50%) scale(${viewScale})`,
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0"
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
            renderMatch(matchId, "left", WC_TREE_COL.leftR32, wcTreeR32Y(i))
          )}
          {rightR32.map((matchId, i) =>
            renderMatch(matchId, "right", WC_TREE_COL.rightR32, wcTreeR32Y(i))
          )}
          {WC_BRACKET_LEFT_R16.map((matchId, i) =>
            renderMatch(matchId, "left", WC_TREE_COL.leftR16, wcTreeR16Y(i))
          )}
          {WC_BRACKET_RIGHT_R16.map((matchId, i) =>
            renderMatch(matchId, "right", WC_TREE_COL.rightR16, wcTreeR16Y(i))
          )}
          {WC_BRACKET_LEFT_QF.map((matchId, i) =>
            renderMatch(matchId, "left", WC_TREE_COL.leftQF, wcTreeQfY(i))
          )}
          {WC_BRACKET_RIGHT_QF.map((matchId, i) =>
            renderMatch(matchId, "right", WC_TREE_COL.rightQF, wcTreeQfY(i))
          )}
          {renderMatch("M101", "left", WC_TREE_COL.leftSF, leftSfY)}
          {renderMatch("M102", "right", WC_TREE_COL.rightSF, rightSfY)}

          {winnerPodiumTeam ? (
            <AdvanceFlag
              teamId={winnerPodiumTeam}
              x={WC_TREE_COL.center}
              y={WC_TREE_PODIUM_WINNER_Y}
              large
            />
          ) : null}

          <div
            className="pointer-events-none absolute z-20 flex items-center justify-center text-[22px] drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
            style={{
              left: WC_TREE_COL.center - 11,
              top: WC_TREE_PODIUM_TROPHY_Y,
              width: 22,
              height: 22,
            }}
            aria-hidden
          >
            🏆
          </div>

          {runnerPodiumTeam ? (
            <AdvanceFlag
              teamId={runnerPodiumTeam}
              x={WC_TREE_COL.center}
              y={WC_TREE_PODIUM_RUNNER_Y}
              large
            />
          ) : null}
        </div>
      </div>

      <div className="mt-1 flex justify-center px-1">
        <div className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-0.5 text-[11px] font-bold text-emerald-200">
          {pickedCount}/{WC_BRACKET_PREDICT_MATCH_IDS.length}
          {isJa ? " 試合" : " picks"}
        </div>
      </div>
    </div>
  );
}
