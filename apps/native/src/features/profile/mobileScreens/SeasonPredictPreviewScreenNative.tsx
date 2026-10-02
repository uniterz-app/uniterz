/**
 * Web `/mobile/season-preview` ハブ相当。
 * 順位予想入力 / アワード予想入力 / 提出後ビュー / 締切後マーケットを内部タブで切替（本番未接続・プレビュー）。
 */
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import MobilePageShell from "./MobilePageShell";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import NbaSeasonStandingsPredictPanelNative from "../../games/predict/season/NbaSeasonStandingsPredictPanelNative";
import NbaSeasonAwardsPredictPanelNative from "../../games/predict/season/NbaSeasonAwardsPredictPanelNative";
import NbaSeasonStandingsViewPanelNative from "../../games/predict/season/NbaSeasonStandingsViewPanelNative";
import NbaSeasonAwardsViewPanelNative from "../../games/predict/season/NbaSeasonAwardsViewPanelNative";
import NbaSeasonStandingsMarketPanelNative from "../../games/predict/season/NbaSeasonStandingsMarketPanelNative";
import NbaSeasonAwardsMarketPanelNative from "../../games/predict/season/NbaSeasonAwardsMarketPanelNative";
import { emptySeasonStandingsPrediction } from "../../../../../../lib/predict/nbaSeasonStandingsPredict";
import { emptySeasonAwardsPrediction } from "../../../../../../lib/predict/nbaSeasonAwardsPredict";
import {
  MOCK_SUBMITTED_AWARDS,
  MOCK_SUBMITTED_STANDINGS,
} from "../../../../../../lib/predict/nbaSeasonPicksViewMocks";
import {
  buildSeasonAwardsMarketPreviewMock,
  buildSeasonStandingsMarketPreviewMock,
} from "../../../../../../lib/predict/seasonPredictMarketMocks";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../../lib/rankings/nbaSeason";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";

type Mode = "standings" | "awards" | "view" | "market";

const SEASON = CURRENT_NBA_SEASON_KEY;

type Props = {
  language: string;
  onClose: () => void;
};

export default function SeasonPredictPreviewScreenNative({ language, onClose }: Props) {
  const lang = resolveLocalizedLang(language);
  const [mode, setMode] = useState<Mode>("standings");
  const [standings, setStandings] = useState(() => emptySeasonStandingsPrediction(SEASON));
  const [awards, setAwards] = useState(() => emptySeasonAwardsPrediction(SEASON));
  const [marketTab, setMarketTab] = useState<"standings" | "awards">("standings");

  const standingsMarket = useMemo(
    () => buildSeasonStandingsMarketPreviewMock(SEASON),
    []
  );
  const awardsMarket = useMemo(
    () => buildSeasonAwardsMarketPreviewMock(SEASON),
    []
  );

  const title = L(lang, {
    ja: "シーズン予想（プレビュー）",
    en: "Season picks (preview)",
    ko: "시즌 예측(미리보기)",
    zh: "赛季预测（预览）",
    es: "Picks de temporada (vista previa)",
    pt: "Palpites da temporada (prévia)",
    fr: "Picks de saison (aperçu)",
  });

  return (
    <MobilePageShell title={title} appBackground onClose={onClose}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <View style={{ marginBottom: 14 }}>
          <CyberSlantedTabBarNative fill>
            <CyberSlantedTabNative
              label={L(lang, {
                ja: "順位予想",
                en: "STANDINGS",
                ko: "순위",
                zh: "排名",
                es: "STANDINGS",
                pt: "STANDINGS",
                fr: "STANDINGS",
              })}
              active={mode === "standings"}
              onPress={() => setMode("standings")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label={L(lang, {
                ja: "アワード",
                en: "AWARDS",
                ko: "어워드",
                zh: "奖项",
                es: "AWARDS",
                pt: "AWARDS",
                fr: "AWARDS",
              })}
              active={mode === "awards"}
              onPress={() => setMode("awards")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label={L(lang, {
                ja: "提出後",
                en: "SUBMITTED",
                ko: "제출 후",
                zh: "已提交",
                es: "ENVIADO",
                pt: "ENVIADO",
                fr: "SOUMIS",
              })}
              active={mode === "view"}
              onPress={() => setMode("view")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label={L(lang, {
                ja: "市場",
                en: "MARKET",
                ko: "마켓",
                zh: "市场",
                es: "MARKET",
                pt: "MARKET",
                fr: "MARKET",
              })}
              active={mode === "market"}
              onPress={() => setMode("market")}
              compact
              fontWeight="700"
            />
          </CyberSlantedTabBarNative>
        </View>

        {mode === "standings" ? (
          <NbaSeasonStandingsPredictPanelNative
            value={standings}
            onChange={setStandings}
            onSubmit={() => setMode("view")}
          />
        ) : null}

        {mode === "awards" ? (
          <NbaSeasonAwardsPredictPanelNative value={awards} onChange={setAwards} />
        ) : null}

        {mode === "view" ? (
          <View style={{ gap: 20 }}>
            <NbaSeasonStandingsViewPanelNative prediction={MOCK_SUBMITTED_STANDINGS} />
            <NbaSeasonAwardsViewPanelNative prediction={MOCK_SUBMITTED_AWARDS} />
          </View>
        ) : null}

        {mode === "market" ? (
          <View style={{ gap: 12 }}>
            <CyberSlantedTabBarNative fill>
              <CyberSlantedTabNative
                label="STANDINGS"
                active={marketTab === "standings"}
                onPress={() => setMarketTab("standings")}
                compact
                fontWeight="700"
              />
              <CyberSlantedTabNative
                label="AWARDS"
                active={marketTab === "awards"}
                onPress={() => setMarketTab("awards")}
                compact
                fontWeight="700"
              />
            </CyberSlantedTabBarNative>
            {marketTab === "standings" ? (
              <NbaSeasonStandingsMarketPanelNative market={standingsMarket} />
            ) : (
              <NbaSeasonAwardsMarketPanelNative market={awardsMarket} />
            )}
          </View>
        ) : null}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingTop: 20, paddingBottom: 64 },
});
