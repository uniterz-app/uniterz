/**
 * __DEV__ — TDL トレード予想バレットの UI モック。
 * 提出 / 提出後 / 市場 / 採点 / 順位。本番 API・Firestore は未接続。
 */
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "../../../profile/mobileScreens/MobilePageShell";
import NbaTradeBallotPredictPanelNative from "./NbaTradeBallotPredictPanelNative";
import NbaTradeBallotViewPanelNative from "./NbaTradeBallotViewPanelNative";
import NbaTradeBallotMarketPanelNative from "./NbaTradeBallotMarketPanelNative";
import NbaTradeBallotScorePanelNative from "./NbaTradeBallotScorePanelNative";
import NbaTradeBallotScoreTableNative from "./NbaTradeBallotScoreTableNative";
import NbaTradeBallotRankingPanelNative from "./NbaTradeBallotRankingPanelNative";
import TradeBallotRulesChipNative from "./TradeBallotRulesChipNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../../rankings/CyberSlantedTabNative";
import {
  emptyTradeBallotPrediction,
  isTradeBallotComplete,
} from "../../../../../../../lib/predict/nbaTradeBallotPredict";
import {
  MOCK_OFFICIAL_TRADE_BALLOT_RESULTS,
  MOCK_SUBMITTED_TRADE_BALLOT,
  MOCK_TRADE_BALLOT_VOTE_PCT,
  buildTradeBallotMarketPreviewMock,
} from "../../../../../../../lib/predict/nbaTradeBallotPreviewMocks";
import { buildTradeBallotRankingPreviewMock } from "../../../../../../../lib/predict/nbaTradeBallotRankingMocks";
import { scoreTradeBallotPrediction } from "../../../../../../../lib/predict/nbaTradeBallotScoring";
import { TRADE_BALLOT_SCHEDULE_COPY_JA } from "../../../../../../../lib/predict/nbaTradeBallotDeadline";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../../../lib/rankings/nbaSeason";
import { useSeasonAwardsPlayerCatalog } from "../../../../../../../lib/predict/useSeasonAwardsPlayerCatalog";
import { getUniterzApiBaseUrl } from "../../submitPredictionApi";
import { cyberAlert } from "../../../../components/cyberAlert";
import { useBottomTabBarInsets } from "../../../../navigation/useBottomTabBarInsets";

type Mode = "edit" | "view" | "market" | "score" | "rank";

type Props = {
  onClose: () => void;
};

export default function TradeBallotPreviewScreenNative({ onClose }: Props) {
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const [mode, setMode] = useState<Mode>("edit");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [ballot, setBallot] = useState(() =>
    emptyTradeBallotPrediction(CURRENT_NBA_SEASON_KEY)
  );
  const [submitted, setSubmitted] = useState(false);
  const market = useMemo(
    () => buildTradeBallotMarketPreviewMock(CURRENT_NBA_SEASON_KEY),
    []
  );
  const ranking = useMemo(() => buildTradeBallotRankingPreviewMock(), []);
  const { players } = useSeasonAwardsPlayerCatalog({
    season: CURRENT_NBA_SEASON_KEY,
    apiBaseUrl: getUniterzApiBaseUrl(),
  });

  const viewPrediction =
    submitted && isTradeBallotComplete(ballot)
      ? ballot
      : MOCK_SUBMITTED_TRADE_BALLOT;

  const mineForMarket =
    submitted && isTradeBallotComplete(ballot)
      ? { prediction: ballot, catalog: players }
      : { prediction: MOCK_SUBMITTED_TRADE_BALLOT, catalog: players };

  const scoreResult = useMemo(
    () =>
      scoreTradeBallotPrediction(
        viewPrediction,
        MOCK_OFFICIAL_TRADE_BALLOT_RESULTS,
        MOCK_TRADE_BALLOT_VOTE_PCT
      ),
    [viewPrediction]
  );

  return (
    <MobilePageShell title="トレードバレット（DEV）" appBackground onClose={onClose}>
      <ScrollView
        contentContainerStyle={[
          styles.pad,
          { paddingBottom: bottomContentReserveY + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.banner}>
          <View style={styles.bannerTop}>
            <Text style={styles.bannerTitle}>DEV MOCK</Text>
            <TradeBallotRulesChipNative
              open={rulesOpen}
              onOpenChange={setRulesOpen}
            />
          </View>
          <Text style={styles.bannerBody}>
            受付 {TRADE_BALLOT_SCHEDULE_COPY_JA.open} · 締切{" "}
            {TRADE_BALLOT_SCHEDULE_COPY_JA.close}。
            {TRADE_BALLOT_SCHEDULE_COPY_JA.lockRule}
            1位ユニフォーム · 2〜50位 Unit · 参加賞 5 Unit。
          </Text>
        </View>

        <View style={{ marginBottom: 14 }}>
          <CyberSlantedTabBarNative fill>
            <CyberSlantedTabNative
              label="提出"
              active={mode === "edit"}
              onPress={() => setMode("edit")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label="提出後"
              active={mode === "view"}
              onPress={() => setMode("view")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label="市場"
              active={mode === "market"}
              onPress={() => setMode("market")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label="採点"
              active={mode === "score"}
              onPress={() => setMode("score")}
              compact
              fontWeight="700"
            />
            <CyberSlantedTabNative
              label="順位"
              active={mode === "rank"}
              onPress={() => setMode("rank")}
              compact
              fontWeight="700"
            />
          </CyberSlantedTabBarNative>
        </View>

        {mode === "edit" ? (
          <NbaTradeBallotPredictPanelNative
            value={ballot}
            readOnly={submitted}
            onChange={(next) => {
              setBallot(next);
              if (submitted) setSubmitted(false);
            }}
            onSubmit={() => {
              setSubmitted(true);
              setMode("view");
              cyberAlert(
                "提出（モック）",
                "本番ではここで保存します。提出後タブに切り替えました。"
              );
            }}
          />
        ) : null}

        {mode === "view" ? (
          <View style={{ gap: 12 }}>
            {!submitted ? (
              <Text style={styles.hint}>
                まだ提出していないので固定モックを表示中。提出タブで 7 枠出して Submit すると自分の内容になる。
              </Text>
            ) : null}
            <NbaTradeBallotViewPanelNative
              prediction={viewPrediction}
              catalog={players}
              showBrandLogo
            />
          </View>
        ) : null}

        {mode === "market" ? (
          <NbaTradeBallotMarketPanelNative
            market={market}
            mine={mineForMarket}
          />
        ) : null}

        {mode === "score" ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.hint}>
              上はルールの採点表・報酬表。下はモック正解での自分の点。はてなでモーダルも開ける。
            </Text>
            <NbaTradeBallotScoreTableNative />
            <NbaTradeBallotScorePanelNative
              result={scoreResult}
              catalog={players}
            />
          </View>
        ) : null}

        {mode === "rank" ? (
          <NbaTradeBallotRankingPanelNative
            rows={ranking}
            catalog={players}
          />
        ) : null}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  pad: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  banner: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
    backgroundColor: "rgba(0,245,255,0.06)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  bannerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  bannerTitle: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(0,245,255,0.9)",
    textTransform: "uppercase",
  },
  bannerBody: {
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.5)",
  },
  hint: {
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
  },
});
