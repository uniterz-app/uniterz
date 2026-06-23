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
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import MatchCard, { type MatchCardProps } from "@/app/component/games/MatchCard";
import { MOBILE_PREDICT_OVERLAY_CARD_OUTER_CLASS } from "@/lib/games/mobileListCardLayout";
import { toast } from "@/app/component/ui/toast";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { splitTeamNameByLeague } from "@/lib/team-name-split";
import { normalizeLeague } from "@/lib/leagues";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import GameTeamStats from "@/app/component/predict/GameTeamStats";
import NbaPostseasonMatchupPanel, {
  H2hSeasonRecordRow,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";
import { shouldFlipH2hToMatchHomeAway } from "@/lib/data/nba/h2h/h2hAlignSides";
import { resolveNbaH2HPack } from "@/lib/data/nba/h2h/resolveNbaH2HPack";
import GamePredictionDistribution from "@/app/component/predict/GamePredictionDistribution";
import NbaStandingsPanel from "@/app/component/standings/NbaStandingsPanel";
import WcTeamProfilePanel from "@/app/component/predict/wc/WcTeamProfilePanel";
import WcPastResultsPanel from "@/app/component/predict/wc/WcPastResultsPanel";
import WcStandingPanel from "@/app/component/predict/wc/WcStandingPanel";
import WcMatchPreviewPanel from "@/app/component/predict/wc/WcMatchPreviewPanel";
import { hasWcMatchPreview } from "@/lib/wc/matchPreviews";
import WcGoalScorerPicker from "@/app/component/predict/wc/WcGoalScorerPicker";
import {
  isWcGoalScorerPickValidForPredictedScore,
  type WcGoalScorerPick,
} from "@/lib/wc/goalScorer";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import PredictNextGameModal from "@/app/component/predict/PredictNextGameModal";
import {
  findNextUnpredictedScheduledGameInList,
  getNextScheduledGameIdOnSameDay,
} from "@/lib/games/nextPredictGame";
import {
  readPredictNextGameModalSkip,
  writePredictNextGameModalSkip,
} from "@/lib/predict/nextGameModalPrefs";
import { matchScoreClass, nameOxanium } from "@/lib/fonts";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import { PREDICT_OVERLAY_FORM_PANEL } from "@/lib/ui/matchOverlayGlass";
import {
  PREDICT_OVERLAY_CYBER_DECK_CLASS,
  PREDICT_OVERLAY_SCORE_INPUT_CLASS,
  PREDICT_OVERLAY_SUBMIT_BTN_CLASS,
  PREDICT_OVERLAY_SUBMIT_BTN_DISABLED_CLASS,
} from "@/lib/ui/predictOverlayCyber";
import { predictHudTabButtonClass } from "@/lib/predict/predictOverlayHud";
import PredictionScoringRulesChip from "@/app/component/predict/PredictionScoringRulesChip";
import { usePredictionPostDistribution } from "@/lib/hooks/usePredictionPostDistribution";
import { loadResultPostDetailClient } from "@/lib/result/loadResultPostDetailClient";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

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
  /** オーバーレイの MatchCard 市場棒グラフをリアルタイム同期 */
  onMarketDistributionChange?: (bias: {
    homePct: number;
    awayPct: number;
  }) => void;
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
  /** ロック後リザルトを親の MatchCard に渡すための通知 */
  onExistingResultPostChange?: (post: PredictionPostV2 | null) => void;
  /** 自分の勝者予想（市場棒グラフマーカー用） */
  onUserPredictionWinnerChange?: (
    winner: "home" | "away" | "draw" | null
  ) => void;
  /** 親 MatchCard の修正メニューから編集を起動（nonce が増えたときだけ反映） */
  predictEditTriggerNonce?: number;
  /** 予想修正の送信完了後（親の nonce リセット用） */
  onPredictEditEnd?: () => void;
};

type Winner = "home" | "away" | "draw";

type H2HRecordLine = {
  leftTeamDisplay: string;
  rightTeamDisplay: string;
  leftWins: number;
  rightWins: number;
};

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

