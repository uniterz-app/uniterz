"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import { evaluateWcBracketSurvival } from "@/lib/wc/wc-knockout-bracket-utils";
import {
  buildWcMatchCardViews,
  buildWcR32CardViews,
} from "@/lib/wc/wc-bracket-display";
import {
  WC_BRACKET_CENTER_FINAL_Y,
  WC_BRACKET_COL_X,
  WC_BRACKET_DESIGN_H,
  WC_BRACKET_DESIGN_W,
  WC_BRACKET_LEFT_QF,
  WC_BRACKET_LEFT_R16,
  WC_BRACKET_RIGHT_R16_TREE,
  WC_BRACKET_RIGHT_QF,
  WC_BRACKET_SLOT_GAP,
  wcQfY,
  wcR16Y,
  wcR32Y,
} from "@/lib/wc/wc-bracket-layout";
import WcBracketCard, {
  WC_BRACKET_CARD_H,
} from "@/app/component/predict/wc/WcBracketCard";
import { PLAYOFF_BRACKET_PANEL } from "@/lib/ui/matchOverlayGlass";
import type { Language } from "@/lib/i18n/language";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import WcBracketHitLegend from "@/app/component/predict/wc/WcBracketHitLegend";

export type WcFullBracketMobileProps = {
  bracket: WcBracketState;
  advancement: WcKnockoutAdvancement;
  officialWinners: Partial<Record<WcBracketPredictMatchId, string>>;
  firstMissMatchId?: WcBracketPredictMatchId | null;
  language?: Language;
  showGlassShell?: boolean;
  showHitLegend?: boolean;
  className?: string;
};

function MatchPairAt({
  x,
  y,
  views,
  side,
}: {
  x: number;
  y: number;
  views: ReturnType<typeof buildWcMatchCardViews>;
  side: "left" | "right";
}) {
  if (views.length === 0) return null;
  return (
    <>
      {views.map((v, i) => (
        <div
          key={`${v.matchId}-${v.role}`}
          className="absolute"
          style={{ left: x, top: y + i * WC_BRACKET_SLOT_GAP }}
        >
          <WcBracketCard
            teamId={v.teamId}
            label={v.label}
            side={side}
            hitStatus={v.hitStatus}
            isPickedWinner={v.isPickedWinner}
          />
        </div>
      ))}
    </>
  );
}

export default function WcFullBracketMobile({
  bracket,
  advancement,
  officialWinners,
  firstMissMatchId: firstMissProp,
  language = "ja",
  showGlassShell = true,
  showHitLegend = true,
  className = "",
}: WcFullBracketMobileProps) {
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

  const survival = useMemo(
    () => evaluateWcBracketSurvival(bracket, officialWinners),
    [bracket, officialWinners]
  );
  const firstMissMatchId = firstMissProp ?? survival.firstMissMatchId;

  const viewScale = wrapWidth ? wrapWidth / WC_BRACKET_DESIGN_W : 1;
  const scaledHeight = WC_BRACKET_DESIGN_H * viewScale + WC_BRACKET_CARD_H;

  const leftR32 = useMemo(
    () =>
      buildWcR32CardViews(
        "left",
        bracket,
        officialWinners,
        firstMissMatchId,
        advancement
      ),
    [bracket, officialWinners, firstMissMatchId, advancement]
  );
  const rightR32 = useMemo(
    () =>
      buildWcR32CardViews(
        "right",
        bracket,
        officialWinners,
        firstMissMatchId,
        advancement
      ),
    [bracket, officialWinners, firstMissMatchId, advancement]
  );

  const renderRound = (
    matchIds: readonly WcBracketPredictMatchId[],
    colX: number,
    yFn: (i: number) => number,
    side: "left" | "right"
  ) =>
    matchIds.map((matchId, i) => (
      <MatchPairAt
        key={matchId}
        x={colX}
        y={yFn(i) - WC_BRACKET_SLOT_GAP / 2}
        views={buildWcMatchCardViews(
          matchId,
          bracket,
          officialWinners,
          firstMissMatchId,
          advancement
        )}
        side={side}
      />
    ));

  const finalViews = buildWcMatchCardViews(
    "M104",
    bracket,
    officialWinners,
    firstMissMatchId,
    advancement
  );

  return (
    <div
      ref={wrapRef}
      className={[
        "relative w-full min-h-[min(100dvh,720px)]",
        showGlassShell ? PLAYOFF_BRACKET_PANEL : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative z-20 px-3 pb-2 pt-3 text-center">
        <div className="text-[11px] font-bold tracking-[0.2em] text-cyan-300/90">
          WORLD CUP 2026
        </div>
        <div className="mt-1 text-[10px] text-white/55">
          {language === "ja"
            ? survival.alive
              ? "生存中 — 的中した枝だけ表示"
              : firstMissMatchId
                ? `${firstMissMatchId} で脱落`
                : "ブラケット"
            : survival.alive
              ? "Alive — showing hits only"
              : firstMissMatchId
                ? `Out at ${firstMissMatchId}`
                : "Bracket"}
        </div>
        {showHitLegend ? (
          <WcBracketHitLegend language={language} compact className="mt-2" />
        ) : null}
      </div>

      <div
        className="relative mx-auto w-full overflow-visible pb-6"
        style={{ minHeight: scaledHeight }}
      >
        <div
          className="absolute left-1/2 origin-top"
          style={{
            width: WC_BRACKET_DESIGN_W,
            height: WC_BRACKET_DESIGN_H,
            transform: `translateX(-50%) scale(${viewScale})`,
          }}
        >
          {leftR32.map((views, i) => (
            <MatchPairAt
              key={`l32-${i}`}
              x={WC_BRACKET_COL_X.leftR32}
              y={wcR32Y(i)}
              views={views}
              side="left"
            />
          ))}
          {rightR32.map((views, i) => (
            <MatchPairAt
              key={`r32-${i}`}
              x={WC_BRACKET_COL_X.rightR32}
              y={wcR32Y(i)}
              views={views}
              side="right"
            />
          ))}

          {renderRound(
            WC_BRACKET_LEFT_R16,
            WC_BRACKET_COL_X.leftR16,
            wcR16Y,
            "left"
          )}
          {renderRound(
            WC_BRACKET_RIGHT_R16_TREE,
            WC_BRACKET_COL_X.rightR16,
            wcR16Y,
            "right"
          )}
          {renderRound(WC_BRACKET_LEFT_QF, WC_BRACKET_COL_X.leftQF, wcQfY, "left")}
          {renderRound(
            WC_BRACKET_RIGHT_QF,
            WC_BRACKET_COL_X.rightQF,
            wcQfY,
            "right"
          )}
          {renderRound(["M101"], WC_BRACKET_COL_X.leftSF, () => wcQfY(1) + 20, "left")}
          {renderRound(["M102"], WC_BRACKET_COL_X.rightSF, () => wcQfY(1) + 20, "right")}

          <MatchPairAt
            x={WC_BRACKET_COL_X.center - 20}
            y={WC_BRACKET_CENTER_FINAL_Y}
            views={finalViews}
            side="left"
          />
        </div>
      </div>
    </div>
  );
}
