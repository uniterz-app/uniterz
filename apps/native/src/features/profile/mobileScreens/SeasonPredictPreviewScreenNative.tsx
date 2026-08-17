/**
 * Web `/mobile/season-preview` ハブ相当。
 * 順位予想入力 / アワード予想入力 / 提出後ビューを内部タブで切替（本番未接続・プレビュー）。
 */
import { useState } from "react";
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
import { emptySeasonStandingsPrediction } from "../../../../../../lib/predict/nbaSeasonStandingsPredict";
import { emptySeasonAwardsPrediction } from "../../../../../../lib/predict/nbaSeasonAwardsPredict";
import {
  MOCK_SUBMITTED_AWARDS,
  MOCK_SUBMITTED_STANDINGS,
} from "../../../../../../lib/predict/nbaSeasonPicksViewMocks";

type Mode = "standings" | "awards" | "view";

const SEASON = "2026-27";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function SeasonPredictPreviewScreenNative({ language, onClose }: Props) {
  const isJa = language === "ja";
  const [mode, setMode] = useState<Mode>("standings");
  const [standings, setStandings] = useState(() => emptySeasonStandingsPrediction(SEASON));
  const [awards, setAwards] = useState(() => emptySeasonAwardsPrediction(SEASON));

  return (
    <MobilePageShell title={isJa ? "シーズン予想（プレビュー）" : "Season picks (preview)"} appBackground onClose={onClose}>
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        <View style={{ marginBottom: 14 }}>
          <CyberSlantedTabBarNative fill>
            <CyberSlantedTabNative
              label={isJa ? "順位予想" : "STANDINGS"}
              active={mode === "standings"}
              onPress={() => setMode("standings")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label={isJa ? "アワード" : "AWARDS"}
              active={mode === "awards"}
              onPress={() => setMode("awards")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label={isJa ? "提出後" : "SUBMITTED"}
              active={mode === "view"}
              onPress={() => setMode("view")}
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
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingTop: 20, paddingBottom: 64 },
});
