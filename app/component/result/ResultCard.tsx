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
import { Pencil, Trash2 } from "lucide-react";
import CyberMenuButton from "@/app/component/ui/CyberMenuButton";
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
import { t } from "@/lib/i18n/t";
import type { ResultPlatform } from "@/lib/result/result-platform";
import MatchScoreLine from "@/app/component/games/MatchScoreLine";
import ResultOutcomeBadges from "@/app/component/result/ResultOutcomeBadges";
import ResultStatsRows from "@/app/component/result/ResultStatsRows";
import { bracketMarketTeamTypography, wcBracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import { MOBILE_RESULT_CARD_OUTER_CLASS } from "@/lib/games/mobileListCardLayout";
import ResultGlassShell from "@/app/component/result/ResultGlassShell";
import { RESULT_GLASS_CHIP, RESULT_HAIRLINE } from "@/lib/result/resultGlass";
import { resolveResultCardBadge } from "@/lib/result/resultBadge";
import { isResultPostLiveGame, isResultPostMatchStarted } from "@/lib/result/resultLiveGame";
import { useResultCardClockMs } from "@/lib/hooks/useResultCardClockMs";
import ResultLiveMark from "@/app/component/result/ResultLiveMark";
import { ResultLeagueBadge } from "@/app/component/result/ResultLeagueBadge";
import WcGoalScorerResultRow, {
  useWcGoalScorerResult,
} from "@/app/component/result/WcGoalScorerResultRow";
import WcMatchGoalScorersColumn from "@/app/component/result/WcMatchGoalScorersUnderScore";
import { resolveWcMatchGoalScorersForDisplay } from "@/lib/wc/matchGoalScorers";
import { db } from "@/lib/firebase";
import { useWcGroupStandingRanks } from "@/lib/wc/useWcGroupStandingRanks";
import WcTeamFlagWithMeta from "@/app/component/result/WcTeamFlagWithMeta";
import WcGroupStandingRecordLine from "@/app/component/result/WcGroupStandingRecordLine";
import { resolveWcGroupStageLine } from "@/lib/wc/wcGroupStandingRank";
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
  /** 予想オーバーレイ等：一覧遷移なしの埋め込み（リフト・クリック無効） */
  embedded?: boolean;
};

