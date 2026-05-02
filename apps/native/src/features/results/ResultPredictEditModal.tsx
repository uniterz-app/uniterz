/**
 * Web `ResultListWithOverlay` の `predictOverlay`（試合取得 → MatchCard + PredictionForm）に相当。
 * リザルト一覧からその場でスコア修正できるようにする。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, type DocumentSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
  resolveGameTeamName,
} from "../../shared/gameRow";
import { splitTeamNameByLeague, getTeamAlias } from "../../utils/teamName";
import PredictModal, {
  type PredictModalMatchPreview,
} from "../games/PredictModal";
import type { NativeGameRow, SupportedLeague } from "../games/useTodayGames";
import { getGamesTexts, type GamesLanguage } from "../games/gamesI18n";
import type { GameCardCenterBlock } from "../games/gameCardCenterTypes";
import { resolveTeamJerseyPalette } from "../games/teamColors";
import {
  resolveNativeSeriesLabel,
  resolveNativeSeriesPair,
} from "../games/resolveNativeSeriesStanding";
import {
  fetchPredictionPostGet,
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
  type PostWithMillis,
  isNativePostPredictionEditable,
} from "./nativeResultModel";

/** スコア文字列から勝者を決める（NBA 同点は null → 送信時バリデーション） */
function inferWinnerFromScores(
  league: SupportedLeague,
  scoreHome: string,
  scoreAway: string
): "home" | "away" | "draw" | null {
  if (scoreHome.trim() === "" || scoreAway.trim() === "") return null;
  const h = Number(scoreHome);
  const a = Number(scoreAway);
  if (!Number.isFinite(h) || !Number.isFinite(a) || h < 0 || a < 0) return null;
  const soccer = league === "pl" || league === "j1";
  if (h > a) return "home";
  if (a > h) return "away";
  return soccer ? "draw" : null;
}

function draftStorageKey(userId: string, gameId: string): string {
  return `predictDraft:${userId}:${gameId}`;
}

function toSupportedLeague(raw: unknown): SupportedLeague {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "bj" || v.includes("b.league")) return "bj";
  if (v === "j1" || v === "j") return "j1";
  if (v === "pl" || v.includes("premier") || v.includes("epl")) return "pl";
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

/** Firestore が無応答でもオーバーレイが塞がれ続けないようにする */
const GAME_DOC_FETCH_TIMEOUT_MS = 20_000;

function getGameDocWithTimeout(gameId: string): Promise<DocumentSnapshot> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error("game_doc_timeout"));
    }, GAME_DOC_FETCH_TIMEOUT_MS);
    void getDoc(doc(db, "games", gameId))
      .then((snap) => {
        clearTimeout(t);
        resolve(snap);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

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
  /** null: 未取得。API + 投稿で確定後にモーダルを出す（修正可否のチラつき防止） */
  const [postEditAllowed, setPostEditAllowed] = useState<boolean | null>(null);

  const [predictToolsTab, setPredictToolsTab] = useState<
    null | "h2h" | "market" | "stats"
  >(null);
  const [winner, setWinner] = useState<"home" | "away" | "draw" | null>(null);
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [predictSubmitting, setPredictSubmitting] = useState(false);

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
      setPostEditAllowed(null);
      resetLocalForm();
      return;
    }
    const gameId =
      typeof post.gameId === "string" && post.gameId.length > 0 ? post.gameId : null;
    if (!gameId) {
      setPhase("error");
      return;
    }

    let cancelled = false;
    setPhase("loading");
    setGame(null);
    setPostEditAllowed(null);

    void (async () => {
      try {
        const [snap, apiRes] = await Promise.all([
          getGameDocWithTimeout(gameId),
          fetchPredictionPostGet(post.id),
        ]);
        if (cancelled) return;
        if (!snap.exists()) {
          setPhase("error");
          return;
        }
        const row = { id: snap.id, ...snap.data() } as Record<string, unknown>;
        const gid = String(row.id ?? "");
        const league = toSupportedLeague(row.league);

        if (apiRes.ok && !apiRes.exists) {
          setPhase("error");
          return;
        }
        let allowed = isNativePostPredictionEditable(post);
        if (apiRes.ok && apiRes.exists) {
          if (!apiRes.mine) {
            setPhase("error");
            return;
          }
          allowed = apiRes.editable;
        }

        let nextHome = "";
        let nextAway = "";
        let usedDraft = false;

        if (fUser?.uid && gid) {
          const rawDraft = await AsyncStorage.getItem(
            draftStorageKey(fUser.uid, gid)
          );
          if (rawDraft) {
            try {
              const d = JSON.parse(rawDraft) as {
                scoreHome?: string;
                scoreAway?: string;
              };
              if (
                typeof d.scoreHome === "string" &&
                typeof d.scoreAway === "string" &&
                d.scoreHome.trim() !== "" &&
                d.scoreAway.trim() !== ""
              ) {
                nextHome = d.scoreHome;
                nextAway = d.scoreAway;
                usedDraft = true;
              }
            } catch {
              /* ignore */
            }
          }
        }

        if (
          !usedDraft &&
          apiRes.ok &&
          apiRes.exists &&
          apiRes.mine &&
          apiRes.prediction
        ) {
          nextHome = String(apiRes.prediction.score.home);
          nextAway = String(apiRes.prediction.score.away);
        }

        if (!usedDraft && nextHome === "") {
          const pred = post.prediction as
            | { winner?: string; score?: { home?: number; away?: number } }
            | undefined;
          const ph = pred?.score?.home;
          const pa = pred?.score?.away;
          if (typeof ph === "number" && typeof pa === "number") {
            nextHome = String(ph);
            nextAway = String(pa);
          }
        }

        let nextWinner = inferWinnerFromScores(league, nextHome, nextAway);
        if (
          nextWinner == null &&
          nextHome !== "" &&
          nextAway !== ""
        ) {
          const pred = post.prediction as { winner?: string } | undefined;
          const w = pred?.winner;
          if (w === "home" || w === "away" || w === "draw") {
            nextWinner = w;
          }
        }

        setScoreHome(nextHome);
        setScoreAway(nextAway);
        setWinner(nextWinner);
        setGame(row);
        setPostEditAllowed(allowed);
        setPhase("ready");
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, post?.id, post?.gameId, resetLocalForm, fUser?.uid]);

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

  const selectedLeague = useMemo(
    () => toSupportedLeague(game?.league),
    [game?.league]
  );

  const isSoccerPredict =
    selectedLeague === "pl" || selectedLeague === "j1";

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
    };
  }, [game, language, peerGames]);

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
    setPostEditAllowed(null);
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

    if (postEditAllowed !== true) {
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
      Alert.alert(
        language === "en" ? "Done" : "完了",
        language === "en" ? "Prediction updated." : "予想を更新しました。"
      );
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
    postEditAllowed,
  ]);

  const predictModalVisible = Boolean(
    visible && phase === "ready" && game && post && postEditAllowed !== null
  );

  const loadingOverlay =
    visible && post && phase === "loading" ? (
      <Modal transparent animationType="fade" visible>
        <View style={styles.loadingRoot}>
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#67e8f9" size="large" />
            <Text style={styles.loadingText}>
              {language === "en" ? "Loading match…" : "試合データを読み込み中…"}
            </Text>
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

  return (
    <>
      {loadingOverlay}
      {errorOverlay}
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
        predictionEditLockedAfterKickoff={postEditAllowed !== true}
        predictData={predictModalData}
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
  loadingText: {
    color: "rgba(248,250,252,0.75)",
    fontSize: 14,
    textAlign: "center",
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
