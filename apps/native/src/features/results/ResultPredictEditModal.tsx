/**
 * Web `ResultListWithOverlay` の `predictOverlay`（試合取得 → MatchCard + PredictionForm）に相当。
 * リザルト一覧からその場でスコア修正できるようにする。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CyberGlassToastModal from "../../components/CyberGlassToastModal";
import { Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
  resolveGameTeamName,
} from "@uniterz/shared";
import { splitTeamNameByLeague, getTeamAlias } from "../../utils/teamName";
import PredictModal, {
  type PredictModalMatchPreview,
  type PredictModalScheduleMeta,
} from "../games/PredictModal";
import { buildPredictModalMergedFinalPreview } from "../games/buildPredictModalMergedFinal";
import { resolveWcBroadcastLabels } from "../../../../../lib/wc/wcBroadcastLabels";
import {
  isWcGoalScorerPickValidForPredictedScore,
  normalizeWcGoalScorerPick,
} from "../../../../../lib/wc/goalScorer";
import { getWcSquadPlayer } from "../../../../../lib/wc/squads";
import type { NativeGameRow, SupportedLeague } from "../games/useTodayGames";
import { getGamesTexts, type GamesLanguage } from "../games/gamesI18n";
import type { GameCardCenterBlock } from "../games/gameCardCenterTypes";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import { resolveTeamJerseyPalette } from "../games/teamColors";
import {
  resolveNativeSeriesLabel,
  resolveNativeSeriesPair,
} from "../games/resolveNativeSeriesStanding";
import {
  getUniterzApiBaseUrl,
  PredictionApiError,
  updatePredictionPostApi,
} from "../games/submitPredictionApi";
import {
  readEditModeHintShown,
  writeEditModeHintShown,
} from "../games/predictEditModeHintPrefs";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import {
  isPostPredictionEditableForViewer,
  type PostWithMillis,
} from "./nativeResultModel";

function draftStorageKey(userId: string, gameId: string): string {
  return `predictDraft:${userId}:${gameId}`;
}

/**
 * `posts` に埋め込まれた試合情報で `games` の getDoc を待たずにモーダルを開く。
 * ネットワークが遅いときの体感を抑える。取得後は Firestore の行で上書きする。
 */
function gameRowBootstrapFromPost(
  post: PostWithMillis,
  gameId: string
): Record<string, unknown> | null {
  const league = post.league;
  const home = post.home;
  const away = post.away;
  if (
    league == null ||
    typeof home !== "object" ||
    home === null ||
    typeof away !== "object" ||
    away === null
  ) {
    return null;
  }
  const row: Record<string, unknown> = {
    id: gameId,
    league,
    home: {
      ...(typeof home === "object" && home !== null ? home : { name: String(home ?? "") }),
      teamId:
        (typeof home === "object" && home !== null
          ? (home as { teamId?: string }).teamId
          : undefined) ??
        (post.home as { teamId?: string } | undefined)?.teamId,
    },
    away: {
      ...(typeof away === "object" && away !== null ? away : { name: String(away ?? "") }),
      teamId:
        (typeof away === "object" && away !== null
          ? (away as { teamId?: string }).teamId
          : undefined) ??
        (post.away as { teamId?: string } | undefined)?.teamId,
    },
    status: typeof post.status === "string" ? post.status : "scheduled",
  };
  if (post.result != null) row.result = post.result;
  const ht = post.homeTeamName;
  const at = post.awayTeamName;
  if (typeof ht === "string" && ht.trim()) row.homeTeamName = ht.trim();
  if (typeof at === "string" && at.trim()) row.awayTeamName = at.trim();
  const sj = post.startAtJst as unknown;
  const sa = post.startAt as unknown;
  if (sj != null) row.startAtJst = sj;
  if (sa != null) row.startAt = sa;
  const sm = post.startAtMillis;
  if (
    sj == null &&
    sa == null &&
    typeof sm === "number" &&
    Number.isFinite(sm)
  ) {
    row.startAtJst = Timestamp.fromMillis(sm);
  }
  const rl = post.roundLabel;
  if (typeof rl === "string" && rl.trim()) row.roundLabel = rl.trim();
  if (post.season != null) row.season = post.season;
  if (post.seasonPhase != null) row.seasonPhase = post.seasonPhase;
  return row;
}

