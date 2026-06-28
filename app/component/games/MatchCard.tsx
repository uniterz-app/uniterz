// app/component/games/MatchCard.tsx
"use client";


import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import Jersey from "@/app/component/games/icons/Jersey";
import {
  joinTeamNameLines,
  splitWcCountryNameForMobileList,
  splitTeamNameByLeague,
} from "@/lib/team-name-split";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Pencil, X } from "lucide-react";
import {
  predictOverlayCornerAnchorClass,
  predictOverlayCornerButtonClasses,
} from "@/lib/ui/cyberMenuButton";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { resolveResultCardBadge } from "@/lib/result/resultBadge";
import {
  RESULT_HAIRLINE,
  withResultHitCyberClip,
  resultBadgeAccent,
  isResultWinFrameBadge,
  isResultHitFrameBadge,
  isResultPerfectFrameBadge,
  isResultStreakFrameBadge,
  isResultUpsetFrameBadge,
  isResultCyberClipFrameBadge,
} from "@/lib/result/resultGlass";
import { formatTeamRecordWithRank } from "@/lib/teamRecordDisplay";
import ResultHitCyberFrame from "@/app/component/result/ResultHitCyberFrame";
import ResultPerfectCyberFrame from "@/app/component/result/ResultPerfectCyberFrame";
import ResultStreakCyberFrame from "@/app/component/result/ResultStreakCyberFrame";
import ResultUpsetCyberFrame from "@/app/component/result/ResultUpsetCyberFrame";
import ResultOutcomeBadges from "@/app/component/result/ResultOutcomeBadges";
import ResultStatsRows from "@/app/component/result/ResultStatsRows";
import WcGoalScorerResultRow, {
  useWcGoalScorerResult,
} from "@/app/component/result/WcGoalScorerResultRow";
import React from "react";
import Soccer from "@/app/component/games/icons/Soccer";
import { motion, useReducedMotion } from "framer-motion";
import {
  GAMES_CYBER_EASE,
  GAMES_CYBER_ENTRY_DURATION_MS,
  GAMES_CYBER_ENTRY_DURATION_SEC,
  GAMES_CYBER_GROUP_GAP_SEC,
  GAMES_CYBER_LEAD_IN_SEC,
  GAMES_LIST_CARDS_LEAD_IN_SEC,
} from "./cyberMotion";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { resolveWcTeamId } from "@/lib/wc/resolveWcTeamId";
import WcTeamFlagWithMeta from "@/app/component/result/WcTeamFlagWithMeta";
import WcGroupStandingRecordLine from "@/app/component/result/WcGroupStandingRecordLine";
import { resolveWcGroupStageStandingForKnockoutDisplay } from "@/lib/wc/wcGroupStandingRank";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import type { Language } from "@/lib/i18n/language";
import { TIMEZONE_ET, TIMEZONE_JST } from "@/lib/time/zonedTime";
import { t } from "@/lib/i18n/t";
import type { WcGameGoalScorer } from "@/lib/wc/goalScorer";

import type { League } from "@/lib/leagues";
import {
  getTeamPrimaryColor,
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
} from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import { auth } from "@/lib/firebase";
import EventPill from "@/app/component/common/EventPill";
import { getGameEventTag } from "@/lib/events/eventRules";
import MatchScoreLine from "@/app/component/games/MatchScoreLine";
import {
  matchVsLabelClass,
  nameOxanium,
  resultStatsMetricNumClass,
} from "@/lib/fonts";
import MatchCardOverlayMarketBar from "@/app/component/games/MatchCardOverlayMarketBar";
import MatchListCyberDecor from "@/app/component/games/MatchListCyberDecor";
import PredictOverlayCyberDecor from "@/app/component/predict/PredictOverlayCyberDecor";
import { MATCH_LIST_CYBER_CTA_CLASS } from "@/lib/ui/matchListCardCyber";
import {
  PREDICT_OVERLAY_CYBER_GRID_CLASS,
} from "@/lib/ui/predictOverlayCyber";
import {
  bracketMarketTeamTypography,
  wcBracketMarketTeamTypography,
} from "@/lib/games/teamDisplayTypography";
import {
  MOBILE_LIST_CARD_OUTER_CLASS,
  MOBILE_LIST_CARD_PANEL_DENSE,
  MOBILE_PREDICT_OVERLAY_CARD_OUTER_CLASS,
  WEB_LIST_CARD_PANEL,
  listCardPanelClass,
} from "@/lib/games/mobileListCardLayout";
import { MATCH_LIST_CYBER_GRID_CLASS } from "@/lib/ui/matchListCardCyber";
import {
  CYBER_GLASS_SHADOW,
  PREDICT_OVERLAY_BLUR_GLASS,
  PREDICT_OVERLAY_MATCH_CARD_GLASS,
} from "@/lib/ui/matchOverlayGlass";
import { LiveMatchMark } from "@/app/component/games/LiveMatchMark";
import {
  isPlayoffStyleGameCard,
  type SeriesStanding,
} from "@/lib/games/playoffSeriesUi";
import {
  scheduleSharedBoundsVtName,
  scheduleSharedContentVtName,
} from "@/lib/games/scheduleSharedTransitionKeys";



/**
 * 入場アニメーションのグループ。
 * 以前は 9 要素を細かくずらしていたが、
 * 「シェル → ヘッダー行 → チーム行 → フッター行」の 4 段にまとめている
 */
const ENTRY_GROUP_SHELL = 0;
const ENTRY_GROUP_HEADER = 1;
const ENTRY_GROUP_TEAMS = 2;
const ENTRY_GROUP_FOOTER = 3;

export type Status = "scheduled" | "live" | "final";

export type TeamSide = {
  name: string;
  colorHex?: string; // 塗り色（チームカラー）
  teamId?: string;   // 必要なら将来ここからカラー取得
};

export type MatchCardProps = {
  id: string;
  league: League;
  /** シーズン（例: "2025-26"）。WC 順位表・過去試合などに使用 */
  season?: string | null;
  /** regular | play_in | playoffs; omitted/null = regular. */
  seasonPhase?: "regular" | "play_in" | "playoffs" | null;
  venue?: string;
  roundLabel?: string;
  /** WC：ノックアウトステージ（R32 以降）か。引き分け予想・市場の引き分け表示を抑止する */
  knockout?: boolean;
  /** WC：仕切り線上に表示する放送媒体（複数可） */
  broadcastLabels?: string[];
  startAtJst: Date | null;
  status: Status;
  home: TeamSide;
  away: TeamSide;
  score: { home: number; away: number } | null;
  /** プレーオフ系：シリーズのホーム先勝数（未設定時は null） */
  seriesStanding?: SeriesStanding | null;
  liveMeta: { period: string; runningTime?: string } | null;
  finalMeta: { ot?: boolean } | null;

  showRecentForm?: boolean;

  viewPredictionHref: string;
  makePredictionHref: string;
  onOpenPredict?: (gameId: string) => void;
  sharedLayoutId?: string;
  /** View Transitions 共有要素用のベースキー（一覧とオーバーレイで同一値） */
  sharedTransitionBaseKey?: string;
  /**
   * 一覧で「共有要素に参加しない」カード用。`view-transition-name: none` で他カードの誤補間を防ぐ。
   */
  forceViewTransitionNameNone?: boolean;
  disableCardMotion?: boolean;

  dense?: boolean;
  hideLine?: boolean;
  hideActions?: boolean;
  marketBias?: {
  homePct: number;
  awayPct: number;
};
showMarketBias?: boolean;
/** @deprecated 一覧レイアウトは attachOverlayMarketBar を使う */
inPredictOverlay?: boolean;
/** 一覧と同じカード見た目のまま、下部に市場棒グラフだけ足す（予想オーバーレイ用） */
attachOverlayMarketBar?: boolean;
/** 親の predict-overlay-cyber-form 一枚に内包するとき（独自ガラス面を出さない） */
overlayUnifiedForm?: boolean;
myPostId?: string | null;
homeRecord?: {
  wins: number;
  losses: number;
  draws?: number;
  rank?: number;
  lastGames?: { at?: any; isWin?: boolean }[];
} | null;
  awayRecord?: {
  wins: number;
  losses: number;
  draws?: number;
  rank?: number;
  lastGames?: { at?: any; isWin?: boolean }[];
} | null;
  /** 一覧の何枚目か（入場スタッガーに合わせたドット開幕ディレイ用） */
  scheduleEntryIndex?: number;
  /** false のとき派手な一覧入場・ユニドット開幕を出さない（日付切替など） */
  heavyListEntry?: boolean;
  /** ルート要素に付与（例: VT ゴースト行の invisible） */
  className?: string;
  /** W杯など試合数が少ない一覧向けの超コンパクト表示 */
  compact?: boolean;
  /** 予想オーバーレイ統合：自分の投稿リザルトをカード内に表示 */
  resultPost?: PredictionPostV2 | null;
  /** resultPost 評価バーを即アニメ */
  resultRatingBarsImmediate?: boolean;
  /** 自分の勝者予想（市場棒グラフのマーカー用） */
  userPredictionWinner?: "home" | "away" | "draw" | null;
  /** 統合カード右上：キックオフ前の予想修正（オーバーレイ等） */
  onRequestPredictEdit?: (post: PredictionPostV2) => void;
  /** 統合カード左上：予想オーバーレイを閉じる */
  onClosePredictOverlay?: () => void;
  /** 親で言語を渡すと users/{uid} の購読をカード毎に増やさない */
  language?: Language;
  /** WC：試合の実得点者（一覧カード表示用） */
  goalScorers?: WcGameGoalScorer[] | null;
};



const leagueLineColor: Record<League, string> = {
  bj: "#eab308",   // Bリーグ
  j1: "#22c55e",   // J1
  nba: "#60a5fa",  // NBA
  pl: "#a855f7",   // Premier League（紫系・仮）
  wc: "#f59e0b",   // World Cup（アンバー）
};

