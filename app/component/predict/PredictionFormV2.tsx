"use client";

import {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { auth } from "@/lib/firebase";
import type { MatchCardProps } from "@/app/component/games/MatchCard";
import { toast } from "@/app/component/ui/toast";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import GameTeamStats from "@/app/component/predict/GameTeamStats";
import GamePredictionDistribution from "@/app/component/predict/GamePredictionDistribution";
import NbaStandingsPanel from "@/app/component/standings/NbaStandingsPanel";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import PredictNextGameModal from "@/app/component/predict/PredictNextGameModal";
import {
  findNextUnpredictedScheduledGameInList,
  getNextScheduledGameIdOnSameDay,
} from "@/lib/games/nextPredictGame";
import {
  readPredictNextGameModalSkip,
  writePredictNextGameModalSkip,
} from "@/lib/predict/nextGameModalPrefs";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";

/* ======================
   Motion
====================== */
/** hidden で親を不透明にして、子の initial が効く前の 1 フレーム露出を防ぐ（モバイル遷移のカクつき対策） */
const pageContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      opacity: { duration: 0.16, ease: "easeOut" },
      staggerChildren: 0.045,
      delayChildren: 0.03,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: "easeOut" } },
};

type Props = {
  dense?: boolean;
  game: MatchCardProps;
  user: { name: string; avatarUrl?: string | null; verified?: boolean };
  onPostCreated?: (payload: { id: string; at: Date }) => void;
  onStandingsOpenChange?: (open: boolean) => void;
  inOverlay?: boolean;
  embedded?: boolean;
  /** Games オーバーレイ: 閉じる（同日に次試合がない・ユーザーがいいえ） */
  onClosePredictOverlay?: () => void;
  /** Games オーバーレイ: 次の試合へ切り替え（はい） */
  onSwitchOverlayGame?: (gameId: string) => void;
  /** オーバーレイで「次へ」に出せる試合 ID（当日リストに無い試合は除外） */
  overlayScheduleGameIds?: string[];
  /** 当日の試合一覧（次試合のチーム名・カラー表示用） */
  overlayScheduleGames?: MatchCardProps[];
  /** 当日リストのうち、すでに自分が予想投稿済みの gameId（次試合モーダルでスキップ） */
  overlayPredictedGameIds?: string[];
};

type Winner = "home" | "away" | "draw";

