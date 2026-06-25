import { useEffect, useMemo, useState } from "react";
import { cyberAlert } from "../../../components/cyberAlert";
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import type { GamesStackParamList } from "../../../navigation/types";
import { colors, radius, spacing } from "../../../theme/tokens";
import { useNativeGameDocument } from "../useNativeGameDocument";
import { getGamesTexts } from "../gamesI18n";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import { resolveGameStatus, resolveGameTeamName } from "@uniterz/shared";
import {
  createPredictionPostApi,
  PredictionApiError,
  updatePredictionPostApi,
} from "../submitPredictionApi";
import { BlocksPulseLoader } from "../../../components/BlocksPulseLoader";
import { PredictToolTabContent } from "../PredictToolTabContent";
import { resolveTeamJerseyPalette } from "../teamColors";

function isSoccerLeague(leagueRaw: unknown): boolean {
  const league = String(leagueRaw ?? "").toLowerCase();
  return league === "pl" || league === "j1";
}

function isGameStarted(game: Record<string, unknown>): boolean {
  const st = resolveGameStatus(game);
  return st === "live" || st === "final";
}

export default function GamePredictScreenNative() {
  const route = useRoute<RouteProp<GamesStackParamList, "GamePredict">>();
  const navigation = useNavigation();
  const { gameId } = route.params;
  const { fUser } = useFirebaseUser();
  const { game, peerGames, loading, notFound } = useNativeGameDocument(gameId);
  const [language] = useState<"ja" | "en">("ja");
  const t = getGamesTexts(language);

  const [winner, setWinner] = useState<"home" | "away" | "draw" | null>(null);
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [existingPostId, setExistingPostId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toolsTab, setToolsTab] = useState<"h2h" | "market" | "stats">("h2h");

  const league = String(game?.league ?? "nba").toLowerCase() as "nba" | "wc" | "bj" | "j1" | "pl";
  const isSoccer = isSoccerLeague(league);
  const locked = game != null && isGameStarted(game);

  useEffect(() => {
    const uid = fUser?.uid;
    if (!uid || !gameId) return;
    void (async () => {
      const q = query(
        collection(db, "posts"),
        where("authorUid", "==", uid),
        where("gameId", "==", gameId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setExistingPostId(null);
        return;
      }
      const docSnap = snap.docs[0]!;
      setExistingPostId(docSnap.id);
      const data = docSnap.data() as {
        prediction?: { winner?: string; score?: { home?: number; away?: number } };
        winner?: string;
        score?: { home?: number; away?: number };
      };
      const w = data.prediction?.winner ?? data.winner;
      if (w === "home" || w === "away" || w === "draw") setWinner(w);
      const sc = data.prediction?.score ?? data.score;
      if (sc && typeof sc.home === "number") setScoreHome(String(sc.home));
      if (sc && typeof sc.away === "number") setScoreAway(String(sc.away));
    })();
  }, [fUser?.uid, gameId]);

  const homeName = game
    ? resolveGameTeamName(game.home, game.homeTeamName, "HOME")
    : "HOME";
  const awayName = game
    ? resolveGameTeamName(game.away, game.awayTeamName, "AWAY")
    : "AWAY";

  const title = useMemo(
    () => (game ? `${homeName} vs ${awayName}` : "Predict"),
    [game, homeName, awayName]
  );

  async function handleSubmit() {
    if (!game || !fUser?.uid) return;
    if (locked) {
      cyberAlert(t.submitLockedTitle, t.submitLockedBody);
      return;
    }
    if (!winner) {
      cyberAlert(t.missingWinnerTitle, t.missingWinnerBody);
      return;
    }
    if (scoreHome.trim() === "" || scoreAway.trim() === "") {
      cyberAlert(t.missingWinnerTitle, t.predictionNeedsScoresBody);
      return;
    }
    const h = Number(scoreHome);
    const a = Number(scoreAway);
    if (!Number.isFinite(h) || !Number.isFinite(a)) {
      cyberAlert(t.invalidInputTitle, t.invalidScoreBody);
      return;
    }
    if (!isSoccer && winner === "draw") {
      cyberAlert(t.invalidInputTitle, t.invalidDrawLeagueBody);
      return;
    }
    if (winner === "home" && h <= a) {
      cyberAlert(t.invalidInputTitle, t.invalidHomeWinBody);
      return;
    }
    if (winner === "away" && a <= h) {
      cyberAlert(t.invalidInputTitle, t.invalidAwayWinBody);
      return;
    }
    if (winner === "draw" && h !== a) {
      cyberAlert(t.invalidInputTitle, t.invalidDrawScoreBody);
      return;
    }

    setSubmitting(true);
    try {
      if (existingPostId) {
        await updatePredictionPostApi(existingPostId, {
          winner,
          scoreHome: h,
          scoreAway: a,
        });
        cyberAlert("", t.updateDoneOnly);
      } else {
        await createPredictionPostApi({
          gameId,
          winner,
          scoreHome: h,
          scoreAway: a,
        });
        cyberAlert("", t.postDoneOnly);
      }
      navigation.goBack();
    } catch (e) {
      const msg =
        e instanceof PredictionApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : t.postErrorBody;
      cyberAlert(t.postErrorTitle, msg);
    } finally {
      setSubmitting(false);
    }
  }

  const formatGameDateMs = (ms: number) =>
    new Date(ms).toLocaleString(language === "en" ? "en-US" : "ja-JP", {
      timeZone: "Asia/Tokyo",
    });

  const homeColor = game
    ? resolveTeamJerseyPalette(game.league, game.home, "#5aa4ff").primary
    : "#5aa4ff";
  const awayColor = game
    ? resolveTeamJerseyPalette(game.league, game.away, "#ff6b8a").primary
    : "#ff6b8a";

  return (
    <MobilePageShell title={title} onClose={() => navigation.goBack()}>
      {loading ? (
        <View style={styles.loading}>
          <BlocksPulseLoader />
        </View>
      ) : notFound || !game ? (
        <Text style={styles.muted}>Game not found</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.winnerRow}>
            {(["home", ...(isSoccer ? (["draw"] as const) : []), "away"] as const).map((w) => {
              const label =
                w === "home" ? homeName : w === "away" ? awayName : t.drawAvailable;
              const active = winner === w;
              return (
                <Pressable
                  key={w}
                  style={[styles.winnerChip, active && styles.winnerChipActive]}
                  onPress={() => setWinner(w)}
                  disabled={locked || submitting}
                >
                  <Text style={[styles.winnerChipText, active && styles.winnerChipTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.scoreRow}>
            <TextInput
              style={styles.scoreInput}
              value={scoreHome}
              onChangeText={setScoreHome}
              keyboardType="number-pad"
              placeholder="HOME"
              placeholderTextColor={colors.textMuted}
              editable={!locked && !submitting}
            />
            <Text style={styles.scoreSep}>-</Text>
            <TextInput
              style={styles.scoreInput}
              value={scoreAway}
              onChangeText={setScoreAway}
              keyboardType="number-pad"
              placeholder="AWAY"
              placeholderTextColor={colors.textMuted}
              editable={!locked && !submitting}
            />
          </View>

          <View style={styles.toolTabs}>
            {(["h2h", "market", "stats"] as const).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.toolTab, toolsTab === tab && styles.toolTabActive]}
                onPress={() => setToolsTab(tab)}
              >
                <Text style={[styles.toolTabText, toolsTab === tab && styles.toolTabTextActive]}>
                  {tab === "h2h" ? t.tabH2h : tab === "market" ? t.tabMarket : t.tabStats}
                </Text>
              </Pressable>
            ))}
          </View>

          <PredictToolTabContent
            tab={toolsTab}
            language={language}
            t={t}
            gameId={gameId}
            league={league}
            subjectGame={game}
            peerGames={peerGames}
            formatGameDateMs={formatGameDateMs}
            homeColor={homeColor}
            awayColor={awayColor}
            isSoccerLeague={isSoccer}
          />

          <Pressable
            style={[styles.submitBtn, (locked || submitting) && styles.submitBtnDisabled]}
            onPress={() => void handleSubmit()}
            disabled={locked || submitting || !fUser?.uid}
          >
            <Text style={styles.submitBtnText}>
              {existingPostId
                ? language === "ja"
                  ? "予想を更新"
                  : "Update prediction"
                : t.predict}
            </Text>
          </Pressable>
          {!fUser?.uid ? (
            <Text style={styles.loginHint}>
              {language === "ja" ? "ログインが必要です" : "Sign in required"}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 32, alignItems: "center" },
  content: { padding: spacing.md, gap: 14, paddingBottom: 40 },
  muted: { color: colors.textSecondary, textAlign: "center", marginTop: 32 },
  winnerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  winnerChip: {
    flexGrow: 1,
    minWidth: "30%",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },
  winnerChipActive: {
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(103,232,249,0.12)",
  },
  winnerChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600", textAlign: "center" },
  winnerChipTextActive: { color: colors.textPrimary },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  scoreInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  scoreSep: { color: colors.textMuted, fontSize: 18, fontWeight: "700" },
  toolTabs: { flexDirection: "row", gap: 8 },
  toolTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  toolTabActive: {
    borderColor: "rgba(103,232,249,0.4)",
    backgroundColor: "rgba(103,232,249,0.1)",
  },
  toolTabText: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
  toolTabTextActive: { color: colors.textPrimary },
  submitBtn: {
    marginTop: 8,
    backgroundColor: "#f97316",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  loginHint: { color: colors.textMuted, textAlign: "center", fontSize: 12 },
});
