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
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import { RankDeltaBadge } from "@/app/component/rankings/RankDeltaBadge";
import { profileHrefWithRankingsReturn } from "@/lib/navigation/rankingsProfileFrom";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import { FLAG_SRC, getCountryCode } from "@/lib/rankings/country";

const rankHudNumClass = summaryMetricNumClass;

function medal(rank: number) {
  if (rank === 1) {
    return {
      text: "#FFD65A",
      glow: "rgba(255,215,90,0.08)",
      tint: "rgba(255,215,90,0.06)",
    };
  }
  if (rank === 2) {
    return {
      text: "#E9EDF6",
      glow: "rgba(230,235,245,0.06)",
      tint: "rgba(230,235,245,0.05)",
    };
  }
  if (rank === 3) {
    return {
      text: "#D59A5A",
      glow: "rgba(205,127,50,0.06)",
      tint: "rgba(205,127,50,0.05)",
    };
  }
  return {
    text: "#FFFFFF",
    glow: "rgba(255,255,255,0.04)",
    tint: "rgba(255,255,255,0.035)",
  };
}

function cardTone(rank: number) {
  if (rank === 1) {
    return {
      border: "rgba(255,255,255,0.18)",
      outerGlow: "rgba(255,215,90,0.07)",
    };
  }
  if (rank === 2) {
    return {
      border: "rgba(255,255,255,0.18)",
      outerGlow: "rgba(230,235,245,0.06)",
    };
  }
  if (rank === 3) {
    return {
      border: "rgba(255,255,255,0.18)",
      outerGlow: "rgba(205,127,50,0.055)",
    };
  }
  return {
    border: "rgba(255,255,255,0.14)",
    outerGlow: "rgba(255,255,255,0.035)",
  };
}

function MonoCornerFrame() {
  const color = "rgba(226,232,240,0.72)";
  const glow = "rgba(226,232,240,0.16)";
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-30">
        <div
          className="absolute inset-0 border"
          style={{
            inset: "0.5px",
            borderColor: color,
            borderWidth: 0.6,
            boxShadow: `0 0 10px ${glow}`,
          }}
        />
        <div className="absolute left-0 top-0 h-4 w-4 border-l-[2.5px] border-t-[2.5px]" style={{ borderColor: color }} />
        <div className="absolute right-0 top-0 h-4 w-4 border-r-[2.5px] border-t-[2.5px]" style={{ borderColor: color }} />
        <div className="absolute bottom-0 left-0 h-4 w-4 border-b-[2.5px] border-l-[2.5px]" style={{ borderColor: color }} />
        <div className="absolute bottom-0 right-0 h-4 w-4 border-b-[2.5px] border-r-[2.5px]" style={{ borderColor: color }} />
      </div>
    </>
  );
}

function FadedFlagBg({
  rank,
  countryCode,
}: {
  rank: number;
  countryCode?: string;
}) {
  const m = medal(rank);
  const src = countryCode ? FLAG_SRC[countryCode] : undefined;
  /** 4位以下の一覧行：国旗をわずかに右へ */
  const listRow = rank > 3;

  if (!src) return null;

  return (
    <div
      className={[
        "pointer-events-none absolute inset-y-0 w-[34%] overflow-hidden",
        listRow ? "-right-[0%]" : "-right-[1%]",
      ].join(" ")}
    >
      <div
        className={[
          "absolute inset-y-[2.5%] w-[92%] overflow-hidden rounded-none",
          listRow ? "right-0" : "right-[3%]",
        ].join(" ")}
        style={{
          opacity: listRow ? 0.72 : 0.46,
          boxShadow: listRow
            ? [
                "0 0 12px rgba(255,255,255,0.28)",
                "0 0 26px rgba(170,210,255,0.22)",
                "0 0 44px rgba(120,180,255,0.12)",
                `0 0 20px ${m.glow}`,
              ].join(", ")
            : `0 0 24px ${m.glow}`,
          maskImage:
            "linear-gradient(90deg, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.42) 20%, rgba(0,0,0,0.76) 50%, rgba(0,0,0,0.98) 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.42) 20%, rgba(0,0,0,0.76) 50%, rgba(0,0,0,0.98) 100%)",
        }}
      >
        <img
          src={src}
          alt=""
          className={
            listRow
              ? "h-full w-full object-contain object-right drop-shadow-[0_0_10px_rgba(255,255,255,0.35)]"
              : "h-full w-full object-contain object-right"
          }
          draggable={false}
        />
      </div>
    </div>
  );
}

