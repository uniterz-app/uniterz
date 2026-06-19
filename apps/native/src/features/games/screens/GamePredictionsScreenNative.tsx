import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import type { GamesStackParamList } from "../../../navigation/types";
import { colors, radius, spacing } from "../../../theme/tokens";
import { useNativeGameDocument } from "../useNativeGameDocument";
import GameMarketDistributionNative from "../GameMarketDistributionNative";
import { getGamesTexts, toNativeGamesLanguage } from "../gamesI18n";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import {
  resolveGameScore,
  resolveGameStatus,
  resolveGameTeamName,
} from "@uniterz/shared";
import { BlocksPulseLoader } from "../../../components/BlocksPulseLoader";
import { resolveTeamJerseyPalette } from "../teamColors";
import { MatchCardFineInnerPlate } from "../MatchCardFineInterior";
import MatchTeamMarkNative from "../MatchTeamMarkNative";
import { useNativeLanguage } from "../../../i18n/NativeLanguageProvider";

function isSoccerLeague(leagueRaw: unknown): boolean {
  const league = String(leagueRaw ?? "").toLowerCase();
  return league === "pl" || league === "j1";
}

/** Web `app/mobile/games/[id]/predictions/page.tsx` 相当 */
export default function GamePredictionsScreenNative() {
  const route = useRoute<RouteProp<GamesStackParamList, "GamePredictions">>();
  const navigation = useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const { gameId } = route.params;
  const { fUser } = useFirebaseUser();
  const { language: appLanguage } = useNativeLanguage();
  const language = toNativeGamesLanguage(appLanguage);
  const t = getGamesTexts(language);
  const { game, loading, notFound } = useNativeGameDocument(gameId);
  const [hasMyPost, setHasMyPost] = useState<boolean | null>(null);

  useEffect(() => {
    const uid = fUser?.uid;
    if (!uid || !gameId) {
      setHasMyPost(null);
      return;
    }
    void (async () => {
      const q = query(
        collection(db, "posts"),
        where("authorUid", "==", uid),
        where("gameId", "==", gameId),
        limit(1)
      );
      const snap = await getDocs(q);
      setHasMyPost(!snap.empty);
    })();
  }, [fUser?.uid, gameId]);

  const homeName = game
    ? resolveGameTeamName(game.home, game.homeTeamName, "HOME")
    : "HOME";
  const awayName = game
    ? resolveGameTeamName(game.away, game.awayTeamName, "AWAY")
    : "AWAY";
  const league = String(game?.league ?? "nba").toLowerCase();
  const isSoccer = isSoccerLeague(league);
  const homeColor = game
    ? resolveTeamJerseyPalette(game.league, game.home, "#5aa4ff").primary
    : "#5aa4ff";
  const awayColor = game
    ? resolveTeamJerseyPalette(game.league, game.away, "#ff6b8a").primary
    : "#ff6b8a";
  const score = game ? resolveGameScore(game) : null;
  const status = game ? resolveGameStatus(game) : "scheduled";

  const title = useMemo(() => {
    if (!game) return language === "ja" ? "コミュニティ予想" : "Community picks";
    return `${awayName} vs ${homeName}`;
  }, [game, homeName, awayName, language]);

  const statusLabel =
    status === "final"
      ? language === "ja"
        ? "終了"
        : "Final"
      : status === "live"
      ? "LIVE"
      : language === "ja"
      ? "予定"
      : "Scheduled";

  const centerScore =
    score && (score.home != null || score.away != null)
      ? `${score.away ?? "-"} - ${score.home ?? "-"}`
      : "vs";

  return (
    <MobilePageShell title={title} onClose={() => navigation.goBack()}>
      {loading ? (
        <View style={styles.loading}>
          <BlocksPulseLoader />
        </View>
      ) : notFound || !game ? (
        <Text style={styles.muted}>
          {language === "ja" ? "試合が見つかりません" : "Game not found"}
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <MatchCardFineInnerPlate borderRadius={radius.card} contentStyle={styles.matchCard}>
            <View style={styles.matchRow}>
              <View style={styles.teamCol}>
                <Text style={styles.sideLabel}>AWAY</Text>
                <MatchTeamMarkNative
                  leagueRaw={game.league}
                  side={game.away}
                  palette={resolveTeamJerseyPalette(game.league, game.away, "#5aa4ff")}
                  jerseySize={44}
                />
                <Text style={styles.teamName} numberOfLines={2}>
                  {awayName}
                </Text>
              </View>
              <View style={styles.centerCol}>
                <Text style={styles.statusPill}>{statusLabel}</Text>
                <Text style={styles.scoreText}>{centerScore}</Text>
              </View>
              <View style={styles.teamCol}>
                <Text style={styles.sideLabel}>HOME</Text>
                <MatchTeamMarkNative
                  leagueRaw={game.league}
                  side={game.home}
                  palette={resolveTeamJerseyPalette(game.league, game.home, "#ff6b8a")}
                  jerseySize={44}
                />
                <Text style={styles.teamName} numberOfLines={2}>
                  {homeName}
                </Text>
              </View>
            </View>
          </MatchCardFineInnerPlate>

          <GameMarketDistributionNative
            gameId={gameId}
            homeName={homeName}
            awayName={awayName}
            homeColor={homeColor}
            awayColor={awayColor}
            isSoccer={isSoccer}
            language={language}
            t={t}
          />

          {fUser?.uid && hasMyPost === false ? (
            <Pressable
              style={styles.predictBtn}
              onPress={() => navigation.navigate("GamePredict", { gameId })}
            >
              <Text style={styles.predictBtnText}>{t.predict}</Text>
            </Pressable>
          ) : null}
          {fUser?.uid && hasMyPost === true ? (
            <Pressable
              style={styles.predictBtnSecondary}
              onPress={() => navigation.navigate("GamePredict", { gameId })}
            >
              <Text style={styles.predictBtnSecondaryText}>{t.editPrediction}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 32, alignItems: "center" },
  content: { padding: spacing.md, gap: 16, paddingBottom: 32 },
  muted: { color: colors.textSecondary, textAlign: "center", marginTop: 32 },
  matchCard: { paddingVertical: 4 },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamCol: { flex: 1, alignItems: "center", gap: 6 },
  centerCol: { width: 88, alignItems: "center", gap: 6 },
  sideLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  teamName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  statusPill: {
    color: "rgba(103,232,249,0.95)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  scoreText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  predictBtn: {
    alignSelf: "center",
    backgroundColor: "#facc15",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  predictBtnText: { color: "#111827", fontWeight: "800", fontSize: 14 },
  predictBtnSecondary: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.35)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  predictBtnSecondaryText: { color: "rgba(103,232,249,0.95)", fontWeight: "700" },
});
