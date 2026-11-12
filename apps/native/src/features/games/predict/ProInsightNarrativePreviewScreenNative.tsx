/**
 * __DEV__ — Pro Insight「予想の材料」の見た目確認。先頭は無料ユーザーの画面。
 * 本番 ingest は未接続。2026-11-12 の実データを写した固定サンプル。
 */
import { ScrollView, StyleSheet, View } from "react-native";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import PredictProInsightKitNative from "./PredictProInsightKitNative";
import PredictProBriefPanelNative from "./PredictProBriefPanelNative";
import { PRO_INSIGHT_PREDICT_KIT_SAMPLES } from "../../../../../../lib/predict/proInsightPredictKitSample";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import PredictProInsightSmartMarketNative from "./PredictProInsightSmartMarketNative";
import {
  sanitizeSmartMoneyMarket,
  type SmartMoneyMarket,
} from "../../../../../../lib/predict/smartMoneyMarket";

const SMART_MARKET_SAMPLE = sanitizeSmartMoneyMarket({
  weekLabel: "2026-11-02",
  home: 23,
  away: 11,
  draw: 0,
  cohortSize: 48,
}) as SmartMoneyMarket;

const SMART_MARKET_EMPTY_SAMPLE = sanitizeSmartMoneyMarket({
  weekLabel: "2026-11-02",
  home: 0,
  away: 0,
  draw: 0,
  cohortSize: 48,
}) as SmartMoneyMarket;

type Props = {
  language: string;
  onClose: () => void;
};

/** 本番の採点が 20 試合たまるまでの検証の成績（2026-11-12 時点の 170 試合） */
const DEV_RECORD_SAMPLE = {
  games: 170,
  hits: 114,
  strongGames: 37,
  strongHits: 35,
  scorerGames: 170,
  scorerHits: 81,
  basis: "backtest" as const,
};

/** 無料ユーザーの INSIGHT タブ（ゲート + 的中率 + この試合の伏せ字カード） */
const FREE_SAMPLE = PRO_INSIGHT_PREDICT_KIT_SAMPLES[1];

export default function ProInsightNarrativePreviewScreenNative({
  language,
  onClose,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const gamesLang = lang === "ja" ? "ja" : "en";
  const { bottomContentReserveY } = useBottomTabBarInsets();

  return (
    <MobilePageShell
      title={L(lang, { ja: "予想の材料", en: "PREDICTION KIT" })}
      eyebrow="DEV"
      subtitle={L(lang, {
        ja: "勝ち負け / 点数 / 欠場の 3 行。11/12 の実データ（固定）",
        en: "Win / scoring / absences. Fixed 11/12 data",
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
        {FREE_SAMPLE ? (
          <View style={styles.card}>
            <PredictProBriefPanelNative
              language={gamesLang}
              homeTeamId={FREE_SAMPLE.homeTeamId}
              awayTeamId={FREE_SAMPLE.awayTeamId}
              homeTeamName=""
              awayTeamName=""
              locked
              onPressUpgrade={() => {}}
              kitRecord={DEV_RECORD_SAMPLE}
              crowd={FREE_SAMPLE.crowd ?? null}
            />
          </View>
        ) : null}
        {PRO_INSIGHT_PREDICT_KIT_SAMPLES.map((s, i) => (
          <View key={`${s.homeTeamId}-${s.awayTeamId}`} style={styles.card}>
            <PredictProInsightKitNative
              kit={i === 0 && !s.kit.record ? { ...s.kit, record: DEV_RECORD_SAMPLE } : s.kit}
              homeTeamId={s.homeTeamId}
              awayTeamId={s.awayTeamId}
              language={gamesLang}
              crowd={s.crowd ?? null}
            />
          </View>
        ))}
        {FREE_SAMPLE ? (
          <>
            <View style={styles.card}>
              <PredictProInsightSmartMarketNative
                market={SMART_MARKET_SAMPLE}
                language={gamesLang}
                homeTeamId={FREE_SAMPLE.homeTeamId}
                awayTeamId={FREE_SAMPLE.awayTeamId}
                homeTeamName=""
                awayTeamName=""
                standalone
              />
            </View>
            <View style={styles.card}>
              <PredictProInsightSmartMarketNative
                market={SMART_MARKET_EMPTY_SAMPLE}
                language={gamesLang}
                homeTeamId={FREE_SAMPLE.homeTeamId}
                awayTeamId={FREE_SAMPLE.awayTeamId}
                homeTeamName=""
                awayTeamName=""
                standalone
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 12,
    flexGrow: 1,
  },
  card: {
    overflow: "hidden",
  },
});