function mergeGameIntoResultPost(
  post: PredictionPostV2,
  game: MatchCardProps
): PredictionPostV2 {
  const homeTeamId = game.home?.teamId ?? post.home?.teamId ?? "";
  const awayTeamId = game.away?.teamId ?? post.away?.teamId ?? "";
  return {
    ...post,
    status: game.status,
    result:
      game.status === "final" && game.score
        ? { home: game.score.home, away: game.score.away }
        : (post.result ?? null),
    home: {
      ...post.home,
      name: game.home.name,
      teamId: homeTeamId,
    },
    away: {
      ...post.away,
      name: game.away.name,
      teamId: awayTeamId,
    },
  };
}

function computeRecordByGames(
  games: Array<{
    leftTeamDisplay: string;
    rightTeamDisplay: string;
    scoreLeft: number | null;
    scoreRight: number | null;
  }>,
  homeTeamName?: string,
  awayTeamName?: string
): H2HRecordLine | null {
  if (!games.length) return null;
  const first = games[0];
  const flip = first
    ? shouldFlipH2hToMatchHomeAway({
        leftTeamDisplay: first.leftTeamDisplay,
        rightTeamDisplay: first.rightTeamDisplay,
        homeTeamName,
        awayTeamName,
      })
    : false;
  const normalized = flip
    ? games.map((g) => ({
        leftTeamDisplay: g.rightTeamDisplay,
        rightTeamDisplay: g.leftTeamDisplay,
        scoreLeft: g.scoreRight,
        scoreRight: g.scoreLeft,
      }))
    : games;

  const { leftTeamDisplay, rightTeamDisplay } = normalized[0];
  let leftWins = 0;
  let rightWins = 0;
  for (const g of normalized) {
    if (g.scoreLeft == null || g.scoreRight == null) continue;
    if (g.scoreLeft > g.scoreRight) leftWins += 1;
    else if (g.scoreRight > g.scoreLeft) rightWins += 1;
  }
  return { leftTeamDisplay, rightTeamDisplay, leftWins, rightWins };
}

