// app/component/games/MatchCard.tsx
"use client";


import Jersey from "@/app/component/games/icons/Jersey";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import React from "react";
import Soccer from "@/app/component/games/icons/Soccer";
import { motion } from "framer-motion";

/* ★ 追加: イベントロガー */
import { logGameEvent } from "@/lib/analytics/logEvent";
import { GAME_EVENT } from "@/lib/analytics/eventTypes";
/* ★ 追加: 認証トークン取得用 */

import type { League } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import { auth } from "@/lib/firebase";
import LoginRequiredModal from "@/app/component/modals/LoginRequiredModal";
import EventPill from "@/app/component/common/EventPill";
import { getGameEventTag } from "@/lib/events/eventRules";



export type Status = "scheduled" | "live" | "final";

export type TeamSide = {
  name: string;
  colorHex?: string; // 塗り色（チームカラー）
  teamId?: string;   // 必要なら将来ここからカラー取得
};

export type MatchCardProps = {
  id: string;
  league: League;
  venue?: string;
  roundLabel?: string;
  startAtJst: Date | null;
  status: Status;
  home: TeamSide;
  away: TeamSide;
  score: { home: number; away: number } | null;
  liveMeta: { period: string; runningTime?: string } | null;
  finalMeta: { ot?: boolean } | null;

  showRecentForm?: boolean;

  viewPredictionHref: string;
  makePredictionHref: string;
  onOpenPredict?: (gameId: string) => void;
  sharedLayoutId?: string;
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
};



const leagueLineColor: Record<League, string> = {
  bj: "#eab308",   // Bリーグ
  j1: "#22c55e",   // J1
  nba: "#60a5fa",  // NBA
  pl: "#a855f7",   // Premier League（紫系・仮）
};

