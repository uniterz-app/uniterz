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
import { resultCardFlyoutButtonClasses } from "@/lib/ui/cyberMenuButton";
import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import Jersey from "@/app/component/games/icons/Jersey";
import Soccer from "@/app/component/games/icons/Soccer";
import { splitTeamNameByLeague, joinTeamNameLines } from "@/lib/team-name-split";
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
import { RESULT_GLASS_CHIP, RESULT_HAIRLINE, isResultWinFrameBadge } from "@/lib/result/resultGlass";
import { resolveResultCardBadge } from "@/lib/result/resultBadge";
import { isResultPostLiveGame, isResultPostMatchStarted } from "@/lib/result/resultLiveGame";
import { useResultCardClockMs } from "@/lib/hooks/useResultCardClockMs";
import ResultLiveMark from "@/app/component/result/ResultLiveMark";
import { ResultLeagueBadge, shouldShowResultLeagueBadge } from "@/app/component/result/ResultLeagueBadge";
import WcGoalScorerResultRow, {
  useWcGoalScorerResult,
} from "@/app/component/result/WcGoalScorerResultRow";
import WcMatchGoalScorersColumn from "@/app/component/result/WcMatchGoalScorersUnderScore";
import { resolveWcMatchGoalScorersForDisplay } from "@/lib/wc/matchGoalScorers";
import WcTeamFlagWithMeta from "@/app/component/result/WcTeamFlagWithMeta";
import TeamRecordLineFromFirestore from "@/app/component/result/TeamRecordLineFromFirestore";
import { nameBebas } from "@/lib/fonts";
import { resolveWcGroupCodeLabel } from "@/lib/wc/wcGroupStandingRank";
import { resolveWcTeamId } from "@/lib/wc/resolveWcTeamId";
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
  /** 他人プロフィール向け：ガラス blur 等の重い演出を抑える */
  visualEffectsLite?: boolean;
  /** 枠走査光（一覧では false 推奨 — GPU 負荷） */
  showFrameSweep?: boolean;
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
  visualEffectsLite = false,
  showFrameSweep = false,
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

  const wcHomeTeamId = resolveWcTeamId(
    post.home,
    post.game?.home,
    post.home?.name
  );
  const wcAwayTeamId = resolveWcTeamId(
    post.away,
    post.game?.away,
    post.away?.name
  );

  const wcMatchGoalScorers = useMemo(() => {
    if (!isWc || !hasFinal) return [];
    return resolveWcMatchGoalScorersForDisplay({
      league: normalizedLeague,
      isFinal: hasFinal,
      matchGoalScorersRaw: post.matchGoalScorers,
      homeTeamId: wcHomeTeamId,
      awayTeamId: wcAwayTeamId,
    });
  }, [isWc, hasFinal, post.matchGoalScorers, wcHomeTeamId, wcAwayTeamId]);

  const wcGroupCodeLabel = useMemo(
    () =>
      isWc
        ? resolveWcGroupCodeLabel(wcHomeTeamId, wcAwayTeamId)
        : null,
    [isWc, wcHomeTeamId, wcAwayTeamId]
  );

  const handle = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onOpen) {
      onOpen(post, { clientX: e.clientX, clientY: e.clientY });
    } else if (href && onNavigate) {
      onNavigate(href);
    }
  };

  const {
    badge,
    outcomeBadge,
    showStreakBadge,
    stackBadges,
    activeWinStreak,
    streakBadge,
  } = resolveResultCardBadge(post, language);

  const nameMt = mobileScheduleDense
    ? "mt-0.5"
    : isMobile
      ? "mt-2"
      : "mt-1.5";
  /** WC: 国旗幅に合わせて国名・順位を中央揃え（MatchCard と同じ） */
  const wcFlagClassName = mobileScheduleDense
    ? "h-[3rem] w-[4.5rem] shrink-0 md:h-[3.7rem] md:w-[5.5rem]"
    : "h-[3.2rem] w-[4.75rem] shrink-0 md:h-[4.2rem] md:w-[6.25rem]";
  const wcNameWidthClass = mobileScheduleDense
    ? "w-[4.5rem] md:w-[5.5rem]"
    : "w-[4.75rem] md:w-[6.25rem]";
  const wcNameTextClass = mobileScheduleDense
    ? "text-[15px] md:text-[18px]"
    : isMobile
      ? "text-[15px] md:text-[18px]"
      : "text-base md:text-xl lg:text-2xl";
  const wcTeamStackClass = "inline-flex flex-col items-center";
  const homeSideColClass = (() => {
    const base = "flex min-w-0 flex-col items-center";
    if (isWc) {
      if (isMobile) {
        return mobileScheduleDense
          ? `${base} pt-0 pr-6 sm:pr-8`
          : `${base} pt-2.5 pr-7 sm:pr-9`;
      }
      return `${base} pt-2.5 sm:pt-3.5`;
    }
    if (isMobile) {
      return mobileScheduleDense
        ? `${base} pt-0 pr-6 sm:pr-8`
        : `${base} pt-2.5 pr-7 sm:pr-9`;
    }
    return `${base} pt-2.5 pr-10 sm:pt-3.5 sm:pr-12`;
  })();
  const awaySideColClass = (() => {
    const base = "flex min-w-0 flex-col items-center";
    if (isWc) {
      if (isMobile) {
        return mobileScheduleDense
          ? `${base} pt-0 pl-6 sm:pl-8`
          : `${base} pt-2.5 pl-7 sm:pl-9`;
      }
      return `${base} pt-2.5 sm:pt-3.5`;
    }
    if (isMobile) {
      return mobileScheduleDense
        ? `${base} pt-0 pl-6 sm:pl-8`
        : `${base} pt-2.5 pl-7 sm:pl-9`;
    }
    return `${base} pt-2.5 pl-10 sm:pt-3.5 sm:pl-12`;
  })();
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
    return `${gamesRoutePrefix}/games/${post.gameId}/predict?edit=1`;
  }, [isOwnerPredict, gamesRoutePrefix, post.gameId, post.status, post.game?.status]);

  const hasCornerTrash = Boolean(showPreKickoffDismiss && onPreKickoffDismiss);
  const isPredictionFinalized =
    post.status === "final" || post.game?.status === "final";
  const hasCornerEdit = Boolean(
    isOwnerPredict &&
      !isPredictionFinalized &&
      (onRequestPredictEdit || (predictEditHref && onNavigate))
  );
  const isMatchStarted = isResultPostMatchStarted(post, clock);

  const hasCornerActions =
    !isMatchStarted && (hasCornerEdit || hasCornerTrash);

  const showCornerControl = !isMatchStarted && hasCornerActions;

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
      showSweep={
        showFrameSweep &&
        !visualEffectsLite &&
        (badge === "streak" ||
          badge === "upset" ||
          isResultWinFrameBadge(badge))
      }
      dense={mobileScheduleDense}
      lift={!embedded}
      lite={visualEffectsLite}
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
      {showCornerControl ? (
        <div
          ref={cornerFabRef}
          data-capture-skip
          className={[
            /* ホバーでペンへ移る途中でも閉じにくいようホットエリアを広げる（見た目位置は維持） */
            "pointer-events-auto absolute",
            isMobile ? "-m-3 p-3 right-2.5 top-2 z-[50]" : "-m-5 p-5 right-2 top-2 z-40 sm:right-2.5 sm:top-2.5",
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
            {hasCornerEdit ? (
              <button
                type="button"
                className={[
                  "absolute right-full top-1/2 mr-1.5 flex -translate-y-1/2 items-center justify-center transition-all duration-300 ease-out",
                  resultCardFlyoutButtonClasses(isMobile, "edit"),
                  isMobile ? "z-[55]" : "z-30",
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
                  "absolute top-full left-1/2 mt-1.5 flex items-center justify-center transition-all duration-300 ease-out",
                  resultCardFlyoutButtonClasses(isMobile, "delete"),
                  isMobile ? "z-[55]" : "z-30",
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
              showCornerControl ? "right-11" : "right-2",
            ].join(" ")}
          >
            <ResultOutcomeBadges
              badge={badge}
              outcomeBadge={outcomeBadge}
              showStreakBadge={showStreakBadge}
              stackBadges={stackBadges}
              streakBadge={streakBadge}
              activeWinStreak={activeWinStreak}
              isMobile={isMobile}
              hitBadgeSubtle
              trailing={liveMarkNode}
            />
          </div>
          {shouldShowResultLeagueBadge(normalizedLeague) ? (
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
          ) : null}
        </>
      ) : (
        <div
          className={[
            "pointer-events-none absolute inset-x-0 z-20 flex items-start gap-1 px-1 sm:px-1.5",
            shouldShowResultLeagueBadge(normalizedLeague)
              ? "justify-between"
              : "justify-end",
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
              showCornerControl ? "pr-12 sm:pr-14" : "",
            ].join(" ")}
          >
            <ResultOutcomeBadges
              badge={badge}
              outcomeBadge={outcomeBadge}
              showStreakBadge={showStreakBadge}
              stackBadges={stackBadges}
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
        className={[
          `relative z-10 ${contentPad}`,
          visualEffectsLite ? "" : "transition-transform active:scale-[0.98]",
        ].join(" ")}
      >
      <div className="relative">
        <div
          className={`grid grid-cols-2 items-start ${
            isMobile ? "gap-x-1" : "gap-x-4"
          }`}
        >
        <div className={homeSideColClass}>
          {isMobile ? (
            isWc ? (
              <div className={wcTeamStackClass}>
                <WcTeamFlagWithMeta
                  teamId={wcHomeTeamId}
                  compact={mobileScheduleDense}
                  flagClassName={wcFlagClassName}
                />
                <div
                  className={`${nameMt} ${wcNameWidthClass} text-center leading-tight`}
                >
                  <span
                    className={`block max-w-full whitespace-nowrap font-bold ${wcNameTextClass}`}
                    style={displayTeamNameFont}
                  >
                    {joinTeamNameLines(homeL1, homeL2)}
                  </span>
                </div>
                <div className={`${wcNameWidthClass} text-center`}>
                  <TeamRecordLineFromFirestore
                    teamId={wcHomeTeamId}
                    league={normalizedLeague}
                    language={language}
                    compact={mobileScheduleDense || isMobile}
                  />
                </div>
                {wcMatchGoalScorers.length > 0 ? (
                  <WcMatchGoalScorersColumn
                    scorers={wcMatchGoalScorers}
                    side="home"
                    compact={isMobile}
                  />
                ) : null}
              </div>
            ) : (
            <>
              <div className="relative flex w-full min-w-0 flex-col items-center justify-center">
                {Icon === Jersey ? (
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
              <div className={`${nameMt} flex w-full justify-center`}>
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
            </>
            )
          ) : isWc ? (
              <div className={wcTeamStackClass}>
                <WcTeamFlagWithMeta
                  teamId={wcHomeTeamId}
                  flagClassName={wcFlagClassName}
                />
                <div
                  className={`${nameMt} ${wcNameWidthClass} text-center leading-tight`}
                >
                  <span
                    className={`block whitespace-nowrap font-bold ${wcNameTextClass}`}
                    style={displayTeamNameFont}
                  >
                    {joinTeamNameLines(homeL1, homeL2)}
                  </span>
                </div>
                <div className={`${wcNameWidthClass} text-center`}>
                  <TeamRecordLineFromFirestore
                    teamId={wcHomeTeamId}
                    league={normalizedLeague}
                    language={language}
                  />
                </div>
                {wcMatchGoalScorers.length > 0 ? (
                  <WcMatchGoalScorersColumn
                    scorers={wcMatchGoalScorers}
                    side="home"
                    compact={isMobile}
                  />
                ) : null}
              </div>
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
                style={displayTeamNameFont}
              >
                <span className="line-clamp-2 break-words">
                  {homeL1} {homeL2}
                </span>
              </div>
            </>
          )}
        </div>

        <div className={awaySideColClass}>
          {isMobile ? (
            isWc ? (
              <div className={wcTeamStackClass}>
                <WcTeamFlagWithMeta
                  teamId={wcAwayTeamId}
                  compact={mobileScheduleDense}
                  flagClassName={wcFlagClassName}
                />
                <div
                  className={`${nameMt} ${wcNameWidthClass} text-center leading-tight`}
                >
                  <span
                    className={`block max-w-full whitespace-nowrap font-bold ${wcNameTextClass}`}
                    style={displayTeamNameFont}
                  >
                    {joinTeamNameLines(awayL1, awayL2)}
                  </span>
                </div>
                <div className={`${wcNameWidthClass} text-center`}>
                  <TeamRecordLineFromFirestore
                    teamId={wcAwayTeamId}
                    league={normalizedLeague}
                    language={language}
                    compact={mobileScheduleDense || isMobile}
                  />
                </div>
                {wcMatchGoalScorers.length > 0 ? (
                  <WcMatchGoalScorersColumn
                    scorers={wcMatchGoalScorers}
                    side="away"
                    compact={isMobile}
                  />
                ) : null}
              </div>
            ) : (
            <>
              <div className="relative flex w-full min-w-0 flex-col items-center justify-center">
                {Icon === Jersey ? (
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
              <div className={`${nameMt} flex w-full justify-center`}>
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
            </>
            )
          ) : isWc ? (
              <div className={wcTeamStackClass}>
                <WcTeamFlagWithMeta
                  teamId={wcAwayTeamId}
                  flagClassName={wcFlagClassName}
                />
                <div
                  className={`${nameMt} ${wcNameWidthClass} text-center leading-tight`}
                >
                  <span
                    className={`block whitespace-nowrap font-bold ${wcNameTextClass}`}
                    style={displayTeamNameFont}
                  >
                    {joinTeamNameLines(awayL1, awayL2)}
                  </span>
                </div>
                <div className={`${wcNameWidthClass} text-center`}>
                  <TeamRecordLineFromFirestore
                    teamId={wcAwayTeamId}
                    league={normalizedLeague}
                    language={language}
                  />
                </div>
                {wcMatchGoalScorers.length > 0 ? (
                  <WcMatchGoalScorersColumn
                    scorers={wcMatchGoalScorers}
                    side="away"
                    compact={isMobile}
                  />
                ) : null}
              </div>
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
                style={displayTeamNameFont}
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
          className={[
            "pointer-events-none absolute left-1/2 z-10 flex w-max max-w-[calc(100%-7.25rem)] -translate-x-1/2 flex-col items-center text-center",
            mobileScheduleDense
              ? "top-4"
              : isMobile
                ? "top-5"
                : "top-5 sm:top-6",
          ].join(" ")}
        >
          {wcGroupCodeLabel ? (
            <span
              className={[
                nameBebas.className,
                "mb-1.5 max-w-full truncate text-center font-black uppercase tracking-[0.24em] text-white",
                isMobile
                  ? mobileScheduleDense
                    ? "text-[17px] leading-none"
                    : "text-[18px] leading-none"
                  : "text-xl leading-none md:text-2xl",
              ].join(" ")}
            >
              {wcGroupCodeLabel}
            </span>
          ) : null}
          <MatchScoreLine
            home={predictedHome}
            away={predictedAway}
            className={[
              "leading-none tracking-tight font-black text-white/85",
              isMobile
                ? mobileScheduleDense
                  ? normalizedLeague === "nba" || normalizedLeague === "bj"
                    ? "text-xl md:text-2xl"
                    : "text-3xl md:text-4xl"
                  : "text-[clamp(1.5rem,6.5vw,1.875rem)]"
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
            animationsOff={visualEffectsLite}
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
  const { platform, ...rest } = props;
  return (
    <ResultCardPresentation
      {...rest}
      platform={platform}
      isMobile={isMobile}
      onNavigate={onNavigate}
    />
  );
}