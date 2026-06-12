"use client";

import React, { useMemo } from "react";
import { auth } from "@/lib/firebase";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { useGameMarketDistribution } from "@/lib/hooks/useGameMarketDistribution";
import { t } from "@/lib/i18n/t";
import { nameOxanium, resultStatsMetricNumClass } from "@/lib/fonts";
import type { League } from "@/lib/leagues";
import type { MarketBiasFallback } from "@/lib/predict/gameMarketDistribution";
import type { Status } from "@/app/component/games/MatchCard";
type Props = {
  gameId: string;
  league: League;
  status: Status;
  score: { home: number; away: number } | null;
  fallbackMarketBias?: MarketBiasFallback | null;
  homeColor: string;
  awayColor: string;
  homeLabel: string;
  awayLabel: string;
  compact?: boolean;
  /** ログインユーザーの勝者予想（home / away / draw） */
  userPredictionWinner?: MarketKey | null;
};

type MarketKey = "home" | "away" | "draw";

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

const winningMarketBorder = (accent: string) => `${accent}88`;
const winningMarketGlow = (accent: string) =>
  `inset 0 0 8px ${accent}1a, 0 0 4px ${accent}22`;

const MARKET_BAR_SEGMENTS = 20;

function allocateSegmentCounts(
  barHome: number,
  barDraw: number,
  barAway: number,
  isSoccer: boolean,
  total: number
): Record<MarketKey, number> {
  const items: { key: MarketKey; share: number }[] = [
    { key: "home", share: barHome },
    ...(isSoccer ? [{ key: "draw" as const, share: barDraw }] : []),
    { key: "away", share: barAway },
  ];
  const sum = items.reduce((s, i) => s + i.share, 0) || 1;
  const scaled = items.map((i) => ({
    key: i.key,
    exact: (i.share / sum) * total,
  }));
  const counts = Object.fromEntries(
    scaled.map((s) => [s.key, Math.floor(s.exact)])
  ) as Record<MarketKey, number>;
  let used = Object.values(counts).reduce((a, b) => a + b, 0);
  const remainders = scaled
    .map((s) => ({ key: s.key, rem: s.exact - counts[s.key] }))
    .sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (used < total) {
    const key = remainders[i % remainders.length].key;
    counts[key] = (counts[key] ?? 0) + 1;
    used += 1;
    i += 1;
  }
  return counts;
}

function buildSegmentKinds(
  barHome: number,
  barDraw: number,
  barAway: number,
  isSoccer: boolean
): MarketKey[] {
  const counts = allocateSegmentCounts(
    barHome,
    barDraw,
    barAway,
    isSoccer,
    MARKET_BAR_SEGMENTS
  );
  const kinds: MarketKey[] = [];
  (["home", "draw", "away"] as const).forEach((key) => {
    if (!isSoccer && key === "draw") return;
    for (let n = 0; n < (counts[key] ?? 0); n++) kinds.push(key);
  });
  return kinds;
}

function markerCenterFromKinds(
  kinds: MarketKey[],
  pick: MarketKey
): number | null {
  const total = kinds.length;
  if (!total) return null;
  let start = 0;
  while (start < total && kinds[start] !== pick) start++;
  if (start >= total) return null;
  let end = start;
  while (end < total && kinds[end] === pick) end++;
  return ((start + (end - start) / 2) / total) * 100;
}

function pickAccentColor(
  pick: MarketKey,
  homeColor: string,
  awayColor: string
): string {
  if (pick === "home") return homeColor;
  if (pick === "away") return awayColor;
  return "#d1d5db";
}

