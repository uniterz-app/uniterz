"use client";

import type { ReactNode } from "react";
import { nameBebas, nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import { summaryMetricNumClass } from "@/lib/fonts";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import {
  cyberRankNumStyle,
  cyberRankPalette,
  CYBER_LIST_CYAN,
} from "@/lib/rankings/cyberRankVisual";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import { RankFirstBorderEdgeScan } from "@/app/component/rankings/RankFirstBorderEdgeScan";
import {
  hasJaScript,
  rankingFontSizePx,
} from "@/lib/rankings/rankingJaTextSize";
import { FLAG_SRC, getCountryCode } from "@/lib/rankings/country";
import {
  formatListMetricDayDelta,
  listRowAvgText,
} from "@/lib/rankings/listRowMetricMeta";

export type CyberRankingScoreLayout = "stack" | "web";

export function CyberRankNumber({
  rank,
  compact,
}: {
  rank: number;
  compact?: boolean;
}) {
  const label = String(rank).padStart(2, "0");

  return (
    <span className="cyber-rank-num relative inline-block">
      <span
        className={[nameBebas.className, "relative z-[1] block tabular-nums leading-none"].join(
          " "
        )}
        style={cyberRankNumStyle(rank, !!compact)}
      >
        {label}
      </span>
      <span aria-hidden className="cyber-rank-num__scan pointer-events-none" />
    </span>
  );
}

const rankHudNumClass = summaryMetricNumClass;

function cyberScoreColor(rank: number): string {
  if (rank === 1) return "#FFD65A";
  if (rank === 2) return "#FCD34D";
  if (rank === 3) return "#FB923C";
  const t = Math.min(1, (rank - 4) / 14);
  return `rgba(255, 43, 214, ${0.92 - t * 0.35})`;
}

function cyberScoreGlow(rank: number): string {
  if (rank === 1) {
    return "0 0 10px rgba(255,214,90,0.55), 0 0 18px rgba(255,43,214,0.25)";
  }
  if (rank <= 3) {
    return "0 0 8px rgba(255,43,214,0.42)";
  }
  const t = Math.min(1, (rank - 4) / 14);
  return `0 0 ${8 + t * 4}px rgba(255,43,214,${0.38 - t * 0.22})`;
}

export function CyberRankingScore({
  rank,
  metric,
  counted,
  compact = false,
  scoreLayout = "stack",
}: {
  rank: number;
  metric: MobileMetric;
  counted: number;
  compact?: boolean;
  scoreLayout?: CyberRankingScoreLayout;
}) {
  const color = cyberScoreColor(rank);
  const mainSize =
    scoreLayout === "web"
      ? rank <= 3
        ? "text-[28px]"
        : "text-[24px]"
      : compact
        ? rank <= 3
          ? "text-[15px]"
          : "text-[13px]"
        : rank <= 3
          ? "text-[23px]"
          : "text-[19px]";

  const valueStyle = {
    color,
    textShadow: cyberScoreGlow(rank),
  } as const;

  const displayValue =
    metric === "winRate" || metric === "streak" || metric === "goalScorerHits"
      ? String(Math.round(counted))
      : formatMetricDecimals(counted, 1);

  return (
    <div
      className={[rankHudNumClass, mainSize, "tabular-nums leading-none"].join(
        " "
      )}
      style={valueStyle}
    >
      {displayValue}
    </div>
  );
}

function CyberListRowMeta({
  countryCode,
  posts,
  metric,
  avgRow,
  compact,
  scoreLayout = "stack",
}: {
  countryCode?: string | null;
  posts: number;
  metric: MobileMetric;
  avgRow: {
    avgTotalScore?: number;
    avgMarginPrecision?: number;
    avgUpsetScore?: number;
  };
  compact?: boolean;
  scoreLayout?: CyberRankingScoreLayout;
}) {
  const code = getCountryCode({ countryCode });
  const flagSrc = code ? FLAG_SRC[code] : undefined;
  const volText = `VOL:${posts}`;
  const avgText = listRowAvgText(metric, avgRow);
  const isWeb = scoreLayout === "web" && !compact;
  const metaSize = isWeb ? 13 : compact ? 10 : 11;
  const flagClass = isWeb
    ? "h-[18px] w-[27px]"
    : compact
      ? "h-[12px] w-[18px]"
      : "h-[14px] w-[21px]";

  return (
    <div
      className={[
        "flex min-w-0 items-center",
        isWeb ? "mt-2.5 gap-2.5" : compact ? "mt-1 gap-1.5" : "mt-1.5 gap-1.5",
      ].join(" ")}
    >
      {flagSrc ? (
        <img
          src={flagSrc}
          alt=""
          width={isWeb ? 27 : compact ? 18 : 21}
          height={isWeb ? 18 : compact ? 12 : 14}
          className={[flagClass, "shrink-0 rounded-[1px] object-cover opacity-80"].join(
            " "
          )}
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <span
        className={[nameOxanium.className, "shrink-0 font-bold uppercase tracking-[0.14em] tabular-nums leading-none"].join(
          " "
        )}
        style={{ color: "rgba(255,255,255,0.42)", fontSize: metaSize }}
      >
        {volText}
      </span>
      {avgText ? (
        <span
          className={[nameOxanium.className, "min-w-0 truncate font-bold uppercase tracking-[0.12em] tabular-nums leading-none"].join(
            " "
          )}
          style={{ color: "rgba(0,245,255,0.55)", fontSize: metaSize }}
        >
          {avgText}
        </span>
      ) : null}
    </div>
  );
}

export function CyberRankingListRow({
  rank,
  displayName,
  photoURL,
  metric,
  metricTag,
  scoreSlot,
  nameExtra,
  compact = false,
  showCrownSlot,
  posts = 0,
  countryCode,
  metricValueDelta,
  avgRow,
  scoreLayout = "stack",
  subtleShell = false,
}: {
  rank: number;
  displayName: string;
  photoURL?: string | null;
  metric: MobileMetric;
  metricTag: string;
  scoreSlot: ReactNode;
  nameExtra?: ReactNode;
  compact?: boolean;
  showCrownSlot?: ReactNode;
  posts?: number;
  countryCode?: string | null;
  metricValueDelta?: number | null;
  avgRow?: {
    avgTotalScore?: number;
    avgMarginPrecision?: number;
    avgUpsetScore?: number;
  };
  scoreLayout?: CyberRankingScoreLayout;
  subtleShell?: boolean;
}) {
  const palette = cyberRankPalette(rank);
  const firstFrame = palette.firstPlaceFrame && !subtleShell;
  const nameJa = hasJaScript(displayName);
  const isWebScore = scoreLayout === "web" && !compact;
  const nameFontSize = rankingFontSizePx(
    isWebScore ? 20 : compact ? 13 : 15,
    displayName
  );
  const tagJa = hasJaScript(metricTag);
  const tagFontSize = rankingFontSizePx(
    isWebScore ? 10 : compact ? 7 : 8,
    metricTag
  );
  const dayDeltaText = formatListMetricDayDelta(metric, metricValueDelta);
  const dayDeltaFontSize = rankingFontSizePx(
    isWebScore ? 11 : compact ? 9 : 10,
    dayDeltaText ?? "p+0.0"
  );

  const tagEl = (
    <span
      className={[
        isWebScore ? "" : "mt-1",
        "font-bold tracking-[0.2em]",
        tagJa ? jp.className : nameOxanium.className,
        tagJa ? "" : "uppercase",
      ].join(" ")}
      style={{ color: "#FF2BD6", fontSize: tagFontSize }}
    >
      {metricTag}
    </span>
  );

  const dayDeltaEl = dayDeltaText ? (
    <span
      className={[
        isWebScore ? "mt-0.5" : "mt-0.5",
        nameOxanium.className,
        "font-extrabold tabular-nums leading-none tracking-[0.06em]",
      ].join(" ")}
      style={{
        color: "#FFD65A",
        fontSize: dayDeltaFontSize,
        textShadow: "0 0 8px rgba(255,214,90,0.45)",
      }}
    >
      {dayDeltaText}
    </span>
  ) : null;

  return (
    <article
      className={[
        "relative flex items-stretch overflow-hidden",
        compact ? "min-h-[56px]" : isWebScore ? "min-h-[82px]" : "min-h-[72px]",
      ].join(" ")}
      style={{
        background: subtleShell
          ? "rgba(255,255,255,0.02)"
          : "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 42%, rgba(0,0,0,0.12) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {firstFrame ? <RankFirstBorderEdgeScan /> : null}

      <span
        aria-hidden
        className={[
          "w-[3px] shrink-0",
          firstFrame ? "relative z-10" : "",
        ].join(" ")}
        style={{
          background: palette.accent,
          boxShadow: `0 0 12px ${palette.accentGlow}`,
        }}
      />

      <div
        className={[
          "flex min-w-0 flex-1 items-center",
          firstFrame ? "relative z-10" : "",
          compact ? "gap-2 px-2 py-2" : "gap-3 px-3 py-2.5 sm:gap-4 sm:px-4",
        ].join(" ")}
      >
        <div
          className={[
            "relative shrink-0",
            compact ? "w-[42px]" : "w-[52px] sm:w-[58px]",
          ].join(" ")}
        >
          <CyberRankNumber rank={rank} compact={compact} />
        </div>

        <div
          className={[
            "flex shrink-0 flex-col items-center",
            rank === 1 && !subtleShell ? (compact ? "gap-0.5" : "gap-1") : "",
          ].join(" ")}
        >
          {rank === 1 && !subtleShell ? (
            <div
              className={[
                "flex items-end justify-center",
                compact ? "gap-0.5" : "gap-1",
              ].join(" ")}
            >
              {showCrownSlot ? (
                <div className="flex shrink-0 items-center justify-center leading-none">
                  {showCrownSlot}
                </div>
              ) : null}
              <span
                aria-hidden
                className={[
                  "font-bold leading-none",
                  nameOxanium.className,
                  compact ? "text-[6px] tracking-[0.08em]" : "text-[7px] tracking-widest",
                ].join(" ")}
                style={{
                  color: "#B8FF3C",
                  textShadow: "0 0 6px rgba(184,255,60,0.55)",
                }}
              >
                +++
              </span>
            </div>
          ) : null}
          <div
            className="relative shrink-0 overflow-hidden rounded-sm"
            style={{
              width: compact ? 36 : 44,
              height: compact ? 36 : 44,
              border: firstFrame
                ? "1px solid rgba(184,255,60,0.55)"
                : "1px solid rgba(255,255,255,0.12)",
              boxShadow: firstFrame ? "0 0 12px rgba(184,255,60,0.2)" : "none",
            }}
          >
            <RankingsAvatarCircle
              photoURL={photoURL}
              displayName={displayName}
              boxClassName="h-full w-full rounded-sm"
              initialTextClassName={
                nameJa
                  ? compact
                    ? "text-[10px]"
                    : "text-[12px]"
                  : compact
                    ? "text-[11px]"
                    : "text-[13px]"
              }
              gateReady
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1">
            <div
              className={[
                "min-w-0 truncate font-bold tracking-[0.06em]",
                nameJa ? jp.className : nameRajdhani.className,
                nameJa ? "" : "uppercase",
              ].join(" ")}
              style={{
                color: CYBER_LIST_CYAN,
                fontSize: nameFontSize,
                textShadow: "0 0 12px rgba(0,245,255,0.35)",
              }}
            >
              {displayName}
            </div>
            {nameExtra}
          </div>
          <CyberListRowMeta
            countryCode={countryCode}
            posts={posts}
            metric={metric}
            avgRow={avgRow ?? {}}
            compact={compact}
            scoreLayout={scoreLayout}
          />
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center pl-1">
          {isWebScore ? (
            <div className="flex items-start gap-2.5">
              {scoreSlot}
              <div className="flex flex-col items-end">
                {tagEl}
                {dayDeltaEl}
              </div>
            </div>
          ) : (
            <>
              {scoreSlot}
              {tagEl}
              {dayDeltaEl}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
