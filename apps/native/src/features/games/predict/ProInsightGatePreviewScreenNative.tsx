/**
 * __DEV__ — Free が PRO INSIGHT を開いたときのゲート UI プレビュー。
 * 本番は NbaPredictToolsTabsNative の Free 時 `PredictProBriefPanelNative locked`。
 * ゲート下に実際の Insight 画面例を出す。
 */
import { ScrollView, StyleSheet, View } from "react-native";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import PredictProBriefPanelNative from "./PredictProBriefPanelNative";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";

type Props = {
  language: string;
  onClose: () => void;
  onPressSubscribe?: () => void;
};

export default function ProInsightGatePreviewScreenNative({
  language,
  onClose,
  onPressSubscribe,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const { bottomContentReserveY } = useBottomTabBarInsets();

  return (
    <MobilePageShell
      title={L(lang, {
        ja: "PRO INSIGHT ゲート",
        en: "PRO INSIGHT Gate",
        ko: "PRO INSIGHT 게이트",
        zh: "PRO INSIGHT 入口",
        es: "Puerta PRO INSIGHT",
        pt: "Portão PRO INSIGHT",
        fr: "Portail PRO INSIGHT",
      })}
      eyebrow="DEV"
      subtitle={L(lang, {
        ja: "Free 向けゲート。下に新UIの表示イメージ（例）",
        en: "Free gate with new UI example below",
        ko: "Free용 게이트. 아래에 새 UI 예시",
        zh: "面向 Free 的入口。下方为新 UI 示例",
        es: "Puerta Free con ejemplo de nueva UI abajo",
        pt: "Portão Free com exemplo da nova UI abaixo",
        fr: "Portail Free avec aperçu nouvelle UI en dessous",
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
          <PredictProBriefPanelNative
            brief={null}
            language={lang === "ja" ? "ja" : "en"}
            homeTeamId="nba-lakers"
            awayTeamId="nba-celtics"
            homeTeamName={lang === "ja" ? "レイカーズ" : "Lakers"}
            awayTeamName={lang === "ja" ? "セルティックス" : "Celtics"}
            locked
            onPressUpgrade={
              onPressSubscribe ??
              (() => {
                /* preview */
              })
            }
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
});
