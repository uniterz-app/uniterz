/**
 * Web プロフィール「ブラケット」タブ相当（フルブラケット表示 + 的中マーク）。
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import PlayoffFullBracketNative from "../games/playoffBracket/PlayoffFullBracketNative";
import { useNativePlayoffBracketView } from "../games/playoffBracket/useNativePlayoffBracketView";
import { profileBracketTabCopy } from "./profileOverviewWidgetsCopy";
import { resolveLocalizedLang } from "../../../../../lib/i18n/localize";

type Props = {
  uid: string | undefined;
  language: string;
};

export default function ProfileBracketTabNative({ uid, language }: Props) {
  const copy = profileBracketTabCopy(language);
  const langJaEn = resolveLocalizedLang(language) === "ja" ? "ja" : "en";
  const { loading, display, savedBracket, score, season, officialResults, hasSubmitted } =
    useNativePlayoffBracketView(uid);

  if (!uid) {
    return <Text style={styles.muted}>{copy.signIn}</Text>;
  }

  if (loading) {
    return (
      <View style={styles.loadingBlock}>
        <BlocksPulseLoader pixelScale={0.9} />
      </View>
    );
  }

  if (!hasSubmitted || !display) {
    return (
      <View style={styles.noDataBox}>
        <Text style={styles.noDataBebas}>NO DATA</Text>
        <Text style={styles.muted}>
          {copy.noBracket}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
        hitLegend={{ language: langJaEn }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  loadingBlock: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  muted: {
    color: "rgba(148,163,184,0.9)",
    fontSize: 14,
    paddingVertical: 16,
    textAlign: "center",
  },
  noDataBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(5,8,20,0.55)",
    alignItems: "center",
  },
  noDataBebas: {
    fontSize: 32,
    letterSpacing: 4,
    color: "rgba(103,232,249,0.55)",
    marginBottom: 8,
    fontWeight: "700",
  },
});
