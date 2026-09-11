/**
 * __DEV__ — 新 Pro Insight（HOME/AWAY 短文 + 重要見出し + 根拠小）の見た目確認。
 * 本番 LLM / ingest は未接続。固定サンプルのみ。
 */
import { ScrollView, StyleSheet, View } from "react-native";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import PredictProInsightNarrativePanelNative from "./PredictProInsightNarrativePanelNative";
import { PRO_INSIGHT_NARRATIVE_SAMPLE } from "../../../../../../lib/predict/proInsightNarrativeSample";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";

type Props = {
  language: string;
  onClose: () => void;
};

export default function ProInsightNarrativePreviewScreenNative({
  language,
  onClose,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const gamesLang = lang === "ja" ? "ja" : "en";
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const brief = PRO_INSIGHT_NARRATIVE_SAMPLE;

  return (
    <MobilePageShell
      title={L(lang, {
        ja: "PRO INSIGHT 新UI",
        en: "PRO INSIGHT New UI",
        ko: "PRO INSIGHT 새 UI",
        zh: "PRO INSIGHT 新 UI",
        es: "PRO INSIGHT nueva UI",
        pt: "PRO INSIGHT nova UI",
        fr: "PRO INSIGHT nouvelle UI",
      })}
      eyebrow="DEV"
      subtitle={L(lang, {
        ja: "試合1本 · MATCHUP2 / SCHEDULE2 / CONTEXT2 / IMPACT2。モック（LLM 未接続）",
        en: "One game brief · M2 / S2 / C2 / I2. Mock (no LLM)",
        ko: "경기 1본 · M2 / S2 / C2 / I2. 목업(LLM 미연결)",
        zh: "单场一篇 · M2 / S2 / C2 / I2。示例（未接 LLM）",
        es: "Un brief de partido · M2 / S2 / C2 / I2. Mock (sin LLM)",
        pt: "Um brief do jogo · M2 / S2 / C2 / I2. Mock (sem LLM)",
        fr: "Un brief de match · M2 / S2 / C2 / I2. Mock (sans LLM)",
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
          <PredictProInsightNarrativePanelNative
            brief={brief}
            language={gamesLang}
            homeTeamName="Lakers"
            awayTeamName="Celtics"
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
  },
});
