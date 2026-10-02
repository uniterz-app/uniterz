import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import GamesNbaSubpageShellNative from "../GamesNbaSubpageShellNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import type { GamesStackParamList } from "../../../navigation/types";
import { colors } from "../../../theme/tokens";
import { BlocksPulseLoader } from "../../../components/BlocksPulseLoader";
import PlayoffFullBracketNative from "../playoffBracket/PlayoffFullBracketNative";
import { useNativePlayoffBracketView } from "../playoffBracket/useNativePlayoffBracketView";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import { playoffBracketViewCopy } from "../stats/nbaStatsUiCopy";

/** Web `/mobile/playoff-bracket/view` 相当：提出済みブラケットのフル表示 */
export default function PlayoffBracketViewNative() {
  const navigation = useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const copy = playoffBracketViewCopy(language);

  const { loading, display, savedBracket, score, season, officialResults, hasSubmitted } =
    useNativePlayoffBracketView(fUser?.uid);

  return (
    <GamesNbaSubpageShellNative
      eyebrow="NBA · PLAYOFFS"
      title="BRACKET"
      subtitle={copy.subtitle}
      onBack={() => navigation.navigate("GamesHome", { openMenu: true })}
      scroll={false}
    >
      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => navigation.navigate("BracketMarket")}>
          <Text style={styles.actionText}>{copy.market}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => navigation.navigate("PlayoffBracket")}>
          <Text style={styles.actionText}>{copy.predict}</Text>
        </Pressable>
      </View>

      {!fUser?.uid ? (
        <Text style={styles.muted}>{copy.signInRequired}</Text>
      ) : loading ? (
        <View style={styles.loading}>
          <BlocksPulseLoader pixelScale={0.9} />
        </View>
      ) : !hasSubmitted || !display ? (
        <View style={styles.noDataBox}>
          <Text style={styles.noDataTitle}>NO DATA</Text>
          <Text style={styles.muted}>{copy.noBracket}</Text>
          <Pressable style={styles.predictCta} onPress={() => navigation.navigate("PlayoffBracket")}>
            <Text style={styles.predictCtaText}>{copy.predictCta}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PlayoffFullBracketNative
            league="nba"
            season={season}
            score={score}
            leftRound1={display.leftRound1}
            leftRound2={display.leftRound2}
            leftRound3={display.leftRound3}
            leftRound4={display.leftRound4}
            rightRound1={display.rightRound1}
            rightRound2={display.rightRound2}
            rightRound3={display.rightRound3}
            rightRound4={display.rightRound4}
            champion={display.champion}
            bracket={savedBracket ?? undefined}
            results={officialResults ?? undefined}
            hitLegend={{ language }}
          />
        </ScrollView>
      )}
    </GamesNbaSubpageShellNative>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    alignItems: "center",
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  actionText: { color: colors.textPrimary, fontWeight: "700", fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  loading: { alignItems: "center", paddingVertical: 32 },
  muted: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  noDataBox: {
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.18)",
    backgroundColor: "rgba(5,8,20,0.55)",
    alignItems: "center",
    gap: 8,
  },
  noDataTitle: {
    fontSize: 32,
    letterSpacing: 4,
    color: "rgba(103,232,249,0.55)",
    fontWeight: "700",
  },
  predictCta: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    backgroundColor: "rgba(0,245,255,0.12)",
  },
  predictCtaText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
});