const pad2 = (n: number) => n.toString().padStart(2, "0");
const fmtKickoff = (d: Date | null) =>
  d ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}` : "--:--";
const fmtRecordWithRank = (
  r: { wins: number; losses: number; rank?: number } | null
) => {
  if (!r) return "(0-0)";
  const record = `(${r.wins}-${r.losses})`;
  if (!r.rank) return record;
  return `${record} :${r.rank}${ordinal(r.rank)}`;
};

function ordinal(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

/** ルートから Web/Mobile の prefix を決定 */
function useSectionPrefix() {
  const pathname = usePathname();
  // 既存のモバイル構成は /m/(with-nav)/... を想定
  if (pathname?.startsWith("/m/")) return "/m/(with-nav)";
  if (pathname?.startsWith("/mobile")) return "/mobile"; // 予備互換
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
  liveMeta,
  finalMeta,
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
  onOpenPredict,
  disableCardMotion = false,
}: MatchCardProps & { className?: string }) {
  const router = useRouter();
  const [showLoginRequired, setShowLoginRequired] = useState(false);

    const [navigating, setNavigating] = useState(false);

const isPredicted = !!myPostId;

    // ▼ 追加：モバイル判定
 // ✅ 追加（既存の useSectionPrefix を使う）
const prefix = useSectionPrefix();
const isMobile = prefix === "/mobile" || prefix.startsWith("/m/");

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
const homeBiasPct = Math.max(0, Math.min(100, marketBias?.homePct ?? 68));
const awayBiasPct = Math.max(0, Math.min(100, marketBias?.awayPct ?? 32));

const marketMajority = useMemo(() => {
  if (Math.abs(homeBiasPct - awayBiasPct) < 0.0001) return "none";
  return homeBiasPct > awayBiasPct ? "home" : "away";
}, [homeBiasPct, awayBiasPct]);



  const jerseyCls = dense
    ? "w-8 h-8 md:w-14 md:h-14"
    : "w-12 h-12 md:w-16 md:h-16";

  // Tailwind に text-1.xl は無いので既に修正済み
  const scoreText = dense ? "text-2xl md:text-5xl" : "text-2xl md:text-6xl";
  const teamText = dense ? "text-sm md:text-base" : "text-base md:text-xl";
  const recordText = dense ? "text-[12px]" : "text-sm";
  const Icon =
  league === "nba" || league === "bj"
    ? Jersey
    : Soccer;


  // 現在のルートから /m or /web を決める & lg を引き継ぎ
  const sp = useSearchParams();
  const lg = sp.get("lg") ?? league;

  // ▼ 統一：試合別タイムライン（分析一覧）
  const predictionsHref = `${prefix}/games/${id}/predictions${lg ? `?lg=${lg}` : ""}`;
  // ▼ 予想をするページ（従来どおり /predict）
  const predictHref = `${prefix}/games/${id}/predict${lg ? `?lg=${lg}` : ""}`;

  // ▼ 自分の投稿詳細（あなたのURL仕様に合わせる：/post/[id]）
  const buildMyPostHref = (postId: string) =>
  `${prefix}/post/${postId}${lg ? `?lg=${lg}` : ""}`;

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
  <div className="flex min-h-[72px] items-center justify-center md:min-h-[88px]">
    <div
      className="text-4xl md:text-6xl leading-none font-black tracking-[0.06em] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
      style={{
        fontFamily:
          'Impact,"Anton","Arial Black",Inter,ui-sans-serif,system-ui,sans-serif',
        fontWeight: 800,
      }}
    >
      VS
    </div>
  </div>
) : isLive ? (
    <span
      className="animate-pulse rounded-full bg-red-500/90 px-2 py-0.5 text-white font-bold uppercase tracking-wide"
      style={{ fontSize: dense ? 10 : 11 }}
    >
      LIVE
    </span>
  ) : (
    <div
      className={`${scoreText} leading-none font-black tabular-nums`}
      style={{
        fontFamily:
          'Impact,"Anton","Arial Black",Inter,ui-sans-serif,system-ui,sans-serif',
        fontWeight: 800,
      }}
    >
      {fmtKickoff(startAtJst)}
    </div>
  );



    if (!inPredictOverlay && status === "live" && score) {
    center = (
      <div className="flex flex-col items-center gap-1">
        <span
          className="animate-pulse rounded-full bg-red-500/90 px-2 py-0.5 text-white font-bold uppercase tracking-wide"
          style={{ fontSize: dense ? 10 : 11 }}
        >
          LIVE
        </span>
        <div
          className={`${scoreText} font-black tabular-nums leading-none`}
          style={{
            fontFamily:
              'Impact,"Anton","Arial Black",Inter,ui-sans-serif,system-ui,sans-serif',
            fontWeight: 800,
          }}
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
      <div className="flex flex-col items-center gap-1">
        <div
          className={`${scoreText} font-black tabular-nums leading-none`}
          style={{
            fontFamily:
              'Impact,"Anton","Arial Black",Inter,ui-sans-serif,system-ui,sans-serif',
            fontWeight: 800,
          }}
        >
          {score.home} <span className="opacity-70">–</span> {score.away}
        </div>
        <div className="text-xs opacity-80">
          Final{finalMeta?.ot ? " (OT)" : ""}
        </div>
      </div>
    );
  }

  const [homeL1, homeL2] = splitTeamNameByLeague(league, home.name);
  const [awayL1, awayL2] = splitTeamNameByLeague(league, away.name);

  /* ★ カード全体タップで click_card を送る（DRY_RUN なので console に出るだけ） */
  const handleClickCard = async () => {
    try {
      const normalizedLeague =
  league === "bj" ? "B1" :
  league === "nba" ? "NBA" :
  league;
      await logGameEvent({
        type: GAME_EVENT.CLICK_CARD,
        gameId: id,
        league: normalizedLeague as "B1" | "J1" | "NBA" | "PL",
      });
    } catch (e) {
      console.warn("log click_card failed", e);
    }
  };

  /* ★ 「予想を見る」クリック時の open_predictions を送る（遷移をブロックしない） */
  const handleOpenPredictions = () => {
    try {
      const normalizedLeague =
  league === "bj" ? "B1" :
  league === "nba" ? "NBA" :
  league;
      void logGameEvent({
        type: GAME_EVENT.OPEN_PREDICTIONS,
        gameId: id,
        league: normalizedLeague as "B1" | "J1" | "NBA" | "PL",
      });
    } catch (e) {
      console.warn("log open_predictions failed", e);
    }
  };

const handleOpenPredict = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  e.stopPropagation();

  const me = auth.currentUser;
  if (!me) {
    setShowLoginRequired(true);
    return;
  }

  // 試合開始後は自分の予想カードだけ開く
  if (isGameStarted) {
    if (myPostId) {
      router.push(buildMyPostHref(myPostId));
    } else {
      alert("この試合のあなたの予想はありません");
    }
    return;
  }

  // 試合前だけ overlay を開く
  onOpenPredict?.(id);
};
  /* ★ 「予想をする」クリック時：
        - 試合前   : 投稿あれば投稿詳細 / なければ予想作成へ
        - 試合開始後: 投稿あれば投稿詳細 / なければ“予想を見る”へ
  */
  const handleMakePrediction = async (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  e.stopPropagation();
if (navigating) return;
setNavigating(true);
  const me = auth.currentUser;

  // ★ 追加：未ログインならモーダルを出して終了
  if (!me) {
    setShowLoginRequired(true);
    return;
  }

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
          router.push(buildMyPostHref(postId));
          return;
        }
        // 念のためのフォールバック（200でpostId無いのは想定外）
        if (isGameStarted) {
          router.push(predictionsHref);
        } else {
          router.push(predictHref);
        }
        return;
      }

      if (res.status === 404) {
        // 自分の投稿が無い
        if (isGameStarted) {
          // 開始後は新規作成させず 予想“を見る”へ
          router.push(predictionsHref);
        } else {
          router.push(predictHref);
        }
        return;
      }

      if (res.status === 409) {
        // サーバー側が「開始後ロック」を返したケース
        router.push(predictionsHref);
        return;
      }

      if (res.status === 401 || res.status === 403) {
        alert("ログインが必要です。");
        return;
      }

      // その他の失敗は安全側で「見る」へ（開始前なら作成へ）
      if (isGameStarted) {
        router.push(predictionsHref);
      } else {
        router.push(predictHref);
      }
     } catch {
      // 通信失敗時も上と同じフォールバック
      if (isGameStarted) {
        router.push(predictionsHref);
      } else {
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
    backgroundColor: "transparent",
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
    backgroundColor: "transparent",
    boxShadow: "none",
  };

return (
<motion.div
  layout={!disableCardMotion}
  layoutId={sharedLayoutId}
className={[
  "group relative overflow-hidden text-white",
  "max-w-[1200px] mx-auto",
  disableCardMotion
    ? ""
    : [
        "transition-transform duration-300",
        navigating
          ? "scale-[0.992] opacity-95"
          : "hover:-translate-y-[2px] hover:scale-[1.003]",
      ].join(" "),
dense
  ? "rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.025)_42%,rgba(255,255,255,0.015)_100%),linear-gradient(180deg,rgba(5,8,20,0.80)_0%,rgba(5,8,20,0.80)_100%)] backdrop-blur-xl shadow-[0_14px_34px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.04)]"
  : "rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_42%,rgba(255,255,255,0.018)_100%),linear-gradient(180deg,rgba(5,8,20,0.80)_0%,rgba(5,8,20,0.80)_100%)] backdrop-blur-xl shadow-[0_18px_44px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.20),inset_0_-1px_0_rgba(255,255,255,0.05)]",
    hideLine ? "pb-3 md:pb-4" : "",
    className || "",
  ].join(" ")}
 style={{
  willChange: "transform",
}}
  onClick={handleClickCard}
>



{showMarketBias && marketBias && (
  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
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
  className="pointer-events-none absolute inset-[1px] rounded-2xl"
  style={{
    boxShadow: `
      inset 0 0 0 1px rgba(255,255,255,0.06),
      inset 0 12px 24px rgba(255,255,255,0.03)
    `,
  }}
/>



      <div
  aria-hidden
  className="pointer-events-none absolute inset-0 rounded-2xl"
  style={{
background:
  "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.008) 26%, rgba(255,255,255,0.00) 46%)",
  }}
/>
      {(() => {
  const tag = getGameEventTag(roundLabel);
  if (!tag) return null;

  return (
    
    <div className="absolute top-2 right-2 z-20">
      <EventPill label={tag.label} color={tag.color} />
    </div>
  );
})()}


      <div
  className={`${
    dense ? "px-3 pt-3 mb-1" : "px-4 pt-3 mb-1"
  } ${inPredictOverlay ? "pb-0" : ""}`}
>
        {!!roundLabel && (
  <div className="mc-round text-center font-bold text-l md:text-2xl mb-1">
    {roundLabel}
  </div>
)}

<div className="h-4 md:h-5"></div>
      </div>

      <div
        className={`grid grid-cols-3 ${
          dense ? "items-start gap-1 px-3 py-0" : "items-center gap-2 px-4 py-4"
        }`}
      >
        {/* HOME */}
<div className="mc-home flex flex-col items-center -mt-5 md:mt-0">

  {/* HOME ラベル：mobile 小 / web 通常 */}
  <div className="text-xs md:text-sm font-bold uppercase tracking-wide opacity-85 mb-1">
  HOME
</div>

  <Icon
  className={`jersey-icon w-11 h-11 md:${jerseyCls}`}
  fill={homeColor}
  stroke="#fff"
/>

  {/* チーム名：mobile小さく / webそのまま */}
  <div className="mc-name mt-1 text-center leading-tight">
  {isMobile ? (
    <>
      {league === "nba" ? (
        // ★ NBA（mobile）→ nickname(line2) だけ
        <div
          className="text-[12px] md:text-base"
          style={{
            fontFamily:
              '"Hiragino Kaku Gothic Std","ヒラギノ角ゴ Std","Hiragino Kaku Gothic ProN","Hiragino Kaku Gothic Pro",Meiryo,"Noto Sans JP",sans-serif',
          }}
        >
          {homeL2 || homeL1}
        </div>
      ) : league === "bj" ? (
        // ★ Bリーグ（mobile）→ 2行表示
        <>
          <div
            className="text-[12px] md:text-base"
            style={{
              fontFamily:
                '"Hiragino Kaku Gothic Std","ヒラギノ角ゴ Std","Hiragino Kaku Gothic ProN","Hiragino Kaku Gothic Pro",Meiryo,"Noto Sans JP",sans-serif',
            }}
          >
            {homeL1}
          </div>
          <div
            className="text-[12px] md:text-base"
            style={{
              fontFamily:
                '"Hiragino Kaku Gothic Std","ヒラギノ角ゴ Std","Hiragino Kaku Gothic ProN","Hiragino Kaku Gothic Pro",Meiryo,"Noto Sans JP",sans-serif',
            }}
          >
            {homeL2}
          </div>
        </>
      ) : (
        // ★ その他リーグ（mobile）
        <div
          className="text-[12px] md:text-base"
          style={{
            fontFamily:
              '"Hiragino Kaku Gothic Std","ヒラギノ角ゴ Std","Hiragino Kaku Gothic ProN","Hiragino Kaku Gothic Pro",Meiryo,"Noto Sans JP",sans-serif',
          }}
        >
          {homeL1} {homeL2}
        </div>
      )}
    </>
  ) : (
    // ★ PC(web) → 従来どおり1行表示
    <div
      className="text-[12px] md:text-base"
      style={{
        fontFamily:
          '"Hiragino Kaku Gothic Std","ヒラギノ角ゴ Std","Hiragino Kaku Gothic ProN","Hiragino Kaku Gothic Pro",Meiryo,"Noto Sans JP",sans-serif',
      }}
    >
      {homeL1} {homeL2}
    </div>
  )}
</div>


  {/* 戦績（record）は mobile 小・web 通常でOK） */}
<div className="mc-record text-[10px] md:text-sm opacity-70 mt-0.5 leading-none tracking-tight">
  {fmtRecordWithRank(homeRecord)}
</div>

{/* ★ ここに挿入 */}
{showRecentForm && homeForm.length > 0 && (
  <div className="mt-1 w-full flex justify-center">
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

</div>


        {/* CENTER */}
<div
  className={`mc-center flex flex-col items-center justify-center ${
    inPredictOverlay ? "-mt-2 md:-mt-3" : "mt-4 md:mt-1"
  }`}
>
  {center}
</div>

        {/* AWAY */}
<div className="mc-away flex flex-col items-center -mt-5 md:mt-0">

  {/* AWAY ラベル：mobile 小 / web 通常 */}
 <div className="text-xs md:text-sm font-bold uppercase tracking-wide opacity-85 mb-1">
  AWAY
</div>

  {/* アイコン：mobile大きく / webそのまま */}
  <Icon
  className={`jersey-icon w-11 h-11 md:${jerseyCls}`}
  fill={awayColor}
  stroke="#fff"
/>

  {/* チーム名：mobile小さく / webそのまま */}
  <div className="mc-name mt-1 text-center leading-tight">
  {isMobile ? (
    <>
      {league === "nba" ? (
        // ★ NBA（mobile）→ nickname(line2) だけ
        <div
          className="text-[12px] md:text-base"
          style={{
            fontFamily:
              '"Hiragino Kaku Gothic Std","ヒラギノ角ゴ Std","Hiragino Kaku Gothic ProN","Hiragino Kaku Gothic Pro",Meiryo,"Noto Sans JP",sans-serif',
          }}
        >
          {awayL2 || awayL1}
        </div>
      ) : league === "bj" ? (
        // ★ Bリーグ（mobile）→ 2行
        <>
          <div
            className="text-[12px] md:text-base"
            style={{
              fontFamily:
                '"Hiragino Kaku Gothic Std","ヒラギノ角ゴ Std","Hiragino Kaku Gothic ProN","Hiragino Kaku Gothic Pro",Meiryo,"Noto Sans JP",sans-serif',
            }}
          >
            {awayL1}
          </div>
          <div
            className="text-[12px] md:text-base"
            style={{
              fontFamily:
                '"Hiragino Kaku Gothic Std","ヒラギノ角ゴ Std","Hiragino Kaku Gothic ProN","Hiragino Kaku Gothic Pro",Meiryo,"Noto Sans JP",sans-serif',
            }}
          >
            {awayL2}
          </div>
        </>
      ) : (
        // ★ その他リーグ（mobile）
        <div
          className="text-[12px] md:text-base"
          style={{
            fontFamily:
              '"Hiragino Kaku Gothic Std","ヒラギノ角ゴ Std","Hiragino Kaku Gothic ProN","Hiragino Kaku Gothic Pro",Meiryo,"Noto Sans JP",sans-serif',
          }}
        >
          {awayL1} {awayL2}
        </div>
      )}
    </>
  ) : (
    // ★ PC（web）は従来どおり  
    <div
      className="text-[12px] md:text-base"
      style={{
        fontFamily:
          '"Hiragino Kaku Gothic Std","ヒラギノ角ゴ Std","Hiragino Kaku Gothic ProN","Hiragino Kaku Gothic Pro",Meiryo,"Noto Sans JP",sans-serif',
      }}
    >
      {awayL1} {awayL2}
    </div>
  )}
</div>


<div className="mc-record text-[10px] md:text-sm opacity-70 mt-0.5 leading-none tracking-tight">
  {fmtRecordWithRank(awayRecord)}
</div>

{/* ★ ここに挿入 */}
{showRecentForm && awayForm.length > 0 && (
  <div className="mt-1 w-full flex justify-center">
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

</div>

      </div>

      {/* 仕切り線 */}
{!hideLine && (
  <div
    className={
      dense
        ? "h-[2px] w-full mt-2 md:mt-2" 
        : "h-[3px] w-full mt-3 md:mt-3" 
    }
    style={{ backgroundColor: leagueLineColor[league] }}
    aria-hidden={true}
  />
)}

      {/* ボタン行 */}
      {!hideActions && (
        <div className="grid grid-cols-1 gap-2 px-3 py-2 md:gap-3 md:px-4 md:py-3">
          {/* ▼ 試合別タイムラインへ */}
          {/* ▼ 予想作成ページへ（自分の投稿があれば詳細へ／開始後は未投稿なら“見る”へ） */}
          {/* ▼ 予想をする / 予想済み */}
<button
  type="button"
  onClick={handleOpenPredict}
  className={[
    "grid w-full place-items-center font-bold text-white",
    "h-8 text-sm px-2 md:h-12 md:text-base",
    "rounded-md",
    "active:scale-[0.985] transition-all duration-200",
  ].join(" ")}
  style={isPredicted ? predictedStyle : normalStyle}
>
{status === "final"
  ? "試合終了"
  : isGameStarted
  ? "試合中"
  : isPredicted
  ? "予想済み"
  : "予想をする"}
</button>
        </div>
      )}
      <LoginRequiredModal
  open={showLoginRequired}
  onClose={() => setShowLoginRequired(false)}
  variant={isMobile ? "mobile" : "web"}
/>
    </motion.div>
  );
}
export default React.memo(MatchCard);