/** Router に繋がない環境（CSS3D の別ルート等）でも同じ UI を出す用 */
export type ResultCardPresentationProps = Props & {
  isMobile: boolean;
  onNavigate?: (href: string) => void;
  /** 3D テーブル配置時など、一覧の日付グループと揃えたラベルを出す */
  listDateLabel?: string;
};

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
  embedded = false,
}: ResultCardPresentationProps) {
  const clock = useResultCardClockMs(cardClockMs);
  const mobileScheduleDense = Boolean(isMobile && scheduleDense);
  const teamNameFont = bracketMarketTeamTypography(isMobile);
  const m = t(language);
  const isEn = language === "en";
  const wcGoalScorer = useWcGoalScorerResult(post);

  const normalizedLeague = normalizeLeague(post.league);
  const isWc = normalizedLeague === "wc";
  const displayTeamNameFont = isWc
    ? wcBracketMarketTeamTypography(isMobile)
    : teamNameFont;

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

  const predictedHome = post.prediction.score.home;
  const predictedAway = post.prediction.score.away;

  const hasFinal =
    typeof post.result?.home === "number" &&
    typeof post.result?.away === "number";
  const finalHome = hasFinal ? post.result!.home : null;
  const finalAway = hasFinal ? post.result!.away : null;

  const wcMatchGoalScorers = useMemo(() => {
    if (!isWc || !hasFinal) return [];
    return resolveWcMatchGoalScorersForDisplay({
      league: normalizedLeague,
      isFinal: hasFinal,
      matchGoalScorersRaw: post.matchGoalScorers,
      homeTeamId: post.home?.teamId,
      awayTeamId: post.away?.teamId,
    });
  }, [isWc, hasFinal, post.matchGoalScorers, post.home?.teamId, post.away?.teamId]);

  const wcGroupRanks = useWcGroupStandingRanks(
    db,
    post.home?.teamId,
    post.away?.teamId
  );
  const wcGroupStageLine = useMemo(
    () =>
      isWc
        ? resolveWcGroupStageLine(
            post.home?.teamId,
            post.away?.teamId,
            language
          )
        : null,
    [isWc, post.home?.teamId, post.away?.teamId, language]
  );

  const handle = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onOpen) {
      onOpen(post, { clientX: e.clientX, clientY: e.clientY });
    } else if (href && onNavigate) {
      onNavigate(href);
    }
  };

  const { badge, activeWinStreak, streakBadge } = resolveResultCardBadge(
    post,
    language
  );

  const nameMt = mobileScheduleDense
    ? "mt-0.5"
    : isMobile
      ? "mt-2"
      : "mt-1.5";
  const hideStatsSection = embedded && post.status !== "final";

  // モバイルはリーグ／ステータスをグリッド内に入れるため、日付バッジ分だけ上余白
  const contentPad = (() => {
    if (!isMobile) {
      return "px-8 pb-5 pt-9";
    }
    if (mobileScheduleDense) {
      return listDateLabel ? "px-2 pb-2.5 pt-10" : "px-2 pb-2.5 pt-8";
    }
    return listDateLabel ? "px-2 pb-4.5 pt-12" : "px-2 pb-4.5 pt-11";
  })();

  const isLiveGame = isResultPostLiveGame(post, clock);

  const liveMarkNode = isLiveGame ? (
    <ResultLiveMark isMobile={isMobile} language={language} />
  ) : null;

  const isOwnerPredict = Boolean(
    viewerUid && post.authorUid === viewerUid && post.gameId
  );

  const predictEditHref = useMemo(() => {
    if (!isOwnerPredict || !gamesRoutePrefix) return null;
    /** 試合確定後は修正 URL を組み立てない（導線は出さない） */
    const finalized =
      post.status === "final" || post.game?.status === "final";
    if (finalized) return null;
    return `${gamesRoutePrefix}/games/${post.gameId}/predict`;
  }, [isOwnerPredict, gamesRoutePrefix, post.gameId, post.status, post.game?.status]);

  const hasCornerTrash = Boolean(showPreKickoffDismiss && onPreKickoffDismiss);
  const hasCornerEdit = Boolean(
    isOwnerPredict && (onRequestPredictEdit || (predictEditHref && onNavigate))
  );
  const isMatchStarted = isResultPostMatchStarted(post, clock);

  const hasCornerActions =
    !isMatchStarted && (hasCornerEdit || hasCornerTrash);

  /** モバイルはホバーが使えないため、ハンバーガーでメニュー開閉 */
  const [cornerFabOpen, setCornerFabOpen] = useState(false);
  const cornerFabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMatchStarted) setCornerFabOpen(false);
  }, [isMatchStarted]);

  useEffect(() => {
    if (!cornerFabOpen) return;
    const onDocPointer = (e: PointerEvent) => {
      const el = cornerFabRef.current;
      if (el && !el.contains(e.target as Node)) setCornerFabOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer, true);
    return () => document.removeEventListener("pointerdown", onDocPointer, true);
  }, [cornerFabOpen]);

  /** タップで開閉。カード hover でもサブメニューを出す */
  const flyoutTrashClass = cornerFabOpen
    ? "pointer-events-auto visible -translate-x-1/2 translate-y-0 opacity-100"
    : "pointer-events-none invisible -translate-x-1/2 -translate-y-2 opacity-0 group-hover/card:pointer-events-auto group-hover/card:visible group-hover/card:-translate-x-1/2 group-hover/card:translate-y-0 group-hover/card:opacity-100";

  const flyoutPenClass = cornerFabOpen
    ? "pointer-events-auto visible -translate-y-1/2 translate-x-0 opacity-100"
    : "pointer-events-none invisible -translate-y-1/2 translate-x-2 opacity-0 group-hover/card:pointer-events-auto group-hover/card:visible group-hover/card:translate-x-0 group-hover/card:opacity-100";

  return (
    <ResultGlassShell
      onClick={embedded ? undefined : handle}
      badge={badge}
      activeWinStreak={activeWinStreak}
      showSweep={false}
      dense={mobileScheduleDense}
      lift={!embedded}
      className={[
        "group/card relative text-white",
        cornerFabOpen ? "overflow-visible" : "",
        embedded
          ? "w-full"
          : isMobile
            ? MOBILE_RESULT_CARD_OUTER_CLASS
            : "mx-auto w-full max-w-[1200px]",
        embedded ? "" : "cursor-pointer select-none",
      ].join(" ")}
      extraPanelClassName={
        cornerFabOpen ? "!overflow-visible" : ""
      }
    >
      {hasCornerActions ? (
        <div
          ref={cornerFabRef}
          className={[
            /* ホバーでペンへ移る途中でも閉じにくいようホットエリアを広げる（見た目位置は維持） */
            "pointer-events-auto absolute",
            isMobile ? "-m-3 p-3 right-0.5 top-0.5 z-[50]" : "-m-5 p-5 right-2 top-2 z-40 sm:right-2.5 sm:top-2.5",
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
                  "absolute right-full top-1/2 mr-1.5 flex -translate-y-1/2 items-center justify-center rounded-md border border-white/20 bg-black/60 text-white/85 shadow-[0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md transition-all duration-300 ease-out",
                  isMobile ? "size-7" : "size-8",
                  isMobile ? "z-[55]" : "z-30",
                  "hover:border-white/40 hover:bg-white/10 hover:text-white",
                  isMobile ? "touch-manipulation" : "",
                  flyoutPenClass,
                ].join(" ")}
                aria-label={m.results.editPredictionAriaLabel}
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
                  className={isMobile ? "h-3 w-3" : "h-[14px] w-[14px]"}
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
                  "absolute top-full left-1/2 mt-1.5 flex items-center justify-center rounded-sm border border-red-500/50 bg-black/75 text-red-300 shadow-[0_0_14px_rgba(248,113,113,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md transition-all duration-300 ease-out",
                  isMobile ? "size-7" : "size-8",
                  isMobile ? "z-[55]" : "z-30",
                  "hover:border-red-400/85 hover:bg-red-950/45 hover:text-red-100 hover:shadow-[0_0_22px_rgba(239,68,68,0.32)]",
                  isMobile ? "touch-manipulation" : "",
                  flyoutTrashClass,
                ].join(" ")}
                aria-label={m.results.removeFromList}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCornerFabOpen(false);
                  void onPreKickoffDismiss();
                }}
              >
                <Trash2
                  className={isMobile ? "h-3 w-3" : "h-[14px] w-[14px]"}
                  strokeWidth={2.2}
                  aria-hidden
                />
              </button>
            ) : null}
            {/* メイン：ハンバーガー（サイバー角パネル） */}
            <CyberMenuButton
              size="xs"
              className={[
                "relative transition-all duration-300 ease-out",
                isMobile ? "z-[52]" : "z-20",
              ].join(" ")}
              aria-expanded={cornerFabOpen}
              aria-haspopup="true"
              aria-label={m.results.openActions}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCornerFabOpen((v) => !v);
              }}
            />
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
              RESULT_GLASS_CHIP,
              "inline-block font-semibold tracking-wide text-white/85",
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
              "pointer-events-none absolute top-1.5 z-20 flex max-w-[min(100%,11rem)] flex-col items-end gap-1.5",
              hasCornerActions ? "right-11" : "right-2",
            ].join(" ")}
          >
            <ResultOutcomeBadges
              badge={badge}
              streakBadge={streakBadge}
              activeWinStreak={activeWinStreak}
              isMobile={isMobile}
              hitBadgeSubtle
              trailing={liveMarkNode}
            />
          </div>
          <div
            className={[
              "pointer-events-none absolute left-2 z-20",
              listDateLabel ? "top-10" : "top-2",
            ].join(" ")}
          >
            <ResultLeagueBadge
              league={normalizedLeague}
              teamNameFont={teamNameFont}
              compact
            />
          </div>
        </>
      ) : (
        <div
          className={[
            "pointer-events-none absolute inset-x-0 z-20 flex items-start justify-between gap-1 px-1 sm:px-1.5",
            listDateLabel ? "top-6 pt-0.5 sm:top-7 sm:pt-1" : "top-0 pt-1 sm:pt-1.5",
          ].join(" ")}
        >
          <ResultLeagueBadge
            league={normalizedLeague}
            teamNameFont={teamNameFont}
          />
          <div
            className={[
              "flex min-w-0 flex-1 flex-col items-end gap-1.5",
              hasCornerActions ? "pr-12 sm:pr-14" : "",
            ].join(" ")}
          >
            <ResultOutcomeBadges
              badge={badge}
              streakBadge={streakBadge}
              activeWinStreak={activeWinStreak}
              isMobile={isMobile}
              hitBadgeSubtle
              trailing={liveMarkNode}
            />
          </div>
        </div>
      )}

      {/* active:scale は本文のみ（角の除外ボタン押下でカード全体が沈まないよう） */}
      <div
        className={`relative z-10 transition-transform active:scale-[0.98] ${contentPad}`}
      >
      <div className="relative">
        <div
          className={`grid grid-cols-2 items-start ${
            isMobile ? "gap-x-1" : "gap-x-4"
          }`}
        >
        <div
          className={
            isMobile
              ? mobileScheduleDense
                ? "flex min-w-0 flex-col items-center pt-0 pr-6 sm:pr-8"
                : "flex min-w-0 flex-col items-center pt-2.5 pr-7 sm:pr-9"
              : "flex min-w-0 flex-col items-center pt-2.5 pr-10 sm:pt-3.5 sm:pr-12"
          }
        >
          {isMobile ? (
            <>
              <div className="relative flex w-full min-w-0 flex-col items-center justify-center">
                {isWc ? (
                  <WcTeamFlagWithMeta
                    teamId={post.home?.teamId}
                    compact={mobileScheduleDense}
                    flagClassName={
                      mobileScheduleDense
                        ? "h-[2.8rem] w-[3.8rem] shrink-0 md:h-[3.5rem] md:w-[4.8rem]"
                        : "h-[3.2rem] w-[4.4rem] shrink-0"
                    }
                  />
                ) : Icon === Jersey ? (
                  <HalftoneJerseyMark
                    accent={homeJerseyColor}
                    accentEnd={homeJerseySecondaryColor}
                    className={
                      mobileScheduleDense
                        ? "jersey-icon h-[3.875rem] w-[3.875rem] shrink-0 md:h-20 md:w-20"
                        : "h-[4.5rem] w-[4.5rem] shrink-0"
                    }
                  />
                ) : (
                  <Icon
                    className={
                      mobileScheduleDense
                        ? "jersey-icon h-16 w-16 shrink-0 md:h-20 md:w-20"
                        : "h-16 w-16 shrink-0"
                    }
                    fill={homeColor}
                    stroke="#fff"
                  />
                )}
              </div>
              <div
                className={`${nameMt} flex w-full justify-center`}
              >
                <span
                  className={`max-w-full truncate text-center font-bold leading-tight ${
                    mobileScheduleDense
                      ? "text-[15px] md:text-[18px]"
                      : "text-[13px] md:text-[17px]"
                  }`}
                  style={displayTeamNameFont}
                >
                  {getMobileTeamName(
                    post.league,
                    post.home?.name ?? "",
                    homeL1,
                    homeL2
                  )}
                </span>
              </div>
              {isWc ? (
                <WcGroupStandingRecordLine
                  standing={wcGroupRanks.homeStanding}
                  language={language}
                  compact={mobileScheduleDense}
                />
              ) : null}
              {wcMatchGoalScorers.length > 0 ? (
                <WcMatchGoalScorersColumn
                  scorers={wcMatchGoalScorers}
                  side="home"
                  compact={isMobile}
                />
              ) : null}
            </>
          ) : (
            <>
              {isWc ? (
                <WcTeamFlagWithMeta
                  teamId={post.home?.teamId}
                  flagClassName="h-[3.5rem] w-[4.8rem]"
                />
              ) : Icon === Jersey ? (
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
                style={displayTeamNameFont}
              >
                <span className="line-clamp-2 break-words">
                  {homeL1} {homeL2}
                </span>
              </div>
              {isWc ? (
                <WcGroupStandingRecordLine
                  standing={wcGroupRanks.homeStanding}
                  language={language}
                />
              ) : null}
              {wcMatchGoalScorers.length > 0 ? (
                <WcMatchGoalScorersColumn
                  scorers={wcMatchGoalScorers}
                  side="home"
                  compact={isMobile}
                />
              ) : null}
            </>
          )}
        </div>

        <div
          className={
            isMobile
              ? mobileScheduleDense
                ? "flex min-w-0 flex-col items-center pt-0 pl-6 sm:pl-8"
                : "flex min-w-0 flex-col items-center pt-2.5 pl-7 sm:pl-9"
              : "flex min-w-0 flex-col items-center pt-2.5 pl-10 sm:pt-3.5 sm:pl-12"
          }
        >
          {isMobile ? (
            <>
              <div className="relative flex w-full min-w-0 flex-col items-center justify-center">
                {isWc ? (
                  <WcTeamFlagWithMeta
                    teamId={post.away?.teamId}
                    compact={mobileScheduleDense}
                    flagClassName={
                      mobileScheduleDense
                        ? "h-[2.8rem] w-[3.8rem] shrink-0 md:h-[3.5rem] md:w-[4.8rem]"
                        : "h-[3.2rem] w-[4.4rem] shrink-0"
                    }
                  />
                ) : Icon === Jersey ? (
                  <HalftoneJerseyMark
                    accent={awayJerseyColor}
                    accentEnd={awayJerseySecondaryColor}
                    className={
                      mobileScheduleDense
                        ? "jersey-icon h-[3.875rem] w-[3.875rem] shrink-0 md:h-20 md:w-20"
                        : "h-[4.5rem] w-[4.5rem] shrink-0"
                    }
                  />
                ) : (
                  <Icon
                    className={
                      mobileScheduleDense
                        ? "jersey-icon h-16 w-16 shrink-0 md:h-20 md:w-20"
                        : "h-16 w-16 shrink-0"
                    }
                    fill={awayColor}
                    stroke="#fff"
                  />
                )}
              </div>
              <div
                className={`${nameMt} flex w-full justify-center`}
              >
                <span
                  className={`max-w-full truncate text-center font-bold leading-tight ${
                    mobileScheduleDense
                      ? "text-[15px] md:text-[18px]"
                      : "text-[13px] md:text-[17px]"
                  }`}
                  style={displayTeamNameFont}
                >
                  {getMobileTeamName(
                    post.league,
                    post.away?.name ?? "",
                    awayL1,
                    awayL2
                  )}
                </span>
              </div>
              {isWc ? (
                <WcGroupStandingRecordLine
                  standing={wcGroupRanks.awayStanding}
                  language={language}
                  compact={mobileScheduleDense}
                />
              ) : null}
              {wcMatchGoalScorers.length > 0 ? (
                <WcMatchGoalScorersColumn
                  scorers={wcMatchGoalScorers}
                  side="away"
                  compact={isMobile}
                />
              ) : null}
            </>
          ) : (
            <>
              {isWc ? (
                <WcTeamFlagWithMeta
                  teamId={post.away?.teamId}
                  flagClassName="h-[3.5rem] w-[4.8rem]"
                />
              ) : Icon === Jersey ? (
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
                style={displayTeamNameFont}
              >
                <span className="line-clamp-2 break-words">
                  {awayL1} {awayL2}
                </span>
              </div>
              {isWc ? (
                <WcGroupStandingRecordLine
                  standing={wcGroupRanks.awayStanding}
                  language={language}
                />
              ) : null}
              {wcMatchGoalScorers.length > 0 ? (
                <WcMatchGoalScorersColumn
                  scorers={wcMatchGoalScorers}
                  side="away"
                  compact={isMobile}
                />
              ) : null}
            </>
          )}
        </div>
        </div>

        <div
          className={[
            "pointer-events-none absolute left-1/2 z-10 flex w-max max-w-[calc(100%-5.25rem)] -translate-x-1/2 flex-col items-center text-center",
            mobileScheduleDense
              ? "top-4"
              : isMobile
                ? "top-5"
                : "top-5 sm:top-6",
          ].join(" ")}
        >
          <MatchScoreLine
            home={predictedHome}
            away={predictedAway}
            className={[
              "leading-none tracking-tight font-black text-white/85",
              isMobile
                ? mobileScheduleDense
                  ? "text-base md:text-4xl"
                  : "text-[clamp(0.9rem,3.4vw,1.2rem)]"
                : "text-2xl md:text-[3.05rem] lg:text-[3.2rem]",
            ].join(" ")}
          />

          {finalHome != null && finalAway != null ? (
            <MatchScoreLine
              home={finalHome}
              away={finalAway}
              className={[
                "mt-1 text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.32)] md:mt-1.5",
                isMobile
                  ? "text-[10px] font-bold leading-tight"
                  : "text-base font-bold md:text-lg",
              ].join(" ")}
            />
          ) : null}

          {wcGroupStageLine ? (
            <div
              className={[
                "mt-1 max-w-full truncate text-center font-medium text-white/50",
                isMobile ? "text-[9px] leading-tight" : "text-[11px] leading-tight",
              ].join(" ")}
            >
              {wcGroupStageLine}
            </div>
          ) : null}
        </div>
      </div>

      {hideStatsSection && !wcGoalScorer ? null : (
        <div
          className={mobileScheduleDense ? "mt-2.5" : isMobile ? "mt-5" : "mt-3"}
          aria-hidden
        >
          <div className={RESULT_HAIRLINE} />
        </div>
      )}

      <div
        className={[
          mobileScheduleDense ? "mt-2" : isMobile ? "mt-3.5" : "mt-2",
          isMobile
            ? mobileScheduleDense
              ? "space-y-2.5"
              : "space-y-3.5"
            : "space-y-1",
        ].join(" ")}
      >
        {wcGoalScorer ? (
          <WcGoalScorerResultRow
            label={m.results.wcGoalScorerLabel}
            info={wcGoalScorer}
            compact={isMobile}
          />
        ) : null}

        {hideStatsSection ? null : (
          <ResultStatsRows
            post={post}
            language={language}
            isMobile={isMobile}
            ratingBarsImmediate={ratingBarsImmediate}
            rowIndexOffset={wcGoalScorer ? 1 : 0}
          />
        )}
      </div>
    </div>
    </ResultGlassShell>
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