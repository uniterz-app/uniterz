"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { auth } from "@/lib/firebase";
import type { MatchCardProps } from "@/app/component/games/MatchCard";
import { toast } from "@/app/component/ui/toast";
import { logGameEvent } from "@/lib/analytics/logEvent";
import { useRouter, usePathname } from "next/navigation";
import { Alfa_Slab_One } from "next/font/google";
import { ChevronDown } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import GameTeamStats from "@/app/component/predict/GameTeamStats";

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

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });

type Props = {
  dense?: boolean;
  game: MatchCardProps;
  user: { name: string; avatarUrl?: string | null; verified?: boolean };
  onPostCreated?: (payload: { id: string; at: Date }) => void;
  inOverlay?: boolean;
  embedded?: boolean;
};

type Winner = "home" | "away" | "draw";

export default function PredictionFormV2({
  dense = false,
  game,
  user,
  onPostCreated,
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
  const [confidence, setConfidence] = useState(50);
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [draggingSlider, setDraggingSlider] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const sliderWrapRef = useRef<HTMLDivElement | null>(null);
  const formTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const isSoccer = game.league === "pl" || game.league === "j1";

  const homeSafe = game?.home ?? { name: "Home", colorHex: "#ef4444" };
  const awaySafe = game?.away ?? { name: "Away", colorHex: "#3b82f6" };

  const [homeL1, homeL2] = splitTeamNameByLeague(game.league, homeSafe.name);
  const [awayL1, awayL2] = splitTeamNameByLeague(game.league, awaySafe.name);

  const handleSliderTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      setDraggingSlider(true);
      e.stopPropagation();
    },
    []
  );

  const handleSliderTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (draggingSlider) {
        e.stopPropagation();
      }
    },
    [draggingSlider]
  );

  const handleSliderTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      setDraggingSlider(false);
      e.stopPropagation();
    },
    []
  );

  const handleSliderPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setDraggingSlider(true);
      e.stopPropagation();
    },
    []
  );

  const handleSliderPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (draggingSlider) {
        e.stopPropagation();
      }
    },
    [draggingSlider]
  );

  const handleSliderPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setDraggingSlider(false);
      e.stopPropagation();
    },
    []
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
          confidence,
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
      setConfidence(50);
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
        {/* 詳細スタッツ */}
        <motion.div variants={fadeUp} className={glassCard}>
          <div
            onClick={() => setStatsOpen((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between"
          >
            <div className="text-sm font-semibold text-white/90">
              詳細スタッツ
            </div>

            <ChevronDown
              size={18}
              className={`text-white/70 transition-transform duration-200 ${
                statsOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {statsOpen && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <GameTeamStats
                league={game.league}
                homeTeamId={game.home.teamId ?? ""}
                awayTeamId={game.away.teamId ?? ""}
              />
            </div>
          )}
        </motion.div>

        {/* 自信度 */}
        <motion.div variants={fadeUp} className={`pt-1 ${glassCard}`}>
          <div className="mb-2 text-sm font-semibold text-white/88">自信度</div>

          <div
            ref={sliderWrapRef}
            className="w-full overflow-x-hidden"
            onTouchStartCapture={handleSliderTouchStart}
            onTouchMoveCapture={handleSliderTouchMove}
            onTouchEndCapture={handleSliderTouchEnd}
            onTouchCancelCapture={() => setDraggingSlider(false)}
            onPointerDownCapture={handleSliderPointerDown}
            onPointerMoveCapture={handleSliderPointerMove}
            onPointerUpCapture={handleSliderPointerUp}
            onPointerCancelCapture={() => setDraggingSlider(false)}
          >
            <input
              type="range"
              min={1}
              max={100}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="block w-full max-w-full"
              style={{ touchAction: "pan-x" }}
            />
          </div>

          <div className="mt-1 text-right text-sm text-white/60">
            <span
              className={`text-2xl font-bold tabular-nums text-white ${alfa.className}`}
            >
              {confidence}
            </span>
            <span className="ml-1">%</span>
          </div>
        </motion.div>

        {/* スコア入力 */}
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

        {/* 投稿 */}
        <motion.div variants={fadeUp} className="pt-0">
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={[
              "flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold",
              "border border-white/15 backdrop-blur-xl transition-all duration-200",
              "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]",
              canSubmit
                ? "bg-white/12 shadow-[0_6px_22px_rgba(255,255,255,0.08)] hover:bg-white/18 active:scale-[0.98]"
                : "cursor-not-allowed bg-white/6 text-white/40",
            ].join(" ")}
          >
            {submitting ? "投稿中…" : "予想する"}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}