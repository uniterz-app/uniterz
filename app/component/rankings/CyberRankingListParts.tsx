"use client";

import type { ReactNode } from "react";
import { nameBebas, nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import { summaryMetricNumClass } from "@/lib/fonts";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import {
  cyberMetricTag,
  cyberRankNumStyle,
  cyberRankPalette,
  cyberRankQuietFrameColor,
  CYBER_LIST_CYAN,
} from "@/lib/rankings/cyberRankVisual";
import type { MobileMetric } from "@/lib/rankings/rankingMetrics";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import { RankFirstBorderEdgeScan } from "@/app/component/rankings/RankFirstBorderEdgeScan";
import {
  hasJaScript,
  rankingFontSizePx,
} from "@/lib/rankings/rankingJaTextSize";
import { FLAG_SRC, getCountryCode } from "@/lib/rankings/country";
import RankingListProSkinFx, {
  type RankingListProSkinIntensity,
} from "@/app/component/rankings/RankingListProSkinFx";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import type { Language } from "@/lib/i18n/language";
import { RankDeltaBadge } from "@/app/component/rankings/RankDeltaBadge";
import {
  formatListMetricDayDelta,
  listRowAvgText,
} from "@/lib/rankings/listRowMetricMeta";

export type CyberRankingScoreLayout = "stack" | "web";

export function CyberRankNumber({
  rank,
  compact,
  displayValue,
  muted = false,
  variant = "list",
}: {
  rank: number;
  compact?: boolean;
  /** 順位以外の表示（-- / ··· など） */
  displayValue?: string;
  /** 未取得・ローディング — リストと同フォントでニュートラル表示 */
  muted?: boolean;
  /** tower = MyRankCard 塔（やや大きめ） */
  variant?: "list" | "tower";
}) {
  const label = displayValue ?? String(rank).padStart(2, "0");
  const isCompact = !!compact;
  const style = muted
    ? {
        fontSize:
          variant === "tower"
            ? isCompact
              ? "2.4rem"
              : "3.2rem"
            : isCompact
              ? "1.65rem"
              : "2.25rem",
        transform: "skewX(-12deg)",
        display: "inline-block" as const,
        color: "rgba(255,255,255,0.42)",
        letterSpacing: "0.05em",
      }
    : cyberRankNumStyle(rank, isCompact, variant);

  return (
    <span className="cyber-rank-num relative inline-block">
      <span
        className={[nameBebas.className, "relative z-[1] block tabular-nums leading-none"].join(
          " "
        )}
        style={style}
      >
        {label}
      </span>
      {!muted ? (
        <span aria-hidden className="cyber-rank-num__scan pointer-events-none" />
      ) : null}
    </span>
  );
}

/** 順位以外の数値 — フォントは子要素任せでスキャンラインだけ重ねる */
export function CyberScanlineText({
  children,
  className,
  subtle = true,
}: {
  children: ReactNode;
  className?: string;
  /** true = 順位数字より控えめなスキャンライン */
  subtle?: boolean;
}) {
  return (
    <span className="cyber-rank-num relative inline-block">
      <span className={["relative z-[1] block", className].filter(Boolean).join(" ")}>
        {children}
      </span>
      <span
        aria-hidden
        className={[
          "cyber-rank-num__scan pointer-events-none",
          subtle ? "cyber-rank-num__scan--subtle" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </span>
  );
}

const rankHudNumClass = summaryMetricNumClass;

function cyberScoreColor(rank: number): string {
  if (rank === 1) return "#FFD65A";
  if (rank === 2) return "#FCD34D";
  if (rank === 3) return "#FB923C";
  return "rgba(255,255,255,0.96)";
}

function cyberScoreGlow(rank: number): string {
  if (rank === 1) {
    return "0 0 10px rgba(255,214,90,0.55), 0 0 18px rgba(255,43,214,0.25)";
  }
  if (rank <= 3) {
    return "0 0 8px rgba(255,43,214,0.42)";
  }
  return "none";
}

export function CyberRankingScore({
  rank,
  metric,
  counted,
  compact = false,
  scoreLayout = "stack",
  plainWhite = false,
}: {
  rank: number;
  metric: MobileMetric;
  counted: number;
  compact?: boolean;
  scoreLayout?: CyberRankingScoreLayout;
  /** My Rank Free — 順位色ではなく白 */
  plainWhite?: boolean;
}) {
  const color = plainWhite ? "rgba(255,255,255,0.96)" : cyberScoreColor(rank);
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
    textShadow: plainWhite ? "none" : cyberScoreGlow(rank),
    transform: "skewX(-12deg)",
    display: "inline-block" as const,
  };

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
  flagOnly = false,
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
  flagOnly?: boolean;
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
      {flagOnly ? null : (
        <>
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
        </>
      )}
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
  showFirstPlaceFrame = false,
  proSkinVariant = null,
  proSkinIntensity = "medium",
  rankOverline = null,
  rankDeltaPlaces,
  language = "ja",
  hideListMeta = false,
  bare = false,
  rankDisplayValue,
  rankMuted = false,
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
  /** subtle シェルでも 1 位の EDGE SCAN 枠を表示（グループ詳細ランキング等） */
  showFirstPlaceFrame?: boolean;
  /** Pro Skin — 実パターンを行背景に（未指定時は従来） */
  proSkinVariant?: ProfilePlanProBgVariant | null;
  proSkinIntensity?: RankingListProSkinIntensity;
  /** 廃止（左アクセントバーは出さない）。呼び出し互換のため残す */
  hideAccentBar?: boolean;
  rankOverline?: string | null;
  rankDeltaPlaces?: number | null;
  language?: Language;
  /** 試合得点上位など — VOL / 平均は出さず、国旗だけ出す */
  hideListMeta?: boolean;
  /** My Rank カード内 — リスト行の背景・下線・1位枠なし。配置だけ揃える */
  bare?: boolean;
  rankDisplayValue?: string;
  rankMuted?: boolean;
}) {
  const palette = cyberRankPalette(rank);
  const firstFrame =
    !bare && palette.firstPlaceFrame && (!subtleShell || showFirstPlaceFrame);
  const quietFrame = bare ? null : cyberRankQuietFrameColor(rank);
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
    dayDeltaText ?? "+0.0"
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

  const baseBg = subtleShell
    ? "rgba(255,255,255,0.02)"
    : "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 42%, rgba(0,0,0,0.12) 100%)";

  return (
    <article
      className={[
        "relative mb-[3px] flex items-stretch overflow-hidden",
        compact ? "min-h-[56px]" : isWebScore ? "min-h-[82px]" : "min-h-[72px]",
      ].join(" ")}
      style={{
        background:
          bare || proSkinVariant || hideListMeta ? "transparent" : baseBg,
        borderBottom: bare ? "none" : "1px solid rgba(255,255,255,0.06)",
        marginBottom: bare ? 0 : undefined,
      }}
    >
      {bare ? null : proSkinVariant ? (
        <RankingListProSkinFx
          variant={proSkinVariant}
          intensity={proSkinIntensity}
        />
      ) : null}
      {firstFrame ? <RankFirstBorderEdgeScan /> : null}
      {quietFrame ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[6]"
          style={{ boxShadow: `inset 0 0 0 1px ${quietFrame}` }}
        />
      ) : null}

      <div
        className={[
          "flex min-w-0 flex-1 items-center",
          firstFrame || proSkinVariant ? "relative z-10" : "",
          compact
            ? firstFrame
              ? "gap-2 px-2 pb-2 pt-5"
              : "gap-2 px-2 py-2"
            : firstFrame
              ? "gap-3 px-3 pb-2.5 pt-5 sm:gap-4 sm:px-4"
              : "gap-3 px-3 py-2.5 sm:gap-4 sm:px-4",
        ].join(" ")}
      >
        <div
          className={[
            "relative flex shrink-0 flex-col items-center justify-center",
            compact ? "min-h-9 w-[42px]" : "min-h-11 w-[52px] sm:w-[58px]",
            rankOverline ? (compact ? "gap-1.5" : "gap-2") : "gap-0",
          ].join(" ")}
        >
          {rankOverline ? (
            <span
              className={[
                nameOxanium.className,
                "whitespace-nowrap text-center font-bold uppercase tracking-[0.12em] text-white/50",
                compact ? "text-[6.5px]" : "text-[7px]",
              ].join(" ")}
            >
              {rankOverline}
            </span>
          ) : null}
          <CyberRankNumber
            rank={rank}
            compact={compact}
            displayValue={rankDisplayValue}
            muted={rankMuted}
          />
          <RankDeltaBadge
            delta={rankDeltaPlaces}
            size="sm"
            language={language}
          />
        </div>

        <div
          className={[
            "relative flex shrink-0 flex-col items-center justify-center",
            compact ? "h-9 w-9" : "h-11 w-11",
          ].join(" ")}
        >
          {rank === 1 && firstFrame ? (
            <div
              className={[
                "absolute bottom-full mb-0.5 flex items-end justify-center",
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
            className={[
              "relative shrink-0 rounded-sm",
              firstFrame ? "cyber-rank-avatar-first-glow" : "",
            ].join(" ")}
            style={{
              width: compact ? 36 : 44,
              height: compact ? 36 : 44,
              ...(firstFrame
                ? null
                : { border: "1px solid rgba(255,255,255,0.12)" }),
            }}
          >
            <RankingsAvatarCircle
              photoURL={photoURL}
              displayName={displayName}
              imageLoading={rank === 1 ? "eager" : "lazy"}
              boxClassName="h-full w-full overflow-hidden rounded-sm"
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
          {hideListMeta ? (
            countryCode ? (
              <CyberListRowMeta
                countryCode={countryCode}
                posts={0}
                metric={metric}
                avgRow={{}}
                compact={compact}
                scoreLayout={scoreLayout}
                flagOnly
              />
            ) : null
          ) : (
            <CyberListRowMeta
              countryCode={countryCode}
              posts={posts}
              metric={metric}
              avgRow={avgRow ?? {}}
              compact={compact}
              scoreLayout={scoreLayout}
            />
          )}
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