export default function PredictionFormV2({
  dense = false,
  game,
  user,
  onPostCreated,
  onStandingsOpenChange,
  inOverlay = false,
  embedded = false,
  onClosePredictOverlay,
  onSwitchOverlayGame,
  overlayScheduleGameIds,
  overlayScheduleGames,
  overlayPredictedGameIds,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/");
  const prefix = isMobile ? "/mobile" : "/web";
  const { language } = useUserLanguage(auth.currentUser?.uid ?? null);
  const isEn = language === "en";

  const gameDateKey = useMemo(() => {
    return game.startAtJst
      ? game.startAtJst.toISOString().slice(0, 10)
      : undefined;
  }, [game.startAtJst]);

  const [winner, setWinner] = useState<Winner | null>(null);
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toolsTab, setToolsTab] = useState<
    null | "stats" | "market" | "standings"
  >(null);
  const [marketChartKey, setMarketChartKey] = useState(0);
  /** Games オーバーレイ: 投稿後モーダル用の次試合 */
  const [nextGamePreview, setNextGamePreview] = useState<MatchCardProps | null>(
    null
  );

  const formTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const isSoccer = game.league === "pl" || game.league === "j1";
  const showStandings = game.league === "nba";

  const homeSafe = game?.home ?? { name: "Home", colorHex: "#ef4444" };
  const awaySafe = game?.away ?? { name: "Away", colorHex: "#3b82f6" };

  const [homeL1, homeL2] = splitTeamNameByLeague(game.league, homeSafe.name);
  const [awayL1, awayL2] = splitTeamNameByLeague(game.league, awaySafe.name);

  useEffect(() => {
    onStandingsOpenChange?.(toolsTab === "standings");
  }, [toolsTab, onStandingsOpenChange]);

  useLayoutEffect(() => {
    if (toolsTab === "market") {
      setMarketChartKey((k) => k + 1);
    }
  }, [toolsTab]);

  // チーム詳細から戻ったとき ?standings=1 でスタンディングを開いた状態にする
  useEffect(() => {
    if (searchParams.get("standings") !== "1") return;
    if (!showStandings) return;
    setToolsTab("standings");
  }, [searchParams, showStandings]);

  function getMobileTeamLabel(
    league: MatchCardProps["league"],
    l1: string,
    l2: string
  ) {
    if (!isMobile) return `${l1} ${l2}`.trim();
    if (league === "nba") return l2 || l1;
    return `${l1} ${l2}`.trim();
  }

  const homeLabel = getMobileTeamLabel(game.league, homeL1, homeL2);
  const awayLabel = getMobileTeamLabel(game.league, awayL1, awayL2);
  const predictTeamNameTy = bracketMarketTeamTypography(isMobile);

  useEffect(() => {
    const h = Number(scoreHome);
    const a = Number(scoreAway);

    if (scoreHome === "" || scoreAway === "") {
      setWinner(null);
      return;
    }

    if (Number.isNaN(h) || Number.isNaN(a)) {
      setWinner(null);
      return;
    }

    if (h > a) {
      setWinner("home");
      return;
    }

    if (a > h) {
      setWinner("away");
      return;
    }

    if (isSoccer && h === a) {
      setWinner("draw");
      return;
    }

    setWinner(null);
  }, [scoreHome, scoreAway, isSoccer]);

  const canSubmit =
    !!winner && !submitting && scoreHome !== "" && scoreAway !== "";

  const scoreInputClass = [
    "w-full rounded-xl border border-white/15 bg-white/[0.10] text-left text-white placeholder-white/35 outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.12]",
    resultStatsMetricNumClass,
    // iOS Safari: 16px 未満だとフォーカス時に自動ズームする
    isMobile ? "px-3.5 py-2.5 text-base" : "px-4 py-3 text-base",
  ].join(" ");

  const glassCard =
    "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-md px-4 py-3";

  const glassCardStatsPanel = isMobile
    ? "relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] backdrop-blur-md px-3 py-2.5"
    : glassCard;

  const toolButtonBase = isMobile
    ? "flex h-9 w-full items-center justify-center rounded-xl border px-1.5 text-xs font-semibold transition-all duration-200"
    : "flex h-11 w-full items-center justify-center rounded-2xl border text-sm font-semibold transition-all duration-200";

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const me = auth.currentUser;
    if (!me) return;

    const h = Number(scoreHome);
    const a = Number(scoreAway);

    if (Number.isNaN(h) || Number.isNaN(a)) {
      alert(isEn ? "Please enter valid scores." : "スコアを正しく入力してください");
      return;
    }

    if (winner === "home" && h <= a) {
      alert(
        isEn
          ? "For a home-win prediction, the home score must be higher."
          : "ホーム勝利予想の場合、ホーム得点を多くしてください"
      );
      return;
    }
    if (winner === "away" && a <= h) {
      alert(
        isEn
          ? "For an away-win prediction, the away score must be higher."
          : "アウェイ勝利予想の場合、アウェイ得点を多くしてください"
      );
      return;
    }
    if (isSoccer && winner === "draw" && h !== a) {
      alert(
        isEn
          ? "For a draw prediction, both scores must be equal."
          : "引き分け予想の場合、スコアは同点にしてください"
      );
      return;
    }

    try {
      setSubmitting(true);
      const idToken = await me.getIdToken();

      const body = {
        gameId: (game as any).id,
        league: game.league,
        authorUid: me.uid,
        prediction: {
          winner,
          score: { home: h, away: a },
        },
      };

      const res = await fetch("/api/posts_v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      const raw = await res.text().catch(() => "");

      let json: any = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        if (!res.ok) {
          throw new Error(
            raw?.slice(0, 200) || `投稿失敗 (${res.status})`
          );
        }
        throw new Error(
          `APIがJSONではなくHTMLを返しました (${res.status})`
        );
      }

      if (!res.ok) {
        const detail =
          (typeof json?.message === "string" && json.message) ||
          (typeof json?.error === "string" && json.error) ||
          raw?.slice(0, 200);
        throw new Error(detail || `投稿失敗 (${res.status})`);
      }

      toast.success(isEn ? "Prediction submitted." : "予想を投稿しました");
      onPostCreated?.({ id: json.id ?? "(local)", at: new Date() });

      setWinner(null);
      setScoreHome("");
      setScoreAway("");

      if (inOverlay) {
        if (readPredictNextGameModalSkip()) {
          onClosePredictOverlay?.();
        } else {
          const skip = new Set(
            (overlayPredictedGameIds ?? []).map((id) => String(id))
          );
          const currentId = String((game as any).id);

          let nextId: string | null = null;
          if (overlayScheduleGames?.length) {
            nextId = findNextUnpredictedScheduledGameInList(
              overlayScheduleGames,
              currentId,
              game.league,
              skip
            );
          } else if (game.startAtJst) {
            try {
              nextId = await getNextScheduledGameIdOnSameDay({
                currentGameId: currentId,
                league: game.league,
                dayAnchor: game.startAtJst,
                skipGameIds: skip,
              });
            } catch {
              /* ignore */
            }
          }
          const nextInSchedule =
            nextId &&
            (!overlayScheduleGameIds?.length ||
              overlayScheduleGameIds.some(
                (id) => String(id) === String(nextId)
              ));
          const preview =
            nextInSchedule && nextId
              ? overlayScheduleGames?.find(
                  (p) => String(p.id) === String(nextId)
                ) ?? null
              : null;
          if (preview) {
            setNextGamePreview(preview);
          } else {
            onClosePredictOverlay?.();
          }
        }
      } else {
        router.push(`${prefix}/games?date=${gameDateKey}`);
      }
    } catch (e: any) {
      alert(e.message ?? (isEn ? "Failed to submit." : "送信に失敗しました"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextModalYes = useCallback(
    (dontShowAgain: boolean) => {
      if (dontShowAgain) writePredictNextGameModalSkip();
      const id = nextGamePreview?.id;
      setNextGamePreview(null);
      if (id) onSwitchOverlayGame?.(String(id));
    },
    [nextGamePreview, onSwitchOverlayGame]
  );

  const handleNextModalNo = useCallback(
    (dontShowAgain: boolean) => {
      if (dontShowAgain) writePredictNextGameModalSkip();
      setNextGamePreview(null);
      onClosePredictOverlay?.();
    },
    [onClosePredictOverlay]
  );

  const nextModal =
    typeof document !== "undefined" && nextGamePreview
      ? createPortal(
          <PredictNextGameModal
            open
            isEn={isEn}
            league={nextGamePreview.league}
            homeName={nextGamePreview.home?.name ?? ""}
            awayName={nextGamePreview.away?.name ?? ""}
            homeTeamId={nextGamePreview.home?.teamId}
            awayTeamId={nextGamePreview.away?.teamId}
            homeColorHex={nextGamePreview.home?.colorHex}
            awayColorHex={nextGamePreview.away?.colorHex}
            onYes={handleNextModalYes}
            onNo={handleNextModalNo}
          />,
          document.body
        )
      : null;

  return (
    <>
    <motion.div
      variants={pageContainer}
      initial="hidden"
      animate="show"
      className={[
        "mx-auto w-full max-w-[900px] overflow-x-hidden text-white",
        embedded
          ? "min-h-0 overflow-y-visible pb-2"
          : [
              isMobile ? "min-h-svh" : "min-h-screen",
              "overflow-y-auto overflow-x-hidden overscroll-none pb-bottom-nav",
            ].join(" "),
      ].join(" ")}
      style={{
        overscrollBehaviorX: "none",
        touchAction: "pan-y",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
      onTouchStartCapture={(e) => {
        const t = e.touches[0];
        if (!t) return;
        formTouchStartRef.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchMoveCapture={(e) => {
        const start = formTouchStartRef.current;
        const t = e.touches[0];
        if (!start || !t) return;

        const dx = Math.abs(t.clientX - start.x);
        const dy = Math.abs(t.clientY - start.y);

        if (dx > dy && dx > 8) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onTouchEndCapture={() => {
        formTouchStartRef.current = null;
      }}
      onTouchCancelCapture={() => {
        formTouchStartRef.current = null;
      }}
    >
      <div className="space-y-4 overflow-x-hidden">
        <motion.div
          variants={fadeUp}
          className={["grid grid-cols-3", isMobile ? "gap-1.5" : "gap-2"].join(
            " "
          )}
        >
          <button
            type="button"
            onClick={() =>
              setToolsTab((t) => (t === "stats" ? null : "stats"))
            }
            className={[
              toolButtonBase,
              toolsTab === "stats"
                ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                : "border-white/10 bg-white/[0.035] text-white/88 hover:bg-white/6",
            ].join(" ")}
          >
            <span className={isMobile ? "truncate" : ""}>
              {isEn ? "Stats" : "詳細スタッツ"}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setToolsTab((t) => (t === "market" ? null : "market"))
            }
            className={[
              toolButtonBase,
              toolsTab === "market"
                ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                : "border-white/10 bg-white/[0.035] text-white/88 hover:bg-white/6",
            ].join(" ")}
          >
            <span className={isMobile ? "truncate" : ""}>
              {isEn ? "Market" : "市場"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!showStandings) return;
              setToolsTab((t) => (t === "standings" ? null : "standings"));
            }}
            disabled={!showStandings}
            className={[
              toolButtonBase,
              toolsTab === "standings"
                ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                : showStandings
                  ? "border-white/10 bg-white/[0.035] text-white/88 hover:bg-white/6"
                  : "cursor-not-allowed border-white/10 bg-white/2 text-white/35",
            ].join(" ")}
          >
            <span className={isMobile ? "truncate" : ""}>
              {isEn ? "Standings" : "順位表"}
            </span>
          </button>
        </motion.div>

        {toolsTab === "stats" && (
          <motion.div variants={fadeUp} className={glassCardStatsPanel}>
            <ShellGridOverlay
              roundedClassName={isMobile ? "rounded-xl" : "rounded-2xl"}
            />
            <div className="relative z-1">
            <div
              className={
                isMobile
                  ? "mb-2 text-xs font-semibold text-white/90"
                  : "mb-3 text-sm font-semibold text-white/90"
              }
            >
              {isEn ? "Stats" : "詳細スタッツ"}
            </div>
            <div
              className={
                isMobile
                  ? "border-t border-white/10 pt-2"
                  : "border-t border-white/10 pt-3"
              }
            >
              <GameTeamStats
                league={game.league}
                homeTeamId={game.home.teamId ?? ""}
                awayTeamId={game.away.teamId ?? ""}
                language={language}
              />
            </div>
            </div>
          </motion.div>
        )}

        {toolsTab === "market" && (
          <motion.div variants={fadeUp} className={glassCardStatsPanel}>
            <ShellGridOverlay
              roundedClassName={isMobile ? "rounded-xl" : "rounded-2xl"}
            />
            <div className="relative z-1">
            <GamePredictionDistribution
              gameId={(game as { id: string }).id}
              league={game.league}
              homeName={homeSafe.name}
              awayName={awaySafe.name}
              homeColor={homeSafe.colorHex ?? "#ef4444"}
              awayColor={awaySafe.colorHex ?? "#3b82f6"}
              variant="predictForm"
              chartReplayKey={marketChartKey}
              fallbackMarketBias={game.marketBias}
            />
            </div>
          </motion.div>
        )}

        {toolsTab === "standings" && (
          <motion.div variants={fadeUp} className={glassCardStatsPanel}>
            <ShellGridOverlay
              roundedClassName={isMobile ? "rounded-xl" : "rounded-2xl"}
            />
            <div className="relative z-1">
            <div
              className={
                isMobile
                  ? "mb-2 text-xs font-semibold text-white/90"
                  : "mb-3 text-sm font-semibold text-white/90"
              }
            >
              {isEn ? "Standings" : "順位表"}
            </div>
            <div
              className={
                isMobile
                  ? "border-t border-white/10 pt-2"
                  : "border-t border-white/10 pt-3"
              }
            >
              {showStandings ? (
                <NbaStandingsPanel compact={isMobile} />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/3 px-4 py-4 text-sm text-white/65">
                  {isEn
                    ? "Standings are not available for this league yet."
                    : "このリーグでは Standings はまだ未対応です。"}
                </div>
              )}
            </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeUp} className={`space-y-3 pt-1 ${glassCard}`}>
          <div className="text-sm font-semibold text-white/88">
            {isEn ? "Score Prediction" : "スコア予想"}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div
                className="mb-2 text-sm font-bold text-white/88"
                style={predictTeamNameTy}
              >
                {homeLabel}
              </div>
              <input
                type="number"
                inputMode="numeric"
                className={scoreInputClass}
                placeholder={isEn ? "Score" : "得点"}
                value={scoreHome}
                onChange={(e) => setScoreHome(e.target.value)}
              />
            </div>

            <div>
              <div
                className="mb-2 text-sm font-bold text-white/88"
                style={predictTeamNameTy}
              >
                {awayLabel}
              </div>
              <input
                type="number"
                inputMode="numeric"
                className={scoreInputClass}
                placeholder={isEn ? "Score" : "得点"}
                value={scoreAway}
                onChange={(e) => setScoreAway(e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="pt-0">
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={[
              "flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold text-white",
              "border backdrop-blur-xl transition-all duration-200",
              "drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]",
              canSubmit
                ? [
                    "border-blue-500/40",
                    "active:scale-[0.98]",
                  ].join(" ")
                : "cursor-not-allowed border-white/15 bg-white/6 text-white/40",
            ].join(" ")}
            style={
              canSubmit
                ? {
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
                  }
                : undefined
            }
          >
            {submitting ? (isEn ? "Submitting..." : "投稿中…") : isEn ? "Submit Prediction" : "予想する"}
          </button>
        </motion.div>
      </div>
    </motion.div>
    {nextModal}
    </>
  );
}