function UserPredictionMarker({
  kinds,
  pick,
  homeColor,
  awayColor,
  compact,
  ariaLabel,
}: {
  kinds: MarketKey[];
  pick: MarketKey;
  homeColor: string;
  awayColor: string;
  compact?: boolean;
  ariaLabel: string;
}) {
  const center = markerCenterFromKinds(kinds, pick);
  if (center == null) return null;

  const accent = pickAccentColor(pick, homeColor, awayColor);

  return (
    <div
      className={compact ? "relative mb-px h-2.5 w-full" : "relative mb-0.5 h-3 w-full"}
      role="img"
      aria-label={ariaLabel}
    >
      <div
        className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center"
        style={{ left: `${center}%` }}
      >
        <span
          className={[
            nameOxanium.className,
            "font-bold uppercase tracking-[0.16em]",
            compact ? "text-[7px]" : "text-[8px] md:text-[9px]",
          ].join(" ")}
          style={{
            color: accent,
            textShadow: `0 0 8px ${accent}88`,
          }}
        >
          YOU
        </span>
        <span
          className="mt-px block h-0 w-0 border-x-[3px] border-t-[4px] border-x-transparent md:border-x-4 md:border-t-[5px]"
          style={{
            borderTopColor: accent,
            filter: `drop-shadow(0 0 4px ${accent}aa)`,
          }}
          aria-hidden
        />
      </div>
    </div>
  );
}

function SegmentedMarketBar({
  barHome,
  barDraw,
  barAway,
  isSoccer,
  homeColor,
  awayColor,
  compact,
  highlightedKeys,
}: {
  barHome: number;
  barDraw: number;
  barAway: number;
  isSoccer: boolean;
  homeColor: string;
  awayColor: string;
  compact?: boolean;
  highlightedKeys: Set<MarketKey>;
}) {
  const kinds = useMemo(
    () => buildSegmentKinds(barHome, barDraw, barAway, isSoccer),
    [barAway, barDraw, barHome, isSoccer]
  );
  const segH = compact ? 10 : 14;

  const segmentStyle = (key: MarketKey): React.CSSProperties => {
    const highlighted = highlightedKeys.has(key);
    if (key === "home") {
      return {
        background: `linear-gradient(180deg, ${homeColor} 0%, ${homeColor}cc 100%)`,
        boxShadow: highlighted
          ? winningMarketGlow(homeColor)
          : `0 0 8px ${homeColor}44, inset 0 1px 0 rgba(255,255,255,0.18)`,
        border: highlighted
          ? `1px solid ${winningMarketBorder(homeColor)}`
          : `1px solid ${homeColor}88`,
      };
    }
    if (key === "draw") {
      const drawAccent = "#9ca3af";
      return {
        background:
          "linear-gradient(180deg, rgba(156,163,175,0.92) 0%, rgba(107,114,128,0.88) 100%)",
        boxShadow: highlighted
          ? winningMarketGlow(drawAccent)
          : "inset 0 1px 0 rgba(255,255,255,0.12)",
        border: highlighted
          ? `1px solid ${winningMarketBorder(drawAccent)}`
          : "1px solid rgba(156,163,175,0.45)",
      };
    }
    return {
      background: `linear-gradient(180deg, ${awayColor} 0%, ${awayColor}cc 100%)`,
      boxShadow: highlighted
        ? winningMarketGlow(awayColor)
        : `0 0 8px ${awayColor}40, inset 0 1px 0 rgba(255,255,255,0.16)`,
      border: highlighted
        ? `1px solid ${winningMarketBorder(awayColor)}`
        : `1px solid ${awayColor}88`,
    };
  };

  return (
    <div
      className={[
        "flex w-full rounded-md bg-white/[0.06] p-[3px]",
        compact ? "gap-[2px]" : "gap-[3px]",
      ].join(" ")}
      role="img"
    >
      {kinds.map((key, i) => (
        <div
          key={`${key}-${i}`}
          className="min-w-0 flex-1 origin-bottom -skew-x-[14deg] rounded-[2px] transition-shadow duration-300"
          style={{
            height: segH,
            ...segmentStyle(key),
          }}
        />
      ))}
    </div>
  );
}

