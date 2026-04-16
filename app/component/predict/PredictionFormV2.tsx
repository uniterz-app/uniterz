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
import { motion, type Variants } from "framer-motion";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { normalizeLeague } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import GameTeamStats from "@/app/component/predict/GameTeamStats";
import NbaPostseasonMatchupPanel from "@/app/component/predict/NbaPostseasonMatchupPanel";
import { resolveNbaH2HPack } from "@/lib/data/nba/h2h/resolveNbaH2HPack";
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
  /** Games オーバーレイ: この試合の自分の投稿 ID（あれば修正 UI） */
  overlayExistingPostId?: string | null;
};

type Winner = "home" | "away" | "draw";

/** MatchCard と同趣旨：試合開始済み（未投稿ならスコア予想 UI を出さない） */
function isMatchStartedForPredict(game: MatchCardProps): boolean {
  const { status, startAtJst } = game;
  if (status === "live" || status === "final") return true;
  if (status === "scheduled" && startAtJst instanceof Date) {
    try {
      return Date.now() >= startAtJst.getTime();
    } catch {
      /* ignore */
    }
  }
  return false;
}

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
  overlayExistingPostId = null,
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
    null | "stats" | "market" | "standings" | "h2h"
  >(null);
  const [marketChartKey, setMarketChartKey] = useState(0);
  /** Games オーバーレイ: 投稿後モーダル用の次試合 */
  const [nextGamePreview, setNextGamePreview] = useState<MatchCardProps | null>(
    null
  );

  type ExistingSnap =
    | null
    | "loading"
    | {
        editable: boolean;
        prediction: {
          winner: Winner;
          score: { home: number; away: number };
        };
      };

  /** オーバーレイで既存投稿を読み込んだ結果（修正可否・表示用） */
  const [existingSnapshot, setExistingSnapshot] = useState<ExistingSnap>(null);
  /** true のときスコア入力を出して PATCH 更新可能 */
  const [showScoreEdit, setShowScoreEdit] = useState(false);

  /**
   * 一覧オーバーレイ以外（/predict 単体）で、自分の投稿 ID を API で解決した結果。
   * skip = オーバーレイ（オーバーレイは overlayExistingPostId を使う）
   */
  const [standaloneMine, setStandaloneMine] = useState<
    "skip" | "loading" | { postId: string | null }
  >(() => (inOverlay ? "skip" : "loading"));

  const formTouchStartRef = useRef<{ x: number; y: number } | null>(null);

  const isSoccer = game.league === "pl" || game.league === "j1";
  const showStandings = game.league === "nba";
  /** Playoffs / Play-In: 直接対決 / 市場 / 詳細スタッツの3タブ（順位表タブなし） */
  const isNbaPostseasonTools =
    game.league === "nba" &&
    (game.seasonPhase === "playoffs" || game.seasonPhase === "play_in");
  const showStandingsTab = showStandings && !isNbaPostseasonTools;

  const homeSafe = game?.home ?? { name: "Home", colorHex: "#0ea5e9" };
  const awaySafe = game?.away ?? { name: "Away", colorHex: "#f43f5e" };

  /** 市場ドーナツ: MatchCard と同じく teamId からチームカラー（未登録時のみ colorHex / 既定） */
  const normalizedLeague = normalizeLeague(game.league);
  const homeMarketColor = useMemo(() => {
    const fromPalette = getTeamPrimaryColor(normalizedLeague, game.home?.teamId);
    if (fromPalette !== "#ffffff") return fromPalette;
    return homeSafe.colorHex ?? "#0ea5e9";
  }, [normalizedLeague, game.home?.teamId, homeSafe.colorHex]);

  const awayMarketColor = useMemo(() => {
    const fromPalette = getTeamPrimaryColor(normalizedLeague, game.away?.teamId);
    if (fromPalette !== "#ffffff") return fromPalette;
    return awaySafe.colorHex ?? "#f43f5e";
  }, [normalizedLeague, game.away?.teamId, awaySafe.colorHex]);

  const [homeL1, homeL2] = splitTeamNameByLeague(game.league, homeSafe.name);
  const [awayL1, awayL2] = splitTeamNameByLeague(game.league, awaySafe.name);

  const nbaH2HPack = useMemo(() => {
    if (!isNbaPostseasonTools) return null;
    return resolveNbaH2HPack(
      game.home.teamId,
      game.away.teamId,
      game.home.name,
      game.away.name
    );
  }, [
    isNbaPostseasonTools,
    game.home.teamId,
    game.away.teamId,
    game.home.name,
    game.away.name,
  ]);

  useEffect(() => {
    onStandingsOpenChange?.(toolsTab === "standings");
  }, [toolsTab, onStandingsOpenChange]);

  useEffect(() => {
    if (isNbaPostseasonTools && toolsTab === "standings") {
      setToolsTab(null);
    }
  }, [isNbaPostseasonTools, toolsTab]);

  useLayoutEffect(() => {
    if (toolsTab === "market") {
      setMarketChartKey((k) => k + 1);
    }
  }, [toolsTab]);

  // チーム詳細から戻ったとき ?standings=1 でスタンディングを開いた状態にする
  useEffect(() => {
    if (searchParams.get("standings") !== "1") return;
    if (!showStandingsTab) return;
    setToolsTab("standings");
  }, [searchParams, showStandingsTab]);

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

  const isGameStarted = useMemo(
    () => isMatchStartedForPredict(game),
    [game.status, game.startAtJst]
  );

  /** /predict 単体：この試合の自分の投稿 ID を取得（開始後に未投稿ならフォームを出さないため） */
  useEffect(() => {
    if (inOverlay) {
      setStandaloneMine("skip");
      return;
    }
    let alive = true;
    setStandaloneMine("loading");
    void (async () => {
      try {
        const me = auth.currentUser;
        if (!me) {
          if (alive) setStandaloneMine({ postId: null });
          return;
        }
        const token = await me.getIdToken();
        const gid = String((game as { id: string }).id);
        const res = await fetch(
          `/api/posts_v2/byGameMine?gameId=${encodeURIComponent(gid)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: "include",
          }
        );
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          exists?: boolean;
          postId?: string;
        };
        if (!alive) return;
        if (!json.ok || !json.exists || !json.postId) {
          setStandaloneMine({ postId: null });
          return;
        }
        setStandaloneMine({ postId: String(json.postId) });
      } catch {
        if (alive) setStandaloneMine({ postId: null });
      }
    })();
    return () => {
      alive = false;
    };
  }, [inOverlay, (game as { id: string }).id]);

  const standaloneMineLoading = !inOverlay && standaloneMine === "loading";

  const effectivePostId = inOverlay
    ? overlayExistingPostId ?? null
    : standaloneMine === "skip" || standaloneMine === "loading"
      ? null
      : standaloneMine.postId;

  useEffect(() => {
    if (!effectivePostId) {
      setExistingSnapshot(null);
      setShowScoreEdit(false);
      return;
    }

    let alive = true;
    setExistingSnapshot("loading");
    setShowScoreEdit(false);

    void (async () => {
      try {
        const me = auth.currentUser;
        if (!me) {
          if (alive) setExistingSnapshot(null);
          return;
        }
        const token = await me.getIdToken();
        const res = await fetch(
          `/api/posts_v2/${encodeURIComponent(effectivePostId)}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: "include",
          }
        );
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          exists?: boolean;
          mine?: boolean;
          editable?: boolean;
          prediction?: { winner: Winner; score: { home: number; away: number } };
        };
        if (!alive) return;
        if (!json.ok || !json.exists || !json.mine || !json.prediction) {
          setExistingSnapshot(null);
          return;
        }
        setExistingSnapshot({
          editable: Boolean(json.editable),
          prediction: json.prediction,
        });
      } catch {
        if (alive) setExistingSnapshot(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [effectivePostId, (game as { id: string }).id]);

  const overlayFormLayout = useMemo(() => {
    // 単体ページで投稿の有無取得中：開始済みならフォームは出さず読み込み表示
    if (standaloneMineLoading) {
      if (isGameStarted) {
        return {
          showLoadingExisting: true,
          showEditableSummary: false,
          showLockedSummary: false,
          showScoreForm: false,
        };
      }
      return {
        showLoadingExisting: false,
        showEditableSummary: false,
        showLockedSummary: false,
        showScoreForm: true,
      };
    }

    // 自分の投稿なし：試合開始後はスコア予想ブロックを出さない
    if (!effectivePostId) {
      return {
        showLoadingExisting: false,
        showEditableSummary: false,
        showLockedSummary: false,
        showScoreForm: !isGameStarted,
      };
    }
    if (existingSnapshot === "loading" || existingSnapshot === null) {
      return {
        showLoadingExisting: true,
        showEditableSummary: false,
        showLockedSummary: false,
        showScoreForm: false,
      };
    }
    const snap = existingSnapshot;
    if (!snap.prediction) {
      return {
        showLoadingExisting: false,
        showEditableSummary: false,
        showLockedSummary: false,
        showScoreForm: !isGameStarted,
      };
    }
    if (!snap.editable) {
      return {
        showLoadingExisting: false,
        showEditableSummary: false,
        showLockedSummary: true,
        showScoreForm: false,
      };
    }
    if (!showScoreEdit) {
      return {
        showLoadingExisting: false,
        showEditableSummary: true,
        showLockedSummary: false,
        showScoreForm: false,
      };
    }
    return {
      showLoadingExisting: false,
      showEditableSummary: false,
      showLockedSummary: false,
      showScoreForm: true,
    };
  }, [
    standaloneMineLoading,
    isGameStarted,
    effectivePostId,
    existingSnapshot,
    showScoreEdit,
  ]);

  const snapPred =
    existingSnapshot !== null &&
    existingSnapshot !== "loading" &&
    "prediction" in existingSnapshot
      ? existingSnapshot.prediction
      : null;

  const canSubmit =
    !!winner && !submitting && scoreHome !== "" && scoreAway !== "";

  const scoreInputClass = [
    "w-full rounded-xl border border-white/15 bg-white/[0.10] text-left text-white placeholder-white/35 outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.12]",
    resultStatsMetricNumClass,
    // iOS Safari: 16px 未満だとフォーカス時に自動ズームする
    isMobile ? "px-3.5 py-2.5 text-base" : "px-4 py-3 text-base",
  ].join(" ");

  const glassCard =
    "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-md px-4 py-3";

  const glassCardStatsPanel = isMobile
    ? "relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] backdrop-blur-md px-3 py-2.5"
    : glassCard;

  const toolButtonBase = isMobile
    ? "flex h-9 w-full items-center justify-center rounded-xl border px-1.5 text-xs font-semibold transition-all duration-200"
    : "flex h-11 w-full items-center justify-center rounded-2xl border text-sm font-semibold transition-all duration-200";

  /** Match tab label font size (text-xs / text-sm). */
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

      const isPatchUpdate = Boolean(
        effectivePostId &&
          existingSnapshot !== null &&
          existingSnapshot !== "loading" &&
          existingSnapshot.editable &&
          showScoreEdit
      );

      if (isPatchUpdate && effectivePostId) {
        const res = await fetch(
          `/api/posts_v2/${encodeURIComponent(effectivePostId)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              prediction: {
                winner,
                score: { home: h, away: a },
              },
            }),
          }
        );
        const rawPatch = await res.text().catch(() => "");
        let jsonPatch: any = {};
        try {
          jsonPatch = rawPatch ? JSON.parse(rawPatch) : {};
        } catch {
          throw new Error(
            rawPatch?.slice(0, 200) || `更新失敗 (${res.status})`
          );
        }
        if (!res.ok) {
          const detailPatch =
            (typeof jsonPatch?.message === "string" && jsonPatch.message) ||
            (typeof jsonPatch?.error === "string" && jsonPatch.error) ||
            rawPatch?.slice(0, 200);
          throw new Error(detailPatch || `更新失敗 (${res.status})`);
        }
        toast.success(isEn ? "Prediction updated." : "予想を更新しました");
        setExistingSnapshot((prev) =>
          typeof prev === "object" && prev !== null && "prediction" in prev
            ? {
                ...prev,
                prediction: {
                  winner: winner!,
                  score: { home: h, away: a },
                },
              }
            : prev
        );
        setShowScoreEdit(false);
        setWinner(null);
        setScoreHome("");
        setScoreAway("");
        setSubmitting(false);
        return;
      }

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
        "mx-auto w-full overflow-x-hidden text-white",
        /* 試合オーバーレイでは上の MatchCard と同じ横幅に揃える（/web でも max-w-[900px] に縮まない） */
        embedded && inOverlay ? "max-w-none" : "max-w-[900px]",
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
              setToolsTab((t) => {
                if (isNbaPostseasonTools) return t === "h2h" ? null : "h2h";
                return t === "stats" ? null : "stats";
              })
            }
            className={[
              toolButtonBase,
              (isNbaPostseasonTools ? toolsTab === "h2h" : toolsTab === "stats")
                ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                : "border-white/10 bg-white/[0.035] text-white/88 hover:bg-white/6",
            ].join(" ")}
          >
            <span
              className={[
                "inline-flex max-w-full items-center justify-center gap-1.5",
                isMobile ? "min-w-0" : "",
              ].join(" ")}
            >
              <span className={isMobile ? "truncate" : ""}>
                {isNbaPostseasonTools
                  ? isEn
                    ? "Matchup"
                    : "直接対決"
                  : isEn
                    ? "Stats"
                    : "詳細スタッツ"}
              </span>
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
            <span
              className={[
                "inline-flex max-w-full items-center justify-center gap-1.5",
                isMobile ? "min-w-0" : "",
              ].join(" ")}
            >
              <span className={isMobile ? "truncate" : ""}>
                {isEn ? "Market" : "市場"}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isNbaPostseasonTools) {
                setToolsTab((t) => (t === "stats" ? null : "stats"));
                return;
              }
              if (!showStandings) return;
              setToolsTab((t) => (t === "standings" ? null : "standings"));
            }}
            disabled={!isNbaPostseasonTools && !showStandings}
            className={[
              toolButtonBase,
              (isNbaPostseasonTools ? toolsTab === "stats" : toolsTab === "standings")
                ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                : isNbaPostseasonTools || showStandings
                  ? "border-white/10 bg-white/[0.035] text-white/88 hover:bg-white/6"
                  : "cursor-not-allowed border-white/10 bg-white/2 text-white/35",
            ].join(" ")}
          >
            <span className={isMobile ? "truncate" : ""}>
              {isNbaPostseasonTools
                ? isEn
                  ? "Stats"
                  : "詳細スタッツ"
                : isEn
                  ? "Standings"
                  : "順位表"}
            </span>
          </button>
        </motion.div>

        {toolsTab === "h2h" && isNbaPostseasonTools && (
          <motion.div variants={fadeUp} className={glassCardStatsPanel}>
            <ShellGridOverlay
              roundedClassName={isMobile ? "rounded-xl" : "rounded-2xl"}
            />
            <div className="relative z-1">
              <div
                className={[
                  isMobile ? "mb-2 space-y-1.5" : "mb-3 space-y-2",
                  "text-center",
                ].join(" ")}
              >
                <div
                  className={[
                    isMobile ? "text-xs" : "text-sm",
                    "font-semibold text-white/90",
                  ].join(" ")}
                >
                  {isEn ? "Season head-to-head" : "今季の直接対決"}
                </div>
                {nbaH2HPack?.seriesRecord ? (
                  <div
                    className={[
                      resultStatsMetricNumClass,
                      "flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-1 text-sm text-white/85 sm:text-base md:gap-x-2 md:text-lg",
                    ].join(" ")}
                  >
                    <span className="max-w-[46%] truncate sm:max-w-none">
                      {nbaH2HPack.seriesRecord.leftTeamDisplay}
                    </span>
                    <span
                      className={[
                        resultStatsMetricNumClass,
                        "inline-flex shrink-0 items-baseline font-bold tabular-nums text-xl sm:text-2xl md:text-3xl",
                      ].join(" ")}
                    >
                      <span
                        className={
                          nbaH2HPack.seriesRecord.leftWins >
                          nbaH2HPack.seriesRecord.rightWins
                            ? "text-yellow-300"
                            : "text-white"
                        }
                        style={
                          nbaH2HPack.seriesRecord.leftWins >
                          nbaH2HPack.seriesRecord.rightWins
                            ? {
                                textShadow:
                                  "0 0 8px rgba(253, 224, 71, 0.5), 0 0 3px rgba(253, 224, 71, 0.65)",
                              }
                            : undefined
                        }
                      >
                        {nbaH2HPack.seriesRecord.leftWins}
                      </span>
                      <span className="mx-1 text-white/55 sm:mx-1.5">–</span>
                      <span
                        className={
                          nbaH2HPack.seriesRecord.rightWins >
                          nbaH2HPack.seriesRecord.leftWins
                            ? "text-yellow-300"
                            : "text-white"
                        }
                        style={
                          nbaH2HPack.seriesRecord.rightWins >
                          nbaH2HPack.seriesRecord.leftWins
                            ? {
                                textShadow:
                                  "0 0 8px rgba(253, 224, 71, 0.5), 0 0 3px rgba(253, 224, 71, 0.65)",
                              }
                            : undefined
                        }
                      >
                        {nbaH2HPack.seriesRecord.rightWins}
                      </span>
                    </span>
                    <span className="max-w-[46%] truncate sm:max-w-none">
                      {nbaH2HPack.seriesRecord.rightTeamDisplay}
                    </span>
                  </div>
                ) : null}
              </div>
              <div
                className={
                  isMobile
                    ? "border-t border-white/10 pt-2"
                    : "border-t border-white/10 pt-3"
                }
              >
                <NbaPostseasonMatchupPanel
                  isEn={isEn}
                  seriesGames={nbaH2HPack?.games}
                  h2hAverages={nbaH2HPack?.h2hAverages}
                />
              </div>
            </div>
          </motion.div>
        )}

        {toolsTab === "stats" && (
          <motion.div variants={fadeUp} className={glassCardStatsPanel}>
            <ShellGridOverlay
              roundedClassName={isMobile ? "rounded-xl" : "rounded-2xl"}
            />
            <div className="relative z-1">
              <div
                className={
                  isMobile ? "mb-2 text-xs font-semibold text-white/90" : "mb-3 text-sm font-semibold text-white/90"
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
              homeColor={homeMarketColor}
              awayColor={awayMarketColor}
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

        {overlayFormLayout.showLoadingExisting ? (
          <motion.div
            variants={fadeUp}
            className={`py-6 text-center text-sm text-white/70 ${glassCard}`}
          >
            {isEn ? "Loading…" : "読み込み中…"}
          </motion.div>
        ) : null}

        {overlayFormLayout.showEditableSummary && snapPred ? (
          <motion.div variants={fadeUp} className={`space-y-3 pt-1 ${glassCard}`}>
            <div className="text-sm font-semibold text-white/88">
              {isEn ? "Your prediction" : "あなたの予想"}
            </div>
            <div className="space-y-2 px-0.5">
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="min-w-0 truncate text-center text-sm font-bold text-white/88 sm:text-base md:text-lg"
                  style={predictTeamNameTy}
                >
                  {homeLabel}
                </div>
                <div
                  className="min-w-0 truncate text-center text-sm font-bold text-white/88 sm:text-base md:text-lg"
                  style={predictTeamNameTy}
                >
                  {awayLabel}
                </div>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2">
                <div
                  className={[
                    "text-center font-black tabular-nums text-white",
                    isMobile ? "text-2xl" : "text-3xl",
                    resultStatsMetricNumClass,
                  ].join(" ")}
                >
                  {snapPred.score.home}
                </div>
                <span
                  className={[
                    "shrink-0 font-black tabular-nums text-white/55",
                    isMobile ? "text-2xl" : "text-3xl",
                    resultStatsMetricNumClass,
                  ].join(" ")}
                  aria-hidden
                >
                  –
                </span>
                <div
                  className={[
                    "text-center font-black tabular-nums text-white",
                    isMobile ? "text-2xl" : "text-3xl",
                    resultStatsMetricNumClass,
                  ].join(" ")}
                >
                  {snapPred.score.away}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setScoreHome(String(snapPred.score.home));
                setScoreAway(String(snapPred.score.away));
                setShowScoreEdit(true);
              }}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-amber-300/40 bg-amber-500/15 text-sm font-bold text-amber-100 transition hover:bg-amber-500/25 active:scale-[0.99]"
            >
              {isEn ? "Edit" : "修正"}
            </button>
          </motion.div>
        ) : null}

        {overlayFormLayout.showLockedSummary && snapPred ? (
          <motion.div variants={fadeUp} className={`space-y-2 pt-1 ${glassCard}`}>
            <div className="text-sm font-semibold text-white/88">
              {isEn ? "Your prediction (locked)" : "あなたの予想（試合開始後は変更できません）"}
            </div>
            <div className="space-y-2 px-0.5">
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="min-w-0 truncate text-center text-sm font-bold text-white/85 sm:text-base md:text-lg"
                  style={predictTeamNameTy}
                >
                  {homeLabel}
                </div>
                <div
                  className="min-w-0 truncate text-center text-sm font-bold text-white/85 sm:text-base md:text-lg"
                  style={predictTeamNameTy}
                >
                  {awayLabel}
                </div>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2">
                <div
                  className={[
                    "text-center font-black tabular-nums text-white/90",
                    isMobile ? "text-2xl" : "text-3xl",
                    resultStatsMetricNumClass,
                  ].join(" ")}
                >
                  {snapPred.score.home}
                </div>
                <span
                  className={[
                    "shrink-0 font-black tabular-nums text-white/50",
                    isMobile ? "text-2xl" : "text-3xl",
                    resultStatsMetricNumClass,
                  ].join(" ")}
                  aria-hidden
                >
                  –
                </span>
                <div
                  className={[
                    "text-center font-black tabular-nums text-white/90",
                    isMobile ? "text-2xl" : "text-3xl",
                    resultStatsMetricNumClass,
                  ].join(" ")}
                >
                  {snapPred.score.away}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}

        {overlayFormLayout.showScoreForm ? (
          <>
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
              {showScoreEdit && effectivePostId ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowScoreEdit(false);
                    setScoreHome("");
                    setScoreAway("");
                    setWinner(null);
                  }}
                  className="mt-2 w-full text-center text-xs font-medium text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
                >
                  {isEn ? "Cancel editing" : "修正をやめる"}
                </button>
              ) : null}
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
                {submitting
                  ? isEn
                    ? "Submitting..."
                    : "投稿中…"
                  : effectivePostId && showScoreEdit
                    ? isEn
                      ? "Update prediction"
                      : "予想を更新する"
                    : isEn
                      ? "Submit Prediction"
                      : "予想する"}
              </button>
            </motion.div>
          </>
        ) : null}
      </div>
    </motion.div>
    {nextModal}
    </>
  );
}