function toSupportedLeague(raw: unknown): SupportedLeague {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "bj" || v.includes("b.league")) return "bj";
  if (v === "j1" || v === "j") return "j1";
  if (v === "pl" || v.includes("premier") || v.includes("epl")) return "pl";
  if (v === "wc" || v.includes("world")) return "wc";
  return "nba";
}

function toCompactTeamName(leagueRaw: unknown, rawName: string): string {
  const league = String(leagueRaw ?? "").toLowerCase();
  const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
  const toUnifiedLabel = (value: string) => normalize(value).toLocaleUpperCase("en-US");
  if (league === "pl") return toUnifiedLabel(getTeamAlias(rawName) ?? rawName);
  if (league === "nba") {
    const normalized = normalize(rawName);
    const nbaLabel = normalized.split(" ").filter(Boolean).slice(-1)[0] ?? normalized;
    return toUnifiedLabel(nbaLabel);
  }
  if (league === "bj" || league === "j1") {
    const [line1, line2] = splitTeamNameByLeague(
      league as "nba" | "bj" | "j1",
      rawName
    );
    return toUnifiedLabel(`${line1} ${line2}`.trim());
  }
  return toUnifiedLabel(rawName);
}

type Phase = "idle" | "loading" | "error" | "ready";

type Props = {
  visible: boolean;
  post: PostWithMillis | null;
  language: GamesLanguage;
  onClose: () => void;
  onUpdated: () => void | Promise<void>;
};