function statBoxSurface(
  variant: MarketKey,
  homeColor: string,
  awayColor: string,
  isHighlighted: boolean
): React.CSSProperties {
  if (isHighlighted) {
    const accent =
      variant === "home"
        ? homeColor
        : variant === "away"
          ? awayColor
          : "#9ca3af";
    return {
      background: `linear-gradient(180deg, ${accent}28 0%, rgba(0,0,0,0.38) 72%)`,
      border: `1px solid ${winningMarketBorder(accent)}`,
      boxShadow: winningMarketGlow(accent),
    };
  }
  if (variant === "home") {
    return {
      background: `linear-gradient(180deg, ${homeColor}28 0%, rgba(0,0,0,0.38) 72%)`,
      border: `1px solid ${homeColor}70`,
      boxShadow: `inset 0 0 18px ${homeColor}16, 0 0 12px ${homeColor}14`,
    };
  }
  if (variant === "draw") {
    return {
      background:
        "linear-gradient(180deg, rgba(156,163,175,0.22) 0%, rgba(0,0,0,0.38) 72%)",
      border: "1px solid rgba(156,163,175,0.48)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
    };
  }
  return {
    background: `linear-gradient(180deg, ${awayColor}28 0%, rgba(0,0,0,0.38) 72%)`,
    border: `1px solid ${awayColor}70`,
    boxShadow: `inset 0 0 18px ${awayColor}16, 0 0 12px ${awayColor}14`,
  };
}

function StatBox({
  label,
  pct,
  variant,
  homeColor,
  awayColor,
  compact,
  isHighlighted = false,
}: {
  label: string;
  pct: number;
  variant: MarketKey;
  homeColor: string;
  awayColor: string;
  compact?: boolean;
  isHighlighted?: boolean;
}) {
  const labelTint =
    variant === "home"
      ? homeColor
      : variant === "away"
        ? awayColor
        : "#d1d5db";

  return (
    <div
      className={[
        "min-w-0 text-center transition-shadow duration-300",
        compact ? "px-1.5 py-1" : "px-2 py-2 md:px-2.5 md:py-2.5",
      ].join(" ")}
      style={statBoxSurface(variant, homeColor, awayColor, isHighlighted)}
    >
      <div
        className={[
          nameOxanium.className,
          "truncate font-bold uppercase tracking-[0.14em]",
          compact ? "text-[8px]" : "text-[9px] md:text-[10px]",
        ].join(" ")}
        style={{ color: `${labelTint}cc` }}
      >
        {label}
      </div>
      <div
        className={[
          resultStatsMetricNumClass,
          "mt-0.5 font-black tabular-nums",
          "text-white",
          compact ? "text-sm" : "text-lg md:text-xl",
        ].join(" ")}
        style={
          isHighlighted
            ? undefined
            : {
                textShadow: `0 0 14px ${labelTint}44`,
              }
        }
      >
        {formatPct(pct)}
      </div>
    </div>
  );
}

/** 予想オーバーレイ：放送局の下に常時表示する市場棒グラフ（市場タブと同じ posts 集計） */
function resolveWinningMarketKeys(
  status: Status,
  score: { home: number; away: number } | null,
  isSoccer: boolean
): Set<MarketKey> {
  if (status !== "final" || !score) return new Set();
  const { home, away } = score;
  if (isSoccer && home === away) return new Set(["draw"]);
  if (home > away) return new Set(["home"]);
  if (away > home) return new Set(["away"]);
  return new Set();
}

