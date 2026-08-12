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
import { isWcKnockoutGame } from "@/lib/legacyWcWebShims";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import GameTeamStats from "@/app/component/predict/GameTeamStats";
import GamePredictionDistribution from "@/app/component/predict/GamePredictionDistribution";
import NbaPredictToolsTabs from "@/app/component/predict/NbaPredictToolsTabs";
function WcTeamProfilePanel(_props: Record<string, unknown>) {
  return null;
}
function WcPastResultsPanel(_props: Record<string, unknown>) {
  return null;
}
function WcStandingPanel(_props: Record<string, unknown>) {
  return null;
}
function WcMatchPreviewPanel(_props: Record<string, unknown>) {
  return null;
}
function WcKnockoutChallengeModal(_props: Record<string, unknown>) {
  return null;
}
function WcGoalScorerPicker(_props: Record<string, unknown>) {
  return null;
}
import { useWcKnockoutChallengePrompt, hasWcMatchPreview } from "@/lib/legacyWcWebShims";
import NbaTopScorerPicker from "@/app/component/predict/nba/NbaTopScorerPicker";
import {
  normalizeNbaTopScorerCandidates,
  normalizeNbaTopScorerPick,
  type NbaTopScorerPick,
} from "@/lib/nba/topScorer";
import CountryFlag from "@/app/component/games/CountryFlag";
import {
  normalizeWcGoalScorerPick,
  type WcGoalScorerPick,
} from "@/lib/legacyWcWebShims";
import {
  buildClientPredictionPayload,
  validateClientPrediction,
} from "@/lib/predict/clientPredictionSubmit";
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
import TutorialPredictAnnotator from "@/app/component/tutorial/TutorialPredictAnnotator";
import { TUTORIAL_CYAN } from "@/lib/tutorial/tutorialMotion";
import PredictOverlayScoreFields from "@/app/component/predict/PredictOverlayScoreFields";
import { useUserPlan } from "@/hooks/useUserPlan";
import { usePredictionPostDistribution } from "@/lib/hooks/usePredictionPostDistribution";
import { loadResultPostDetailClient } from "@/lib/result/loadResultPostDetailClient";
import { mergeGameIntoResultPost } from "@/lib/result/mergeGameIntoResultPost";
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
  /** 親の predict-overlay-cyber-form 一枚に内包するとき（内側のフォーム面を出さない） */
  overlayUnifiedForm?: boolean;
  /** オーバーレイ: MatchCard から渡すホーム戦績（Pro Info チーム文脈用） */
  overlayHomeRecord?: MatchCardProps["homeRecord"];
  /** オーバーレイ: MatchCard から渡すアウェイ戦績（Pro Info チーム文脈用） */
  overlayAwayRecord?: MatchCardProps["awayRecord"];
  /**
   * チュートリアル練習用。API / 認証をスキップして onTutorialSubmit に渡す。
   */
  tutorialMode?: boolean;
  onTutorialSubmit?: (payload: {
    winner: "home" | "away" | "draw";
    scoreHome: number;
    scoreAway: number;
    goalScorer?: { playerId: string; teamId: string } | null;
  }) => void;
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
  overlayUnifiedForm = false,
  overlayHomeRecord: _overlayHomeRecord,
  overlayAwayRecord: _overlayAwayRecord,
  tutorialMode = false,
  onTutorialSubmit,
}: Props) {
  void _overlayHomeRecord;
  void _overlayAwayRecord;
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
  /** ノックアウトで同点（PK 決着）を予想したときに勝ち上がる側 */
  const [pkWinner, setPkWinner] = useState<"home" | "away" | null>(null);
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [goalScorerPick, setGoalScorerPick] = useState<
    WcGoalScorerPick | NbaTopScorerPick | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [toolsTab, setToolsTab] = useState<
    null | "stats" | "market" | "standings" | "preview" | "results"
  >(null);
  const [marketChartKey, setMarketChartKey] = useState(0);
  const [tutorialAnnotDismissed, setTutorialAnnotDismissed] = useState(false);

  useEffect(() => {
    if (tutorialMode) setTutorialAnnotDismissed(false);
  }, [tutorialMode]);
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
  const isNba = game.league === "nba";
  const showWcMatchPreview = isWc && hasWcMatchPreview(gameId);
  const isSoccer = game.league === "pl" || game.league === "j1" || isWc;
  /** WC ノックアウト：引き分け「結果」は存在しない（同点は PK 決着）ため市場表示から引き分けを除外 */
  const isKnockout = isWcKnockoutGame(game);
  const { isPro: isProUser } = useUserPlan(auth.currentUser?.uid ?? undefined);
  /** 引き分けを許可するサッカー試合か（グループリーグ・リーグ戦のみ） */
  const drawAllowed = isSoccer && !isKnockout;
  /** ノックアウト予想フローで UNITERZ ノックアウトチャレンジ告知を生涯1回表示 */
  const knockoutChallengePrompt = useWcKnockoutChallengePrompt(isKnockout);
  /** ノックアウトで同点スコアを入力中（＝PK 決着の予想）か */
  const knockoutScoreTie =
    isKnockout &&
    scoreHome !== "" &&
    scoreAway !== "" &&
    Number(scoreHome) === Number(scoreAway);
  // WC は Standings タブ（グループ順位 + FIFA ランク）を常に出す。
  // NBA は旧ツールタブ廃止（Insight / Injury / Team Stats / Roster の新タブに移行）
  const showStandings = isWc;
  const showStandingsTab = showStandings;

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

  useEffect(() => {
    if (!onMarketDistributionChange) return;
    const total =
      postDistribution.home +
      postDistribution.away +
      (drawAllowed ? postDistribution.draw : 0);
    if (total <= 0) return;
    onMarketDistributionChange({
      homePct: (postDistribution.home / total) * 100,
      awayPct: (postDistribution.away / total) * 100,
    });
  }, [postDistribution, drawAllowed, onMarketDistributionChange]);

  useEffect(() => {
    onStandingsOpenChange?.(toolsTab === "standings");
  }, [toolsTab, onStandingsOpenChange]);

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

    if (drawAllowed && h === a) {
      setWinner("draw");
      return;
    }

    // ノックアウトの同点は PK 決着：選んだ勝ち上がり側を勝者にする（未選択なら送信不可）
    if (isKnockout && h === a) {
      setWinner(pkWinner);
      return;
    }

    setWinner(null);
  }, [scoreHome, scoreAway, drawAllowed, isKnockout, pkWinner]);

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
      setGoalScorerPick(
        normalizeWcGoalScorerPick(pred.goalScorer) ??
          normalizeNbaTopScorerPick(pred.goalScorer)
      );
      setWinner(pred.winner);
      // ノックアウトで同点（PK 決着）の既存予想は勝ち上がり側を復元
      if (
        pred.score.home === pred.score.away &&
        (pred.winner === "home" || pred.winner === "away")
      ) {
        setPkWinner(pred.winner);
      }
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

  const nbaTopScorerCandidates = useMemo(
    () =>
      normalizeNbaTopScorerCandidates(
        game.topScorerCandidates ??
          (game as { topScorerCandidates?: unknown }).topScorerCandidates
      ),
    [game]
  );

  const buildPredictionPayload = (
    h: number,
    a: number,
    resolvedWinner: "home" | "away" | "draw"
  ): {
    winner: Winner;
    score: { home: number; away: number };
    goalScorer?: WcGoalScorerPick | NbaTopScorerPick | null;
  } => {
    return buildClientPredictionPayload({
      validated: { winner: resolvedWinner, score: { home: h, away: a } },
      league: game.league,
      goalScorerPick,
      homeTeamId: game.home?.teamId,
      awayTeamId: game.away?.teamId,
    });
  };

  const overlayEmbedded = embedded && inOverlay;
  const overlayUnified = overlayEmbedded && overlayUnifiedForm;

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

  const glassCard = overlayUnified
    ? "relative w-full overflow-hidden px-3 py-2 md:px-4 md:py-2.5"
    : overlayEmbedded
      ? `relative w-full overflow-hidden ${PREDICT_OVERLAY_FORM_PANEL} px-4 py-3`
      : `relative w-full overflow-hidden rounded-2xl ${standaloneGlassFill} px-4 py-3`;

  /** 試合カードと同幅。上下は詰めてセグメントを近づける */
  const glassCardStatsPanel = overlayUnified
    ? "relative w-full overflow-visible px-0 py-0 md:px-0"
    : overlayEmbedded
      ? `relative w-full overflow-visible ${PREDICT_OVERLAY_FORM_PANEL} px-0 py-1`
      : isMobile
        ? `relative w-full overflow-visible rounded-xl ${standaloneGlassFill} px-0 py-1`
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

    const h = Number(scoreHome);
    const a = Number(scoreAway);

    const validated = validateClientPrediction({
      winner,
      scoreHome: h,
      scoreAway: a,
      league: game.league,
      knockout: isKnockout,
      pkWinner,
    });
    if (!validated.ok) {
      if (validated.code === "knockout_pk_winner_required") {
        alert(
          language === "ja"
            ? "同点予想のため、PKで勝ち上がるチームを選んでください。"
            : "Pick which team advances on penalties."
        );
        return;
      }
      alert(m.predict.enterValidScores);
      return;
    }

    const predictionPayload = buildPredictionPayload(
      validated.value.score.home,
      validated.value.score.away,
      validated.value.winner
    );

    /** チュートリアル: 認証・API をスキップ */
    if (tutorialMode) {
      try {
        setSubmitting(true);
        onTutorialSubmit?.({
          winner: validated.value.winner,
          scoreHome: validated.value.score.home,
          scoreAway: validated.value.score.away,
          goalScorer:
            isNba && predictionPayload.goalScorer
              ? (predictionPayload.goalScorer as NbaTopScorerPick)
              : null,
        });
        toast.success(m.predict.predictionSubmitted);
        onPostCreated?.({ id: "tutorial-local", at: new Date() });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const me = auth.currentUser;
    if (!me) return;

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
              prediction: predictionPayload,
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
        const nextPrediction = predictionPayload;
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
        setPkWinner(null);
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
        prediction: predictionPayload,
        comment: "",
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
      setPkWinner(null);
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
              ? "space-y-1.5 pt-1.5"
              : "space-y-2 pt-2"
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

        {isNba && !isGameStarted ? (
          /* 開始前のみ: Insight / Injury / Stats / Roster */
          <motion.div {...fadeUpMotionProps} className={glassCardStatsPanel}>
            <div className="relative z-1">
              <NbaPredictToolsTabs
                language={language}
                isPro={isProUser}
                homeTeamId={game.home.teamId}
                awayTeamId={game.away.teamId}
                homeTeamName={homeSafe.name}
                awayTeamName={awaySafe.name}
              />
            </div>
          </motion.div>
        ) : !isNba ? (
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
              setToolsTab((t) => (t === "stats" ? null : "stats"))
            }
            className={
              overlayEmbedded
                ? overlayToolButtonClass(toolsTab === "stats")
                : [
                    toolButtonBase,
                    toolsTab === "stats"
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
                {isWc ? m.predict.teamProfile : m.predict.teamStats}
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
              if (!showStandings) return;
              setToolsTab((t) => (t === "standings" ? null : "standings"));
            }}
            disabled={!showStandings}
            className={
              overlayEmbedded
                ? overlayToolButtonClass(
                    toolsTab === "standings",
                    !showStandings
                  )
                : [
                    toolButtonBase,
                    toolsTab === "standings"
                      ? "border-cyan-300/35 bg-cyan-300/12 text-white"
                      : showStandings
                        ? toolButtonInactiveClass
                        : "cursor-not-allowed border-white/10 bg-white/2 text-white/35",
                  ].join(" ")
            }
          >
            <span className={isMobile ? "truncate" : ""}>
              {m.predict.groupStandings}
            </span>
          </button>
        </motion.div>
        ) : null}

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
                    gameId={gameId}
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
              knockout={isKnockout}
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
            {tutorialMode ? (
              <TutorialPredictAnnotator
                open={!tutorialAnnotDismissed}
                overviewTitle={m.tutorial.practice.predictOverviewTitle}
                overviewBody={m.tutorial.practice.predictOverviewBody}
                sidesTitle={m.tutorial.practice.predictSidesTitle}
                sidesBody={m.tutorial.practice.predictSidesBody}
                marketTitle={m.tutorial.practice.predictMarketTitle}
                marketBody={m.tutorial.practice.predictMarketBody}
                toolsTitle={m.tutorial.practice.predictToolsTitle}
                toolsBody={m.tutorial.practice.predictToolsBody}
                scoresTitle={m.tutorial.practice.predictScoresTitle}
                scoresBody={m.tutorial.practice.predictScoresBody}
                bonusTitle={m.tutorial.practice.predictBonusTitle}
                bonusBody={m.tutorial.practice.predictBonusBody}
                enterTitle={m.tutorial.practice.predictEnterTitle}
                enterBody={m.tutorial.practice.predictEnterBody}
                submitTitle={m.tutorial.practice.predictSubmitTitle}
                submitBody={m.tutorial.practice.predictSubmitBody}
                nextLabel={m.tutorial.next}
                skipLabel={m.tutorial.skip}
                enterWaitHint={m.tutorial.practice.predictEnterWait}
                submitWaitHint={m.tutorial.practice.predictSubmitWait}
                enterReady={scoreHome !== "" && scoreAway !== ""}
                backLabel={m.tutorial.back}
                onSkip={() => setTutorialAnnotDismissed(true)}
              />
            ) : null}
            <motion.div
              {...fadeUpMotionProps}
              className={`relative space-y-4 pt-1 ${glassCard} ${
                tutorialMode
                  ? "ring-1 ring-cyan-300/40 shadow-[0_0_18px_rgba(0,245,255,0.18)]"
                  : ""
              }`}
            >
              <PredictionScoringRulesChip
                league={game.league}
                language={language}
                size={isMobile ? "mobile" : "web"}
                className="absolute right-1 top-1 z-10"
              />
              <div className="relative z-1 min-w-0 pr-9 text-sm font-semibold text-white/88">
                {m.predict.scorePrediction}
                {isKnockout ? (
                  <span className="ml-0.5 align-super text-[10px] font-bold text-amber-300/90">
                    *
                  </span>
                ) : null}
              </div>

              {isKnockout ? (
                <div className="relative z-1 -mt-2 space-y-1">
                  <div className="text-xs font-medium leading-relaxed text-amber-300/80">
                    {language === "ja"
                      ? "* 同点予想は PK 戦で決着。勝ち上がるチームを選んでください（採点は PK 前のスコアで判定）。"
                      : "* A level score goes to penalties — pick who advances (scored on the pre-penalty result)."}
                  </div>
                  <div className="rounded-lg border border-amber-300/15 bg-amber-300/[0.06] px-2.5 py-1.5 text-[11px] leading-relaxed text-white/70">
                    {language === "ja" ? (
                      <>
                        <span className="font-semibold text-amber-200/90">例）</span>{" "}
                        「1-1・{homeLabel}が PK 勝ち」と予想 → 実際も同点で{" "}
                        {homeLabel}が進出すれば満点。進出チームを外すとスコアが合っていても 0 点。
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-amber-200/90">e.g.</span>{" "}
                        Predict “1-1, {homeLabel} win on pens” → full marks if it
                        ends level and {homeLabel} advance. Pick the wrong team to
                        advance and it’s 0, even with the right score.
                      </>
                    )}
                  </div>
                </div>
              ) : null}

              <div
                data-tutorial-target={
                  tutorialMode ? "predict-scores" : undefined
                }
                className="relative z-1 space-y-4"
              >
              {overlayEmbedded ? (
                <PredictOverlayScoreFields
                  home={{
                    label: homeLabel,
                    teamId: game.home?.teamId,
                    value: scoreHome,
                    onChange: setScoreHome,
                    placeholder: m.predict.scorePlaceholder,
                  }}
                  away={{
                    label: awayLabel,
                    teamId: game.away?.teamId,
                    value: scoreAway,
                    onChange: setScoreAway,
                    placeholder: m.predict.scorePlaceholder,
                  }}
                />
              ) : (
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
              )}

              {knockoutScoreTie ? (
                <div className="relative z-1 space-y-2">
                  <div className="text-sm font-semibold text-amber-300/90">
                    {language === "ja"
                      ? "PK戦で勝ち上がるチーム"
                      : "Who advances on penalties?"}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        {
                          side: "home" as const,
                          label: homeLabel,
                          teamId: game.home?.teamId,
                        },
                        {
                          side: "away" as const,
                          label: awayLabel,
                          teamId: game.away?.teamId,
                        },
                      ]
                    ).map(({ side, label, teamId }) => {
                      const active = pkWinner === side;
                      return (
                        <button
                          key={side}
                          type="button"
                          onClick={() => setPkWinner(side)}
                          aria-pressed={active}
                          aria-label={label}
                          className={[
                            "flex h-12 items-center justify-center rounded-xl border transition-all duration-200",
                            active
                              ? "border-amber-300/70 bg-amber-300/15 shadow-[0_0_12px_rgba(252,211,77,0.25)]"
                              : "border-white/12 bg-white/[0.04] hover:bg-white/[0.08]",
                          ].join(" ")}
                        >
                          <CountryFlag
                            teamId={teamId}
                            alt={label}
                            className={[
                              "aspect-[4/3] w-9",
                              active ? "" : "opacity-85",
                            ].join(" ")}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              </div>

              {showScoreEdit && effectivePostId ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowScoreEdit(false);
                    setScoreHome("");
                    setScoreAway("");
                    setWinner(null);
                    setPkWinner(null);
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
                  gameId={gameId}
                />
              ) : null}

              {isNba ? (
                <div
                  data-tutorial-target={
                    tutorialMode ? "predict-bonus" : undefined
                  }
                >
                  <NbaTopScorerPicker
                    homeTeamId={game.home?.teamId}
                    awayTeamId={game.away?.teamId}
                    homeLabel={homeLabel}
                    awayLabel={awayLabel}
                    candidates={nbaTopScorerCandidates}
                    value={
                      goalScorerPick
                        ? normalizeNbaTopScorerPick(goalScorerPick)
                        : null
                    }
                    onChange={setGoalScorerPick}
                    language={language}
                    isMobile={isMobile}
                  />
                </div>
              ) : null}
            </motion.div>

            <motion.div
              {...fadeUpMotionProps}
              className="pt-0"
              data-tutorial-target={tutorialMode ? "predict-submit" : undefined}
            >
              <button
                disabled={!canSubmit}
                onClick={handleSubmit}
                className={[
                  canSubmit
                    ? PREDICT_OVERLAY_SUBMIT_BTN_CLASS
                    : PREDICT_OVERLAY_SUBMIT_BTN_DISABLED_CLASS,
                  "flex h-12 w-full items-center justify-center text-sm font-bold tracking-[0.06em]",
                  tutorialMode && canSubmit
                    ? "animate-pulse shadow-[0_0_22px_rgba(0,245,255,0.45)]"
                    : "",
                ].join(" ")}
                style={
                  tutorialMode && canSubmit
                    ? { boxShadow: `0 0 22px ${TUTORIAL_CYAN}66` }
                    : undefined
                }
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
    <WcKnockoutChallengeModal
      open={knockoutChallengePrompt.open}
      language={language}
      onClose={knockoutChallengePrompt.dismiss}
    />
    </>
  );
}