export default function ResultPredictEditModal({
  visible,
  post,
  language,
  onClose,
  onUpdated,
}: Props) {
  const { fUser } = useFirebaseUser();
  const t = useMemo(() => getGamesTexts(language), [language]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [game, setGame] = useState<Record<string, unknown> | null>(null);

  const [predictToolsTab, setPredictToolsTab] = useState<
    null | "h2h" | "market" | "stats" | "preview" | "standings"
  >(null);
  const [winner, setWinner] = useState<"home" | "away" | "draw" | null>(null);
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [predictSubmitting, setPredictSubmitting] = useState(false);
  /** 予想更新成功のカスタムオーバーレイ（システム Alert の代わり） */
  const [postUpdateSuccess, setPostUpdateSuccess] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const resetLocalForm = useCallback(() => {
    setPredictToolsTab(null);
    setWinner(null);
    setScoreHome("");
    setScoreAway("");
    setPredictSubmitting(false);
  }, []);

  useEffect(() => {
    if (!visible || !post) {
      setPhase("idle");
      setGame(null);
      resetLocalForm();
      return;
    }
    setPostUpdateSuccess(null);
    const gameId =
      typeof post.gameId === "string" && post.gameId.length > 0 ? post.gameId : null;
    if (!gameId) {
      setPhase("error");
      return;
    }

    let cancelled = false;
    const bootstrap = gameRowBootstrapFromPost(post, gameId);
    if (bootstrap) {
      setGame(bootstrap);
      setPhase("ready");
    } else {
      setPhase("loading");
      setGame(null);
    }

    void (async () => {
      try {
        const snap = await getDoc(doc(db, "games", gameId));
        if (cancelled) return;
        if (!snap.exists()) {
          if (!bootstrap && !cancelled) setPhase("error");
          return;
        }
        const row = { id: snap.id, ...snap.data() } as Record<string, unknown>;
        if (!cancelled) {
          setGame(row);
          setPhase("ready");
        }
      } catch {
        if (!cancelled && !bootstrap) setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, post?.id, post?.gameId, resetLocalForm]);

  /** 編集ヒント（GamesHomeScreen の openPredictModal と同様） */
  useEffect(() => {
    if (!visible || phase !== "ready" || !post) return;
    void (async () => {
      try {
        const hintSeen = await readEditModeHintShown();
        if (!hintSeen) {
          Alert.alert(t.editModeTitle, t.editModeBody);
          await writeEditModeHintShown();
        }
      } catch {
        /* ストレージ不可時はスキップ */
      }
    })();
  }, [visible, phase, post, t.editModeBody, t.editModeTitle]);

  /** 下書きまたは投稿のスコアでフォーム初期化 */
  useEffect(() => {
    if (!visible || phase !== "ready" || !game || !post || !fUser?.uid) return;
    const gameId = String(game.id ?? "");
    if (!gameId) return;

    void (async () => {
      const key = draftStorageKey(fUser.uid!, gameId);
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        try {
          const draft = JSON.parse(raw) as {
            winner: "home" | "away" | "draw" | null;
            scoreHome: string;
            scoreAway: string;
          };
          setWinner(draft.winner ?? null);
          setScoreHome(draft.scoreHome ?? "");
          setScoreAway(draft.scoreAway ?? "");
          return;
        } catch {
          /* ignore */
        }
      }
      const pred = post.prediction as
        | { winner?: string; score?: { home?: number; away?: number } }
        | undefined;
      const ph = pred?.score?.home;
      const pa = pred?.score?.away;
      if (typeof ph === "number" && typeof pa === "number") {
        setScoreHome(String(ph));
        setScoreAway(String(pa));
      }
      const w = pred?.winner;
      if (w === "home" || w === "away" || w === "draw") {
        setWinner(w);
      }
    })();
  }, [visible, phase, game, post, fUser?.uid]);

  const selectedLeague = useMemo(
    () => toSupportedLeague(game?.league),
    [game?.league]
  );

  const isSoccerPredict =
    selectedLeague === "wc" ||
    selectedLeague === "pl" ||
    selectedLeague === "j1";

  useEffect(() => {
    if (!visible || phase !== "ready") return;
    if (scoreHome === "" || scoreAway === "") {
      setWinner(null);
      return;
    }
    const homeNum = Number(scoreHome);
    const awayNum = Number(scoreAway);
    if (
      !Number.isFinite(homeNum) ||
      !Number.isFinite(awayNum) ||
      homeNum < 0 ||
      awayNum < 0
    ) {
      setWinner(null);
      return;
    }
    if (homeNum > awayNum) {
      setWinner("home");
      return;
    }
    if (awayNum > homeNum) {
      setWinner("away");
      return;
    }
    if (isSoccerPredict) {
      setWinner("draw");
      return;
    }
    setWinner(null);
  }, [visible, phase, scoreHome, scoreAway, isSoccerPredict]);

  useEffect(() => {
    if (!visible || phase !== "ready" || !game || !fUser?.uid) return;
    const gameId = String(game.id ?? "");
    if (!gameId) return;
    const key = draftStorageKey(fUser.uid, gameId);
    void AsyncStorage.setItem(
      key,
      JSON.stringify({ winner, scoreHome, scoreAway })
    );
  }, [visible, phase, game, fUser?.uid, winner, scoreHome, scoreAway]);

  const peerGames = useMemo((): NativeGameRow[] => {
    if (!game) return [];
    const row: NativeGameRow = {
      ...game,
      id: String(game.id ?? ""),
    } as NativeGameRow;
    return [row];
  }, [game]);

  const formatGameDateMs = useCallback(
    (ms: number) =>
      new Date(ms).toLocaleString(language === "en" ? "en-US" : "ja-JP", {
        timeZone: "Asia/Tokyo",
      }),
    [language]
  );

  const predictModalData = useMemo(() => {
    if (!game || !game.id) return null;
    const row: NativeGameRow = {
      ...game,
      id: String(game.id),
    } as NativeGameRow;
    return {
      gameId: String(game.id),
      league: selectedLeague,
      language,
      subjectGame: row,
      peerGames,
      formatGameDateMs,
      isSoccerLeague: isSoccerPredict,
    };
  }, [game, selectedLeague, language, peerGames, formatGameDateMs, isSoccerPredict]);

  const predictModalMatchPreview = useMemo((): PredictModalMatchPreview | null => {
    if (!game) return null;
    const g = game;
    const homeName = resolveGameTeamName(g.home, g.homeTeamName, "HOME");
    const awayName = resolveGameTeamName(g.away, g.awayTeamName, "AWAY");
    const homeCompact = toCompactTeamName(g.league, homeName);
    const awayCompact = toCompactTeamName(g.league, awayName);
    const centerBlock = getGameCardCenterBlock(g, language);
    const seriesLabel = resolveNativeSeriesLabel(g, peerGames);
    const seriesPair = resolveNativeSeriesPair(g, peerGames);
    const roundLabelRaw = g.roundLabel;
    const roundLabel =
      typeof roundLabelRaw === "string" && roundLabelRaw.trim()
        ? roundLabelRaw.trim()
        : null;
    const homePalette = resolveTeamJerseyPalette(g.league, g.home, "#ff6b8a");
    const awayPalette = resolveTeamJerseyPalette(g.league, g.away, "#5aa4ff");
    return {
      roundLabel,
      homeCompact,
      awayCompact,
      /** Web オーバーレイの MatchCard と同様、記録行は省略 */
      homeRecord: null,
      awayRecord: null,
      centerBlock,
      seriesLabel,
      seriesPair,
      homePalette,
      awayPalette,
      leagueRaw: g.league,
      homeSide: g.home,
      awaySide: g.away,
    };
  }, [game, language, peerGames]);

  const predictOverlayMarketBar = useMemo(() => {
    if (!game?.id) return null;
    const gameId = String(game.id);
    const homeName = resolveGameTeamName(game.home, game.homeTeamName, "HOME");
    const awayName = resolveGameTeamName(game.away, game.awayTeamName, "AWAY");
    const pred = post?.prediction as { winner?: "home" | "away" | "draw" } | undefined;
    const homePalette = resolveTeamJerseyPalette(game.league, game.home, "#ff6b8a");
    const awayPalette = resolveTeamJerseyPalette(game.league, game.away, "#5aa4ff");
    const marketBias = game.marketBias as { homePct?: number; awayPct?: number } | undefined;
    return {
      gameId,
      league: selectedLeague,
      status: resolveGameStatus(game),
      score: resolveGameScore(game),
      fallbackMarketBias:
        marketBias?.homePct != null && marketBias?.awayPct != null
          ? { homePct: marketBias.homePct, awayPct: marketBias.awayPct }
          : null,
      homeColor: homePalette.primary,
      awayColor: awayPalette.primary,
      homeLabel: toCompactTeamName(game.league, homeName),
      awayLabel: toCompactTeamName(game.league, awayName),
      compact: selectedLeague === "wc",
      userPredictionWinner: winner ?? pred?.winner ?? null,
    };
  }, [game, post?.prediction, selectedLeague, winner]);

  const predictScheduleMeta = useMemo((): PredictModalScheduleMeta | null => {
    if (!game) return null;
    if (resolveGameStatus(game) !== "scheduled") return null;
    const startAt = resolveGameStartAt(game);
    const kickoffValue = formatKickoffTime(startAt, language);
    const gameId = String(game.id ?? "");
    const broadcastLabels =
      selectedLeague === "wc" ? resolveWcBroadcastLabels(gameId, game) : [];
    if (!startAt && broadcastLabels.length === 0) return null;
    return { kickoffValue, broadcastLabels };
  }, [game, selectedLeague, language]);

  const wcGoalScorerPreview = useMemo(() => {
    if (!game || selectedLeague !== "wc" || !post) return null;
    const homeSide = game.home as { teamId?: string } | undefined;
    const awaySide = game.away as { teamId?: string } | undefined;
    const homeTeamId = homeSide?.teamId;
    const awayTeamId = awaySide?.teamId;
    const homeRaw = scoreHome.trim();
    const awayRaw = scoreAway.trim();
    if (homeRaw === "" || awayRaw === "") return null;
    const score = { home: Number(homeRaw), away: Number(awayRaw) };
    if (
      !Number.isInteger(score.home) ||
      !Number.isInteger(score.away) ||
      score.home < 0 ||
      score.away < 0
    ) {
      return null;
    }
    const storedPick = (post.prediction as { goalScorer?: unknown } | undefined)
      ?.goalScorer;
    const pick = normalizeWcGoalScorerPick(storedPick);
    if (
      !pick ||
      !isWcGoalScorerPickValidForPredictedScore(
        pick,
        score,
        homeTeamId,
        awayTeamId
      )
    ) {
      return null;
    }
    const playerName =
      getWcSquadPlayer(pick.teamId, pick.playerId)?.name ?? pick.playerId;
    return { playerName, teamId: pick.teamId };
  }, [game, post, selectedLeague, scoreHome, scoreAway]);

  const predictMergedFinalPreview = useMemo(() => {
    if (!game || !post) return null;
    if (resolveGameStatus(game) !== "final") return null;
    const finalScore = resolveGameScore(game);
    if (!finalScore) return null;
    const pred = post.prediction as
      | {
          score?: { home?: number; away?: number };
          goalScorer?: unknown;
        }
      | undefined;
    const predictedScore = pred?.score;
    if (
      predictedScore?.home == null ||
      predictedScore?.away == null ||
      !Number.isFinite(predictedScore.home) ||
      !Number.isFinite(predictedScore.away)
    ) {
      return null;
    }
    const homeSide = game.home as { teamId?: string } | undefined;
    const awaySide = game.away as { teamId?: string } | undefined;
    return buildPredictModalMergedFinalPreview({
      league: selectedLeague,
      language,
      finalScore,
      predictedScore: {
        home: predictedScore.home,
        away: predictedScore.away,
      },
      stats: (post.stats as Record<string, unknown> | undefined) ?? null,
      goalScorer: pred?.goalScorer,
      homeTeamId: homeSide?.teamId,
      awayTeamId: awaySide?.teamId,
      finalOt: resolveFinalMetaOt(game),
    });
  }, [game, post, selectedLeague, language]);

  const predictModalHomeLabel = useMemo(() => {
    if (!game) return "";
    const homeName = resolveGameTeamName(
      game.home,
      game.homeTeamName,
      "HOME"
    );
    return toCompactTeamName(game.league, homeName);
  }, [game]);

  const predictModalAwayLabel = useMemo(() => {
    if (!game) return "";
    const awayName = resolveGameTeamName(
      game.away,
      game.awayTeamName,
      "AWAY"
    );
    return toCompactTeamName(game.league, awayName);
  }, [game]);

  const handleClose = useCallback(() => {
    resetLocalForm();
    setPhase("idle");
    setGame(null);
    onClose();
  }, [onClose, resetLocalForm]);

  const handleSubmit = useCallback(async () => {
    if (!game || !fUser || !post) return;
    if (scoreHome.trim() === "" || scoreAway.trim() === "") {
      Alert.alert(t.missingWinnerTitle, t.predictionNeedsScoresBody);
      return;
    }
    if (!winner) {
      Alert.alert(t.invalidInputTitle, t.predictionNeedsWinnerScoreBody);
      return;
    }
    const homeNum = Number(scoreHome);
    const awayNum = Number(scoreAway);
    if (
      !Number.isFinite(homeNum) ||
      !Number.isFinite(awayNum) ||
      homeNum < 0 ||
      awayNum < 0
    ) {
      Alert.alert(t.invalidInputTitle, t.invalidScoreBody);
      return;
    }
    if (!isSoccerPredict && winner === "draw") {
      Alert.alert(t.invalidInputTitle, t.invalidDrawLeagueBody);
      return;
    }
    if (winner === "home" && homeNum <= awayNum) {
      Alert.alert(t.invalidInputTitle, t.invalidHomeWinBody);
      return;
    }
    if (winner === "away" && awayNum <= homeNum) {
      Alert.alert(t.invalidInputTitle, t.invalidAwayWinBody);
      return;
    }
    if (winner === "draw" && homeNum !== awayNum) {
      Alert.alert(t.invalidInputTitle, t.invalidDrawScoreBody);
      return;
    }

    if (!isPostPredictionEditableForViewer(post, fUser?.uid)) {
      Alert.alert(t.submitLockedTitle, t.submitLockedBody);
      return;
    }

    if (!getUniterzApiBaseUrl()) {
      Alert.alert(t.apiBaseMissingTitle, t.apiBaseMissingBody);
      return;
    }

    setPredictSubmitting(true);
    try {
      await updatePredictionPostApi(post.id, {
        winner,
        scoreHome: homeNum,
        scoreAway: awayNum,
      });
      await AsyncStorage.removeItem(draftStorageKey(fUser.uid, String(game.id ?? "")));
      await onUpdated();
      setPostUpdateSuccess({
        title: language === "en" ? "Done" : "完了",
        message: language === "en" ? "Prediction updated." : "予想を更新しました。",
      });
      handleClose();
    } catch (err) {
      const msg =
        err instanceof PredictionApiError
          ? err.message
          : language === "en"
            ? "Could not update."
            : "更新に失敗しました。";
      Alert.alert(language === "en" ? "Error" : "エラー", msg);
    } finally {
      setPredictSubmitting(false);
    }
  }, [
    game,
    fUser,
    post,
    scoreHome,
    scoreAway,
    winner,
    isSoccerPredict,
    t,
    language,
    onUpdated,
    handleClose,
  ]);

  const predictModalVisible = Boolean(visible && phase === "ready" && game && post);

  /** Web GET `/api/posts_v2/:id` の `editable` と一致（試合 doc ではなく投稿のキックオフ時刻） */
  const predictionEditable = Boolean(
    post && isPostPredictionEditableForViewer(post, fUser?.uid)
  );

  const loadingOverlay =
    visible && post && phase === "loading" ? (
      <Modal transparent animationType="fade" visible>
        <View style={styles.loadingRoot}>
          <View style={styles.loadingCard}>
            <BlocksPulseLoader />
          </View>
        </View>
      </Modal>
    ) : null;

  const errorOverlay =
    visible && post && phase === "error" ? (
      <Modal transparent animationType="fade" visible>
        <Pressable style={styles.loadingRoot} onPress={handleClose}>
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              {language === "en"
                ? "Could not load this match."
                : "試合データを読み込めませんでした。"}
            </Text>
            <Pressable style={styles.errorBtn} onPress={handleClose}>
              <Text style={styles.errorBtnLabel}>
                {language === "en" ? "Close" : "閉じる"}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    ) : null;

  const dismissPostSuccess = useCallback(() => {
    setPostUpdateSuccess(null);
  }, []);

  return (
    <>
      {loadingOverlay}
      {errorOverlay}
      <CyberGlassToastModal
        visible={postUpdateSuccess != null}
        title={postUpdateSuccess?.title ?? ""}
        message={postUpdateSuccess?.message ?? ""}
        onDismiss={dismissPostSuccess}
      />
      <PredictModal
        visible={predictModalVisible}
        matchPreview={predictModalMatchPreview}
        t={t}
        predictHomeTeamLabel={predictModalHomeLabel}
        predictAwayTeamLabel={predictModalAwayLabel}
        predictToolsTab={predictToolsTab}
        setPredictToolsTab={setPredictToolsTab}
        winner={winner}
        isSoccerPredict={isSoccerPredict}
        scoreAway={scoreAway}
        setScoreAway={setScoreAway}
        scoreHome={scoreHome}
        setScoreHome={setScoreHome}
        predictSubmitting={predictSubmitting}
        isEditingPrediction={Boolean(post?.id)}
        onSubmit={() => void handleSubmit()}
        onClose={handleClose}
        spectatorStartedNoPost={false}
        predictionEditLockedAfterKickoff={!predictionEditable}
        expandScoreFormWhenEditing={false}
        predictData={predictModalData}
        overlayMarketBar={predictOverlayMarketBar}
        predictScheduleMeta={predictScheduleMeta}
        wcGoalScorerPreview={wcGoalScorerPreview}
        mergedFinalPreview={predictMergedFinalPreview}
        language={language}
        overlayUnifiedForm
      />
    </>
  );
}

function formatKickoffTime(
  startAt: Date | null,
  language: GamesLanguage
): string {
  if (!startAt) return "--:--";
  const timeZone = language === "en" ? "America/New_York" : "Asia/Tokyo";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(startAt);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function resolveFinalMetaOt(raw: Record<string, unknown>): boolean {
  const fm = raw.finalMeta as { ot?: boolean } | undefined;
  return Boolean(fm?.ot);
}

/** Web `MatchCardMobile` の isLive：公式 LIVE またはキックオフ経過後の予熱 */
function isEffectiveLive(game: Record<string, unknown>): boolean {
  const status = resolveGameStatus(game);
  if (status === "live") return true;
  if (status !== "scheduled") return false;
  const startAt = resolveGameStartAt(game);
  return startAt != null && Date.now() >= startAt.getTime();
}

/** `GamesHomeScreen` と同一の中央ブロック解決 */
function getGameCardCenterBlock(
  game: Record<string, unknown>,
  language: GamesLanguage
): GameCardCenterBlock {
  const status = resolveGameStatus(game);
  const score = resolveGameScore(game);
  const startAt = resolveGameStartAt(game);
  const liveUi = isEffectiveLive(game);
  if (status === "final" && score) {
    const ot = resolveFinalMetaOt(game);
    const sub = `${language === "en" ? "Final" : "試合終了"}${
      ot ? " (OT)" : ""
    }`;
    return { variant: "score", home: score.home, away: score.away, subLine: sub };
  }
  if (liveUi) {
    return { variant: "liveMark" };
  }
  return {
    variant: "time",
    time: formatKickoffTime(startAt, language),
  };
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingCard: {
    padding: 28,
    borderRadius: 16,
    backgroundColor: "rgba(15,18,28,0.94)",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.25)",
    alignItems: "center",
    gap: 14,
    minWidth: 220,
  },
  errorCard: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: "rgba(15,18,28,0.96)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.35)",
    alignItems: "center",
    gap: 16,
    maxWidth: 320,
  },
  errorText: {
    color: "rgba(248,250,252,0.85)",
    fontSize: 14,
    textAlign: "center",
  },
  errorBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.45)",
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  errorBtnLabel: {
    color: "rgba(224,250,254,0.95)",
    fontSize: 14,
    fontWeight: "700",
  },
});
