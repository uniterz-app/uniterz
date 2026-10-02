/**
 * __DEV__ — 予想マッチアップ Team Stats（NET/ORTG… + LAST 5 フォーム）の見た目確認。
 */
import { ScrollView, StyleSheet, View } from "react-native";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import NbaTeamStatsPanelNative from "./NbaTeamStatsPanelNative";
import { teamStatsForPreset } from "../../../../../../lib/predict/nbaTeamStatsPreviewMocks";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";

type Props = {
  language: string;
  onClose: () => void;
};

export default function MatchupTeamStatsPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const gamesLang = lang === "ja" ? "ja" : "en";
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const data = teamStatsForPreset("both-teams-rich");

  return (
    <MobilePageShell
      title={L(lang, {
        ja: "マッチアップ STATS",
        en: "Matchup STATS",
        ko: "매치업 STATS",
        zh: "对阵 STATS",
        es: "STATS del matchup",
        pt: "STATS do confronto",
        fr: "STATS du matchup",
      })}
      eyebrow="DEV"
      subtitle={L(lang, {
        ja: "NET… · LAST 5（折りたたみ · 試合タップで BOX）",
        en: "NET… · LAST 5 (collapse · tap game for BOX)",
        ko: "NET… · LAST 5 (접기 · 경기 탭 → BOX)",
        zh: "NET… · LAST 5（折叠 · 点比赛开 BOX）",
        es: "NET… · LAST 5 (plegar · tocar partido → BOX)",
        pt: "NET… · LAST 5 (recolher · toque → BOX)",
        fr: "NET… · LAST 5 (replier · taper un match → BOX)",
      })}
      onClose={onClose}
      appBackground
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomContentReserveY + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <NbaTeamStatsPanelNative
            data={data}
            isPro
            language={gamesLang}
          />
        </View>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 8,
    paddingTop: 8,
    flexGrow: 1,
  },
  card: {
    overflow: "hidden",
    backgroundColor: "#000",
  },
});
