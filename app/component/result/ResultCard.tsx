// app/component/result/ResultCard.tsx
"use client";

import React, { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import Jersey from "@/app/component/games/icons/Jersey";
import Soccer from "@/app/component/games/icons/Soccer";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import { getTeamAlias } from "@/lib/team-alias";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { Language } from "@/lib/i18n/language";
import type { ResultPlatform } from "@/lib/result/result-platform";
import ResultStatRatingBar from "@/app/component/result/ResultStatRatingBar";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { MATCH_OVERLAY_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function toNumber(v: unknown, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export type ResultCardOpenAnchor = { clientX: number; clientY: number };

type Props = {
  post: PredictionPostV2;
  href?: string;
  /** 一覧オーバーレイ用：タップ位置付近に詳細を出すため座標を渡す */
  onOpen?: (post: PredictionPostV2, anchor: ResultCardOpenAnchor) => void;
  language?: Language;
  /** 指定時は pathname ではなくこれでモバイル表示を決める（リザルトのルート固定用） */
  platform?: ResultPlatform;
};

/** Router に繋がない環境（CSS3D の別ルート等）でも同じ UI を出す用 */
export type ResultCardPresentationProps = Props & {
  isMobile: boolean;
  onNavigate?: (href: string) => void;
  /** 3D テーブル配置時など、一覧の日付グループと揃えたラベルを出す */
  listDateLabel?: string;
};

const leaguePillBg: Record<string, string> = {
  nba: "#1D428A",
  bj: "#C8102E",
  pl: "#3A0CA3",
  j1: "#E10600",
};

const leagueLabel: Record<string, string> = {
  nba: "NBA",
  bj: "B1",
  pl: "PL",
  j1: "J1",
};

function toInt(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.round(v) : null;
}

function isYellow10pt(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v >= 7;
}

function isRedUpset(v: unknown): boolean {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

function getStreakBadge(
  activeWinStreak: unknown,
  isEn: boolean
): {
  label: string;
  className: string;
  iconClassName: string;
} | null {
  const v =
    typeof activeWinStreak === "number" && Number.isFinite(activeWinStreak)
      ? Math.floor(activeWinStreak)
      : 0;

  if (v < 3) return null;

  if (v >= 7) {
    return {
      label: isEn ? `${v} Win Streak` : `${v}連勝`,
      className:
        "bg-linear-to-r from-red-600 via-red-500 to-orange-500 text-white border border-red-300/70 shadow-[0_0_18px_rgba(239,68,68,0.5)]",
      iconClassName: "text-yellow-200",
    };
  }

  if (v >= 5) {
    return {
      label: isEn ? `${v} Win Streak` : `${v}連勝`,
      className:
        "bg-linear-to-r from-orange-500 via-amber-500 to-red-500 text-white border border-orange-200/70 shadow-[0_0_16px_rgba(249,115,22,0.42)]",
      iconClassName: "text-yellow-100",
    };
  }

  return {
    label: isEn ? `${v} Win Streak` : `${v}連勝`,
    className:
      "bg-linear-to-r from-yellow-300 via-amber-300 to-orange-400 text-black border border-yellow-100/80 shadow-[0_0_14px_rgba(250,204,21,0.38)]",
    iconClassName: "text-red-500",
  };
}

/** Mobile用: 文字白・視認性重視・3/5/7で色階層 */
function getStreakBadgeForMobile(
  activeWinStreak: unknown,
  isEn: boolean
): {
  label: string;
  className: string;
  iconClassName: string;
} | null {
  const v =
    typeof activeWinStreak === "number" && Number.isFinite(activeWinStreak)
      ? Math.floor(activeWinStreak)
      : 0;

  if (v < 3) return null;

  if (v >= 7) {
    return {
      label: isEn ? `${v} Win Streak` : `${v}連勝`,
      className:
        "bg-linear-to-r from-[#180f2b] via-[#312e81] to-[#0f172a] text-white border border-violet-400/60 shadow-[0_0_14px_rgba(167,139,250,0.5)]",
      iconClassName: "text-white/90",
    };
  }

  if (v >= 5) {
    return {
      label: isEn ? `${v} Win Streak` : `${v}連勝`,
      className:
        "bg-linear-to-r from-[#0a1628] via-[#0e7490] to-[#052e2b] text-white border border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.45)]",
      iconClassName: "text-white/90",
    };
  }

  return {
    label: isEn ? `${v} Win Streak` : `${v}連勝`,
    className:
      "bg-linear-to-r from-[#0b1f1a] via-[#166534] to-[#0f172a] text-white border border-emerald-400/60 shadow-[0_0_10px_rgba(52,211,153,0.4)]",
    iconClassName: "text-white/90",
  };
}

export function ResultCardPresentation({
  post,
  href,
  onOpen,
  language = "ja",
  isMobile,
  onNavigate,
  listDateLabel,
}: ResultCardPresentationProps) {
  const teamNameFont = bracketMarketTeamTypography(isMobile);
  const isEn = language === "en";
  const hadUpsetGame = Boolean((post.stats as any)?.hadUpsetGame);

  const normalizedLeague = normalizeLeague(post.league);

  const Icon =
    normalizedLeague === "nba" || normalizedLeague === "bj" ? Jersey : Soccer;

  const homeColor =
    getTeamPrimaryColor(normalizedLeague, post.home?.teamId) ?? "#0ea5e9";
  const awayColor =
    getTeamPrimaryColor(normalizedLeague, post.away?.teamId) ?? "#f43f5e";

  const [homeL1, homeL2] = splitTeamNameByLeague(
    post.league,
    post.home?.name ?? ""
  );
  const [awayL1, awayL2] = splitTeamNameByLeague(
    post.league,
    post.away?.name ?? ""
  );

  function getMobileTeamName(
    league: string,
    rawName: string,
    l1: string,
    l2?: string
  ) {
    if (league === "nba") return l2 || rawName;
    if (league === "pl") return getTeamAlias(rawName) ?? rawName;
    return [l1, l2].filter(Boolean).join(" ");
  }

  const predictedScore = `${post.prediction.score.home} - ${post.prediction.score.away}`;

  const hasFinal =
    typeof post.result?.home === "number" &&
    typeof post.result?.away === "number";
  const finalScore = hasFinal
    ? `${post.result!.home} - ${post.result!.away}`
    : null;

  const handle = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onOpen) {
      onOpen(post, { clientX: e.clientX, clientY: e.clientY });
    } else if (href && onNavigate) {
      onNavigate(href);
    }
  };

  const pillBg = leaguePillBg[normalizedLeague] ?? "#334155";
  const pillText =
    leagueLabel[normalizedLeague] ?? normalizedLeague.toUpperCase();

  const activeWinStreak = toInt(
    (post.stats as any)?.pointsV3Detail?.activeWinStreak
  ) ?? 0;

  const streakBadge = isMobile
    ? getStreakBadgeForMobile(activeWinStreak, isEn)
    : getStreakBadge(activeWinStreak, isEn);

  const scorePrecisionValueClass = isYellow10pt(post.stats?.scorePrecision)
    ? "text-yellow-300"
    : "text-white";
  const pointsV3ValueClass = isYellow10pt((post.stats as any)?.pointsV3)
    ? "text-yellow-300"
    : "text-white";
  const upsetValueClass = hadUpsetGame && isRedUpset((post.stats as any)?.upsetPoints)
    ? "text-red-400"
    : "text-white";

  let badge: "hit" | "upset" | "miss" | "streak" | null = null;
  if (post.stats?.upsetHit) badge = "upset";
  else if (streakBadge) badge = "streak";
  else if (post.stats?.isWin) badge = "hit";
  else if (post.stats && post.stats.isWin === false) badge = "miss";

  let frame = "";
  if (badge === "upset") {
    frame =
      "border border-red-700 ring-4 ring-red-700/90 shadow-[0_0_28px_rgba(220,38,38,0.75)]";
  } else if (badge === "streak") {
    if (activeWinStreak >= 7) {
      frame =
        "border border-red-400 ring-2 ring-red-400/70 shadow-[0_0_22px_rgba(239,68,68,0.45)]";
    } else if (activeWinStreak >= 5) {
      frame =
        "border border-orange-300 ring-2 ring-orange-300/60 shadow-[0_0_18px_rgba(249,115,22,0.38)]";
    } else {
      frame =
        "border border-yellow-300 ring-1 ring-yellow-300/60 shadow-[0_0_16px_rgba(250,204,21,0.32)]";
    }
  } else if (badge === "hit") {
    frame =
      "border border-yellow-400 ring-1 ring-yellow-400/70 shadow-[0_0_14px_rgba(250,204,21,0.45)]";
  } else if (badge === "miss") {
    frame = "border border-gray-500/60 shadow-[0_0_14px_rgba(107,114,128,0.35)]";
  }

  const nameMt = isMobile ? "mt-1" : "mt-1.5";
  const mobileBadgeClass = isMobile
    ? "text-[10px] px-1.5 py-0.5"
    : "text-[11px] px-2 py-0.5";
  const mobileStreakBadgeClass = isMobile
    ? "text-[9px] px-1.5 py-0.5 gap-1"
    : "text-[11px] px-2.5 py-0.5 gap-1.5";
  const mobileStreakIconClass = isMobile ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  const statRows = useMemo(() => {
    const scorePrecision = toNumber(post.stats?.scorePrecision, 0);
    const upsetPoints = toNumber((post.stats as any)?.upsetPoints, 0);
    const pointsV3 = toNumber((post.stats as any)?.pointsV3, 0);

    return [
      {
        key: "scorePrecision" as const,
        label: isEn ? "Score Precision" : "スコア精度",
        value: scorePrecision,
        barMax: 10,
        format: (v: number) => v.toFixed(1),
      },
      {
        key: "upsetPoints" as const,
        label: isEn ? "Upset Score" : "Upsetスコア",
        value: upsetPoints,
        barMax: 10,
        format: (v: number) =>
          hadUpsetGame ? `${(Math.round(v * 10) / 10).toFixed(1)}` : "--",
      },
      {
        key: "pointsV3" as const,
        label: isEn ? "Total Score" : "総合スコア",
        value: pointsV3,
        barMax: 10,
        format: (v: number) =>
          `${(Math.round(v * 10) / 10).toFixed(1)}`,
      },
    ];
  }, [post.stats, isEn, hadUpsetGame]);

  const barAnimateMs = isMobile ? 480 : 520;
  const barStaggerMs = isMobile ? 80 : 90;

  // モバイルはリーグ／ステータスをグリッド内に入れるため、日付バッジ分だけ上余白
  const contentPad = isMobile
    ? listDateLabel
      ? "px-4 pb-3 pt-7"
      : "px-4 pb-3 pt-4"
    : "px-8 pb-6 pt-10";

  return (
    <div
      onClick={handle}
      className={[
        "group relative max-w-[1200px] mx-auto w-full overflow-hidden text-white",
        "active:scale-[0.98] transition-transform cursor-pointer select-none",
        MATCH_OVERLAY_GLASS_PANEL,
        frame,
      ].join(" ")}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      {listDateLabel ? (
        <div
          className={[
            "pointer-events-none absolute top-2 z-30 max-w-[78%] truncate text-left",
            isMobile ? "left-4" : "left-8",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block rounded-full border border-cyan-300/40 bg-black/65 font-semibold tracking-wide text-cyan-50/95 shadow-[0_0_12px_rgba(34,211,238,0.15)] backdrop-blur-sm",
              isMobile ? "px-2.5 py-0.5 text-[9px]" : "px-3 py-1 text-[10px]",
            ].join(" ")}
          >
            {listDateLabel}
          </span>
        </div>
      ) : null}
      {/* デスクトップ：上部にリーグ＋ステータス。モバイルはユニ横に配置 */}
      {!isMobile && (
        <div
          className={[
            "pointer-events-none absolute inset-x-0 z-20 flex items-start justify-between gap-2 px-2 sm:px-3",
            listDateLabel ? "top-7 pt-1 sm:top-8 sm:pt-1.5" : "top-0 pt-2 sm:pt-2.5",
          ].join(" ")}
        >
          <span
            className="pointer-events-auto inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest sm:text-[11px]"
            style={{ backgroundColor: pillBg, ...teamNameFont }}
          >
            {pillText}
          </span>
          <div className="flex min-w-0 flex-1 justify-end">
            {badge === "streak" && streakBadge && (
              <span
                className={`pointer-events-auto inline-flex max-w-full items-center rounded-md font-extrabold shadow-md ${mobileStreakBadgeClass} ${streakBadge.className}`}
              >
                <Flame
                  className={`shrink-0 ${mobileStreakIconClass} ${streakBadge.iconClassName}`}
                />
                <span className="min-w-0 truncate">{streakBadge.label}</span>
              </span>
            )}
            {badge === "hit" && (
              <span
                className={`pointer-events-auto shrink-0 rounded-md bg-yellow-400 text-black font-extrabold shadow-md ${mobileBadgeClass}`}
              >
                HIT
              </span>
            )}
            {badge === "upset" && (
              <span
                className={`pointer-events-auto shrink-0 rounded-md bg-red-500 font-extrabold text-white shadow-md ${mobileBadgeClass}`}
              >
                UPSET
              </span>
            )}
            {badge === "miss" && (
              <span
                className={`pointer-events-auto shrink-0 rounded-md bg-gray-500 font-extrabold text-white shadow-md ${mobileBadgeClass}`}
              >
                MISS
              </span>
            )}
          </div>
        </div>
      )}

      <div className={`relative z-10 ${contentPad}`}>
      <div
        className={`grid items-center ${
          isMobile
            ? "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-1.5"
            : "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-8"
        }`}
      >
        <div
          className={
            isMobile
              ? "flex min-w-0 flex-col items-stretch"
              : "flex min-w-0 flex-col items-center ml-1 sm:ml-3"
          }
        >
          {isMobile ? (
            <>
              <div className="relative flex w-full min-w-0 items-center justify-center">
                <span
                  className="pointer-events-auto absolute -left-1 inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: pillBg, ...teamNameFont }}
                >
                  {pillText}
                </span>
                <Icon
                  className="h-10 w-10 shrink-0"
                  fill={homeColor}
                  stroke="#fff"
                />
              </div>
              <div
                className={`${nameMt} w-full max-w-full truncate text-center text-[13px] font-bold leading-tight md:text-[17px]`}
                style={teamNameFont}
              >
                {getMobileTeamName(
                  post.league,
                  post.home?.name ?? "",
                  homeL1,
                  homeL2
                )}
              </div>
            </>
          ) : (
            <>
              <Icon
                className="h-14 w-14"
                fill={homeColor}
                stroke="#fff"
              />
              <div
                className={`${nameMt} flex h-[2.9rem] items-center justify-center text-center text-base font-bold leading-tight md:h-[3.4rem] md:text-xl lg:text-2xl`}
                style={teamNameFont}
              >
                <span className="line-clamp-2 break-words">
                  {homeL1} {homeL2}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex max-w-full shrink-0 flex-col items-center justify-center px-0.5">
          <div
            className={[
              "whitespace-nowrap leading-none tracking-tight tabular-nums font-black",
              isMobile
                ? "text-[clamp(1.2rem,5vw,1.6rem)]"
                : "text-xl md:text-5xl",
              resultStatsMetricNumClass,
            ].join(" ")}
          >
            {predictedScore}
          </div>

          {finalScore && (
            <div
              className={`mt-1.5 whitespace-nowrap tabular-nums opacity-85 md:mt-2 ${
                isMobile
                  ? "text-xs font-bold leading-tight"
                  : "text-sm font-bold md:text-base"
              } ${resultStatsMetricNumClass}`}
            >
              {finalScore}
            </div>
          )}
        </div>

        <div
          className={
            isMobile
              ? "flex min-w-0 flex-col items-stretch"
              : "flex min-w-0 flex-col items-center mr-1 sm:mr-3"
          }
        >
          {isMobile ? (
            <>
              <div className="relative flex w-full min-w-0 items-center justify-center">
                <Icon
                  className="h-10 w-10 shrink-0"
                  fill={awayColor}
                  stroke="#fff"
                />
                {badge === "streak" && streakBadge && (
                  <span
                    className={`pointer-events-auto absolute -right-1 inline-flex max-w-[min(100%,7rem)] min-w-0 items-center gap-0.5 rounded-md font-extrabold shadow-md ${mobileStreakBadgeClass} ${streakBadge.className}`}
                  >
                    <Flame
                      className={`h-2 w-2 shrink-0 ${streakBadge.iconClassName}`}
                    />
                    <span className="min-w-0 truncate text-[9px] leading-tight">
                      {streakBadge.label}
                    </span>
                  </span>
                )}
                {badge === "hit" && (
                  <span
                    className={`pointer-events-auto absolute -right-1 shrink-0 rounded-md bg-yellow-400 text-black font-extrabold shadow-md ${mobileBadgeClass}`}
                  >
                    HIT
                  </span>
                )}
                {badge === "upset" && (
                  <span
                    className={`pointer-events-auto absolute -right-1 shrink-0 rounded-md bg-red-500 font-extrabold text-white shadow-md ${mobileBadgeClass}`}
                  >
                    UPSET
                  </span>
                )}
                {badge === "miss" && (
                  <span
                    className={`pointer-events-auto absolute -right-1 shrink-0 rounded-md bg-gray-500 font-extrabold text-white shadow-md ${mobileBadgeClass}`}
                  >
                    MISS
                  </span>
                )}
              </div>
              <div
                className={`${nameMt} w-full max-w-full truncate text-center text-[13px] font-bold leading-tight md:text-[17px]`}
                style={teamNameFont}
              >
                {getMobileTeamName(
                  post.league,
                  post.away?.name ?? "",
                  awayL1,
                  awayL2
                )}
              </div>
            </>
          ) : (
            <>
              <Icon
                className="h-14 w-14"
                fill={awayColor}
                stroke="#fff"
              />
              <div
                className={`${nameMt} flex h-[2.9rem] items-center justify-center text-center text-base font-bold leading-tight md:h-[3.4rem] md:text-xl lg:text-2xl`}
                style={teamNameFont}
              >
                <span className="line-clamp-2 break-words">
                  {awayL1} {awayL2}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-dashed border-white/15" />

      <div className={`mt-2.5 ${isMobile ? "space-y-0.5" : "space-y-1"}`}>
        {statRows.map((r, index) => {
          const cap = r.barMax;
          const ratio =
            r.key === "upsetPoints" && !hadUpsetGame
              ? 0
              : cap > 0
                ? clamp01(r.value / cap)
                : 0;
          const display = r.format(r.value);

          const valueClass =
            r.key === "scorePrecision"
              ? scorePrecisionValueClass
              : r.key === "upsetPoints"
                ? upsetValueClass
                : pointsV3ValueClass;

          return (
            <div
              key={r.key}
              className={
                isMobile
                  ? "flex items-center gap-2"
                  : "flex items-center gap-2.5 sm:gap-3"
              }
            >
              <div
                className={
                  isMobile
                    ? "w-26 min-w-0 shrink-0"
                    : "flex w-29 min-w-0 shrink-0 sm:w-31"
                }
              >
                <span
                  className={
                    isMobile
                      ? "truncate text-[11px] font-semibold leading-tight text-white"
                      : "truncate text-[12px] font-semibold text-white sm:text-[13px]"
                  }
                >
                  {r.label}
                </span>
              </div>

              <ResultStatRatingBar
                ratio={ratio}
                animateMs={barAnimateMs}
                delayMs={index * barStaggerMs}
                size={isMobile ? "sm" : "md"}
              />

              <div
                className={
                  isMobile
                    ? `w-10 shrink-0 text-right text-[11px] ${resultStatsMetricNumClass}`
                    : `w-11 shrink-0 text-right text-[12px] text-white sm:w-12 sm:text-[13px] ${resultStatsMetricNumClass}`
                }
              >
                <span className={valueClass}>{display}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}

export default function ResultCard(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile =
    props.platform !== undefined
      ? props.platform === "mobile"
      : pathname?.startsWith("/mobile") || pathname?.startsWith("/m/");
  const { platform: _p, ...rest } = props;
  void _p;
  return (
    <ResultCardPresentation
      {...rest}
      isMobile={isMobile}
      onNavigate={(href) => router.push(href)}
    />
  );
}