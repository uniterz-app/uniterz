// app/component/games/MatchCard.tsx
"use client";


import HalftoneJerseyMark from "@/app/component/games/HalftoneJerseyMark";
import CountryFlag from "@/app/component/games/CountryFlag";
import Jersey from "@/app/component/games/icons/Jersey";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useCallback } from "react";
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
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { TIMEZONE_ET, TIMEZONE_JST } from "@/lib/time/zonedTime";
import { t } from "@/lib/i18n/t";

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
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import {
  MOBILE_LIST_CARD_OUTER_CLASS,
  MOBILE_LIST_CARD_PANEL_DENSE,
  MOBILE_PREDICT_OVERLAY_CARD_OUTER_CLASS,
} from "@/lib/games/mobileListCardLayout";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
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
  /** regular | play_in | playoffs; omitted/null = regular. */
  seasonPhase?: "regular" | "play_in" | "playoffs" | null;
  venue?: string;
  roundLabel?: string;
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
inPredictOverlay?: boolean;
myPostId?: string | null;
homeRecord?: {
  wins: number;
  losses: number;
  rank?: number;
  lastGames?: { at?: any; isWin?: boolean }[];
} | null;
  awayRecord?: {
  wins: number;
  losses: number;
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
}: {
  r: { wins: number; losses: number; rank?: number } | null;
}) {
  if (!r) {
    return (
      <span className={[resultStatsMetricNumClass, "opacity-70"].join(" ")}>
        (0-0)
      </span>
    );
  }
  const record = `(${r.wins}-${r.losses})`;
  if (!r.rank) {
    return (
      <span className={[resultStatsMetricNumClass, "opacity-70"].join(" ")}>
        {record}
      </span>
    );
  }
  return (
    <span
      className={[
        resultStatsMetricNumClass,
        "inline-flex max-w-full flex-wrap items-baseline justify-center gap-x-2 opacity-85",
      ].join(" ")}
    >
      <span className="tabular-nums">{record}</span>
      <span className="tabular-nums whitespace-nowrap">{`:${r.rank}${ordinal(r.rank)}`}</span>
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

function MatchCard({
  id,
  league,
  venue,
  roundLabel,
  startAtJst,
  status,
  home,
  away,
  score,
  seriesStanding = null,
  liveMeta,
  finalMeta,
  seasonPhase = null,
  viewPredictionHref,
  makePredictionHref,
  dense = false,
  hideLine = false,
  showRecentForm = false,
  hideActions = false,
  marketBias,
  showMarketBias = false,
  inPredictOverlay = false,
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
}: MatchCardProps) {
  const router = useRouter();

  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const displayTimeZone = language === "en" ? TIMEZONE_ET : TIMEZONE_JST;

    const [navigating, setNavigating] = useState(false);
  // Full-area tap: scale the whole card shell (transparent overlay alone shows no motion).
  const [fullCardPressed, setFullCardPressed] = useState(false);

const isPredicted = !!myPostId;

    // ▼ 追加：モバイル判定
 // ✅ 追加（既存の useSectionPrefix を使う）
const prefix = useSectionPrefix();
const pathname = usePathname();
const isMobile = prefix === "/mobile" || prefix.startsWith("/m/");
  /** モバイル dense / W杯コンパクト一覧 */
  const mobileDense = (dense && isMobile) || (compact && league === "wc");
  const teamNameFont = bracketMarketTeamTypography(isMobile);
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
  const teamMarkSizeFlag = dense
    ? isMobile
      ? "w-[4.5rem] h-[3rem] md:w-[5.5rem] md:h-[3.7rem] mb-2"
      : "w-[4.5rem] h-[3rem] md:w-[5.5rem] md:h-[3.7rem] mb-2"
    : "w-[4.75rem] h-[3.2rem] md:w-[6.25rem] md:h-[4.2rem] mb-2";
  const teamMarkSizeJersey = dense
    ? isMobile
      ? "jersey-icon w-[3.875rem] h-[3.875rem] md:w-20 md:h-20"
      : "jersey-icon w-16 h-16 md:w-20 md:h-20"
    : isMobile
      ? "jersey-icon w-[4.125rem] h-[4.125rem] md:w-24 md:h-24"
      : "jersey-icon w-[4.25rem] h-[4.25rem] md:w-24 md:h-24";

  // Tailwind に text-1.xl は無いので既に修正済み
  const scoreText = dense ? "text-xl md:text-4xl" : "text-xl md:text-5xl";
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

let center: React.ReactNode = inPredictOverlay ? (
  status === "final" && score ? (
    <div
      className={
        mobileDense
          ? "flex min-h-[44px] flex-col items-center justify-center gap-0.5 md:min-h-[68px]"
          : "flex min-h-[72px] flex-col items-center justify-center gap-1 md:min-h-[88px]"
      }
    >
      <div
        className={[
          "text-2xl leading-none tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] md:text-5xl",
          resultStatsMetricNumClass,
        ].join(" ")}
      >
        {score.home} <span className="opacity-70">–</span> {score.away}
      </div>
      <div
        className="text-[10px] font-medium text-white/75 md:text-xs"
        style={teamNameFont}
      >
        {m.games.finalLabel}
        {finalMeta?.ot ? " (OT)" : ""}
      </div>
    </div>
  ) : status === "live" && score ? (
    <div
      className={
        mobileDense
          ? "flex min-h-[44px] flex-col items-center justify-center gap-0.5 md:min-h-[68px]"
          : "flex min-h-[72px] flex-col items-center justify-center gap-1 md:min-h-[88px]"
      }
    >
      <div
        className={[
          "text-2xl leading-none tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] md:text-5xl",
          resultStatsMetricNumClass,
        ].join(" ")}
      >
        {score.home} <span className="opacity-70">–</span> {score.away}
      </div>
      {liveMeta?.period ? (
        <div className="text-[10px] text-white/75 md:text-xs">
          {liveMeta.period}
          {liveMeta.runningTime ? ` ${liveMeta.runningTime}` : ""}
        </div>
      ) : null}
    </div>
  ) : (
    <div
      className={
        mobileDense
          ? "flex min-h-[44px] items-center justify-center md:min-h-[68px]"
          : "flex min-h-[72px] items-center justify-center md:min-h-[88px]"
      }
    >
      <div
        className={[
          "text-2xl leading-none tracking-wide text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] md:text-5xl",
          resultStatsMetricNumClass,
        ].join(" ")}
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
    <div
      className={[scoreText, "leading-none", resultStatsMetricNumClass].join(
        " "
      )}
    >
      {fmtKickoff(startAtJst, displayTimeZone)}
    </div>
  );



    if (!inPredictOverlay && status === "live" && score) {
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
        <div
          className={[scoreText, "leading-none", resultStatsMetricNumClass].join(
            " "
          )}
        >
          {score.home} <span className="opacity-70">–</span> {score.away}
        </div>
        {liveMeta?.period && (
          <div className="text-xs opacity-80">
            {liveMeta.period}
            {liveMeta.runningTime ? ` ${liveMeta.runningTime}` : ""}
          </div>
        )}
      </div>
    );
  }

  if (!inPredictOverlay && status === "final" && score) {
    center = (
      <div
        className={
          mobileDense
            ? "flex flex-col items-center gap-0.5"
            : "flex flex-col items-center gap-1"
        }
      >
        <div
          className={[scoreText, "leading-none", resultStatsMetricNumClass].join(
            " "
          )}
        >
          {score.home} <span className="opacity-70">–</span> {score.away}
        </div>
        <div className="text-xs opacity-80" style={teamNameFont}>
          {m.games.finalLabel}
          {finalMeta?.ot ? " (OT)" : ""}
        </div>
      </div>
    );
  }

  const [homeL1, homeL2] = splitTeamNameByLeague(league, home.name);
  const [awayL1, awayL2] = splitTeamNameByLeague(league, away.name);

  /** Same behavior as the predict CTA (schedule overlay when logged in). */
  const triggerOpenPredictLikeButton = () => {
    const me = auth.currentUser;
    if (!me) return;

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


const predictedStyle: React.CSSProperties = {
  background: `
    radial-gradient(95% 220% at 50% 50%,
      rgba(148,163,184,0.22) 0%,
      rgba(100,116,139,0.14) 42%,
      rgba(71,85,105,0.06) 66%,
      rgba(71,85,105,0.00) 100%
    )
  `,
  boxShadow: "none",
};

const normalStyle: React.CSSProperties = {
  background: `
    radial-gradient(92% 230% at 50% 50%,
      rgba(59,130,246,0.92) 0%,
      rgba(37,99,235,0.88) 36%,
      rgba(29,78,216,0.58) 58%,
      rgba(29,78,216,0.20) 74%,
      rgba(29,78,216,0.05) 84%,
      rgba(29,78,216,0.00) 100%
    )
  `,
  boxShadow: "none",
};

return (
<motion.div
  layout={
    !isMobile && !disableCardMotion && !sharedTransitionBaseKey
  }
  layoutId={isMobile ? undefined : sharedLayoutId}
  // backdrop-blur 要素の transform は毎フレーム再ブラーを誘発するため、入場は opacity のみ。
  // 行レベルでは動かさず、カードの出現はこのフェード一本に集約する
  initial={entryTransition ? { opacity: 0 } : false}
  animate={
    entryTransition
      ? { scale: cardShellPressScale, opacity: 1 }
      : useFullCardHitLayer
        ? { scale: cardShellPressScale }
        : undefined
  }
  transition={
    isMobile
      ? entryTransition
        ? {
            scale: {
              type: "tween" as const,
              delay: entryTransition(ENTRY_GROUP_SHELL).delay,
              ...(useFullCardHitLayer && !reduceMotion
                ? {
                    duration: 0.12,
                    ease: "easeOut" as const,
                  }
                : {
                    duration: entryTransition(ENTRY_GROUP_SHELL).duration + 0.06,
                    ease: entryTransition(ENTRY_GROUP_SHELL).ease,
                  }),
            },
            opacity: {
              type: "tween" as const,
              delay: entryTransition(ENTRY_GROUP_SHELL).delay,
              duration: entryTransition(ENTRY_GROUP_SHELL).duration * 0.55,
              ease: entryTransition(ENTRY_GROUP_SHELL).ease,
            },
          }
        : useFullCardHitLayer && !reduceMotion
          ? {
              scale: {
                type: "tween" as const,
                duration: 0.12,
                ease: "easeOut",
              },
            }
          : {}
      : {
          layout: { duration: 0.22 },
          ...(entryTransition
            ? {
                scale: {
                  type: "tween" as const,
                  delay: entryTransition(ENTRY_GROUP_SHELL).delay,
                  ...(useFullCardHitLayer && !reduceMotion
                    ? {
                        duration: 0.12,
                        ease: "easeOut",
                      }
                    : {
                        duration: entryTransition(ENTRY_GROUP_SHELL).duration + 0.06,
                        ease: entryTransition(ENTRY_GROUP_SHELL).ease,
                      }),
                },
                opacity: {
                  type: "tween" as const,
                  delay: entryTransition(ENTRY_GROUP_SHELL).delay,
                  duration: entryTransition(ENTRY_GROUP_SHELL).duration * 0.55,
                  ease: entryTransition(ENTRY_GROUP_SHELL).ease,
                },
              }
            : useFullCardHitLayer && !reduceMotion
              ? {
                  scale: {
                    type: "tween" as const,
                    duration: 0.12,
                    ease: "easeOut",
                  },
                }
              : {}),
        }
  }
className={[
  "group relative overflow-hidden text-white",
  inPredictOverlay && isMobile
    ? MOBILE_PREDICT_OVERLAY_CARD_OUTER_CLASS
    : mobileDense
      ? MOBILE_LIST_CARD_OUTER_CLASS
      : "mx-auto max-w-[1200px] w-full",
disableCardMotion
  ? ""
  : isMobile
    ? ""
    : [
        "transition-opacity duration-200",
        navigating ? "opacity-90" : "",
      ].join(" "),
dense
  ? MOBILE_LIST_CARD_PANEL_DENSE
  : "rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_42%,rgba(255,255,255,0.012)_100%),linear-gradient(180deg,rgba(8,8,8,0.18)_0%,rgba(8,8,8,0.18)_100%)] backdrop-blur-xl shadow-[0_14px_36px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(255,255,255,0.04)]",
    isPredicted ? "!border-zinc-500/50" : "",
    hideLine
      ? mobileDense
        ? "pb-1 md:pb-2"
        : "pb-2 md:pb-3"
      : "",
    className || "",
  ].join(" ")}
 style={{
  transformOrigin: "50% 50%",
  ...(isMobile ? {} : { willChange: "transform" as const }),
  ...(vtBoundsName
    ? ({
        viewTransitionName: vtBoundsName,
        ...(vtBoundsName !== "none"
          ? { viewTransitionClass: "schedule-shared-bounds" }
          : {}),
      } as React.CSSProperties)
    : {}),
}}
>
      {useFullCardHitLayer ? (
        onOpenPredict ? (
          <motion.div
            role="button"
            tabIndex={0}
            aria-label={m.games.openPrediction}
            className={[
              "absolute inset-0 z-[12] cursor-pointer touch-manipulation rounded-2xl",
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
              "absolute inset-0 z-[12] cursor-pointer touch-manipulation rounded-2xl",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(5,8,20,0.92)]",
            ].join(" ")}
            prefetch={false}
            {...fullCardPressHandlers}
          />
        )
      ) : null}

      <motion.div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-2xl"
        // 背景テクスチャはシェルと同時にフェードのみ（カード内で別々に動かさない）
        initial={entryTransition ? { opacity: 0 } : false}
        animate={entryTransition ? { opacity: 1 } : undefined}
        transition={entryTransition ? entryTransition(ENTRY_GROUP_SHELL) : undefined}
        aria-hidden
      >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.14]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />

{/* 試合終了後は市場バイアスの色帯・境界線を出さない */}
{showMarketBias && marketBias && status !== "final" && (
  <div className="pointer-events-none absolute inset-0 z-1 overflow-hidden rounded-2xl">
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

<div
  aria-hidden
  className="pointer-events-none absolute inset-px rounded-2xl"
  style={{
    boxShadow: `
      inset 0 0 0 1px rgba(255,255,255,0.04),
      inset 0 12px 24px rgba(255,255,255,0.018)
    `,
  }}
/>



      <div
  aria-hidden
  className="pointer-events-none absolute inset-0 rounded-2xl"
  style={{
background:
  "linear-gradient(180deg, rgba(255,255,255,0.016) 0%, rgba(255,255,255,0.006) 26%, rgba(255,255,255,0.00) 46%)",
  }}
/>
      </motion.div>

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
            : dense
              ? "mb-0.5 px-3 pt-2"
              : "mb-0.5 px-4 pt-2",
          inPredictOverlay ? "pb-0" : "",
        ].join(" ")}
        {...entryGroupProps(ENTRY_GROUP_HEADER)}
      >
        {!!roundLabel && (
          <div
            className={[
              "mc-round text-center font-bold",
              mobileDense
                ? "mt-3 mb-0 text-xl leading-snug md:text-2xl"
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
          className={mobileDense ? "h-0 md:h-1" : "h-2.5 md:h-3.5"}
          aria-hidden
        />
      </motion.div>

      <div
        className={`grid grid-cols-3 ${
          mobileDense
            ? "items-center gap-0 px-2 py-0"
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
            "mc-home flex flex-col items-center",
            mobileDense ? "mt-0" : "-mt-5 md:mt-0",
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

  {/* ユニ・チーム名・戦績（モバイル dense 時もラッパーでまとめるのみ） */}
  <div className="flex w-full flex-col items-center">
  {league === "wc" ? (
    <CountryFlag teamId={home.teamId} className={teamMarkSizeFlag} />
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
      mobileDense ? "-mt-0.5" : "mt-1.5",
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
      ) : (
        // ★ その他リーグ（mobile）
        <div
          className="text-[15px] font-bold md:text-[18px]"
          style={teamNameFont}
        >
          {homeL1} {homeL2}
        </div>
      )}
    </>
  ) : (
    <div
      className="text-base font-bold leading-tight md:text-xl lg:text-2xl"
      style={teamNameFont}
    >
      {homeL1} {homeL2}
    </div>
  )}
</div>


  {/* 戦績・順位：総合得点などと同じ Oxanium（下のリーグ線用の下パディングのみ） */}
<div
  className={[
    "mc-record text-[11px] leading-none md:text-[15px]",
    mobileDense ? "-mt-0.5 pb-1 md:pb-0.5" : "mt-0 pb-1 md:pb-1",
  ].join(" ")}
>
  <RecordWithRank r={homeRecord} />
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
              ? "-mt-2 md:-mt-3"
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
                "mt-1 flex justify-center",
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
            "mc-away flex flex-col items-center",
            mobileDense ? "mt-0" : "-mt-5 md:mt-0",
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

  {/* ユニ・チーム名・戦績（モバイル dense 時もラッパーでまとめるのみ） */}
  <div className="flex w-full flex-col items-center">
  {/* アイコン：mobile大きく / webそのまま */}
  {league === "wc" ? (
    <CountryFlag teamId={away.teamId} className={teamMarkSizeFlag} />
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
      mobileDense ? "-mt-0.5" : "mt-1.5",
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
      ) : (
        // ★ その他リーグ（mobile）
        <div
          className="text-[15px] font-bold md:text-[18px]"
          style={teamNameFont}
        >
          {awayL1} {awayL2}
        </div>
      )}
    </>
  ) : (
    <div
      className="text-base font-bold leading-tight md:text-xl lg:text-2xl"
      style={teamNameFont}
    >
      {awayL1} {awayL2}
    </div>
  )}
</div>


<div
  className={[
    "mc-record text-[11px] leading-none md:text-[15px]",
    mobileDense ? "-mt-0.5 pb-1 md:pb-0.5" : "mt-0 pb-1 md:pb-1",
  ].join(" ")}
>
  <RecordWithRank r={awayRecord} />
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

      {/* 仕切り線 */}
{!hideLine && (
  <motion.div
    className={[
      "relative overflow-hidden",
      dense
        ? mobileDense
          ? "h-[2px] w-full mt-1.5 md:mt-2"
          : "h-[2px] w-full mt-2 md:mt-2.5"
        : "h-[3px] w-full mt-2.5 md:mt-3",
    ].join(" ")}
    style={{
      backgroundColor: leagueLineColor[league],
      transformOrigin: "50% 50%",
      // グローは静的に持たせ、入場は opacity / scaleX のみ（boxShadow の tween は毎フレーム再描画になる）
      boxShadow:
        "0 0 16px rgba(34,211,238,0.5), 0 0 5px rgba(94,234,212,0.35)",
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
                "grid w-full place-items-center font-bold text-white",
                "h-8 text-[13px] px-2 md:h-12 md:text-[15px]",
                "rounded-md",
                isMobile ? "" : "transition-all duration-200",
                isPredicted && !onOpenPredict ? "cursor-default" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={isPredicted ? predictedStyle : normalStyle}
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
                "grid w-full place-items-center font-bold text-white",
                "h-8 text-[13px] px-2 md:h-12 md:text-[15px]",
                "rounded-md",
                isMobile
                  ? ""
                  : "transition-all duration-200",
                isPredicted && !onOpenPredict
                  ? "cursor-default"
                  : isMobile
                    ? "cursor-pointer"
                    : "active:scale-[0.985] cursor-pointer",
              ]
                .filter(Boolean)
                .join(" ")}
              style={isPredicted ? predictedStyle : normalStyle}
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
  );
}
export default React.memo(MatchCard);
