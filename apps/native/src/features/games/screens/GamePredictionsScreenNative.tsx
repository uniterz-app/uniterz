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
import { getGamesTexts } from "../gamesI18n";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import { resolveGameTeamName } from "../../../shared/gameRow";
import { BlocksPulseLoader } from "../../../components/BlocksPulseLoader";
import { resolveTeamJerseyPalette } from "../teamColors";

function isSoccerLeague(leagueRaw: unknown): boolean {
  const league = String(leagueRaw ?? "").toLowerCase();
  return league === "pl" || league === "j1";
}

export default function GamePredictionsScreenNative() {
  const route = useRoute<RouteProp<GamesStackParamList, "GamePredictions">>();
  const navigation = useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const { gameId } = route.params;
  const { fUser } = useFirebaseUser();
  const { game, loading, notFound } = useNativeGameDocument(gameId);
  const [language] = useState<"ja" | "en">("ja");
  const t = getGamesTexts(language);
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

  const title = useMemo(() => {
    if (!game) return "Predictions";
    return `${homeName} vs ${awayName}`;
  }, [game, homeName, awayName]);

  return (
    <MobilePageShell title={title} onClose={() => navigation.goBack()}>
      {loading ? (
        <View style={styles.loading}>
          <BlocksPulseLoader />
        </View>
      ) : notFound || !game ? (
        <Text style={styles.muted}>Game not found</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.matchCard}>
            <Text style={styles.matchHome}>{homeName}</Text>
            <Text style={styles.matchVs}>vs</Text>
            <Text style={styles.matchAway}>{awayName}</Text>
          </View>

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
              <Text style={styles.predictBtnSecondaryText}>
                {language === "ja" ? "予想を編集" : "Edit prediction"}
              </Text>
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
  matchCard: {
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(5,8,20,0.45)",
    alignItems: "center",
    gap: 4,
  },
  matchHome: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", textAlign: "center" },
  matchVs: { color: colors.textMuted, fontSize: 12 },
  matchAway: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", textAlign: "center" },
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