export default function MatchCardOverlayMarketBar({
  gameId,
  league,
  status,
  score,
  fallbackMarketBias,
  homeColor,
  awayColor,
  homeLabel,
  awayLabel,
  compact = false,
  userPredictionWinner = null,
}: Props) {
  const { language } = useUserLanguage(auth.currentUser?.uid ?? null);
  const m = t(language);
  const { isSoccer, total, homePct, awayPct, drawPct, fromFallback } =
    useGameMarketDistribution(gameId, league, fallbackMarketBias);

  const { barHome, barDraw, barAway, highlightedKeys, segmentKinds } =
    useMemo(() => {
      const sum = Math.max(1e-6, homePct + awayPct + (isSoccer ? drawPct : 0));
      const bh = (homePct / sum) * 100;
      const bd = (drawPct / sum) * 100;
      const ba = (awayPct / sum) * 100;
      return {
        barHome: bh,
        barDraw: bd,
        barAway: ba,
        highlightedKeys: resolveWinningMarketKeys(status, score, isSoccer),
        segmentKinds: buildSegmentKinds(bh, bd, ba, isSoccer),
      };
    }, [awayPct, drawPct, homePct, isSoccer, score, status]);

  const hasData =
    total > 0 ||
    (fallbackMarketBias?.homePct ?? 0) + (fallbackMarketBias?.awayPct ?? 0) > 0;

  if (!hasData) return null;

  return (
    <div className="w-full">
      <div
        className={[
          "rounded-md border border-white/[0.08] bg-white/[0.04]",
          compact ? "px-1.5 py-1" : "px-2 py-1.5 md:px-2.5",
        ].join(" ")}
        aria-label={`${m.predict.marketBias} ${homeLabel} ${formatPct(homePct)} ${awayLabel} ${formatPct(awayPct)}`}
      >
        <div
          className={[
            "flex items-end justify-between gap-2",
            nameOxanium.className,
            compact ? "mb-0.5" : "mb-1",
          ].join(" ")}
        >
          <span
            className={[
              "font-bold uppercase tracking-[0.18em] text-white/45",
              compact ? "text-[8px] leading-none" : "text-[9px] leading-none md:text-[10px]",
            ].join(" ")}
          >
            {m.predict.marketBias}
          </span>
          {total > 0 && !fromFallback ? (
            <span
              className={[
                "shrink-0 tabular-nums leading-none text-white/70",
                compact ? "text-[10px]" : "text-[11px] md:text-xs",
              ].join(" ")}
            >
              {m.predict.totalPredictions}
              <span
                className={[
                  resultStatsMetricNumClass,
                  "font-bold text-white/88",
                  compact ? "text-[11px]" : "text-xs md:text-sm",
                ].join(" ")}
              >
                {total}
              </span>
            </span>
          ) : null}
        </div>

        {userPredictionWinner ? (
          <UserPredictionMarker
            kinds={segmentKinds}
            pick={userPredictionWinner}
            homeColor={homeColor}
            awayColor={awayColor}
            compact={compact}
            ariaLabel={m.predict.yourPrediction}
          />
        ) : null}
        <SegmentedMarketBar
          barHome={barHome}
          barDraw={barDraw}
          barAway={barAway}
          isSoccer={isSoccer}
          homeColor={homeColor}
          awayColor={awayColor}
          compact={compact}
          highlightedKeys={highlightedKeys}
        />
      </div>

      <div
        className={[
          "mt-1 grid gap-2",
          isSoccer ? "grid-cols-3" : "grid-cols-2",
          compact ? "gap-1" : "md:gap-2",
        ].join(" ")}
      >
        <StatBox
          label={homeLabel}
          pct={homePct}
          variant="home"
          homeColor={homeColor}
          awayColor={awayColor}
          compact={compact}
          isHighlighted={highlightedKeys.has("home")}
        />
        {isSoccer ? (
          <StatBox
            label={m.predict.draw}
            pct={drawPct}
            variant="draw"
            homeColor={homeColor}
            awayColor={awayColor}
            compact={compact}
            isHighlighted={highlightedKeys.has("draw")}
          />
        ) : null}
        <StatBox
          label={awayLabel}
          pct={awayPct}
          variant="away"
          homeColor={homeColor}
          awayColor={awayColor}
          compact={compact}
          isHighlighted={highlightedKeys.has("away")}
        />
      </div>
    </div>
  );
}
