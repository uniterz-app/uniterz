// app/component/result/ResultCard.tsx
"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { Flame, Menu, Pencil, Trash2 } from "lucide-react";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import Jersey from "@/app/component/games/icons/Jersey";
import Soccer from "@/app/component/games/icons/Soccer";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import {
  getTeamPrimaryColor,
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
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
import {
  MOBILE_LIST_CARD_PANEL_DENSE,
  MOBILE_RESULT_CARD_OUTER_CLASS,
} from "@/lib/games/mobileListCardLayout";
import { LiveMatchMark } from "@/app/component/games/LiveMatchMark";
import { ResultLeagueLabelNbaWeb } from "@/app/component/result/ResultLeagueLabelNbaWeb";

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
  /** true かつモバイル表示時のみ、試合一覧 dense の MatchCard に近い枠・密度にする */
  scheduleDense?: boolean;
  /**
   * 一覧が1件だけのとき true。下部の評価バーがビューポート判定で動かないのを避ける
   */
  ratingBarsImmediate?: boolean;
  /** 試合キックオフ前のみ true：右上に一覧から除外する操作を出す */
  showPreKickoffDismiss?: boolean;
  /** 一覧から除外（サーバー削除含む場合あり）。キックオフ後は呼ばれない想定 */
  onPreKickoffDismiss?: () => void | Promise<void>;
  /** 閲覧者 UID（自分の投稿と一致するときのみ右上に予想修正ボタン） */
  viewerUid?: string | null;
  /** 予想画面へのルート接頭辞（例: `/web`） */
  gamesRoutePrefix?: "/web" | "/mobile";
  /** 指定時は「予想を修正」でページ遷移せずコールバック（オーバーレイ等） */
  onRequestPredictEdit?: (post: PredictionPostV2) => void;
  /** キックオフ・LIVE 判定の基準時刻（一覧の定期 tick と揃える） */
  cardClockMs?: number;
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

function ResultCardPresentationImpl({
  post,
  href,
  onOpen,
  language = "ja",
  isMobile,
  onNavigate,
  listDateLabel,
  scheduleDense = false,
  ratingBarsImmediate = false,
  showPreKickoffDismiss = false,
  onPreKickoffDismiss,
  viewerUid = null,
  gamesRoutePrefix,
  onRequestPredictEdit,
  cardClockMs,
}: ResultCardPresentationProps) {
  const clock =
    typeof cardClockMs === "number" && Number.isFinite(cardClockMs)
      ? cardClockMs
      : Date.now();
  const mobileScheduleDense = Boolean(isMobile && scheduleDense);
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
  const homeJerseyColor = useMemo(
    () =>
      getTeamJerseyPrimaryColor(normalizedLeague, post.home?.teamId) ??
      homeColor,
    [normalizedLeague, post.home?.teamId, homeColor]
  );
  const awayJerseyColor = useMemo(
    () =>
      getTeamJerseyPrimaryColor(normalizedLeague, post.away?.teamId) ??
      awayColor,
    [normalizedLeague, post.away?.teamId, awayColor]
  );
  const homeJerseySecondaryColor = useMemo(
    () => getTeamJerseySecondaryColor(normalizedLeague, post.home?.teamId),
    [normalizedLeague, post.home?.teamId]
  );
  const awayJerseySecondaryColor = useMemo(
    () => getTeamJerseySecondaryColor(normalizedLeague, post.away?.teamId),
    [normalizedLeague, post.away?.teamId]
  );

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

  const streakBadge = getStreakBadge(activeWinStreak, isEn);

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

  const nameMt = mobileScheduleDense
    ? "mt-0.5"
    : isMobile
      ? "mt-1"
      : "mt-1.5";
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
  const contentPad = (() => {
    if (!isMobile) return "px-8 pb-5 pt-9";
    if (mobileScheduleDense) {
      // 角のリーグ／HIT バッジ分の上余白（日付ラベルありは2段）
      return listDateLabel ? "px-2 pb-1.5 pt-10" : "px-2 pb-1.5 pt-7";
    }
    return listDateLabel ? "px-2 pb-2 pt-11" : "px-2 pb-2 pt-9";
  })();

  const listPanelClass = mobileScheduleDense
    ? MOBILE_LIST_CARD_PANEL_DENSE
    : MATCH_OVERLAY_GLASS_PANEL;

  /** 試合開始〜確定まで：LIVE 表示（一覧の MatchCard と同趣旨） */
  const isLiveGame =
    post.status !== "final" &&
    (post.status === "live" ||
      (post.status === "scheduled" &&
        typeof post.startAtMillis === "number" &&
        Number.isFinite(post.startAtMillis) &&
        clock >= post.startAtMillis));

  const liveMarkNode = isLiveGame ? (
    <LiveMatchMark
      density={isMobile ? "resultMobile" : "resultDesktop"}
      isEn={isEn}
      className="pointer-events-auto"
    />
  ) : null;

  const isOwnerPredict = Boolean(
    viewerUid && post.authorUid === viewerUid && post.gameId
  );

  const predictEditHref = useMemo(() => {
    if (!isOwnerPredict || !gamesRoutePrefix) return null;
    return `${gamesRoutePrefix}/games/${post.gameId}/predict`;
  }, [isOwnerPredict, gamesRoutePrefix, post.gameId]);

  const hasCornerTrash = Boolean(showPreKickoffDismiss && onPreKickoffDismiss);
  const hasCornerEdit = Boolean(
    isOwnerPredict && (onRequestPredictEdit || (predictEditHref && onNavigate))
  );
  /** 試合開始時点以降は右上メニュー（ハンバーガー）を出さない */
  const isMatchStarted =
    post.status === "live" ||
    post.status === "final" ||
    (post.status === "scheduled" &&
      typeof post.startAtMillis === "number" &&
      Number.isFinite(post.startAtMillis) &&
      clock >= post.startAtMillis);

  const hasCornerActions =
    !isMatchStarted && (hasCornerEdit || hasCornerTrash);

  /** モバイルはホバーが使えないため、ハンバーガーでメニュー開閉 */
  const [cornerFabOpen, setCornerFabOpen] = useState(false);
  const cornerFabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMatchStarted) setCornerFabOpen(false);
  }, [isMatchStarted]);

  useEffect(() => {
    if (!isMobile || !cornerFabOpen) return;
    const onDocPointer = (e: PointerEvent) => {
      const el = cornerFabRef.current;
      if (el && !el.contains(e.target as Node)) setCornerFabOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer, true);
    return () => document.removeEventListener("pointerdown", onDocPointer, true);
  }, [isMobile, cornerFabOpen]);

  /** 下に飛び出すゴミ箱（中央揃え＋縦方向の出現） */
  const flyoutTrashClass = isMobile
    ? cornerFabOpen
      ? "pointer-events-auto visible -translate-x-1/2 translate-y-0 opacity-100"
      : "pointer-events-none invisible -translate-x-1/2 -translate-y-2 opacity-0"
    : "pointer-events-none invisible -translate-x-1/2 -translate-y-2 opacity-0 group-hover:pointer-events-auto group-hover:visible group-hover:-translate-x-1/2 group-hover:translate-y-0 group-hover:opacity-100";

  /** 左へ飛び出すペン（overflow 内に収める）。translate は y 中央揃えと合成 */
  const flyoutPenClass = isMobile
    ? cornerFabOpen
      ? "pointer-events-auto visible -translate-y-1/2 translate-x-0 opacity-100"
      : "pointer-events-none invisible -translate-y-1/2 translate-x-2 opacity-0"
    : "pointer-events-none invisible -translate-y-1/2 translate-x-2 opacity-0 group-hover:pointer-events-auto group-hover:visible group-hover:-translate-y-1/2 group-hover:translate-x-0 group-hover:opacity-100";

  return (
    <div
      onClick={handle}
      className={[
        "relative text-white",
        /* モバイル：飛び出しボタンがカード外にはみ出すため、メニュー展開中だけクリップ解除（タップを受け付ける） */
        isMobile && cornerFabOpen ? "overflow-visible" : "overflow-hidden",
        isMobile
          ? MOBILE_RESULT_CARD_OUTER_CLASS
          : "mx-auto w-full max-w-[1200px]",
        "cursor-pointer select-none",
        listPanelClass,
        frame,
      ].join(" ")}
    >
      {badge === "streak" ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-2xl result-card-streak-sweep"
          aria-hidden
        >
          <div className="result-card-streak-sweep__spin" />
        </div>
      ) : null}
      {badge === "upset" ? (
        <div
          className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-2xl result-card-upset-sweep"
          aria-hidden
        >
          <div className="result-card-upset-sweep__spin" />
        </div>
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      {hasCornerActions ? (
        <div
          ref={cornerFabRef}
          className={[
            /* ホバーでペンへ移る途中でも閉じにくいようホットエリアを広げる（見た目位置は維持） */
            "group pointer-events-auto absolute -m-6 p-6",
            isMobile ? "right-2 top-2 z-[50]" : "right-3 top-3 z-40 sm:right-4 sm:top-4",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={[
              "relative flex items-center justify-center",
              isMobile ? "touch-manipulation" : "",
            ].join(" ")}
          >
            {/* 左に飛び出す：予想修正（ペン） */}
            {hasCornerEdit && predictEditHref ? (
              <button
                type="button"
                className={[
                  "absolute right-full top-1/2 mr-2 flex size-8 items-center justify-center rounded-sm border border-cyan-400/55 bg-black/75 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.22),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-all duration-300 ease-out sm:size-9",
                  isMobile ? "z-[55]" : "z-30",
                  "hover:border-cyan-300/90 hover:bg-cyan-500/12 hover:text-cyan-50 hover:shadow-[0_0_22px_rgba(34,211,238,0.4)]",
                  isMobile ? "touch-manipulation" : "",
                  flyoutPenClass,
                ].join(" ")}
                aria-label={isEn ? "Edit prediction" : "予想を修正"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCornerFabOpen(false);
                  if (onRequestPredictEdit) {
                    onRequestPredictEdit(post);
                  } else if (predictEditHref) {
                    onNavigate?.(predictEditHref);
                  }
                }}
              >
                <Pencil
                  className={isMobile ? "h-3.5 w-3.5" : "h-[15px] w-[15px]"}
                  strokeWidth={2.2}
                  aria-hidden
                />
              </button>
            ) : null}
            {/* 下に飛び出す：一覧から除外（ゴミ箱） */}
            {hasCornerTrash && onPreKickoffDismiss ? (
              <button
                type="button"
                className={[
                  "absolute top-full left-1/2 mt-2 flex size-8 items-center justify-center rounded-sm border border-red-500/50 bg-black/75 text-red-300 shadow-[0_0_14px_rgba(248,113,113,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-300 ease-out sm:size-9",
                  isMobile ? "z-[55]" : "z-30",
                  "hover:border-red-400/85 hover:bg-red-950/45 hover:text-red-100 hover:shadow-[0_0_22px_rgba(239,68,68,0.32)]",
                  isMobile ? "touch-manipulation" : "",
                  flyoutTrashClass,
                ].join(" ")}
                aria-label={isEn ? "Remove from list" : "一覧から除外"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCornerFabOpen(false);
                  void onPreKickoffDismiss();
                }}
              >
                <Trash2
                  className={isMobile ? "h-3.5 w-3.5" : "h-[15px] w-[15px]"}
                  strokeWidth={2.2}
                  aria-hidden
                />
              </button>
            ) : null}
            {/* メイン：ハンバーガー（サイバー角パネル） */}
            <button
              type="button"
              className={[
                "relative flex items-center justify-center rounded-sm border border-cyan-400/50 bg-linear-to-b from-zinc-800/95 to-black/92 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-all duration-300 ease-out",
                isMobile ? "z-[52] size-8 touch-manipulation" : "z-20 size-9",
                "hover:border-cyan-300/90 hover:from-zinc-800 hover:to-zinc-950 hover:text-white hover:shadow-[0_0_26px_rgba(34,211,238,0.42)]",
              ].join(" ")}
              aria-expanded={isMobile ? cornerFabOpen : undefined}
              aria-haspopup="true"
              aria-label={isEn ? "Open actions" : "操作メニュー"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isMobile) setCornerFabOpen((v) => !v);
              }}
            >
              <Menu
                className={isMobile ? "h-2.5 w-2.5" : "h-3.5 w-3.5"}
                strokeWidth={isMobile ? 2 : 2.1}
                aria-hidden
              />
            </button>
          </div>
        </div>
      ) : null}
      {listDateLabel ? (
        <div
          className={[
            "pointer-events-none absolute top-2 z-30 max-w-[78%] truncate text-left",
            isMobile ? "left-2" : "left-8",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block rounded-full border border-cyan-300/35 bg-black/65 font-semibold tracking-wide text-cyan-50/95 shadow-[0_0_6px_rgba(34,211,238,0.08)] backdrop-blur-sm",
              isMobile ? "px-2.5 py-0.5 text-[9px]" : "px-3 py-1 text-[10px]",
            ].join(" ")}
          >
            {listDateLabel}
          </span>
        </div>
      ) : null}
      {/* モバイル：左上にリーグ、右上に HIT 等（日付ラベルあり時はリーグのみ一段下げ） */}
      {isMobile ? (
        <>
          <div
            className={[
              "pointer-events-none absolute top-2 z-20 flex max-w-[min(100%,11rem)] flex-col items-end gap-1.5",
              hasCornerActions ? "right-11" : "right-2",
            ].join(" ")}
          >
            <div className="flex max-w-full flex-row flex-wrap items-start justify-end gap-1">
              {badge === "streak" && streakBadge && (
                <span
                  className={`pointer-events-auto inline-flex max-w-full min-w-0 items-center gap-0.5 rounded-md font-extrabold shadow-md ${mobileStreakBadgeClass} ${streakBadge.className}`}
                >
                  <Flame
                    className={`shrink-0 ${mobileStreakIconClass} ${streakBadge.iconClassName}`}
                  />
                  <span className="min-w-0 truncate text-[9px] leading-tight">
                    {streakBadge.label}
                  </span>
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
              {liveMarkNode}
            </div>
          </div>
          <div
            className={[
              "pointer-events-none absolute left-2 z-20",
              listDateLabel ? "top-10" : "top-2",
            ].join(" ")}
          >
            {normalizedLeague === "nba" ? (
              <span className="pointer-events-auto mt-1 inline-flex shrink-0 items-center">
                <ResultLeagueLabelNbaWeb />
              </span>
            ) : (
              <span
                className="pointer-events-auto inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                style={{ backgroundColor: pillBg, ...teamNameFont }}
              >
                {pillText}
              </span>
            )}
          </div>
        </>
      ) : (
        <div
          className={[
            "pointer-events-none absolute inset-x-0 z-20 flex items-start justify-between gap-1 px-1 sm:px-1.5",
            listDateLabel ? "top-6 pt-0.5 sm:top-7 sm:pt-1" : "top-0 pt-1 sm:pt-1.5",
          ].join(" ")}
        >
          {normalizedLeague === "nba" ? (
            <span className="pointer-events-auto mt-1 inline-flex shrink-0 items-center pt-1 sm:mt-1.5 sm:pt-1.5">
              <ResultLeagueLabelNbaWeb />
            </span>
          ) : (
            <span
              className="pointer-events-auto inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest sm:text-[11px]"
              style={{ backgroundColor: pillBg, ...teamNameFont }}
            >
              {pillText}
            </span>
          )}
          <div
            className={[
              "flex min-w-0 flex-1 flex-col items-end gap-1.5",
              hasCornerActions ? "pr-12 sm:pr-14" : "",
            ].join(" ")}
          >
            <div className="flex flex-row flex-wrap items-start justify-end gap-1">
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
              {liveMarkNode}
            </div>
          </div>
        </div>
      )}

      {/* active:scale は本文のみ（角の除外ボタン押下でカード全体が沈まないよう） */}
      <div
        className={`relative z-10 transition-transform active:scale-[0.98] ${contentPad}`}
      >
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
              ? mobileScheduleDense
                ? "flex min-w-0 flex-col items-stretch pt-0"
                : "flex min-w-0 flex-col items-stretch pt-1.5"
              : "flex min-w-0 flex-col items-center ml-1 translate-x-2 pt-2.5 sm:ml-3 sm:translate-x-2.5 sm:pt-3.5"
          }
        >
          {isMobile ? (
            <>
              <div className="relative flex w-full min-w-0 items-center justify-center">
                {Icon === Jersey ? (
                  <HalftoneJerseyMark
                    accent={homeJerseyColor}
                    accentEnd={homeJerseySecondaryColor}
                    className={
                      mobileScheduleDense
                        ? "jersey-icon ml-1 h-[3.875rem] w-[3.875rem] shrink-0 md:h-20 md:w-20"
                        : "ml-1 h-[4.5rem] w-[4.5rem] shrink-0"
                    }
                  />
                ) : (
                  <Icon
                    className={
                      mobileScheduleDense
                        ? "jersey-icon ml-1 h-16 w-16 shrink-0 md:h-20 md:w-20"
                        : "ml-1 h-16 w-16 shrink-0"
                    }
                    fill={homeColor}
                    stroke="#fff"
                  />
                )}
              </div>
              <div
                className={`${nameMt} w-full max-w-full truncate text-center font-bold leading-tight ${
                  mobileScheduleDense
                    ? "text-[15px] md:text-[18px]"
                    : "text-[13px] md:text-[17px]"
                }`}
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
              {Icon === Jersey ? (
                <HalftoneJerseyMark
                  accent={homeJerseyColor}
                  accentEnd={homeJerseySecondaryColor}
                  className="h-20 w-20"
                />
              ) : (
                <Icon className="h-20 w-20" fill={homeColor} stroke="#fff" />
              )}
              <div
                className={`${nameMt} flex h-[2.65rem] items-center justify-center text-center text-base font-bold leading-tight md:h-[3.1rem] md:text-xl lg:text-2xl`}
                style={teamNameFont}
              >
                <span className="line-clamp-2 break-words">
                  {homeL1} {homeL2}
                </span>
              </div>
            </>
          )}
        </div>

        <div
          className={
            mobileScheduleDense
              ? "mt-0 flex max-w-full shrink-0 flex-col items-center justify-center px-0.5"
              : "mt-2 flex max-w-full shrink-0 flex-col items-center justify-center px-0.5"
          }
        >
          <div
            className={[
              "whitespace-nowrap leading-none tracking-tight tabular-nums font-black text-white/85",
              isMobile
                ? mobileScheduleDense
                  ? "text-xl md:text-4xl"
                  : "text-[clamp(1.32rem,5.4vw,1.78rem)]"
                : "text-2xl md:text-[3.05rem] lg:text-[3.2rem]",
              resultStatsMetricNumClass,
            ].join(" ")}
          >
            {predictedScore}
          </div>

          {finalScore && (
            <div
              className={`mt-1 whitespace-nowrap tabular-nums text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.32)] md:mt-1.5 ${
                isMobile
                  ? "text-[13px] font-bold leading-tight"
                  : "text-base font-bold md:text-lg"
              } ${resultStatsMetricNumClass}`}
            >
              {finalScore}
            </div>
          )}
        </div>

        <div
          className={
            isMobile
              ? mobileScheduleDense
                ? "flex min-w-0 flex-col items-stretch pt-0"
                : "flex min-w-0 flex-col items-stretch pt-1.5"
              : "flex min-w-0 flex-col items-center mr-1 -translate-x-2 pt-2.5 sm:mr-3 sm:-translate-x-2.5 sm:pt-3.5"
          }
        >
          {isMobile ? (
            <>
              <div className="relative flex w-full min-w-0 items-center justify-center">
                {Icon === Jersey ? (
                  <HalftoneJerseyMark
                    accent={awayJerseyColor}
                    accentEnd={awayJerseySecondaryColor}
                    className={
                      mobileScheduleDense
                        ? "jersey-icon mr-1 h-[3.875rem] w-[3.875rem] shrink-0 md:h-20 md:w-20"
                        : "mr-1 h-[4.5rem] w-[4.5rem] shrink-0"
                    }
                  />
                ) : (
                  <Icon
                    className={
                      mobileScheduleDense
                        ? "jersey-icon mr-1 h-16 w-16 shrink-0 md:h-20 md:w-20"
                        : "mr-1 h-16 w-16 shrink-0"
                    }
                    fill={awayColor}
                    stroke="#fff"
                  />
                )}
              </div>
              <div
                className={`${nameMt} w-full max-w-full truncate text-center font-bold leading-tight ${
                  mobileScheduleDense
                    ? "text-[15px] md:text-[18px]"
                    : "text-[13px] md:text-[17px]"
                }`}
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
              {Icon === Jersey ? (
                <HalftoneJerseyMark
                  accent={awayJerseyColor}
                  accentEnd={awayJerseySecondaryColor}
                  className="h-20 w-20"
                />
              ) : (
                <Icon className="h-20 w-20" fill={awayColor} stroke="#fff" />
              )}
              <div
                className={`${nameMt} flex h-[2.65rem] items-center justify-center text-center text-base font-bold leading-tight md:h-[3.1rem] md:text-xl lg:text-2xl`}
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

      <div
        className={
          mobileScheduleDense
            ? "mt-1.5 border-t border-dashed border-white/15"
            : "mt-3 border-t border-dashed border-white/15"
        }
      />

      <div
        className={`${mobileScheduleDense ? "mt-1" : "mt-2"} ${isMobile ? "space-y-0.5" : "space-y-1"}`}
      >
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
                animationActive={
                  ratingBarsImmediate ? true : undefined
                }
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

export const ResultCardPresentation = memo(ResultCardPresentationImpl);
ResultCardPresentation.displayName = "ResultCardPresentation";

export default function ResultCard(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const onNavigate = useCallback(
    (href: string) => {
      void router.push(href);
    },
    [router]
  );
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
      onNavigate={onNavigate}
    />
  );
}