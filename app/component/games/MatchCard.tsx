// app/component/games/MatchCard.tsx
"use client";

import Link from "next/link";
import Jersey from "@/app/component/games/icons/Jersey";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/* ★ 追加: イベントロガー */
import { logGameEvent } from "@/lib/analytics/logEvent";
import { GAME_EVENT } from "@/lib/analytics/eventTypes";
/* ★ 追加: 認証トークン取得用 */
import { auth } from "@/lib/firebase";
import type { League } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

function useTeamRecord(teamId?: string) {
  const [rec, setRec] = useState<{ wins: number; losses: number } | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const ref = doc(db, "teams", teamId);
    getDoc(ref).then((snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      setRec({
        wins: d.wins ?? 0,
        losses: d.losses ?? 0,
      });
    });
  }, [teamId]);

  return rec;
}


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

  /** 互換維持のため残す（内部では未使用） */
  viewPredictionHref: string;
  makePredictionHref: string;

  dense?: boolean;
  hideLine?: boolean;
  hideActions?: boolean;
};

const leagueLineColor: Record<League, string> = {
  bj: "#eab308",   // Bリーグ
  j1: "#22c55e",    // J1（仮）→今後使わないなら何色でもOK
  nba: "#60a5fa",  // NBA（色は仮）
};

const pad2 = (n: number) => n.toString().padStart(2, "0");
const fmtKickoff = (d: Date | null) =>
  d ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}` : "--:--";
const fmtRecord = (r: { wins: number; losses: number } | null) => {
  if (!r) return "(0-0)";
  return `(${r.wins}-${r.losses})`;
};

/** ルートから Web/Mobile の prefix を決定 */
function useSectionPrefix() {
  const pathname = usePathname();
  // 既存のモバイル構成は /m/(with-nav)/... を想定
  if (pathname?.startsWith("/m/")) return "/m/(with-nav)";
  if (pathname?.startsWith("/mobile")) return "/mobile"; // 予備互換
  return "/web";
}

export default function MatchCard({
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
  // 互換で受け取るが内部では使わない
  viewPredictionHref,
  makePredictionHref,
  dense = false,
  hideLine = false,
  hideActions = false,
  className,
}: MatchCardProps & { className?: string }) {
  const router = useRouter();

    // ▼ 追加：モバイル判定
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 768;

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
const homeRecord = useTeamRecord(home.teamId);
const awayRecord = useTeamRecord(away.teamId);

const homeColor =
  getTeamPrimaryColor(normalizedLeague, home.teamId) ?? "#0ea5e9";

const awayColor =
  getTeamPrimaryColor(normalizedLeague, away.teamId) ?? "#f43f5e";

  const jerseyCls = dense
    ? "w-8 h-8 md:w-14 md:h-14"
    : "w-12 h-12 md:w-16 md:h-16";

  // Tailwind に text-1.xl は無いので既に修正済み
  const scoreText = dense ? "text-2xl md:text-5xl" : "text-2xl md:text-6xl";
  const teamText = dense ? "text-sm md:text-base" : "text-base md:text-xl";
  const recordText = dense ? "text-[12px]" : "text-sm";
  const Icon = Jersey;  // NBA も B1 も同じアイコンで良い

  // 現在のルートから /m or /web を決める & lg を引き継ぎ
  const prefix = useSectionPrefix();
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

  let center: React.ReactNode = (
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

  if (status === "live" && score) {
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

  if (status === "final" && score) {
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
        league: normalizedLeague as "B1" | "J1",
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
        league: normalizedLeague as "B1" | "J1",
      });
    } catch (e) {
      console.warn("log open_predictions failed", e);
    }
  };

  /* ★ 「予想をする」クリック時：
        - 試合前   : 投稿あれば投稿詳細 / なければ予想作成へ
        - 試合開始後: 投稿あれば投稿詳細 / なければ“予想を見る”へ
  */
  const handleMakePrediction = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    try {
      e.preventDefault();
      e.stopPropagation();

      const me = auth.currentUser;
      const token = me ? await me.getIdToken() : null;

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
    }
  };

  return (
    <div
      className={[
        "text-white",
        dense
          ? "rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm shadow"
          : "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-md",
        hideLine ? "pb-3 md:pb-4" : "",
        className || "",
      ].join(" ")}
      onClick={handleClickCard}
    >
      <div className={`${dense ? "px-3 pt-3 mb-1" : "px-4 pt-4 mb-1"}`}>
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
  <div className="text-[11px] md:text-sm font-bold uppercase tracking-wide opacity-80 mb-1">
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
    {fmtRecord(homeRecord)}
  </div>

</div>


        {/* CENTER */}
        <div className="mc-center flex flex-col items-center justify-center mt-4 md:mt-1">
  {center}
</div>

        {/* AWAY */}
<div className="mc-away flex flex-col items-center -mt-5 md:mt-0">

  {/* AWAY ラベル：mobile 小 / web 通常 */}
  <div className="text-[11px] md:text-sm font-bold uppercase tracking-wide opacity-80 mb-1">
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


  {/* 戦績（record） */}
  <div className="mc-record text-[10px] md:text-sm opacity-70 mt-0.5 leading-none tracking-tight">
    {fmtRecord(awayRecord)}
  </div>

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
        <div className="grid grid-cols-2 gap-2 px-3 py-2 md:gap-3 md:px-4 md:py-3">
          {/* ▼ 試合別タイムラインへ */}
          <Link
            href={predictionsHref}
            onClick={handleOpenPredictions}
            className="rounded-lg bg-white/15 hover:bg-white/25 text-white grid place-items-center font-bold h-8 text-sm px-2 md:h-12 md:text-base active:scale-90 transition-transform"
            aria-label="その試合の分析一覧（予想を見る）"
          >
            予想を見る
          </Link>

          {/* ▼ 予想作成ページへ（自分の投稿があれば詳細へ／開始後は未投稿なら“見る”へ） */}
          <Link
            href={predictHref}
            onClick={handleMakePrediction}
            className="rounded-lg bg-white/15 hover:bg-white/25 text-white grid place-items-center font-bold h-8 text-sm px-2 md:h-12 md:text-base active:scale-90 transition-transform"
            aria-label="予想をする"
          >
            予想をする
          </Link>
        </div>
      )}
    </div>
  );
}
