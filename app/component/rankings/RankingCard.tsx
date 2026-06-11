"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RankingRowWithCountry, MobileMetric } from "./_data/mockRows";
import { jp, summaryMetricNumClass } from "@/lib/fonts";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import { metricNum } from "@/lib/rankings/metric";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import { useRankCountUp } from "@/lib/hooks/useCountUpRanking";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { streakShortLabel } from "@/lib/i18n/rankings";
import {
  RankingsGlowWireFrame,
  RankingsNoiseTexture,
  RankingsScanTexture,
} from "@/app/component/rankings/RankingsCyberDecor";
import {
  listCardShellStyle,
  listRankMedal,
} from "@/lib/rankings/rankingsCyberTheme";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import { RankDeltaBadge } from "@/app/component/rankings/RankDeltaBadge";
import { profileHrefWithRankingsReturn } from "@/lib/navigation/rankingsProfileFrom";
import { profilePathKeyFromRow } from "@/lib/profile/profilePathKey";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import { FLAG_SRC, getCountryCode } from "@/lib/rankings/country";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

const rankHudNumClass = summaryMetricNumClass;

export type RankingCardSize = "default" | "compact";
export type RankingCardShellTone = "default" | "subtle";

function medal(rank: number) {
  return listRankMedal(rank);
}

function FadedFlagBg({
  rank,
  countryCode,
}: {
  rank: number;
  countryCode?: string;
}) {
  const src = countryCode ? FLAG_SRC[countryCode] : undefined;
  /** 4位以下の一覧行：国旗をわずかに右へ */
  const listRow = rank > 3;

  if (!src) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <img
        src={src}
        alt=""
        className={[
          "absolute top-1/2 -translate-y-1/2 object-contain",
          listRow ? "right-0 h-[110%]" : "right-[-4%] h-[120%]",
        ].join(" ")}
        style={{ opacity: listRow ? 0.07 : 0.08 }}
        draggable={false}
      />
    </div>
  );
}

function ValueText({
  rank,
  metric,
  counted,
  isTop3,
  language,
  size = "default",
}: {
  rank: number;
  metric: MobileMetric;
  counted: number;
  isTop3: boolean;
  language: Language;
  size?: RankingCardSize;
}) {
  const m = medal(rank);
  const compact = size === "compact";
  const justifyRow = isTop3 ? "justify-center" : "justify-end";

  const baseTextClass = compact
    ? rank === 1
      ? "text-[19px]"
      : isTop3
        ? "text-[17px]"
        : "text-[14px]"
    : rank === 1
      ? "text-[32px]"
      : isTop3
        ? "text-[28px]"
        : "text-[20px]";

  const valueStyle =
    rank <= 3
      ? ({ color: m.text } as const)
      : ({ color: "rgba(140,240,255,0.92)" } as const);

  if (metric === "streak") {
    return (
      <div
        className={[
          "inline-flex max-w-full items-baseline gap-0.5 leading-none",
          justifyRow,
          rankHudNumClass,
          baseTextClass,
        ].join(" ")}
        style={valueStyle}
      >
        <span>{Math.round(counted)}</span>
        <span
          className={
            compact
              ? rank === 1
                ? "text-[11px]"
                : isTop3
                  ? "text-[10px]"
                  : "text-[9px]"
              : rank === 1
                ? "text-[17px]"
                : isTop3
                  ? "text-[15px]"
                  : "text-[11px]"
          }
        >
          {streakShortLabel(language)}
        </span>
      </div>
    );
  }

  if (metric === "goalScorerHits") {
    return (
      <div
        className={[
          "inline-flex max-w-full items-baseline leading-none",
          justifyRow,
          rankHudNumClass,
          baseTextClass,
        ].join(" ")}
        style={valueStyle}
      >
        <span className="tabular-nums">{Math.round(counted)}</span>
      </div>
    );
  }

  if (metric === "winRate") {
    return (
      <div
        className={[
          "inline-flex max-w-full items-baseline leading-none",
          justifyRow,
          rankHudNumClass,
        ].join(" ")}
        style={valueStyle}
      >
        <span className={baseTextClass}>{Math.round(counted)}</span>
        <span
          className={
            compact
              ? rank === 1
                ? "ml-0.5 text-[10px]"
                : isTop3
                  ? "ml-0.5 text-[9px]"
                  : "ml-0.5 text-[8px]"
              : rank === 1
                ? "ml-0.5 text-[16px]"
                : isTop3
                  ? "ml-0.5 text-[14px]"
                  : "ml-0.5 text-[10px]"
          }
        >
          %
        </span>
      </div>
    );
  }

  return (
    <div
      className={[
        "inline-flex max-w-full items-baseline gap-1 leading-none",
        justifyRow,
        rankHudNumClass,
        baseTextClass,
      ].join(" ")}
      style={valueStyle}
    >
      <span className="shrink-0 tabular-nums">
        {formatMetricDecimals(counted, 1)}
      </span>
      <span
        className={[
          "shrink-0",
          compact
            ? rank === 1
              ? "text-[9px]"
              : isTop3
                ? "text-[8px]"
                : "text-[7px]"
            : rank === 1
              ? "text-[15px]"
              : isTop3
                ? "text-[13px]"
                : "text-[9px]",
        ].join(" ")}
      >
        {t(language).rankings.pts}
      </span>
    </div>
  );
}

