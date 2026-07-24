/**
 * Web `/mobile/season-*-preview` 相当。
 * 試合サイドメニュー「アワード予想」「順位予想」からの入口。
 */
import { useState } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import GamesNbaSubpageShellNative from "../GamesNbaSubpageShellNative";
import type { GamesStackParamList } from "../../../navigation/types";
import NbaSeasonStandingsPredictPanelNative from "../predict/season/NbaSeasonStandingsPredictPanelNative";
import NbaSeasonAwardsPredictPanelNative from "../predict/season/NbaSeasonAwardsPredictPanelNative";
import { emptySeasonStandingsPrediction } from "../../../../../../lib/predict/nbaSeasonStandingsPredict";
import { emptySeasonAwardsPrediction } from "../../../../../../lib/predict/nbaSeasonAwardsPredict";

const SEASON = "2026-27";

export default function SeasonPredictScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const route = useRoute<RouteProp<GamesStackParamList, "SeasonPredict">>();
  const mode = route.params?.mode ?? "standings";
  const language: "ja" | "en" = "ja";
  const isJa = language === "ja";

  const [standings, setStandings] = useState(() => emptySeasonStandingsPrediction(SEASON));
  const [awards, setAwards] = useState(() => emptySeasonAwardsPrediction(SEASON));

  const title = mode === "awards" ? "AWARDS" : "STANDINGS";

  const subtitle =
    mode === "awards"
      ? isJa
        ? "MVP・DPOY など主要アワードを予想。候補は人気ピックから選び、名前検索でも絞り込めます。"
        : "Predict major awards. Pick from popular candidates or search by name."
      : isJa
        ? "East / West 各 1〜15 位を予想。同じチームは同じカンファレンス内で一度だけ使えます。"
        : "Rank East / West 1–15. Each team can be used once per conference.";

  return (
    <GamesNbaSubpageShellNative
      eyebrow="NBA · SEASON"
      title={title}
      subtitle={subtitle}
      onBack={() => navigation.navigate("GamesHome", { openMenu: true })}
    >
      {mode === "standings" ? (
        <NbaSeasonStandingsPredictPanelNative
          value={standings}
          onChange={setStandings}
        />
      ) : (
        <NbaSeasonAwardsPredictPanelNative value={awards} onChange={setAwards} />
      )}
    </GamesNbaSubpageShellNative>
  );
}