const pad2 = (n: number) => n.toString().padStart(2, "0");
const fmtKickoff = (d: Date | null, timeZone: string) =>
  d
    ? d.toLocaleTimeString("en-US", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "--:--";

/** モバイル WC 一覧 — 国旗幅に揃え、短い国名は 1 行 */
function wcListNameShellClass(
  league: League,
  isMobile: boolean,
  mobileDense: boolean
): string {
  if (league !== "wc") return "";
  if (isMobile && mobileDense) {
    return "w-[4.5rem] min-w-0 max-w-[4.5rem] md:w-[5.5rem] md:max-w-[5.5rem]";
  }
  return "max-w-full whitespace-nowrap";
}

function wcListNameTextClass(
  league: League,
  isMobile: boolean,
  mobileDense: boolean
): string {
  if (league === "wc" && isMobile && mobileDense) {
    return "text-[14px] font-bold leading-[1.12] md:text-[15px]";
  }
  if (isMobile) return "text-[15px] font-bold md:text-[18px]";
  return "text-base font-bold leading-tight md:text-xl lg:text-2xl";
}

function wcListNameFontStyle(
  league: League,
  isMobile: boolean,
  mobileDense: boolean,
  wcTeamNameFont: React.CSSProperties,
  teamNameFont: React.CSSProperties
): React.CSSProperties {
  if (league === "wc" && isMobile && mobileDense) {
    return wcBracketMarketTeamTypography(true);
  }
  if (league === "wc") return wcTeamNameFont;
  return teamNameFont;
}

function renderWcMobileDenseTeamName(
  fullName: string,
  textClass: string,
  fontStyle: React.CSSProperties
) {
  const split = splitWcCountryNameForMobileList(fullName);
  if (!split.singleLine) {
    return (
      <>
        <div className={textClass} style={fontStyle}>
          {split.line1}
        </div>
        <div className={textClass} style={fontStyle}>
          {split.line2}
        </div>
      </>
    );
  }
  return (
    <div className={`${textClass} whitespace-nowrap`} style={fontStyle}>
      {split.text}
    </div>
  );
}

/** モバイル dense 一覧のキックオフ — Web 試合カード（非 dense）と同じ Oxanium + サイズ */
function listKickoffCenterClass(
  isMobile: boolean,
  mobileDense: boolean,
  scoreText: string
): string {
  if (isMobile && mobileDense) {
    return ["text-xl leading-none md:text-5xl", resultStatsMetricNumClass].join(" ");
  }
  return [scoreText, "leading-none", resultStatsMetricNumClass].join(" ");
}

const fmtKickoffDateTime = (
  d: Date | null,
  timeZone: string,
  locale: string
) =>
  d
    ? d.toLocaleString(locale, {
        timeZone,
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "--:--";

function ordinal(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

/** ResultMatchHeader の予想スコア数字と同じスタック */
const RESULT_CARD_NUM_FONT =
  'Impact,"Anton","Arial Black",Inter,ui-sans-serif,system-ui,sans-serif';

/** BracketCardWeb / BracketCardMobile のチーム短名と同じ系統 */
function bracketMarketTeamNameStyle(isMobile: boolean): React.CSSProperties {
  return isMobile
    ? {
        fontFamily: '"Bebas Neue", sans-serif',
        letterSpacing: "0.08em",
      }
    : {
        fontFamily: "Oswald, Bebas Neue, sans-serif",
        letterSpacing: "0.06em",
      };
}

/** ResultStatsCard「総合得点」等と同じ数値フォント（Oxanium） */
function RecordWithRank({
  r,
  league,
}: {
  r: { wins: number; losses: number; draws?: number; rank?: number } | null;
  league: string;
}) {
  const line = formatTeamRecordWithRank(r, league);
  const hasRank = r?.rank != null && Number.isFinite(r.rank) && r.rank > 0;

  if (!hasRank) {
    return (
      <span className={[resultStatsMetricNumClass, "opacity-70"].join(" ")}>
        {line}
      </span>
    );
  }

  const rankSep = line.lastIndexOf(":");
  const record = rankSep >= 0 ? line.slice(0, rankSep) : line;
  const rankPart = rankSep >= 0 ? line.slice(rankSep + 1) : "";

  return (
    <span
      className={[
        resultStatsMetricNumClass,
        "inline-flex max-w-full flex-wrap items-baseline justify-center gap-x-2 opacity-85",
      ].join(" ")}
    >
      <span className="tabular-nums">{record}</span>
      {rankPart ? (
        <span className="tabular-nums whitespace-nowrap">{`:${rankPart}`}</span>
      ) : null}
    </span>
  );
}

/** ルートから Web/Mobile の prefix を決定 */
function useSectionPrefix() {
  const pathname = usePathname();
  if (pathname?.startsWith("/mobile") || pathname?.startsWith("/m/"))
    return "/mobile";
  return "/web";
}

function broadcastNameUsesCjk(label: string): boolean {
  return /[\u3040-\u30ff\u4e00-\u9fff]/.test(label);
}

function MatchCardView({
  id,
  league,
  venue,
  roundLabel,
  knockout = false,
  broadcastLabels = [],
  startAtJst,
  status,
  home,
  away,
  score,
  seriesStanding = null,
  liveMeta,
  finalMeta,
  seasonPhase = null,
  season = null,
  viewPredictionHref,
  makePredictionHref,
  dense = false,
  hideLine = false,
  showRecentForm = false,
  hideActions = false,
  marketBias,
  showMarketBias = false,
  inPredictOverlay = false,
  attachOverlayMarketBar = false,
  overlayUnifiedForm = false,
  myPostId = null,
  homeRecord = null,
  awayRecord = null,
  className,
  sharedLayoutId,
  sharedTransitionBaseKey,
  forceViewTransitionNameNone = false,
  onOpenPredict,
  disableCardMotion = false,
  scheduleEntryIndex,
  heavyListEntry = true,
  compact = false,
  resultPost = null,
  resultRatingBarsImmediate = false,
  userPredictionWinner = null,
  onRequestPredictEdit,
  onClosePredictOverlay,
  language,
}: MatchCardProps & { language: Language }) {
  const router = useRouter();

  const { fUser: user } = useFirebaseUser();
  const m = t(language);
  const displayTimeZone = language === "en" ? TIMEZONE_ET : TIMEZONE_JST;

  const wcBroadcastSep = language === "ja" ? "：" : ": ";

  const wcHomeTeamId = resolveWcTeamId(
    home,
    resultPost?.home?.teamId,
    resultPost?.game?.home,
    resultPost?.home?.name,
    home.name
  );
  const wcAwayTeamId = resolveWcTeamId(
    away,
    resultPost?.away?.teamId,
    resultPost?.game?.away,
    resultPost?.away?.name,
    away.name
  );
  const wcKnockoutHomeStanding = useMemo(
    () =>
      league === "wc" && knockout
        ? resolveWcGroupStageStandingForKnockoutDisplay(wcHomeTeamId, homeRecord)
        : null,
    [league, knockout, wcHomeTeamId, homeRecord]
  );
  const wcKnockoutAwayStanding = useMemo(
    () =>
      league === "wc" && knockout
        ? resolveWcGroupStageStandingForKnockoutDisplay(wcAwayTeamId, awayRecord)
        : null,
    [league, knockout, wcAwayTeamId, awayRecord]
  );

  const [navigating, setNavigating] = useState(false);
  // Full-area tap: scale the whole card shell (transparent overlay alone shows no motion).
  const [fullCardPressed, setFullCardPressed] = useState(false);

const isPredicted = !!myPostId;

    // ▼ 追加：モバイル判定
 // ✅ 追加（既存の useSectionPrefix を使う）
const prefix = useSectionPrefix();
const pathname = usePathname();
const isMobile = prefix === "/mobile" || prefix.startsWith("/m/");
  /** 一覧のガラス面・レイアウト dense（リザルト一覧 scheduleDense と同条件） */
  const listScheduleDense = dense || (isMobile && !inPredictOverlay);
  const listPanelClass = listCardPanelClass(listScheduleDense);
  /** Web は外枠にガラス面を直付け（従来どおり）。モバイルは transform 外の分割シェル */
  const useSplitGlassShell = isMobile;
  const webPanelClass = listScheduleDense
    ? MOBILE_LIST_CARD_PANEL_DENSE
    : WEB_LIST_CARD_PANEL;
  /** モバイル dense / W杯コンパクト一覧 */
  const mobileDense =
    (listScheduleDense && isMobile) || (compact && league === "wc");
  const showWcBroadcastRow =
    league === "wc" &&
    broadcastLabels.length > 0 &&
    status !== "final";
  const wcBroadcastCompact = mobileDense || inPredictOverlay;
  /** 予想オーバーレイは下にフォームが続くため、発光仕切り線は出さない */
  const showDividerLine =
    !hideLine && !inPredictOverlay && !attachOverlayMarketBar;
  /** 予想オーバーレイでは市場棒グラフのみ追加（カード本体は一覧レイアウト） */
  const showOverlayMarketBar =
    showMarketBias && (inPredictOverlay || attachOverlayMarketBar);
  /** オーバーレイでは未開始試合の中央をキックオフ時刻ではなく VS にする */
  const overlayCenterMode = inPredictOverlay || attachOverlayMarketBar;
  const showMergedResult = Boolean(overlayCenterMode && resultPost);
  /** 予想オーバーレイ：未開始試合のキックオフ・放送局（予想有無に関わらず） */
  const showOverlayScheduleMeta = Boolean(
    overlayCenterMode &&
      status === "scheduled" &&
      (startAtJst || showWcBroadcastRow)
  );
  const {
    badge: resultBadge,
    outcomeBadge: resultOutcomeBadge,
    showStreakBadge: resultShowStreakBadge,
    stackBadges: resultStackBadges,
    streakBadge: resultStreakBadge,
    activeWinStreak: resultActiveWinStreak,
  } = useMemo(
    () =>
      resultPost
        ? resolveResultCardBadge(resultPost, language)
        : {
            badge: null,
            frameBadge: null,
            outcomeBadge: null,
            showStreakBadge: false,
            stackBadges: false,
            activeWinStreak: 0,
            streakBadge: null,
          },
    [resultPost, language]
  );
  const mergedResultAccent = showMergedResult
    ? resultBadgeAccent(resultBadge, resultActiveWinStreak)
    : null;
  const predictOverlayGlassBase =
    showMergedResult && isResultCyberClipFrameBadge(resultBadge)
      ? withResultHitCyberClip(PREDICT_OVERLAY_MATCH_CARD_GLASS)
      : PREDICT_OVERLAY_MATCH_CARD_GLASS;
  const mergedOverlayGlassClass =
    showMergedResult && mergedResultAccent?.frameBorder
      ? [
          predictOverlayGlassBase,
          isResultCyberClipFrameBadge(resultBadge)
            ? ""
            : mergedResultAccent.frameBorder,
          isResultCyberClipFrameBadge(resultBadge)
            ? CYBER_GLASS_SHADOW
            : mergedResultAccent.shadow || CYBER_GLASS_SHADOW,
        ].join(" ")
      : predictOverlayGlassBase;
  const wcGoalScorerResultRaw = useWcGoalScorerResult(
    resultPost ?? ({ league: "nba", prediction: {} } as PredictionPostV2)
  );
  const wcGoalScorerResult = resultPost ? wcGoalScorerResultRaw : null;
  const predictedScore =
    resultPost?.prediction?.score != null
      ? resultPost.prediction.score
      : null;
  const hideMergedStatsSection =
    showMergedResult && resultPost?.status !== "final";
  const kickoffLocale = language === "ja" ? "ja-JP" : "en-US";
  const teamNameFont = bracketMarketTeamTypography(isMobile);
  /** letter-spacing は末尾にも余白が乗るため、中央揃え時の見た目ずれを補正 */
  const wcTeamNameFont: React.CSSProperties =
    league === "wc"
      ? {
          ...teamNameFont,
          paddingRight: teamNameFont.letterSpacing,
        }
      : teamNameFont;
  const showPlayoffSeriesRow =
    isPlayoffStyleGameCard(seasonPhase, roundLabel) &&
    seriesStanding != null;
  /** 共有要素遷移：外枠とヒーローグリッドに別名を付与（none は一覧の非参加カード用） */
  const vtBoundsName = forceViewTransitionNameNone
    ? "none"
    : sharedTransitionBaseKey
      ? scheduleSharedBoundsVtName(sharedTransitionBaseKey)
      : "";
  /** モバイルは外枠のみ共有（グリッド二重名による補間崩れを避ける）。Web は従来どおり bounds + content */
  const vtContentName = forceViewTransitionNameNone
    ? "none"
    : sharedTransitionBaseKey
      ? isMobile
        ? "none"
        : scheduleSharedContentVtName(sharedTransitionBaseKey)
      : "";

  // ▼ 追加：NBA × mobile のときは nickname（line2 のみ）
  function getDisplayName(league: League, l1: string, l2: string): string {
    if (league === "nba" && isMobile) {
      return l2 || l1; // ← NBA mobile → line2 だけ
    }
    return `${l1}\n${l2 || ""}`;
  }


  // ▼ チームカラーを teamId から取得する
const normalizedLeague = normalizeLeague(league);

// ▼ Firestore からチーム成績（wins/losses）を取得
function toLast5WL(
  lastGames: { at?: any; isWin?: boolean }[] | undefined,
  latestSide: "left" | "right"
): ("W" | "L")[] {
  if (!Array.isArray(lastGames)) return [];

  const sorted = [...lastGames]
    .sort((a, b) => {
      const ams = a?.at?.toMillis ? a.at.toMillis() : 0;
      const bms = b?.at?.toMillis ? b.at.toMillis() : 0;
      return bms - ams; // new -> old
    })
    .slice(0, 5)
    .map((g) => (g?.isWin ? "W" : "L"));

  // latestSide が右なら old->new に反転（右端が最新）
  return latestSide === "right" ? [...sorted].reverse() : sorted;
}

const homeForm = useMemo(
  () => toLast5WL(homeRecord?.lastGames, "right"),
  [homeRecord]
);

const awayForm = useMemo(
  () => toLast5WL(awayRecord?.lastGames, "left"),
  [awayRecord]
);
const homeColor = useMemo(
  () => getTeamPrimaryColor(normalizedLeague, home.teamId) ?? "#0ea5e9",
  [normalizedLeague, home.teamId]
);

const awayColor = useMemo(
  () => getTeamPrimaryColor(normalizedLeague, away.teamId) ?? "#f43f5e",
  [normalizedLeague, away.teamId]
);

const homeJerseyColor = useMemo(
  () => getTeamJerseyPrimaryColor(normalizedLeague, home.teamId) ?? homeColor,
  [normalizedLeague, home.teamId, homeColor]
);

const awayJerseyColor = useMemo(
  () => getTeamJerseyPrimaryColor(normalizedLeague, away.teamId) ?? awayColor,
  [normalizedLeague, away.teamId, awayColor]
);

const homeSecondaryColor = useMemo(
  () => getTeamJerseySecondaryColor(normalizedLeague, home.teamId),
  [normalizedLeague, home.teamId]
);
const awaySecondaryColor = useMemo(
  () => getTeamJerseySecondaryColor(normalizedLeague, away.teamId),
  [normalizedLeague, away.teamId]
);
const homeBiasPct = Math.max(0, Math.min(100, marketBias?.homePct ?? 68));
const awayBiasPct = Math.max(0, Math.min(100, marketBias?.awayPct ?? 32));

const marketMajority = useMemo(() => {
  if (Math.abs(homeBiasPct - awayBiasPct) < 0.0001) return "none";
  return homeBiasPct > awayBiasPct ? "home" : "away";
}, [homeBiasPct, awayBiasPct]);



  /** サッカーボール等（従来サイズ） */
  const teamMarkSizeSoccer = dense
    ? "jersey-icon w-16 h-16 md:w-20 md:h-20"
    : "jersey-icon w-[4.25rem] h-[4.25rem] md:w-24 md:h-24";
  /** WC 国旗用：横長 3:2 系 (ジャージより気持ち小さめ) */
  const wcOverlayLayout = inPredictOverlay || attachOverlayMarketBar;
  const teamMarkSizeFlag =
    wcOverlayLayout && league === "wc"
      ? isMobile
        ? "w-[5.5rem] h-[3.67rem] md:w-[6.75rem] md:h-[4.5rem] mb-1"
        : "w-[6.25rem] h-[4.17rem] md:w-[8rem] md:h-[5.33rem] mb-1"
      : dense
        ? isMobile
          ? "w-[4.5rem] h-[3rem] md:w-[5.5rem] md:h-[3.7rem] mb-2"
          : "w-[4.5rem] h-[3rem] md:w-[5.5rem] md:h-[3.7rem] mb-2"
        : "w-[4.75rem] h-[3.2rem] md:w-[6.25rem] md:h-[4.2rem] mb-2";
  const wcRecordWidthClass =
    wcOverlayLayout && league === "wc"
      ? isMobile
        ? "w-[5.5rem] md:w-[6.75rem]"
        : "w-[6.25rem] md:w-[8rem]"
      : dense
        ? "w-[4.5rem] md:w-[5.5rem]"
        : "w-[4.75rem] md:w-[6.25rem]";
  const teamMarkSizeJersey = dense
    ? isMobile
      ? "jersey-icon w-[3.875rem] h-[3.875rem] md:w-20 md:h-20"
      : "jersey-icon w-16 h-16 md:w-20 md:h-20"
    : isMobile
      ? "jersey-icon w-[4.125rem] h-[4.125rem] md:w-24 md:h-24"
      : "jersey-icon w-[4.25rem] h-[4.25rem] md:w-24 md:h-24";

  // Tailwind に text-1.xl は無いので既に修正済み
  const scoreText = dense
    ? isMobile
      ? "text-lg md:text-4xl"
      : "text-xl md:text-4xl"
    : isMobile
      ? "text-[clamp(1.05rem,4.2vw,1.35rem)] md:text-5xl"
      : "text-xl md:text-5xl";
  const teamText = dense ? "text-sm md:text-base" : "text-base md:text-xl";
  const recordText = dense ? "text-[12px]" : "text-sm";
  const Icon =
    league === "nba" || league === "bj" ? Jersey : Soccer;

  const reduceMotion = useReducedMotion();
  /** 一覧は先頭3枚のみ入場。オーバーレイは除外。単体ページは index 未指定で対象 */
  const showContentEntry =
    heavyListEntry &&
    !inPredictOverlay &&
    (scheduleEntryIndex === undefined || scheduleEntryIndex < 3);
  /** オーバーレイ複製 or 4枚目以降ではドット開幕も出さない */
  const jerseyDotRevealEnabled =
    showContentEntry && (league === "nba" || league === "bj");

  const entryTransition = useMemo(() => {
    if (!showContentEntry || reduceMotion) return null;
    /** カード間のずれはここで一元管理（行レベルのスタッガーは page モードでは行わない） */
    const listStagger =
      scheduleEntryIndex !== undefined
        ? Math.min(scheduleEntryIndex * 0.05, 0.14)
        : 0;
    const ease = GAMES_CYBER_EASE;
    const duration = GAMES_CYBER_ENTRY_DURATION_SEC;
    const groupGap = GAMES_CYBER_GROUP_GAP_SEC;
    /** 一覧では上部バー〜日付ストリップの起動を待ってからカードを始める */
    const leadIn =
      scheduleEntryIndex !== undefined
        ? GAMES_LIST_CARDS_LEAD_IN_SEC
        : GAMES_CYBER_LEAD_IN_SEC;
    return (group: number) => ({
      delay: listStagger + leadIn + group * groupGap,
      duration,
      ease,
    });
  }, [showContentEntry, reduceMotion, scheduleEntryIndex]);

  /**
   * グループ入場：下からスライド＋着地直後に一瞬明滅する「ロックオン」フリッカー。
   * opacity / transform のみで構成（backdrop-blur や filter は使わない）
   */
  const entryGroupProps = (group: number, dy: number = 10) => {
    if (!entryTransition) {
      return { initial: false as const };
    }
    const t = entryTransition(group);
    return {
      initial: { opacity: 0, y: dy },
      animate: { opacity: [0, 1, 0.45, 1], y: 0 },
      transition: {
        y: t,
        opacity: {
          delay: t.delay,
          duration: t.duration * 1.25,
          times: [0, 0.5, 0.66, 1],
          ease: "linear" as const,
        },
      },
    };
  };

  /**
   * ドット開幕はチーム行グループの入場に同期（HOME / AWAY 同時）
   */
  const jerseyDotDelayMs = useMemo(() => {
    if (!jerseyDotRevealEnabled || reduceMotion || !entryTransition) {
      return 0;
    }
    /** 行の入場が始まってから少し経ってからドット開始 */
    const duringRowMs = Math.round(GAMES_CYBER_ENTRY_DURATION_MS * 0.32);
    const tailMs = 28;
    return (
      Math.round(entryTransition(ENTRY_GROUP_TEAMS).delay * 1000) +
      duringRowMs +
      tailMs
    );
  }, [jerseyDotRevealEnabled, reduceMotion, entryTransition]);

  // 現在のルートから /m or /web を決める & lg を引き継ぎ
  const sp = useSearchParams();
  const lg = sp.get("lg") ?? league;

  // ▼ 予想をするページ（/predict のみ使用、predictions/post への遷移は廃止）
  const predictHref = `${prefix}/games/${id}/predict${lg ? `?lg=${lg}` : ""}`;

  // ▼ 試合が開始済みかどうか（status優先＋開始時刻フォールバック）
  const isGameStarted = (() => {

    if (status === "live" || status === "final") return true;
    if (status === "scheduled" && startAtJst instanceof Date) {
      try {
        return Date.now() >= startAtJst.getTime();
      } catch {}
    }
    return false;
  })();

  // ▼ LIVE判定（scoreが無くてもLIVE）
// ▼ 自動LIVE判定（開始時刻を過ぎたらLIVE）
const isLive =
  status === "live" ||
  (status === "scheduled" &&
    startAtJst instanceof Date &&
    Date.now() >= startAtJst.getTime());

const showMergedPredictEdit = Boolean(
  showMergedResult &&
    resultPost &&
    onRequestPredictEdit &&
    isPredicted &&
    status === "scheduled" &&
    !isGameStarted
);

const overlayPredictScoreClass = isMobile
  ? mobileDense
    ? "text-[10px] font-bold leading-tight text-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.28)]"
    : "text-[11px] font-bold leading-tight text-amber-200 drop-shadow-[0_0_10px_rgba(251,191,36,0.28)]"
  : mobileDense
    ? "text-sm font-bold text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.32)] md:text-base"
    : "text-base font-bold text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.32)] md:text-lg";

const renderOverlayPredictScore = () => {
  if (!showMergedResult || !predictedScore) return null;
  return (
    <MatchScoreLine
      home={predictedScore.home}
      away={predictedScore.away}
      className={overlayPredictScoreClass}
    />
  );
};

const overlayScoreTextClass = isMobile
  ? mobileDense
    ? "text-xl leading-none tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]"
    : "text-[clamp(1.2rem,4.8vw,1.55rem)] leading-none tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]"
  : mobileDense
    ? "text-3xl leading-none tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)] md:text-5xl"
    : "text-4xl leading-none tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)] md:text-5xl lg:text-6xl";

const mergedPreKickoffScoreClass = [
  overlayScoreTextClass,
  "text-cyan-50 drop-shadow-[0_0_22px_rgba(34,211,238,0.38)]",
].join(" ");

let center: React.ReactNode = overlayCenterMode ? (
  status === "final" && score ? (
    <div
      className={
        isMobile
          ? mobileDense
            ? "flex min-h-[40px] flex-col items-center justify-center gap-0.5"
            : "flex min-h-[44px] flex-col items-center justify-center gap-0.5"
          : mobileDense
            ? "flex min-h-[48px] flex-col items-center justify-center gap-0.5 md:min-h-[60px]"
            : "flex min-h-[56px] flex-col items-center justify-center gap-0.5 md:min-h-[72px]"
      }
    >
      <div className="flex flex-col items-center">
        <MatchScoreLine
          home={score.home}
          away={score.away}
          className={overlayScoreTextClass}
        />
        {showPlayoffSeriesRow && finalMeta?.ot ? (
          <span className="mt-0.5 text-[10px] font-medium opacity-75 md:text-xs">
            (OT)
          </span>
        ) : null}
      </div>
      {!showPlayoffSeriesRow ? (
        <div
          className="text-[10px] font-medium text-white/75 md:text-xs"
          style={teamNameFont}
        >
          {m.games.finalLabel}
          {finalMeta?.ot ? " (OT)" : ""}
        </div>
      ) : null}
      {renderOverlayPredictScore()}
    </div>
  ) : status === "live" && score ? (
    <div
      className={
        isMobile
          ? mobileDense
            ? "flex min-h-[40px] flex-col items-center justify-center gap-0.5"
            : "flex min-h-[44px] flex-col items-center justify-center gap-0.5"
          : mobileDense
            ? "flex min-h-[48px] flex-col items-center justify-center gap-0.5 md:min-h-[60px]"
            : "flex min-h-[56px] flex-col items-center justify-center gap-0.5 md:min-h-[72px]"
      }
    >
      <MatchScoreLine
        home={score.home}
        away={score.away}
        className={overlayScoreTextClass}
      />
      {liveMeta?.period ? (
        <div className="text-[10px] text-white/75 md:text-xs">
          {liveMeta.period}
          {liveMeta.runningTime ? ` ${liveMeta.runningTime}` : ""}
        </div>
      ) : null}
      {renderOverlayPredictScore()}
    </div>
  ) : showMergedResult && status === "scheduled" && predictedScore ? (
    <div
      className={
        isMobile
          ? mobileDense
            ? "flex min-h-[52px] flex-col items-center justify-center gap-1"
            : "flex min-h-[56px] flex-col items-center justify-center gap-1"
          : mobileDense
            ? "flex min-h-[60px] flex-col items-center justify-center gap-1.5 md:min-h-[72px]"
            : "flex min-h-[68px] flex-col items-center justify-center gap-1.5 md:min-h-[80px]"
      }
    >
      <span
        className={[
          nameOxanium.className,
          "text-[9px] font-bold uppercase tracking-[0.28em] text-cyan-200/80 md:text-[10px]",
          "drop-shadow-[0_0_12px_rgba(34,211,238,0.35)]",
        ].join(" ")}
      >
        {m.results.myPrediction}
      </span>
      <MatchScoreLine
        home={predictedScore.home}
        away={predictedScore.away}
        className={mergedPreKickoffScoreClass}
      />
    </div>
  ) : (
    <div
      className={
        mobileDense
          ? "flex min-h-[40px] w-full items-center justify-center md:min-h-[52px]"
          : "flex min-h-[52px] w-full items-center justify-center md:min-h-[60px]"
      }
    >
      <div
        className={[
          matchVsLabelClass,
          "uppercase leading-none text-cyan-50/95",
          "drop-shadow-[0_0_14px_rgba(34,211,238,0.42)]",
          mobileDense
            ? "text-2xl md:text-3xl"
            : "text-2xl md:text-4xl",
        ].join(" ")}
        style={{
          letterSpacing: "0.06em",
          paddingRight: "0.06em",
        }}
      >
        VS
      </div>
    </div>
  )
) : isLive ? (
    <LiveMatchMark
      density={dense ? "matchDense" : "matchComfortable"}
      language={language}
    />
  ) : (
    <div className={listKickoffCenterClass(isMobile, mobileDense, scoreText)}>
      {fmtKickoff(startAtJst, displayTimeZone)}
    </div>
  );



    if (!overlayCenterMode && status === "live" && score) {
    center = (
      <div
        className={
          mobileDense
            ? "flex flex-col items-center gap-0.5"
            : "flex flex-col items-center gap-1"
        }
      >
        <LiveMatchMark
          density={dense ? "matchDense" : "matchComfortable"}
          language={language}
        />
        <MatchScoreLine
          home={score.home}
          away={score.away}
          className={[scoreText, "leading-none"].join(" ")}
        />
        {liveMeta?.period && (
          <div className="text-xs opacity-80">
            {liveMeta.period}
            {liveMeta.runningTime ? ` ${liveMeta.runningTime}` : ""}
          </div>
        )}
      </div>
    );
  }

  if (!overlayCenterMode && status === "final" && score) {
    center = (
      <div
        className={
          mobileDense
            ? "flex flex-col items-center gap-0.5"
            : "flex flex-col items-center gap-1"
        }
      >
        <div className="flex flex-col items-center">
          <MatchScoreLine
            home={score.home}
            away={score.away}
            className={[scoreText, "leading-none"].join(" ")}
          />
          {showPlayoffSeriesRow && finalMeta?.ot ? (
            <span className="mt-0.5 text-xs opacity-80">(OT)</span>
          ) : null}
        </div>
        {!showPlayoffSeriesRow ? (
          <div className="text-xs opacity-80" style={teamNameFont}>
            {m.games.finalLabel}
            {finalMeta?.ot ? " (OT)" : ""}
          </div>
        ) : null}
      </div>
    );
  }

  const [homeL1, homeL2] = splitTeamNameByLeague(league, home.name);
  const [awayL1, awayL2] = splitTeamNameByLeague(league, away.name);

  /** Same behavior as the predict CTA (schedule overlay when logged in). */
  const triggerOpenPredictLikeButton = () => {
    const me = auth.currentUser;
    if (!me) {
      router.push(isMobile ? "/mobile/login" : "/web/login");
      return;
    }

    // スケジュール一覧のオーバーレイ：予想済み・試合開始後も市場・詳細スタッツを見るために開く
    if (onOpenPredict) {
      onOpenPredict(id);
      return;
    }

    // オーバーレイなしの単体カード：従来どおり（予想済み・開始後は何もしない）
    if (myPostId) return;
    if (isGameStarted) return;
  };

  const handleOpenPredict = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    triggerOpenPredictLikeButton();
  };

  /** 一覧オーバーレイ以外で、カード全体を Next の Link にするときの遷移先 */
  const fullCardLinkHref = useMemo(() => {
    if (hideActions || inPredictOverlay || onOpenPredict) return null;
    if (status === "final" || isGameStarted || isPredicted) {
      return viewPredictionHref;
    }
    return makePredictionHref;
  }, [
    hideActions,
    inPredictOverlay,
    onOpenPredict,
    status,
    isGameStarted,
    isPredicted,
    viewPredictionHref,
    makePredictionHref,
  ]);

  const skipFullCardLink = (() => {
    if (!fullCardLinkHref || !pathname) return false;
    const path = fullCardLinkHref.split("?")[0] ?? "";
    return pathname === path || pathname.startsWith(`${path}/`);
  })();

  const effectiveFullCardLinkHref =
    fullCardLinkHref && !skipFullCardLink ? fullCardLinkHref : null;

  /** カード全面をクリック対象にする（オーバーレイ用 Link / クリックレイヤー） */
  const useFullCardHitLayer =
    !hideActions &&
    !inPredictOverlay &&
    (Boolean(onOpenPredict) || Boolean(effectiveFullCardLinkHref));

  const fullCardPressHandlers =
    useFullCardHitLayer && !reduceMotion
      ? {
          onPointerDown: () => setFullCardPressed(true),
          onPointerUp: () => setFullCardPressed(false),
          onPointerLeave: () => setFullCardPressed(false),
          onPointerCancel: () => setFullCardPressed(false),
        }
      : {};

  const cardShellPressScale =
    useFullCardHitLayer && fullCardPressed && !reduceMotion ? 0.985 : 1;

  const handleMakePrediction = async (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  e.stopPropagation();
if (navigating) return;
setNavigating(true);
  const me = auth.currentUser;

  // ★ 追加：未ログインならモーダルを出して終了
  if (!me) return;

  try {
    const token = await me.getIdToken();

      const res = await fetch(
        `/api/posts_v2/byGameMine?gameId=${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        }
      );

      if (res.status === 200) {
        const json = await res.json().catch(() => ({} as any));
        const postId = json?.postId as string | undefined;
        if (postId) {
          // post 詳細への遷移は使わない
          return;
        }
        // 念のためのフォールバック（200でpostId無いのは想定外）
        if (!isGameStarted) {
          router.push(predictHref);
        }
        return;
      }

      if (res.status === 404) {
        // 自分の投稿が無い
        if (!isGameStarted) {
          router.push(predictHref);
        }
        return;
      }

      if (res.status === 409) {
        // サーバー側が「開始後ロック」を返したケース → 遷移なし
        return;
      }

      if (res.status === 401 || res.status === 403) {
        router.push(isMobile ? "/mobile/login" : "/web/login");
        return;
      }

      // その他の失敗
      if (!isGameStarted) {
        router.push(predictHref);
      }
     } catch {
      // 通信失敗時
      if (!isGameStarted) {
        router.push(predictHref);
      }
    } finally {
      setNavigating(false);
    }
  };


  const predictCtaClass = (() => {
    if (status === "final") return `${MATCH_LIST_CYBER_CTA_CLASS} match-list-cyber-cta--final`;
    if (isGameStarted) return `${MATCH_LIST_CYBER_CTA_CLASS} match-list-cyber-cta--live`;
    if (isPredicted) return `${MATCH_LIST_CYBER_CTA_CLASS} match-list-cyber-cta--predicted`;
    return MATCH_LIST_CYBER_CTA_CLASS;
  })();

  const predictCtaBaseClass = [
    "grid w-full place-items-center font-bold text-white",
    "h-8 text-[13px] px-2 md:h-12 md:text-[15px]",
    predictCtaClass,
    isMobile ? "" : "transition-all duration-200",
  ].join(" ");

  // backdrop-blur は transform 祖先の外に置く（リザルトカードと同様に背面バーティクルを透過）
  const shellClassName = [
    "group/card relative overflow-hidden text-white",
    inPredictOverlay && isMobile
      ? MOBILE_PREDICT_OVERLAY_CARD_OUTER_CLASS
      : mobileDense
        ? MOBILE_LIST_CARD_OUTER_CLASS
        : "mx-auto max-w-[1200px] w-full",
    !useSplitGlassShell && !inPredictOverlay && !attachOverlayMarketBar
      ? webPanelClass
      : "",
    !useSplitGlassShell && attachOverlayMarketBar
      ? mergedOverlayGlassClass
      : "",
    !useSplitGlassShell && !inPredictOverlay && !attachOverlayMarketBar && isPredicted
      ? "match-list-cyber-card--predicted"
      : "",
    disableCardMotion
      ? ""
      : isMobile
        ? ""
        : [
            "transition-opacity duration-200",
            navigating ? "opacity-90" : "",
          ].join(" "),
    hideLine || inPredictOverlay
      ? mobileDense
        ? "pb-1 md:pb-1.5"
        : inPredictOverlay
          ? "pb-1 md:pb-1.5"
          : "pb-2 md:pb-3"
      : "",
    className || "",
  ].join(" ");

  const glassShellClassName =
    useSplitGlassShell && attachOverlayMarketBar
      ? ["pointer-events-none absolute inset-0 z-0", mergedOverlayGlassClass].join(
          " "
        )
      : useSplitGlassShell && !inPredictOverlay
        ? [
            "pointer-events-none absolute inset-0 z-0",
            listPanelClass,
            isPredicted ? "match-list-cyber-card--predicted" : "",
          ].join(" ")
        : null;

  const shellVtStyle: React.CSSProperties = {
    ...(vtBoundsName
      ? ({
          viewTransitionName: vtBoundsName,
          ...(vtBoundsName !== "none"
            ? { viewTransitionClass: "schedule-shared-bounds" }
            : {}),
        } as React.CSSProperties)
      : {}),
  };

  const contentShellTransition =
    entryTransition
      ? {
          opacity: {
            type: "tween" as const,
            delay: entryTransition(ENTRY_GROUP_SHELL).delay,
            duration: entryTransition(ENTRY_GROUP_SHELL).duration * 0.55,
            ease: entryTransition(ENTRY_GROUP_SHELL).ease,
          },
          scale: {
            type: "tween" as const,
            duration: 0.12,
            ease: "easeOut" as const,
          },
        }
      : useFullCardHitLayer && !reduceMotion
        ? {
            scale: {
              type: "tween" as const,
              duration: 0.12,
              ease: "easeOut" as const,
            },
          }
        : undefined;

  const Shell = isMobile ? "div" : motion.div;
  const shellMotionProps = isMobile
    ? {}
    : {
        layout: !disableCardMotion && !sharedTransitionBaseKey,
        layoutId: sharedLayoutId,
      };

return (
<Shell
  {...shellMotionProps}
  className={shellClassName}
  style={shellVtStyle}
>
      {useFullCardHitLayer ? (
        onOpenPredict ? (
          <motion.div
            role="button"
            tabIndex={0}
            aria-label={m.games.openPrediction}
            className={[
              "absolute inset-0 z-[12] cursor-pointer touch-manipulation",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(5,8,20,0.92)]",
            ].join(" ")}
            onClick={handleOpenPredict}
            {...fullCardPressHandlers}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOpenPredict(e);
              }
            }}
          />
        ) : (
          <Link
            href={effectiveFullCardLinkHref!}
            aria-label={m.games.openMatchPrediction}
            className={[
              "absolute inset-0 z-[12] cursor-pointer touch-manipulation",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(5,8,20,0.92)]",
            ].join(" ")}
            prefetch={false}
            {...fullCardPressHandlers}
          />
        )
      ) : null}

      {glassShellClassName ? (
        <div className={glassShellClassName} aria-hidden />
      ) : null}

      {showMergedResult && isResultHitFrameBadge(resultBadge) ? (
        <ResultHitCyberFrame />
      ) : null}
      {showMergedResult && isResultPerfectFrameBadge(resultBadge) ? (
        <ResultPerfectCyberFrame />
      ) : null}
      {showMergedResult && isResultStreakFrameBadge(resultBadge) ? (
        <ResultStreakCyberFrame activeWinStreak={resultActiveWinStreak} />
      ) : null}
      {showMergedResult && isResultUpsetFrameBadge(resultBadge) ? (
        <ResultUpsetCyberFrame />
      ) : null}

      {attachOverlayMarketBar || (inPredictOverlay && !overlayUnifiedForm) ? (
        <>
          {attachOverlayMarketBar ? null : (
            <div
              className={[
                "pointer-events-none absolute inset-0 z-[1]",
                PREDICT_OVERLAY_MATCH_CARD_GLASS,
              ].join(" ")}
              aria-hidden
            />
          )}
          <div
            className={[
              "pointer-events-none absolute inset-0 z-[2] opacity-70",
              PREDICT_OVERLAY_CYBER_GRID_CLASS,
            ].join(" ")}
            aria-hidden
          />
          <PredictOverlayCyberDecor />
        </>
      ) : overlayUnifiedForm && inPredictOverlay ? null : (
        <>
          <div
            className={[
              "pointer-events-none absolute inset-0 z-[1] opacity-80",
              MATCH_LIST_CYBER_GRID_CLASS,
            ].join(" ")}
            aria-hidden
          />
          <MatchListCyberDecor />
        </>
      )}

{/* 試合終了後は市場バイアスの色帯・境界線を出さない。オーバーレイは下部の市場棒グラフと重複するため非表示 */}
{showMarketBias &&
  marketBias &&
  status !== "final" &&
  !inPredictOverlay &&
  !attachOverlayMarketBar && (
  <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
    {/* HOME 側バー */}
    <div
      className="absolute left-0 top-0 h-full"
      style={{
        width: `${homeBiasPct}%`,
        background: `linear-gradient(90deg, ${homeColor}66 0%, ${homeColor}22 72%, transparent 100%)`,
      }}
    />

    {/* AWAY 側バー */}
    <div
      className="absolute right-0 top-0 h-full"
      style={{
        width: `${awayBiasPct}%`,
        background: `linear-gradient(270deg, ${awayColor}66 0%, ${awayColor}22 72%, transparent 100%)`,
      }}
    />

    {/* HOME 優勢時の発光 */}
    {marketMajority === "home" && (
      <div
        className="absolute left-0 top-0 h-full"
        style={{
          width: `${homeBiasPct}%`,
          background: `linear-gradient(90deg, ${homeColor}22 0%, transparent 100%)`,
          boxShadow: `inset 0 0 14px ${homeColor}14, 0 0 8px ${homeColor}14`,
        }}
      />
    )}

    {/* AWAY 優勢時の発光 */}
    {marketMajority === "away" && (
      <div
        className="absolute right-0 top-0 h-full"
        style={{
          width: `${awayBiasPct}%`,
          background: `linear-gradient(270deg, ${awayColor}22 0%, transparent 100%)`,
          boxShadow: `inset 0 0 14px ${awayColor}14, 0 0 8px ${awayColor}14`,
        }}
      />
    )}

    {/* 境界線 */}
    <div
      className="absolute top-0 h-full w-[2px] -translate-x-1/2 bg-white/18"
      style={{ left: `${homeBiasPct}%` }}
    />
  </div>
)}

      <motion.div
        className="relative z-10"
        style={{ transformOrigin: "50% 50%" }}
        initial={entryTransition ? { opacity: 0 } : false}
        animate={{
          opacity: entryTransition ? 1 : undefined,
          scale: cardShellPressScale,
        }}
        transition={contentShellTransition}
      >
      {showMergedResult ? (
        <div className="pointer-events-none absolute right-2 -top-1 z-20 md:right-3 md:top-2">
          <ResultOutcomeBadges
            badge={resultBadge}
            outcomeBadge={resultOutcomeBadge}
            showStreakBadge={resultShowStreakBadge}
            stackBadges={resultStackBadges}
            streakBadge={resultStreakBadge}
            activeWinStreak={resultActiveWinStreak}
            isMobile={isMobile}
          />
        </div>
      ) : null}
      {onClosePredictOverlay ? (
        <div
          className={[
            "pointer-events-auto absolute z-[50]",
            predictOverlayCornerAnchorClass(isMobile, "left"),
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={[
              predictOverlayCornerButtonClasses(isMobile, "close"),
              "relative z-[52]",
            ].join(" ")}
            aria-label={m.common.close}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClosePredictOverlay();
            }}
          >
            <X
              className={isMobile ? "h-2.5 w-2.5" : "h-[14px] w-[14px]"}
              strokeWidth={2.25}
              aria-hidden
            />
          </button>
        </div>
      ) : null}
      {showMergedPredictEdit && resultPost ? (
        <div
          className={[
            "pointer-events-auto absolute z-[50]",
            predictOverlayCornerAnchorClass(isMobile, "right"),
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className={[
              predictOverlayCornerButtonClasses(isMobile, "edit"),
              "relative z-[52]",
            ].join(" ")}
            aria-label={m.results.editPredictionAriaLabel}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRequestPredictEdit?.(resultPost);
            }}
          >
            <Pencil
              className={isMobile ? "h-2.5 w-2.5" : "h-[14px] w-[14px]"}
              strokeWidth={2.2}
              aria-hidden
            />
          </button>
        </div>
      ) : null}
      {/* 入場時に一度だけ上→下へ走るスキャン光（カードを走査して実体化させる演出） */}
      {entryTransition && !reduceMotion && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 z-[13] h-[34%]"
          style={{
            willChange: "transform, opacity",
            background:
              "linear-gradient(180deg, transparent 0%, rgba(94,234,212,0.05) 30%, rgba(186,230,253,0.13) 50%, rgba(94,234,212,0.05) 70%, transparent 100%)",
          }}
          aria-hidden
          initial={{ y: "-110%", opacity: 0 }}
          animate={{ y: ["-110%", "330%"], opacity: [0, 1, 1, 0] }}
          transition={{
            delay: entryTransition(ENTRY_GROUP_SHELL).delay + 0.05,
            duration: 0.62,
            ease: [0.3, 0, 0.55, 1],
          }}
        />
      )}
      {(() => {
  const tag = getGameEventTag(roundLabel);
  if (!tag) return null;

  return (
    <motion.div
      className={mobileDense ? "absolute top-1 right-1 z-20" : "absolute top-2 right-2 z-20"}
      {...entryGroupProps(ENTRY_GROUP_HEADER, 8)}
    >
      <EventPill label={tag.label} color={tag.color} />
    </motion.div>
  );
})()}


      <motion.div
        className={[
          mobileDense
            ? "mb-0 px-2 pb-0 pt-0"
            : inPredictOverlay
              ? "mb-0 px-4 pb-0 pt-1"
              : dense
                ? "mb-0.5 px-3 pt-2"
                : "mb-0.5 px-4 pt-2",
        ].join(" ")}
        {...entryGroupProps(ENTRY_GROUP_HEADER)}
      >
        {!!roundLabel && (
          <div
            className={[
              "mc-round text-center font-bold",
              !inPredictOverlay && !attachOverlayMarketBar
                ? `${nameOxanium.className} uppercase tracking-[0.18em]`
                : "",
              mobileDense
                ? "mt-3 mb-0 text-xl leading-snug md:text-2xl"
                : inPredictOverlay
                  ? "mt-1 mb-0 text-xl tracking-[0.06em] md:text-2xl lg:text-3xl"
                  : isMobile
                    ? "mt-2 mb-0.5 text-lg md:text-2xl"
                    : // Web 試合カード：レギュラーシーズン等の帯ラベルを読みやすく大きめに
                      "mt-2 mb-0.5 text-xl tracking-[0.06em] md:text-2xl lg:text-3xl",
            ].join(" ")}
            style={teamNameFont}
          >
            {roundLabel}
          </div>
        )}

        <div
          className={
            mobileDense
              ? "h-0 md:h-1"
              : inPredictOverlay
                ? league === "wc"
                  ? "h-2 md:h-2.5"
                  : "h-0.5 md:h-1"
                : "h-2.5 md:h-3.5"
          }
          aria-hidden
        />
      </motion.div>

      <div
        className={`grid min-w-0 grid-cols-3 ${
          mobileDense
            ? "items-center gap-0 px-2 py-0"
            : inPredictOverlay
              ? "items-start gap-1.5 px-4 py-1"
              : dense
                ? "items-start gap-1 px-3 py-0"
                : "items-center gap-2 px-4 py-2.5"
        }`}
        style={
          vtContentName
            ? ({
                viewTransitionName: vtContentName,
                ...(vtContentName !== "none"
                  ? { viewTransitionClass: "schedule-shared-content" }
                  : {}),
              } as React.CSSProperties)
            : undefined
        }
      >
        {/* HOME */}
        <motion.div
          className={[
            "mc-home flex min-w-0 flex-col items-center",
            mobileDense
              ? "mt-0"
              : inPredictOverlay
                ? "mt-0"
                : "-mt-5 md:mt-0",
          ].join(" ")}
          {...entryGroupProps(ENTRY_GROUP_TEAMS, 12)}
        >

  {/* HOME：Web はラベルを大きく */}
  {league !== "wc" && (
    <div
      className={[
        mobileDense ? "mb-0 -mt-3" : "mb-1",
        "text-center font-bold uppercase opacity-85",
        isMobile
          ? "text-xs md:text-sm"
          : "text-sm md:text-base lg:text-lg",
      ].join(" ")}
      style={teamNameFont}
    >
      HOME
    </div>
  )}

  {/* ユニ・チーム名・戦績（WC は国旗幅を基準に縦積み中央揃え） */}
  <div
    className={[
      league === "wc"
        ? "inline-flex flex-col items-center"
        : "flex w-full flex-col items-center",
    ].join(" ")}
  >
  {league === "wc" ? (
    <WcTeamFlagWithMeta
      teamId={wcHomeTeamId}
      compact={mobileDense || isMobile}
      flagClassName={teamMarkSizeFlag}
      knockout={knockout}
    />
  ) : Icon === Jersey ? (
    <HalftoneJerseyMark
      accent={homeJerseyColor}
      accentEnd={homeSecondaryColor}
      className={teamMarkSizeJersey}
      enableDotReveal={jerseyDotRevealEnabled}
      dotRevealDelayMs={jerseyDotDelayMs}
    />
  ) : (
    <Icon
      className={teamMarkSizeSoccer}
      fill={homeJerseyColor}
      stroke="#fff"
    />
  )}

  {/* チーム名：mobile小さく / webそのまま（ユニ直下との間はほんの少しだけ空ける） */}
  <div
    className={[
      "mc-name text-center leading-tight",
      wcListNameShellClass(league, isMobile, mobileDense),
      mobileDense
        ? "-mt-0.5"
        : inPredictOverlay && league === "wc"
          ? "mt-0.5"
          : "mt-1.5",
    ].join(" ")}
  >
  {isMobile ? (
    <>
      {league === "nba" ? (
        // ★ NBA（mobile）→ nickname(line2) だけ
        <div
          className="text-[15px] font-bold md:text-[18px]"
          style={teamNameFont}
        >
          {homeL2 || homeL1}
        </div>
      ) : league === "bj" ? (
        // ★ Bリーグ（mobile）→ 2行表示
        <>
          <div
            className="text-[15px] font-bold md:text-[18px]"
            style={teamNameFont}
          >
            {homeL1}
          </div>
          <div
            className="text-[15px] font-bold md:text-[18px]"
            style={teamNameFont}
          >
            {homeL2}
          </div>
        </>
      ) : league === "wc" && mobileDense ? (
        renderWcMobileDenseTeamName(
          joinTeamNameLines(homeL1, homeL2),
          wcListNameTextClass(league, isMobile, mobileDense),
          wcListNameFontStyle(
            league,
            isMobile,
            mobileDense,
            wcTeamNameFont,
            teamNameFont
          )
        )
      ) : (
        // ★ その他リーグ（mobile）
        <div
          className={wcListNameTextClass(league, isMobile, mobileDense)}
          style={wcListNameFontStyle(
            league,
            isMobile,
            mobileDense,
            wcTeamNameFont,
            teamNameFont
          )}
        >
          {joinTeamNameLines(homeL1, homeL2)}
        </div>
      )}
    </>
  ) : (
    <div
      className={wcListNameTextClass(league, isMobile, mobileDense)}
      style={wcListNameFontStyle(
        league,
        isMobile,
        mobileDense,
        wcTeamNameFont,
        teamNameFont
      )}
    >
      {joinTeamNameLines(homeL1, homeL2)}
    </div>
  )}
</div>

  {/* 戦績・順位：ノックアウトはグループステージのみ */}
<div
  className={[
    "mc-record text-center text-[11px] leading-none md:text-[15px]",
    league === "wc" ? wcRecordWidthClass : "",
    mobileDense ? "-mt-0.5 pb-1 md:pb-0.5" : "mt-0 pb-1 md:pb-1",
  ].join(" ")}
>
  {league === "wc" && knockout ? (
    <WcGroupStandingRecordLine
      standing={wcKnockoutHomeStanding}
      language={language}
      compact={mobileDense || isMobile}
    />
  ) : (
    <RecordWithRank r={homeRecord} league={league} />
  )}
</div>
  </div>

{/* ★ ここに挿入 */}
{showRecentForm && homeForm.length > 0 && (
  <div
    className={[
      "w-full flex justify-center",
      mobileDense ? "mt-0" : "mt-1",
    ].join(" ")}
  >
    <div className="flex items-center gap-1">
      <div className="flex gap-[3px]">
        {homeForm.map((result, idx) => {
          const bgColor =
            result === "W"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-300/20"
              : "bg-rose-500/20 text-rose-300 border-rose-300/20";

          return (
            <div
              key={idx}
              className={`
                w-4 h-4 md:w-5 md:h-5 rounded-[5px] flex items-center justify-center
                text-[8px] md:text-[9px] font-bold font-mono leading-none
                backdrop-blur-sm border shrink-0
                ${bgColor}
              `}
            >
              {result}
            </div>
          );
        })}
      </div>
      <span className="text-[10px] md:text-[11px] text-cyan-200/70">→</span>
    </div>
  </div>
)}

</motion.div>


        {/* CENTER（モバイル dense は行の垂直中央にスコアを置く） */}
        <motion.div
          className={`mc-center flex w-full min-w-0 flex-col items-center justify-center text-center ${
            inPredictOverlay
              ? league === "wc"
                ? "pt-[1.15rem] md:pt-[1.35rem]"
                : "pt-[1.35rem] md:pt-[1.55rem]"
              : mobileDense
                ? ""
                : "mt-4 md:mt-1"
          }`}
          {...entryGroupProps(ENTRY_GROUP_TEAMS, 12)}
        >
          {center}
          {showPlayoffSeriesRow && seriesStanding ? (
            <div
              className={[
                "flex justify-center",
                inPredictOverlay ? "mt-0.5" : "mt-1",
                resultStatsMetricNumClass,
              ].join(" ")}
            >
              <span
                className={[
                  "inline-flex items-baseline font-bold tabular-nums",
                  mobileDense
                    ? "text-sm md:text-base"
                    : "text-base md:text-xl lg:text-2xl",
                ].join(" ")}
              >
                <span className="pr-0.5 text-cyan-300/70 md:pr-1">（</span>
                <span
                  className={
                    seriesStanding.homeWins > seriesStanding.awayWins
                      ? "text-yellow-300"
                      : "text-cyan-50"
                  }
                  style={
                    seriesStanding.homeWins > seriesStanding.awayWins
                      ? {
                          textShadow:
                            "0 0 8px rgba(253, 224, 71, 0.5), 0 0 3px rgba(253, 224, 71, 0.65)",
                        }
                      : {
                          textShadow:
                            "0 0 8px rgba(34, 211, 238, 0.35), 0 0 2px rgba(103, 232, 249, 0.45)",
                        }
                  }
                >
                  {seriesStanding.homeWins}
                </span>
                <span className="px-0.5 text-cyan-400/55 md:px-1.5">-</span>
                <span
                  className={
                    seriesStanding.awayWins > seriesStanding.homeWins
                      ? "text-yellow-300"
                      : "text-cyan-50"
                  }
                  style={
                    seriesStanding.awayWins > seriesStanding.homeWins
                      ? {
                          textShadow:
                            "0 0 8px rgba(253, 224, 71, 0.5), 0 0 3px rgba(253, 224, 71, 0.65)",
                        }
                      : {
                          textShadow:
                            "0 0 8px rgba(34, 211, 238, 0.35), 0 0 2px rgba(103, 232, 249, 0.45)",
                        }
                  }
                >
                  {seriesStanding.awayWins}
                </span>
                <span className="pl-0.5 text-cyan-300/70 md:pl-1">）</span>
              </span>
            </div>
          ) : null}
        </motion.div>

        {/* AWAY */}
        <motion.div
          className={[
            "mc-away flex min-w-0 flex-col items-center",
            mobileDense
              ? "mt-0"
              : inPredictOverlay
                ? "mt-0"
                : "-mt-5 md:mt-0",
          ].join(" ")}
          {...entryGroupProps(ENTRY_GROUP_TEAMS, 12)}
        >

  {league !== "wc" && (
    <div
      className={[
        mobileDense ? "mb-0 -mt-3" : "mb-1",
        "text-center font-bold uppercase opacity-85",
        isMobile
          ? "text-xs md:text-sm"
          : "text-sm md:text-base lg:text-lg",
      ].join(" ")}
      style={teamNameFont}
    >
      AWAY
    </div>
  )}

  {/* ユニ・チーム名・戦績（WC は国旗幅を基準に縦積み中央揃え） */}
  <div
    className={[
      league === "wc"
        ? "inline-flex flex-col items-center"
        : "flex w-full flex-col items-center",
    ].join(" ")}
  >
  {/* アイコン：mobile大きく / webそのまま */}
  {league === "wc" ? (
    <WcTeamFlagWithMeta
      teamId={wcAwayTeamId}
      compact={mobileDense || isMobile}
      flagClassName={teamMarkSizeFlag}
      knockout={knockout}
    />
  ) : Icon === Jersey ? (
    <HalftoneJerseyMark
      accent={awayJerseyColor}
      accentEnd={awaySecondaryColor}
      className={teamMarkSizeJersey}
      enableDotReveal={jerseyDotRevealEnabled}
      dotRevealDelayMs={jerseyDotDelayMs}
    />
  ) : (
    <Icon
      className={teamMarkSizeSoccer}
      fill={awayJerseyColor}
      stroke="#fff"
    />
  )}

  {/* チーム名：mobile小さく / webそのまま（ユニ直下との間はほんの少しだけ空ける） */}
  <div
    className={[
      "mc-name text-center leading-tight",
      wcListNameShellClass(league, isMobile, mobileDense),
      mobileDense
        ? "-mt-0.5"
        : inPredictOverlay && league === "wc"
          ? "mt-0.5"
          : "mt-1.5",
    ].join(" ")}
  >
  {isMobile ? (
    <>
      {league === "nba" ? (
        // ★ NBA（mobile）→ nickname(line2) だけ
        <div
          className="text-[15px] font-bold md:text-[18px]"
          style={teamNameFont}
        >
          {awayL2 || awayL1}
        </div>
      ) : league === "bj" ? (
        // ★ Bリーグ（mobile）→ 2行
        <>
          <div
            className="text-[15px] font-bold md:text-[18px]"
            style={teamNameFont}
          >
            {awayL1}
          </div>
          <div
            className="text-[15px] font-bold md:text-[18px]"
            style={teamNameFont}
          >
            {awayL2}
          </div>
        </>
      ) : league === "wc" && mobileDense ? (
        renderWcMobileDenseTeamName(
          joinTeamNameLines(awayL1, awayL2),
          wcListNameTextClass(league, isMobile, mobileDense),
          wcListNameFontStyle(
            league,
            isMobile,
            mobileDense,
            wcTeamNameFont,
            teamNameFont
          )
        )
      ) : (
        // ★ その他リーグ（mobile）
        <div
          className={wcListNameTextClass(league, isMobile, mobileDense)}
          style={wcListNameFontStyle(
            league,
            isMobile,
            mobileDense,
            wcTeamNameFont,
            teamNameFont
          )}
        >
          {joinTeamNameLines(awayL1, awayL2)}
        </div>
      )}
    </>
  ) : (
    <div
      className={wcListNameTextClass(league, isMobile, mobileDense)}
      style={wcListNameFontStyle(
        league,
        isMobile,
        mobileDense,
        wcTeamNameFont,
        teamNameFont
      )}
    >
      {joinTeamNameLines(awayL1, awayL2)}
    </div>
  )}
</div>

<div
  className={[
    "mc-record text-center text-[11px] leading-none md:text-[15px]",
    league === "wc" ? wcRecordWidthClass : "",
    mobileDense ? "-mt-0.5 pb-1 md:pb-0.5" : "mt-0 pb-1 md:pb-1",
  ].join(" ")}
>
  {league === "wc" && knockout ? (
    <WcGroupStandingRecordLine
      standing={wcKnockoutAwayStanding}
      language={language}
      compact={mobileDense || isMobile}
    />
  ) : (
    <RecordWithRank r={awayRecord} league={league} />
  )}
</div>
  </div>

{/* ★ ここに挿入 */}
{showRecentForm && awayForm.length > 0 && (
  <div
    className={[
      "w-full flex justify-center",
      mobileDense ? "mt-0" : "mt-1",
    ].join(" ")}
  >
    <div className="flex items-center gap-1">
      <span className="text-[10px] md:text-[11px] text-cyan-200/70">←</span>
      <div className="flex gap-[3px]">
        {awayForm.map((result, idx) => {
          const bgColor =
            result === "W"
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-300/20"
              : "bg-rose-500/20 text-rose-300 border-rose-300/20";

          return (
            <div
              key={idx}
              className={`
                w-4 h-4 md:w-5 md:h-5 rounded-[5px] flex items-center justify-center
                text-[8px] md:text-[9px] font-bold font-mono leading-none
                backdrop-blur-sm border shrink-0
                ${bgColor}
              `}
            >
              {result}
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

</motion.div>

      </div>

      {showOverlayScheduleMeta ? (
        <motion.div
          className={[
            "flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 text-center",
            wcBroadcastCompact ? "mt-0.5 py-1 md:px-4" : "mt-1.5 py-1.5 md:px-4",
          ].join(" ")}
          initial={entryTransition ? { opacity: 0, y: 8 } : false}
          animate={entryTransition ? { opacity: 1, y: 0 } : undefined}
          transition={entryTransition ? entryTransition(6) : undefined}
        >
          {startAtJst ? (
            <span className="inline-flex items-baseline gap-1.5">
              <span
                className={[
                  "shrink-0 font-semibold text-white/45",
                  wcBroadcastCompact ? "text-xs md:text-sm" : "text-sm md:text-base",
                ].join(" ")}
                style={teamNameFont}
              >
                {m.games.kickoffAt}
              </span>
              <span
                className={[
                  "font-bold tabular-nums tracking-wide text-white/90",
                  wcBroadcastCompact ? "text-xs md:text-sm" : "text-sm md:text-base",
                ].join(" ")}
                style={teamNameFont}
              >
                {fmtKickoffDateTime(startAtJst, displayTimeZone, kickoffLocale)}
              </span>
            </span>
          ) : null}
          {showWcBroadcastRow ? (
            <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5">
              <span
                className={[
                  "shrink-0 font-semibold text-white/45",
                  wcBroadcastCompact ? "text-xs md:text-sm" : "text-sm md:text-base",
                ].join(" ")}
                style={teamNameFont}
              >
                {m.games.broadcasters}
              </span>
              <span
                className={[
                  "flex min-w-0 flex-wrap items-baseline justify-center font-bold tracking-wide text-cyan-100/90",
                ].join(" ")}
                style={teamNameFont}
              >
                {broadcastLabels.map((label, index) => {
                  const cjkName = broadcastNameUsesCjk(label);
                  const nameSizeClass = cjkName
                    ? wcBroadcastCompact
                      ? "text-xs md:text-sm"
                      : "text-sm md:text-base"
                    : wcBroadcastCompact
                      ? "text-sm md:text-base"
                      : "text-base md:text-lg";
                  return (
                    <span
                      key={`${label}-${index}`}
                      className="inline-flex items-baseline"
                    >
                      {index > 0 ? (
                        <span className={[nameSizeClass, "opacity-80"].join(" ")}>
                          {wcBroadcastSep}
                        </span>
                      ) : null}
                      <span className={nameSizeClass}>{label}</span>
                    </span>
                  );
                })}
              </span>
            </span>
          ) : null}
        </motion.div>
      ) : null}

      {showWcBroadcastRow && !overlayCenterMode && showDividerLine ? (
        <motion.div
          className={[
            "flex w-full items-center justify-center gap-2 px-3 text-center",
            wcBroadcastCompact
              ? inPredictOverlay
                ? "mt-0.5 py-0.5 md:px-4"
                : "mt-1 py-1 md:px-4"
              : "mt-2 py-1.5 md:px-4",
          ].join(" ")}
          initial={entryTransition ? { opacity: 0, y: 8 } : false}
          animate={entryTransition ? { opacity: 1, y: 0 } : undefined}
          transition={entryTransition ? entryTransition(6) : undefined}
        >
          <span
            className={[
              "shrink-0 font-semibold text-white/45",
              wcBroadcastCompact
                ? "text-xs md:text-sm"
                : "text-sm md:text-base",
            ].join(" ")}
            style={teamNameFont}
          >
            {m.games.broadcasters}
          </span>
          <span
            className={[
              "flex min-w-0 flex-wrap items-baseline justify-center font-bold tracking-wide text-cyan-100/90",
            ].join(" ")}
            style={teamNameFont}
          >
            {broadcastLabels.map((label, index) => {
              const cjkName = broadcastNameUsesCjk(label);
              const nameSizeClass = cjkName
                ? wcBroadcastCompact
                  ? "text-xs md:text-sm"
                  : "text-sm md:text-base"
                : wcBroadcastCompact
                  ? "text-sm md:text-base"
                  : "text-base md:text-lg";
              return (
                <span key={`${label}-${index}`} className="inline-flex items-baseline">
                  {index > 0 ? (
                    <span
                      className={[
                        nameSizeClass,
                        "opacity-80",
                      ].join(" ")}
                    >
                      {wcBroadcastSep}
                    </span>
                  ) : null}
                  <span className={nameSizeClass}>{label}</span>
                </span>
              );
            })}
          </span>
        </motion.div>
      ) : null}

      {showOverlayMarketBar ? (
        <motion.div
          className={[
            "w-full px-3 md:px-4",
            (showWcBroadcastRow && showDividerLine) ||
              showOverlayScheduleMeta
              ? "pb-1.5 pt-0.5"
              : "pb-1.5 pt-1",
          ].join(" ")}
          initial={entryTransition ? { opacity: 0, y: 6 } : false}
          animate={entryTransition ? { opacity: 1, y: 0 } : undefined}
          transition={entryTransition ? entryTransition(7) : undefined}
        >
          <MatchCardOverlayMarketBar
            gameId={String(id)}
            league={league}
            knockout={knockout}
            status={status}
            score={score}
            language={language}
            fallbackMarketBias={marketBias}
            homeColor={homeColor}
            awayColor={awayColor}
            homeLabel={
              league === "nba"
                ? (homeL2 || homeL1 || "HOME").trim()
                : `${homeL1 ?? ""} ${homeL2 ?? ""}`.trim() || "HOME"
            }
            awayLabel={
              league === "nba"
                ? (awayL2 || awayL1 || "AWAY").trim()
                : `${awayL1 ?? ""} ${awayL2 ?? ""}`.trim() || "AWAY"
            }
            compact={wcBroadcastCompact}
            userPredictionWinner={userPredictionWinner}
          />
        </motion.div>
      ) : null}

      {showMergedResult && resultPost ? (
        <motion.div
          className="w-full px-3 pb-2 pt-0.5 md:px-4 md:pb-2.5"
          initial={entryTransition ? { opacity: 0, y: 6 } : false}
          animate={entryTransition ? { opacity: 1, y: 0 } : undefined}
          transition={entryTransition ? entryTransition(8) : undefined}
        >
          {(wcGoalScorerResult || !hideMergedStatsSection) && (
            <div className="mb-1.5" aria-hidden>
              <div className={RESULT_HAIRLINE} />
            </div>
          )}
          <div className={mobileDense ? "space-y-1.5" : "space-y-2"}>
            {wcGoalScorerResult ? (
              <WcGoalScorerResultRow
                label={m.results.wcGoalScorerLabel}
                info={wcGoalScorerResult}
                compact={isMobile}
                cyberValue={attachOverlayMarketBar || inPredictOverlay}
              />
            ) : null}
            {!hideMergedStatsSection ? (
              <ResultStatsRows
                post={resultPost}
                language={language}
                isMobile={isMobile}
                comfortable
                ratingBarsImmediate={resultRatingBarsImmediate}
                rowIndexOffset={wcGoalScorerResult ? 1 : 0}
              />
            ) : null}
          </div>
        </motion.div>
      ) : null}

      {/* 仕切り線 */}
{showDividerLine && (
  <motion.div
    className={[
      "relative overflow-hidden match-list-cyber-divider",
      dense
        ? mobileDense
          ? "h-[2px] w-full mt-1.5 md:mt-2"
          : "h-[2px] w-full mt-2 md:mt-2.5"
        : "h-[3px] w-full mt-2.5 md:mt-3",
    ].join(" ")}
    style={{
      backgroundColor: leagueLineColor[league],
      transformOrigin: "50% 50%",
    }}
    aria-hidden={true}
    initial={entryTransition ? { opacity: 0, scaleX: 0.06 } : false}
    animate={entryTransition ? { opacity: 1, scaleX: 1 } : undefined}
    transition={entryTransition ? entryTransition(ENTRY_GROUP_FOOTER) : undefined}
  >
    {/* 展開直後に左→右へ一度だけ走るエナジーパルス */}
    {entryTransition && !reduceMotion && (
      <motion.span
        className="absolute inset-y-0 left-0 w-[16%]"
        style={{
          willChange: "transform, opacity",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(220,252,231,0.95) 50%, transparent 100%)",
        }}
        initial={{ x: "-110%", opacity: 0 }}
        animate={{ x: ["-110%", "660%"], opacity: [0, 1, 0.9, 0] }}
        transition={{
          delay:
            entryTransition(ENTRY_GROUP_FOOTER).delay +
            entryTransition(ENTRY_GROUP_FOOTER).duration * 0.45,
          duration: 0.6,
          ease: [0.2, 0, 0.6, 1],
        }}
      />
    )}
  </motion.div>
)}

      {/* ボタン行 */}
      {!hideActions && (
        <motion.div
          className={
            mobileDense
              ? "grid grid-cols-1 gap-1 px-2 py-0.5 md:gap-3 md:px-4 md:py-3"
              : "grid grid-cols-1 gap-2 px-3 py-1.5 md:gap-3 md:px-4 md:py-2.5"
          }
          {...entryGroupProps(ENTRY_GROUP_FOOTER)}
        >
          {/* ▼ 試合別タイムラインへ */}
          {/* ▼ 予想作成ページへ（自分の投稿があれば詳細へ／開始後は未投稿なら“見る”へ） */}
          {/* ▼ 予想をする / 予想済み（全面ヒット時は下段は表示のみで、<a> 内 button を避ける） */}
          {useFullCardHitLayer ? (
            <div
              aria-hidden
              className={[
                predictCtaBaseClass,
                isPredicted && !onOpenPredict ? "cursor-default" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {status === "final"
                ? m.games.finalLabel
                : isGameStarted
                  ? m.games.live
                  : isPredicted
                    ? m.games.predicted
                    : m.games.predict}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleOpenPredict}
              disabled={Boolean(isPredicted && !onOpenPredict)}
              className={[
                predictCtaBaseClass,
                isPredicted && !onOpenPredict
                  ? "cursor-default"
                  : isMobile
                    ? "cursor-pointer"
                    : "active:scale-[0.985] cursor-pointer",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {status === "final"
                ? m.games.finalLabel
                : isGameStarted
                  ? m.games.live
                  : isPredicted
                    ? m.games.predicted
                    : m.games.predict}
            </button>
          )}
        </motion.div>
      )}
      </motion.div>
    </Shell>
  );
}

function MatchCardWithUserLanguage(props: MatchCardProps) {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  return <MatchCardView {...props} language={language} />;
}

function MatchCard(props: MatchCardProps) {
  if (props.language != null) {
    return <MatchCardView {...props} language={props.language} />;
  }
  return <MatchCardWithUserLanguage {...props} />;
}

export default React.memo(MatchCard);