export default function RankingCard({
  row: r,
  rank,
  metric,
  rankPhase,
  playoffRound,
  rankingLeague,
  wcStage,
  onCountDone,
  language = "ja",
  size = "default",
  shellTone = "default",
  animateValue = true,
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  /** ランキング画面からプロフィールへ行くときの戻り用（未指定時は playoffs） */
  rankPhase?: RankingPhase;
  /** プレーオフラウンドタブ（TOTAL / 1ST / …）の戻り用 */
  playoffRound?: PlayoffRoundKey;
  /** NBA / WORLD CUP のリーグソース（戻りとプロフィール表示切替用） */
  rankingLeague?: RankingLeagueSource;
  /** WORLD CUP ステージ（overall / qualifying / main） */
  wcStage?: WcRankingStage;
  onCountDone?: () => void;
  language?: Language;
  /** マイコミュニティ等、同デザインで少し小さく */
  size?: RankingCardSize;
  /** コミュニティモーダル等、枠・発光を抑える */
  shellTone?: RankingCardShellTone;
  animateValue?: boolean;
}) {
  const compact = size === "compact";
  const subtleShell = shellTone === "subtle";
  const isTop3 = rank <= 3;
  const m = medal(rank);
  const countryCode = getCountryCode(r);

  const pathname = usePathname() ?? "";
  const base = pathname.startsWith("/mobile") || pathname.startsWith("/m/")
    ? "/mobile"
    : "/web";
  const profileKey = profilePathKeyFromRow(r);
  const profileHref = profileHrefWithRankingsReturn(pathname, base, profileKey, {
    metric,
    phase: rankPhase ?? "playoffs",
    playoffRound,
    rankingLeague,
    wcStage,
  });

  const { n: target, d: decimals } = metricNum(r, metric);
  const counted = useRankCountUp(
    target,
    900,
    decimals,
    animateValue,
    rank === 1 ? onCountDone : undefined
  );

  const rankNumClass = compact
    ? rank === 1
      ? "text-[22px]"
      : rank <= 3
        ? "text-[18px]"
        : "text-[15px]"
    : rank === 1
      ? "text-[34px]"
      : rank <= 3
        ? "text-[29px]"
        : "text-[20px]";

  const nameClass = compact
    ? rank === 1
      ? "text-[14px]"
      : isTop3
        ? "text-[13px]"
        : "text-[11px]"
    : rank === 1
      ? "text-[20px]"
      : isTop3
        ? "text-[17px]"
        : "text-[13px]";

  return (
    <Link
      href={profileHref}
      className={[
        "block min-w-0",
        compact ? (isTop3 ? "mb-1" : "mb-1.5") : isTop3 ? "mb-1.5" : "mb-2",
      ].join(" ")}
    >
      <div
        className={[
          "relative overflow-hidden rounded-none border",
          compact
            ? isTop3
              ? "min-h-[50px]"
              : "min-h-[38px]"
            : isTop3
              ? "min-h-[76px]"
              : "min-h-[50px]",
        ].join(" ")}
        style={listCardShellStyle(rank, subtleShell ? "subtle" : "default")}
      >
        {!subtleShell ? <RankingsScanTexture /> : null}
        {!subtleShell ? <RankingsNoiseTexture /> : null}
        {!subtleShell ? <RankingsGlowWireFrame variant="compact" /> : null}
        <FadedFlagBg rank={rank} countryCode={countryCode} />

        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: `radial-gradient(90% 70% at 100% 100%, ${m.tint} 0%, transparent 52%)`,
          }}
        />

        <div
          className={[
            "relative z-10 grid min-w-0 items-center",
            compact ? "gap-2 px-2" : "gap-2.5 px-2.5",
            compact
              ? isTop3
                ? "grid-cols-[22px_32px_minmax(0,1fr)_56px] py-1.5"
                : "grid-cols-[18px_28px_minmax(0,1fr)_auto] py-1"
              : isTop3
                ? "grid-cols-[32px_56px_minmax(0,1fr)_84px] py-2.5"
                : "grid-cols-[22px_36px_minmax(0,1fr)_auto] py-2",
          ].join(" ")}
        >
          <div className="flex items-center justify-center">
            <div
              className={[
                "translate-y-px text-center leading-none",
                rankHudNumClass,
                rankNumClass,
              ].join(" ")}
              style={{
                color: m.text,
              }}
            >
              {rank}
            </div>
          </div>

          <div className="flex items-center">
            <RankingsAvatarCircle
              photoURL={r.photoURL}
              displayName={r.displayName ?? r.handle ?? "?"}
              boxClassName={
                compact
                  ? isTop3
                    ? "h-9 w-9"
                    : "h-7 w-7"
                  : isTop3
                    ? "h-14 w-14"
                    : "h-9 w-9"
              }
              initialTextClassName={
                compact
                  ? isTop3
                    ? "text-[15px]"
                    : "text-[11px]"
                  : isTop3
                    ? "text-[22px]"
                    : "text-[15px]"
              }
              gateReady
            />
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 max-w-full items-center gap-1">
              <div
                className={[
                  "min-w-0 truncate font-black tracking-[0.01em]",
                  jp.className,
                  nameClass,
                ].join(" ")}
                style={{
                  color: "rgba(255,255,255,0.92)",
                  textShadow: "0 2px 12px rgba(0,0,0,0.35)",
                }}
              >
                {r.displayName ?? r.handle ?? "Unknown"}
              </div>
              <RankDeltaBadge
                delta={r.rankDeltaPlaces}
                language={language}
              />
              {r.plan === "pro" ? (
                <ProCyberBadge
                  {...proBadgeStaticMotion}
                  compact
                  ariaLabel={t(language).common.proMember}
                />
              ) : null}
            </div>
          </div>

          <div
            className={[
              "min-w-0",
              isTop3 ? "flex justify-center" : "flex justify-end",
            ].join(" ")}
          >
            <div
              className={[
                "flex min-w-0 max-w-full flex-col",
                compact
                  ? isTop3
                    ? "min-w-[48px] items-center text-center"
                    : "items-end text-right"
                  : isTop3
                    ? "min-w-[68px] items-center text-center"
                    : "items-end text-right",
              ].join(" ")}
            >
              <ValueText
                rank={rank}
                metric={metric}
                counted={counted}
                isTop3={isTop3}
                language={language}
                size={size}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}