function ValueText({
  rank,
  metric,
  counted,
  isTop3,
  language,
}: {
  rank: number;
  metric: MobileMetric;
  counted: number;
  isTop3: boolean;
  language: Language;
}) {
  const m = medal(rank);
  const justifyRow = isTop3 ? "justify-center" : "justify-end";

  const baseTextClass =
    rank === 1 ? "text-[32px]" : isTop3 ? "text-[28px]" : "text-[20px]";

  const valueStyle =
    rank <= 3
      ? ({ color: m.text } as const)
      : ({ color: "rgba(255,255,255,0.9)" } as const);

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
        <span className={rank === 1 ? "text-[17px]" : isTop3 ? "text-[15px]" : "text-[11px]"}>
          {streakShortLabel(language)}
        </span>
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
            rank === 1
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
          rank === 1 ? "text-[15px]" : isTop3 ? "text-[13px]" : "text-[9px]",
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
  onCountDone,
  language = "ja",
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  /** ランキング画面からプロフィールへ行くときの戻り用（未指定時は playoffs） */
  rankPhase?: RankingPhase;
  /** プレーオフラウンドタブ（TOTAL / 1ST / …）の戻り用 */
  playoffRound?: PlayoffRoundKey;
  onCountDone?: () => void;
  language?: Language;
}) {
  const isTop3 = rank <= 3;
  const m = medal(rank);
  const tone = cardTone(rank);
  const countryCode = getCountryCode(r);

  const pathname = usePathname() ?? "";
  const base = pathname.startsWith("/mobile") || pathname.startsWith("/m/")
    ? "/mobile"
    : "/web";
  const handleOrUid = r.handle || r.uid;
  const profileHref = profileHrefWithRankingsReturn(pathname, base, handleOrUid, {
    metric,
    phase: rankPhase ?? "playoffs",
    playoffRound,
  });

  const { n: target, d: decimals } = metricNum(r, metric);
  const counted = useRankCountUp(
    target,
    900,
    decimals,
    true,
    rank === 1 ? onCountDone : undefined
  );

  return (
    <Link
      href={profileHref}
      className={["block min-w-0", isTop3 ? "mb-1.5" : "mb-2"].join(" ")}
    >
      <div
        className={[
          "relative overflow-hidden rounded-none border",
          isTop3 ? "min-h-[76px]" : "min-h-[50px]",
        ].join(" ")}
        style={{
          borderColor: tone.border,
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.095) 0%, rgba(255,255,255,0.04) 44%, rgba(8,13,24,0.86) 100%)",
          boxShadow: [
            isTop3
              ? "0 12px 28px rgba(0,0,0,0.22)"
              : "0 6px 14px rgba(0,0,0,0.16)",
            "inset 0 1px 0 rgba(255,255,255,0.22)",
            "inset 0 -1px 0 rgba(255,255,255,0.05)",
            `inset 0 0 0 1px ${tone.border}`,
            `0 0 18px ${tone.outerGlow}`,
          ].join(", "),
        }}
      >
        <MonoCornerFrame />
        <ShellGridOverlay roundedClassName="rounded-none" />
        <FadedFlagBg rank={rank} countryCode={countryCode} />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 18%, rgba(255,255,255,0.03) 38%, rgba(255,255,255,0.02) 100%),
              radial-gradient(120% 90% at 0% 0%, rgba(255,255,255,0.14) 0%, transparent 42%),
              radial-gradient(90% 70% at 100% 100%, ${m.tint} 0%, transparent 48%)
            `,
          }}
        />

        <div
          className="pointer-events-none absolute left-3 right-3 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.75), rgba(255,255,255,0))",
            opacity: 0.55,
          }}
        />

        <div
          className="pointer-events-none absolute -left-[12%] top-0 h-[65%] w-[58%]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.10) 22%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0) 62%)",
            transform: "skewX(-18deg)",
            opacity: 0.38,
          }}
        />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.10) 100%)",
          }}
        />

        <div
          className={[
            "relative z-10 grid min-w-0 items-center gap-2.5 px-2.5",
            isTop3
              ? "grid-cols-[32px_56px_minmax(0,1fr)_84px] py-2.5"
              : "grid-cols-[22px_36px_minmax(0,1fr)_auto] py-2",
          ].join(" ")}
        >
          <div className="flex items-center justify-center">
            <div
              className={[
                "translate-y-px text-center leading-none",
                rankHudNumClass,
                rank === 1 ? "text-[34px]" : rank <= 3 ? "text-[29px]" : "text-[20px]",
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
              boxClassName={isTop3 ? "h-14 w-14" : "h-9 w-9"}
              initialTextClassName={isTop3 ? "text-[22px]" : "text-[15px]"}
              gateReady
            />
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 max-w-full items-center gap-1">
              <div
                className={[
                  "min-w-0 truncate font-black tracking-[0.01em]",
                  jp.className,
                  rank === 1 ? "text-[20px]" : isTop3 ? "text-[17px]" : "text-[13px]",
                ].join(" ")}
                style={{
                  color: "rgba(255,255,255,0.92)",
                  textShadow: "0 2px 12px rgba(0,0,0,0.35)",
                }}
              >
                {r.displayName ?? r.handle ?? "Unknown"}
              </div>
              <RankDeltaBadge delta={r.rankDeltaPlaces} />
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
                isTop3
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
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}