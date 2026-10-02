/**
 * Web プロフィール「ブラケット」タブ相当（フルブラケット表示 + 的中マーク）。
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BlocksPulseLoader } from "../../components/BlocksPulseLoader";
import PlayoffFullBracketNative from "../games/playoffBracket/PlayoffFullBracketNative";
import { useNativePlayoffBracketView } from "../games/playoffBracket/useNativePlayoffBracketView";
import { profileBracketTabCopy } from "./profileOverviewWidgetsCopy";
import { resolveLocalizedLang } from "../../../../../lib/i18n/localize";
import { PROFILE_CHART_CYBER } from "./profileOverviewChartCyberTheme";
import {
  profileOverviewChartEmptyHintStyle,
  profileOverviewChartNoDataStyle,
} from "./profileOverviewChartShell";

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
      <View style={styles.noDataBox} accessibilityRole="text">
        <Text style={styles.noData}>NO DATA</Text>
        <Text style={styles.noDataHint}>{copy.noBracket}</Text>
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
    minHeight: 180,
    paddingVertical: 36,
    paddingHorizontal: 16,
    borderRadius: 2,
    backgroundColor: PROFILE_CHART_CYBER.rankPlotInnerBg,
    borderWidth: 1,
    borderColor: PROFILE_CHART_CYBER.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  noData: profileOverviewChartNoDataStyle,
  noDataHint: {
    ...profileOverviewChartEmptyHintStyle,
    maxWidth: 260,
  },
});
