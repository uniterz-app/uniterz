"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { auth } from "@/lib/firebase";
import type { MatchCardProps } from "@/app/component/games/MatchCard";
import { toast } from "@/app/component/ui/toast";
import { logGameEvent } from "@/lib/analytics/logEvent";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import GameTeamStats from "@/app/component/predict/GameTeamStats";
import NbaStandingsPanel from "@/app/component/standings/NbaStandingsPanel";

/* ======================
   Motion
====================== */
const pageContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
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
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/");
  const prefix = isMobile ? "/mobile" : "/web";

  const gameDateKey = useMemo(() => {
    return game.startAtJst
      ? game.startAtJst.toISOString().slice(0, 10)
      : undefined;
  }, [game.startAtJst]);

  const [winner, setWinner] = useState<Winner | null>(null);
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [standingsOpen, setStandingsOpen] = useState(false);

  const formTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const isSoccer = game.league === "pl" || game.league === "j1";
  const showStandings = game.league === "nba";

  const homeSafe = game?.home ?? { name: "Home", colorHex: "#ef4444" };
  const awaySafe = game?.away ?? { name: "Away", colorHex: "#3b82f6" };

  const [homeL1, homeL2] = splitTeamNameByLeague(game.league, homeSafe.name);
  const [awayL1, awayL2] = splitTeamNameByLeague(game.league, awaySafe.name);

  const setStandingsState = useCallback(
    (open: boolean) => {
      setStandingsOpen(open);
      onStandingsOpenChange?.(open);
    },
    [onStandingsOpenChange]
  );

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

  const fieldBase =
    "w-full rounded-xl border border-white/15 bg-white/[0.10] px-4 py-3 text-left text-base font-medium text-white placeholder-white/35 outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.12]";

  const glassCard =
    "rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-md px-4 py-3";

  const toolButtonBase =
    "flex h-11 w-full items-center justify-center rounded-2xl border text-sm font-semibold transition-all duration-200";

  const standingsHrefBase = isMobile ? "/mobile/teams" : "/web/teams";

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const me = auth.currentUser;
    if (!me) {
      alert("ログインが必要です");
      return;
    }

    const h = Number(scoreHome);
    const a = Number(scoreAway);

    if (Number.isNaN(h) || Number.isNaN(a)) {
      alert("スコアを正しく入力してください");
      return;
    }

    if (winner === "home" && h <= a) {
      alert("ホーム勝利予想の場合、ホーム得点を多くしてください");
      return;
    }
    if (winner === "away" && a <= h) {
      alert("アウェイ勝利予想の場合、アウェイ得点を多くしてください");
      return;
    }
    if (isSoccer && winner === "draw" && h !== a) {
      alert("引き分け予想の場合、スコアは同点にしてください");
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

      if (!res.ok) {
        throw new Error(raw || `投稿失敗 (${res.status})`);
      }

      let json: any = {};
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`APIがJSONではなくHTMLを返しました (${res.status})`);
      }

      try {
        const normalizedLeague =
          game.league === "bj"
            ? "B1"
            : game.league === "j1"
            ? "J1"
            : game.league.toUpperCase();

        void logGameEvent({
          type: "predict",
          gameId: (game as any).id,
          league: normalizedLeague,
        });
      } catch {}

      toast.success("予想を投稿しました");
      onPostCreated?.({ id: json.id ?? "(local)", at: new Date() });

      if (!inOverlay) {
        router.push(`${prefix}/games?date=${gameDateKey}`);
      }

      setWinner(null);
      setScoreHome("");
      setScoreAway("");
    } catch (e: any) {
      alert(e.message ?? "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      variants={pageContainer}
      initial="hidden"
      animate="show"
      className={[
        "mx-auto w-full max-w-[900px] overflow-x-hidden text-white",
        embedded
          ? "min-h-0 overflow-y-visible pb-2"
          : "min-h-screen overflow-y-auto overflow-x-hidden overscroll-none pb-2",
      ].join(" ")}
      style={{
        overscrollBehaviorX: "none",
        touchAction: "pan-y",
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
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setStatsOpen((v) => !v)}
            className={[
              toolButtonBase,
              statsOpen
                ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                : "border-white/10 bg-white/[0.035] text-white/88 hover:bg-white/[0.06]",
            ].join(" ")}
          >
            <span>詳細スタッツ</span>
            <ChevronDown
              size={16}
              className={[
                "ml-2 transition-transform duration-200",
                statsOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!showStandings) return;
              setStandingsState(!standingsOpen);
            }}
            disabled={!showStandings}
            className={[
              toolButtonBase,
              standingsOpen
                ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                : showStandings
                ? "border-white/10 bg-white/[0.035] text-white/88 hover:bg-white/[0.06]"
                : "cursor-not-allowed border-white/10 bg-white/[0.02] text-white/35",
            ].join(" ")}
          >
            <span>Standings</span>
            <ChevronDown
              size={16}
              className={[
                "ml-2 transition-transform duration-200",
                standingsOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>
        </motion.div>

        {statsOpen && (
          <motion.div variants={fadeUp} className={glassCard}>
            <div className="mb-3 text-sm font-semibold text-white/90">
              詳細スタッツ
            </div>
            <div className="border-t border-white/10 pt-3">
              <GameTeamStats
                league={game.league}
                homeTeamId={game.home.teamId ?? ""}
                awayTeamId={game.away.teamId ?? ""}
              />
            </div>
          </motion.div>
        )}

        {standingsOpen && (
          <motion.div variants={fadeUp} className={glassCard}>
            <div className="mb-3 text-sm font-semibold text-white/90">
              Standings
            </div>
            <div className="border-t border-white/10 pt-3">
              {showStandings ? (
                <NbaStandingsPanel
                  teamHrefBase={standingsHrefBase}
                  useLiveSnapshot={isMobile}
                  compact={isMobile}
                />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/65">
                  このリーグでは Standings はまだ未対応です。
                </div>
              )}
            </div>
          </motion.div>
        )}

        <motion.div variants={fadeUp} className={`space-y-3 pt-1 ${glassCard}`}>
          <div className="text-sm font-semibold text-white/88">スコア予想</div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-2 text-sm font-semibold text-white/88">
                {homeLabel}
              </div>
              <input
                type="number"
                inputMode="numeric"
                className={fieldBase}
                placeholder="得点"
                value={scoreHome}
                onChange={(e) => setScoreHome(e.target.value)}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-white/88">
                {awayLabel}
              </div>
              <input
                type="number"
                inputMode="numeric"
                className={fieldBase}
                placeholder="得点"
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
              "flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold",
              "border backdrop-blur-xl transition-all duration-200",
              "drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]",
              canSubmit
                ? [
                    "border-yellow-300/45 text-[#1c1200]",
                    "bg-gradient-to-b from-yellow-300 to-amber-400",
                    "shadow-[0_10px_28px_rgba(250,204,21,0.28)]",
                    "hover:from-yellow-200 hover:to-amber-300",
                    "active:scale-[0.98]",
                  ].join(" ")
                : "cursor-not-allowed border-white/15 bg-white/6 text-white/40",
            ].join(" ")}
          >
            {submitting ? "投稿中…" : "予想する"}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}