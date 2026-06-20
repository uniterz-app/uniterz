import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import type { GamesStackParamList } from "../../../navigation/types";
import { colors, fonts, radius, spacing } from "../../../theme/tokens";
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
        <View style={styles.body}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.inlineBack}
              accessibilityRole="button"
              accessibilityLabel={language === "ja" ? "戻る" : "Back"}
            >
              <MaterialCommunityIcons name="arrow-left" size={27} color="rgba(148,163,184,0.92)" />
            </Pressable>

            <View style={styles.cardShell}>
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(34,211,238,0.14)", "rgba(255,255,255,0.025)", "rgba(244,63,94,0.1)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[styles.corner, styles.cornerTl]} />
              <View style={[styles.corner, styles.cornerBr]} />
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
                    <Text style={[styles.statusPill, status === "live" && styles.statusLive]}>{statusLabel}</Text>
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
          </ScrollView>

          {fUser?.uid && hasMyPost != null ? (
            <Pressable
              style={[styles.fab, hasMyPost ? styles.fabEdit : null]}
              onPress={() => navigation.navigate("GamePredict", { gameId })}
              accessibilityRole="button"
              accessibilityLabel={hasMyPost ? t.editPrediction : t.predict}
            >
              <MaterialCommunityIcons
                name={hasMyPost ? "pencil" : "pencil-plus"}
                size={22}
                color={hasMyPost ? "rgba(207,250,254,0.98)" : "#fff"}
              />
            </Pressable>
          ) : null}
        </View>
      )}
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 32, alignItems: "center" },
  body: { flex: 1 },
  content: { padding: spacing.md, gap: 14, paddingBottom: 104 },
  muted: { color: colors.textSecondary, textAlign: "center", marginTop: 32 },
  inlineBack: {
    alignSelf: "flex-start",
    padding: 4,
    marginBottom: -2,
  },
  cardShell: {
    position: "relative",
    overflow: "hidden",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
    backgroundColor: "rgba(2,6,23,0.45)",
  },
  corner: {
    position: "absolute",
    width: 18,
    height: 18,
    zIndex: 3,
    borderColor: "rgba(34,211,238,0.48)",
  },
  cornerTl: { top: 8, left: 8, borderTopWidth: 1, borderLeftWidth: 1 },
  cornerBr: { right: 8, bottom: 8, borderRightWidth: 1, borderBottomWidth: 1 },
  matchCard: { paddingVertical: 6 },
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
    letterSpacing: 1.4,
    fontFamily: fonts.metric,
  },
  statusLive: {
    color: "#facc15",
    textShadowColor: "rgba(250,204,21,0.65)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  scoreText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 28,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#facc15",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 14,
    elevation: 8,
  },
  fabEdit: {
    backgroundColor: "rgba(8,47,73,0.96)",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.45)",
    shadowColor: "rgba(34,211,238,0.85)",
  },
});