export default function PredictionFormV2({
  dense = false,
  game,
  user,
  onPostCreated,
  onMarketDistributionChange,
  onStandingsOpenChange,
  inOverlay = false,
  embedded = false,
  onClosePredictOverlay,
  onSwitchOverlayGame,
  overlayScheduleGameIds,
  overlayScheduleGames,
  overlayPredictedGameIds,
  overlayExistingPostId = null,
  onExistingResultPostChange,
  onUserPredictionWinnerChange,
  predictEditTriggerNonce = 0,
  onPredictEditEnd,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/");
  const prefix = isMobile ? "/mobile" : "/web";
  const { language } = useUserLanguage(auth.currentUser?.uid ?? null);
  const m = t(language);
  const gameId = String((game as { id: string }).id);
  const { data: postDistribution, loading: postDistributionLoading } =
    usePredictionPostDistribution(gameId);

  const gameDateKey = useMemo(() => {
    return game.startAtJst
      ? game.startAtJst.toISOString().slice(0, 10)
      : undefined;
  }, [game.startAtJst]);

  const [winner, setWinner] = useState<Winner | null>(null);
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [goalScorerPick, setGoalScorerPick] = useState<WcGoalScorerPick | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [toolsTab, setToolsTab] = useState<
    null | "stats" | "market" | "standings" | "h2h" | "preview" | "results"
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
        post: PredictionPostV2;
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

  const isWc = game.league === "wc";
  const showWcMatchPreview = isWc && hasWcMatchPreview(gameId);
  const isSoccer = game.league === "pl" || game.league === "j1" || isWc;
  // WC は Standings タブ（グループ順位 + FIFA ランク）を常に出す
  const showStandings = game.league === "nba" || isWc;
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
  const h2hPoRecord = useMemo(() => {
    const poGames =
      nbaH2HPack?.games?.filter((g) => Boolean(g.seriesGameLabel)) ?? [];
    return computeRecordByGames(poGames, game.home.name, game.away.name);
  }, [nbaH2HPack?.games, game.home.name, game.away.name]);
  const h2hRsRecordForSeriesTrend = useMemo(() => {
    const rsGames =
      nbaH2HPack?.games?.filter((g) => !g.seriesGameLabel) ?? [];
    return computeRecordByGames(rsGames, game.home.name, game.away.name);
  }, [nbaH2HPack?.games, game.home.name, game.away.name]);

  useEffect(() => {
    if (!onMarketDistributionChange) return;
    const total =
      postDistribution.home +
      postDistribution.away +
      (isSoccer ? postDistribution.draw : 0);
    if (total <= 0) return;
    onMarketDistributionChange({
      homePct: (postDistribution.home / total) * 100,
      awayPct: (postDistribution.away / total) * 100,
    });
  }, [postDistribution, isSoccer, onMarketDistributionChange]);

  useEffect(() => {
    onStandingsOpenChange?.(toolsTab === "standings");
  }, [toolsTab, onStandingsOpenChange]);

  useEffect(() => {
    if (isNbaPostseasonTools && toolsTab === "standings") {
      setToolsTab(null);
    }
  }, [isNbaPostseasonTools, toolsTab]);

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
        const detail = await loadResultPostDetailClient(effectivePostId);
        if (!alive) return;
        if (!detail.ok || detail.post.authorUid !== me.uid) {
          setExistingSnapshot(null);
          return;
        }
        const post = detail.post;
        const editable =
          typeof post.startAtMillis === "number" &&
          Date.now() < post.startAtMillis;
        setExistingSnapshot({ editable, post });
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
    if (!snap.post.prediction) {
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

  const existingResultPost = useMemo((): PredictionPostV2 | null => {
    if (
      existingSnapshot === null ||
      existingSnapshot === "loading" ||
      !("post" in existingSnapshot)
    ) {
      return null;
    }
    return mergeGameIntoResultPost(existingSnapshot.post, game);
  }, [existingSnapshot, game]);

  /** オーバーレイ／統合 MatchCard 表示時は市場棒グラフと重複するため市場タブを隠す */
  const showMergedMatchCard =
    !inOverlay &&
    (overlayFormLayout.showLockedSummary ||
      overlayFormLayout.showEditableSummary) &&
    Boolean(existingResultPost);
  const hideMarketTab =
    (embedded && inOverlay) || showMergedMatchCard;

  useEffect(() => {
    if (!onExistingResultPostChange) return;
    const shouldNotify =
      (overlayFormLayout.showLockedSummary ||
        overlayFormLayout.showEditableSummary) &&
      Boolean(existingResultPost);
    if (shouldNotify && existingResultPost) {
      onExistingResultPostChange(existingResultPost);
    } else {
      onExistingResultPostChange(null);
    }
  }, [
    onExistingResultPostChange,
    overlayFormLayout.showLockedSummary,
    overlayFormLayout.showEditableSummary,
    existingResultPost,
  ]);

  useEffect(() => {
    if (!onUserPredictionWinnerChange) return;
    onUserPredictionWinnerChange(
      existingResultPost?.prediction?.winner ?? null
    );
  }, [onUserPredictionWinnerChange, existingResultPost]);

  useLayoutEffect(() => {
    if (!hideMarketTab && toolsTab === "market") {
      setMarketChartKey((k) => k + 1);
    }
  }, [toolsTab, hideMarketTab]);

  useEffect(() => {
    if (hideMarketTab && toolsTab === "market") {
      setToolsTab(null);
    }
  }, [hideMarketTab, toolsTab]);

  const openPredictEditFromResultCard = useCallback(
    (post: PredictionPostV2) => {
      const pred = post.prediction;
      if (!pred) return;
      setScoreHome(String(pred.score.home));
      setScoreAway(String(pred.score.away));
      setGoalScorerPick(pred.goalScorer ?? null);
      setWinner(pred.winner);
      setShowScoreEdit(true);
    },
    []
  );

  const lastPredictEditNonceRef = useRef(0);
  useEffect(() => {
    if (predictEditTriggerNonce === lastPredictEditNonceRef.current) return;
    if (!predictEditTriggerNonce || !existingResultPost) return;
    lastPredictEditNonceRef.current = predictEditTriggerNonce;
    openPredictEditFromResultCard(existingResultPost);
  }, [
    predictEditTriggerNonce,
    existingResultPost,
    openPredictEditFromResultCard,
  ]);

  const canSubmit =
    !!winner && !submitting && scoreHome !== "" && scoreAway !== "";

  const predictedScoreForGoalScorer = useMemo(() => {
    if (scoreHome === "" || scoreAway === "") return null;
    const h = Number(scoreHome);
    const a = Number(scoreAway);
    if (!Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
      return null;
    }
    return { home: h, away: a };
  }, [scoreHome, scoreAway]);

  const buildPredictionPayload = (
    h: number,
    a: number
  ): {
    winner: Winner;
    score: { home: number; away: number };
    goalScorer?: WcGoalScorerPick | null;
  } => {
    const score = { home: h, away: a };
    const goalScorer =
      isWc &&
      goalScorerPick &&
      isWcGoalScorerPickValidForPredictedScore(
        goalScorerPick,
        score,
        game.home?.teamId,
        game.away?.teamId
      )
        ? goalScorerPick
        : null;
    return {
      winner: winner!,
      score,
      ...(isWc ? { goalScorer } : {}),
    };
  };

  const overlayEmbedded = embedded && inOverlay;

  const scoreInputClass = [
    overlayEmbedded
      ? `${PREDICT_OVERLAY_SCORE_INPUT_CLASS} w-full text-left font-black outline-none`
      : "w-full rounded-xl border border-white/15 bg-white/[0.10] text-left text-white placeholder-white/35 outline-none transition focus:border-cyan-300/40 focus:bg-white/[0.12]",
    matchScoreClass,
    // iOS Safari: 16px 未満だとフォーカス時に自動ズームする
    isMobile ? "px-3.5 py-2.5 text-base" : "px-4 py-3 text-base",
    overlayEmbedded ? "" : "w-full",
  ]
    .filter(Boolean)
    .join(" ");

  /** 単体ページ：方眼オーバーレイなし・半透明面のみ（blur によるチラつきを避ける） */
  const standaloneGlassFill =
    "border border-white/10 bg-[linear-gradient(172deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.025)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]";

  const glassCard = overlayEmbedded
    ? `relative w-full overflow-hidden ${PREDICT_OVERLAY_FORM_PANEL} px-4 py-3`
    : `relative w-full overflow-hidden rounded-2xl ${standaloneGlassFill} px-4 py-3`;

  const glassCardStatsPanel = overlayEmbedded
    ? `relative w-full overflow-hidden ${PREDICT_OVERLAY_FORM_PANEL} px-3 py-2.5`
    : isMobile
      ? `relative w-full overflow-hidden rounded-xl ${standaloneGlassFill} px-3 py-2.5`
      : glassCard;

  const toolButtonInactiveClass = overlayEmbedded
    ? predictHudTabButtonClass(false)
    : "border-white/10 bg-white/[0.04] text-white/88 hover:bg-white/6";

  const fadeUpMotionProps = overlayEmbedded
    ? ({ initial: false as const } as const)
    : ({ variants: fadeUp } as const);

  const toolButtonBase = isMobile
    ? "flex h-9 w-full items-center justify-center rounded-xl border px-1.5 text-xs font-semibold transition-all duration-200"
    : "flex h-11 w-full items-center justify-center rounded-2xl border text-sm font-semibold transition-all duration-200";

  const toolGridCols = (() => {
    if (isWc) {
      let count = 2;
      if (showWcMatchPreview) count += 1;
      count += 1;
      if (!hideMarketTab) count += 1;
      if (count >= 5) return "grid-cols-2 sm:grid-cols-5";
      if (count === 4) return hideMarketTab ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4";
      if (count === 3) return hideMarketTab ? "grid-cols-3" : "grid-cols-3";
    }
    return hideMarketTab ? "grid-cols-2" : "grid-cols-3";
  })();

  const overlayToolDeckClass = [
    PREDICT_OVERLAY_CYBER_DECK_CLASS,
    "grid overflow-hidden",
    toolGridCols,
    isMobile ? "h-10" : "h-11",
  ].join(" ");

  const overlayToolButtonClass = (active: boolean, disabled = false) =>
    [
      predictHudTabButtonClass(active, disabled),
      nameOxanium.className,
      "h-full uppercase tracking-[0.14em]",
      isMobile ? "text-[10px]" : "text-[11px] md:text-xs",
    ].join(" ");

  /** Match tab label font size (text-xs / text-sm). */
  const handleSubmit = async () => {
    if (!canSubmit) return;

    const me = auth.currentUser;
    if (!me) return;

    const h = Number(scoreHome);
    const a = Number(scoreAway);

    if (Number.isNaN(h) || Number.isNaN(a)) {
      alert(m.predict.enterValidScores);
      return;
    }

    if (winner === "home" && h <= a) {
      alert(m.predict.enterValidScores);
      return;
    }
    if (winner === "away" && a <= h) {
      alert(m.predict.enterValidScores);
      return;
    }
    if (isSoccer && winner === "draw" && h !== a) {
      alert(m.predict.enterValidScores);
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
              prediction: buildPredictionPayload(h, a),
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
        toast.success(m.predict.predictionUpdated);
        const nextPrediction = buildPredictionPayload(h, a);
        let mergedPostForOverlay: PredictionPostV2 | null = null;
        setExistingSnapshot((prev) => {
          if (typeof prev !== "object" || prev === null || !("post" in prev)) {
            return prev;
          }
          const nextPost = { ...prev.post, prediction: nextPrediction };
          mergedPostForOverlay = mergeGameIntoResultPost(nextPost, game);
          return { ...prev, post: nextPost };
        });
        setShowScoreEdit(false);
        setWinner(null);
        setScoreHome("");
        setScoreAway("");
        setGoalScorerPick(null);
        if (inOverlay && mergedPostForOverlay) {
          onExistingResultPostChange?.(mergedPostForOverlay);
          onUserPredictionWinnerChange?.(nextPrediction.winner);
        }
        onPredictEditEnd?.();
        setSubmitting(false);
        return;
      }

      const body = {
        gameId: (game as any).id,
        league: game.league,
        authorUid: me.uid,
        prediction: buildPredictionPayload(h, a),
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

      toast.success(m.predict.predictionSubmitted);
      onPostCreated?.({ id: json.id ?? "(local)", at: new Date() });

      setWinner(null);
      setScoreHome("");
      setScoreAway("");
      setGoalScorerPick(null);

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
      alert(e.message ?? m.predict.failedToSubmit);
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
            language={language}
            league={nextGamePreview.league}
            homeName={nextGamePreview.home?.name ?? ""}
            awayName={nextGamePreview.away?.name ?? ""}
            homeTeamId={nextGamePreview.home?.teamId}
            awayTeamId={nextGamePreview.away?.teamId}
            homeColorHex={nextGamePreview.home?.colorHex}
            awayColorHex={nextGamePreview.away?.colorHex}
            startAtJst={nextGamePreview.startAtJst}
            seasonPhase={nextGamePreview.seasonPhase}
            roundLabel={nextGamePreview.roundLabel}
            seriesStanding={nextGamePreview.seriesStanding}
            homeRecord={nextGamePreview.homeRecord}
            awayRecord={nextGamePreview.awayRecord}
            onYes={handleNextModalYes}
            onNo={handleNextModalNo}
          />,
          document.body
        )
      : null;

  return (
    <>
    <motion.div
      variants={overlayEmbedded ? undefined : pageContainer}
      initial={overlayEmbedded ? false : "hidden"}
      animate={overlayEmbedded ? undefined : "show"}
      className={[
        "mx-auto w-full overflow-x-hidden text-white",
        /* 試合オーバーレイでは上の MatchCard と同じ横幅に揃える（/web でも max-w-[900px] に縮まない） */
        overlayEmbedded
          ? "max-w-none"
          : isWc && !isMobile
            ? "max-w-[1120px]"
            : "max-w-[900px]",
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
      <div
        className={[
          "overflow-x-hidden",
          overlayEmbedded
            ? isMobile
              ? "space-y-3 pt-2"
              : "space-y-3 pt-2.5"
            : "space-y-4",
        ].join(" ")}
      >
        {showMergedMatchCard && existingResultPost ? (
          <motion.div {...fadeUpMotionProps}>
            <MatchCard
              {...game}
              hideActions
              showMarketBias
              attachOverlayMarketBar
              disableCardMotion
              resultPost={existingResultPost}
              resultRatingBarsImmediate
              myPostId={effectivePostId}
              userPredictionWinner={
                existingResultPost?.prediction?.winner ?? null
              }
              onRequestPredictEdit={
                overlayFormLayout.showEditableSummary
                  ? openPredictEditFromResultCard
                  : undefined
              }
              className={
                isMobile ? MOBILE_PREDICT_OVERLAY_CARD_OUTER_CLASS : undefined
              }
            />
          </motion.div>
        ) : null}

        <motion.div
          {...fadeUpMotionProps}
          className={
            overlayEmbedded
              ? overlayToolDeckClass
              : [
                  "grid",
                  toolGridCols,
                  isMobile ? "gap-2" : "gap-2.5",
                ].join(" ")
          }
        >
          <button
            type="button"
            onClick={() =>
              setToolsTab((t) => {
                if (isNbaPostseasonTools) return t === "h2h" ? null : "h2h";
                return t === "stats" ? null : "stats";
              })
            }
            className={
              overlayEmbedded
                ? overlayToolButtonClass(
                    isNbaPostseasonTools ? toolsTab === "h2h" : toolsTab === "stats"
                  )
                : [
                    toolButtonBase,
                    (isNbaPostseasonTools ? toolsTab === "h2h" : toolsTab === "stats")
                      ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                      : toolButtonInactiveClass,
                  ].join(" ")
            }
          >
            <span
              className={[
                "inline-flex max-w-full items-center justify-center gap-1.5",
                isMobile ? "min-w-0" : "",
              ].join(" ")}
            >
              <span className={isMobile ? "truncate" : ""}>
                {isNbaPostseasonTools
                  ? m.predict.h2hStats
                  : isWc
                    ? m.predict.teamProfile
                    : m.predict.teamStats}
              </span>
            </span>
          </button>

          {!hideMarketTab ? (
            <button
              type="button"
              onClick={() =>
                setToolsTab((t) => (t === "market" ? null : "market"))
              }
              className={
                overlayEmbedded
                  ? overlayToolButtonClass(toolsTab === "market")
                  : [
                      toolButtonBase,
                      toolsTab === "market"
                        ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                        : toolButtonInactiveClass,
                    ].join(" ")
              }
            >
              <span
                className={[
                  "inline-flex max-w-full items-center justify-center gap-1.5",
                  isMobile ? "min-w-0" : "",
                ].join(" ")}
              >
                <span className={isMobile ? "truncate" : ""}>
                  {m.games.market}
                </span>
              </span>
            </button>
          ) : null}

          {showWcMatchPreview ? (
            <button
              type="button"
              onClick={() =>
                setToolsTab((t) => (t === "preview" ? null : "preview"))
              }
              className={
                overlayEmbedded
                  ? overlayToolButtonClass(toolsTab === "preview")
                  : [
                      toolButtonBase,
                      toolsTab === "preview"
                        ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                        : toolButtonInactiveClass,
                    ].join(" ")
              }
            >
              <span className={isMobile ? "truncate" : ""}>
                {m.predict.matchPreview}
              </span>
            </button>
          ) : null}

          {isWc ? (
            <button
              type="button"
              onClick={() =>
                setToolsTab((t) => (t === "results" ? null : "results"))
              }
              className={
                overlayEmbedded
                  ? overlayToolButtonClass(toolsTab === "results")
                  : [
                      toolButtonBase,
                      toolsTab === "results"
                        ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                        : toolButtonInactiveClass,
                    ].join(" ")
              }
            >
              <span className={isMobile ? "truncate" : ""}>
                {m.predict.pastResults}
              </span>
            </button>
          ) : null}

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
            className={
              overlayEmbedded
                ? overlayToolButtonClass(
                    isNbaPostseasonTools ? toolsTab === "stats" : toolsTab === "standings",
                    !isNbaPostseasonTools && !showStandings
                  )
                : [
                    toolButtonBase,
                    (isNbaPostseasonTools ? toolsTab === "stats" : toolsTab === "standings")
                      ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                      : isNbaPostseasonTools || showStandings
                        ? toolButtonInactiveClass
                        : "cursor-not-allowed border-white/10 bg-white/2 text-white/35",
                  ].join(" ")
            }
          >
            <span className={isMobile ? "truncate" : ""}>
              {isNbaPostseasonTools
                ? m.predict.teamStats
                : m.predict.groupStandings}
            </span>
          </button>
        </motion.div>

        {toolsTab === "h2h" && isNbaPostseasonTools && (
          <motion.div {...fadeUpMotionProps} className={glassCardStatsPanel}>
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
                  {m.predict.seriesTrend}
                </div>
                {h2hPoRecord ? (
                  <div className="text-center">
                    <H2hSeasonRecordRow
                      leftTeamDisplay={h2hPoRecord.leftTeamDisplay}
                      rightTeamDisplay={h2hPoRecord.rightTeamDisplay}
                      leftWins={h2hPoRecord.leftWins}
                      rightWins={h2hPoRecord.rightWins}
                    />
                  </div>
                ) : h2hRsRecordForSeriesTrend ? (
                  <div className="text-center">
                    <H2hSeasonRecordRow
                      phaseLabel="RS"
                      leftTeamDisplay={h2hRsRecordForSeriesTrend.leftTeamDisplay}
                      rightTeamDisplay={
                        h2hRsRecordForSeriesTrend.rightTeamDisplay
                      }
                      leftWins={h2hRsRecordForSeriesTrend.leftWins}
                      rightWins={h2hRsRecordForSeriesTrend.rightWins}
                    />
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
                  language={language}
                  seriesGames={nbaH2HPack?.games}
                  h2hAverages={nbaH2HPack?.h2hAverages}
                  homeTeamName={game.home.name}
                  awayTeamName={game.away.name}
                />
              </div>
            </div>
          </motion.div>
        )}

        {toolsTab === "stats" && (
          <motion.div {...fadeUpMotionProps} className={glassCardStatsPanel}>
            <div className="relative z-1">
              <div
                className={
                  isMobile
                    ? "mb-2 text-xs font-semibold text-white/90"
                    : isWc
                      ? "mb-3 text-base font-semibold text-white/90"
                      : "mb-3 text-sm font-semibold text-white/90"
                }
              >
                {isWc ? m.predict.teamProfile : m.predict.teamStats}
              </div>
              <div
                className={
                  isMobile
                    ? "border-t border-white/10 pt-2"
                    : isWc
                      ? "border-t border-white/10 pt-4"
                      : "border-t border-white/10 pt-3"
                }
              >
                {isWc ? (
                  <WcTeamProfilePanel
                    homeTeamId={game.home.teamId ?? ""}
                    awayTeamId={game.away.teamId ?? ""}
                    homeName={homeSafe.name}
                    awayName={awaySafe.name}
                    language={language}
                    isMobile={isMobile}
                  />
                ) : (
                  <GameTeamStats
                    league={game.league}
                    homeTeamId={game.home.teamId ?? ""}
                    awayTeamId={game.away.teamId ?? ""}
                    language={language}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {!hideMarketTab && toolsTab === "market" && (
          <motion.div {...fadeUpMotionProps} className={glassCardStatsPanel}>
            <div className="relative z-1">
            <GamePredictionDistribution
              gameId={gameId}
              league={game.league}
              homeName={homeSafe.name}
              awayName={awaySafe.name}
              homeColor={homeMarketColor}
              awayColor={awayMarketColor}
              variant="predictForm"
              chartReplayKey={marketChartKey}
              fallbackMarketBias={game.marketBias}
              distribution={postDistribution}
              distributionLoading={postDistributionLoading}
            />
            </div>
          </motion.div>
        )}

        {toolsTab === "standings" && (
          <motion.div {...fadeUpMotionProps} className={glassCardStatsPanel}>
            <div className="relative z-1">
            <div
              className={
                isMobile
                  ? "mb-2 text-xs font-semibold text-white/90"
                  : isWc
                    ? "mb-3 text-base font-semibold text-white/90"
                    : "mb-3 text-sm font-semibold text-white/90"
              }
            >
              {m.predict.groupStandings}
            </div>
            <div
              className={
                isMobile
                  ? "border-t border-white/10 pt-2"
                  : isWc
                    ? "border-t border-white/10 pt-4"
                    : "border-t border-white/10 pt-3"
              }
            >
              {isWc ? (
                <WcStandingPanel
                  homeTeamId={game.home.teamId ?? ""}
                  awayTeamId={game.away.teamId ?? ""}
                  language={language}
                  isMobile={isMobile}
                />
              ) : showStandings ? (
                <NbaStandingsPanel compact={isMobile} />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/3 px-4 py-4 text-sm text-white/65">
                  {m.predict.standingsNotAvailable}
                </div>
              )}
            </div>
            </div>
          </motion.div>
        )}

        {toolsTab === "preview" && showWcMatchPreview && (
          <motion.div
            {...fadeUpMotionProps}
            className={[
              glassCardStatsPanel,
              isMobile ? "!px-2" : "",
            ].join(" ")}
          >
            <div className="relative z-1 min-w-0">
              <div
                className={
                  isMobile
                    ? "mb-2 text-sm font-semibold text-white/90"
                    : "mb-3 text-base font-semibold text-white/90"
                }
              >
                {m.predict.matchPreview}
              </div>
              <div
                className={
                  isMobile
                    ? "min-w-0 border-t border-white/10 pt-2"
                    : "border-t border-white/10 pt-4"
                }
              >
                <WcMatchPreviewPanel
                  gameId={gameId}
                  language={language}
                  isMobile={isMobile}
                />
              </div>
            </div>
          </motion.div>
        )}

        {toolsTab === "results" && isWc && (
          <motion.div {...fadeUpMotionProps} className={glassCardStatsPanel}>
            <div className="relative z-1">
              <div
                className={
                  isMobile
                    ? "mb-2 text-xs font-semibold text-white/90"
                    : "mb-3 text-base font-semibold text-white/90"
                }
              >
                {m.predict.pastResults}
              </div>
              <div
                className={
                  isMobile
                    ? "border-t border-white/10 pt-2"
                    : "border-t border-white/10 pt-4"
                }
              >
                <WcPastResultsPanel
                  homeTeamId={game.home.teamId ?? ""}
                  awayTeamId={game.away.teamId ?? ""}
                  currentGameId={gameId}
                  season={game.season}
                  language={language}
                  isMobile={isMobile}
                />
              </div>
            </div>
          </motion.div>
        )}

        {overlayFormLayout.showLoadingExisting ? (
          <motion.div
            {...fadeUpMotionProps}
            className="flex justify-center py-6"
          >
            <CandleChartLoader label={m.common.loading} />
          </motion.div>
        ) : null}

        {overlayFormLayout.showScoreForm ? (
          <>
            <motion.div
              {...fadeUpMotionProps}
              className={`relative space-y-4 pt-1 ${glassCard}`}
            >
              <PredictionScoringRulesChip
                league={game.league}
                language={language}
                size={isMobile ? "mobile" : "web"}
                className="absolute right-1 top-1 z-10"
              />
              <div className="relative z-1 min-w-0 pr-9 text-sm font-semibold text-white/88">
                {m.predict.scorePrediction}
              </div>

              <div className="relative z-1 grid grid-cols-2 gap-3">
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
                    placeholder={m.predict.scorePlaceholder}
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
                    placeholder={m.predict.scorePlaceholder}
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
                    setGoalScorerPick(null);
                  }}
                  className="mt-2 w-full text-center text-xs font-medium text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
                >
                  {m.predict.cancelEditing}
                </button>
              ) : null}

              {isWc ? (
                <WcGoalScorerPicker
                  homeTeamId={game.home?.teamId}
                  awayTeamId={game.away?.teamId}
                  homeLabel={homeLabel}
                  awayLabel={awayLabel}
                  predictedScore={predictedScoreForGoalScorer}
                  value={goalScorerPick}
                  onChange={setGoalScorerPick}
                  language={language}
                  isMobile={isMobile}
                />
              ) : null}
            </motion.div>

            <motion.div {...fadeUpMotionProps} className="pt-0">
              <button
                disabled={!canSubmit}
                onClick={handleSubmit}
                className={[
                  canSubmit
                    ? PREDICT_OVERLAY_SUBMIT_BTN_CLASS
                    : PREDICT_OVERLAY_SUBMIT_BTN_DISABLED_CLASS,
                  "flex h-12 w-full items-center justify-center text-sm font-bold tracking-[0.06em]",
                ].join(" ")}
              >
                {canSubmit ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-8 top-0 z-[1] h-px bg-linear-to-r from-transparent via-cyan-300/50 to-transparent"
                  />
                ) : null}
                <span className="relative z-[2]">
                  {submitting
                    ? m.common.submitting
                    : effectivePostId && showScoreEdit
                      ? m.predict.predictionUpdated
                      : m.predict.submitPrediction}
                </span>
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