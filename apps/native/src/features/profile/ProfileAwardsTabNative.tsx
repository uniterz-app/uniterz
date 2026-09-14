/**
 * Web プロフィール「アワード」タブ相当。
 * 提出済みシーズン予想（アワード + 順位）を表示。
 */
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import NbaSeasonAwardsViewPanelNative from "../games/predict/season/NbaSeasonAwardsViewPanelNative";
import NbaSeasonStandingsViewPanelNative from "../games/predict/season/NbaSeasonStandingsViewPanelNative";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../lib/rankings/nbaSeason";
import type {
  NbaAwardCandidate,
  NbaSeasonAwardsPrediction,
} from "../../../../../lib/predict/nbaSeasonAwardsPredict";
import type { NbaSeasonStandingsPrediction } from "../../../../../lib/predict/nbaSeasonStandingsPredict";
import { fetchProfileSeasonAwardsNative } from "./seasonAwardsApiNative";
import { fetchProfileSeasonStandingsNative } from "./seasonStandingsApiNative";
import { profileAwardsBracketCopy } from "@/lib/profile/profileAwardsBracketCopy";
import { PROFILE_CHART_CYBER } from "./profileOverviewChartCyberTheme";
import {
  profileOverviewChartEmptyHintStyle,
  profileOverviewChartNoDataStyle,
} from "./profileOverviewChartShell";

type Props = {
  uid: string | undefined;
  language: string;
  /** 明示指定時は fetch せずこれを表示（プレビュー用） */
  prediction?: NbaSeasonAwardsPrediction | null;
  candidates?: NbaAwardCandidate[];
  standings?: NbaSeasonStandingsPrediction | null;
};

export default function ProfileAwardsTabNative({
  uid,
  language,
  prediction: predictionProp,
  candidates: candidatesProp,
  standings: standingsProp,
}: Props) {
  const copy = profileAwardsBracketCopy(language);
  const controlled =
    predictionProp !== undefined || standingsProp !== undefined;
  const [loading, setLoading] = useState(!controlled && Boolean(uid));
  const [prediction, setPrediction] = useState<NbaSeasonAwardsPrediction | null>(
    predictionProp ?? null
  );
  const [candidates, setCandidates] = useState<NbaAwardCandidate[]>(
    candidatesProp ?? []
  );
  const [standings, setStandings] = useState<NbaSeasonStandingsPrediction | null>(
    standingsProp ?? null
  );

  useEffect(() => {
    if (controlled) {
      if (predictionProp !== undefined) {
        setPrediction(predictionProp ?? null);
        setCandidates(candidatesProp ?? []);
      }
      if (standingsProp !== undefined) {
        setStandings(standingsProp ?? null);
      }
      setLoading(false);
      return;
    }
    if (!uid) {
      setPrediction(null);
      setCandidates([]);
      setStandings(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [awardsRes, standingsRes] = await Promise.allSettled([
          fetchProfileSeasonAwardsNative(uid, CURRENT_NBA_SEASON_KEY),
          fetchProfileSeasonStandingsNative(uid, CURRENT_NBA_SEASON_KEY),
        ]);
        if (cancelled) return;
        if (awardsRes.status === "fulfilled") {
          setPrediction(awardsRes.value.prediction);
          setCandidates(awardsRes.value.candidates ?? []);
        } else {
          console.error("ProfileAwardsTabNative awards", awardsRes.reason);
          setPrediction(null);
          setCandidates([]);
        }
        if (standingsRes.status === "fulfilled") {
          setStandings(standingsRes.value.prediction);
        } else {
          console.error("ProfileAwardsTabNative standings", standingsRes.reason);
          setStandings(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, controlled, predictionProp, candidatesProp, standingsProp]);

  if (!uid) {
    return (
      <Text style={styles.muted}>{copy.signInRequired}</Text>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="rgba(252,211,77,0.8)" />
      </View>
    );
  }

  if (!prediction && !standings) {
    return (
      <View style={styles.noDataBox} accessibilityRole="text">
        <Text style={styles.noData}>NO DATA</Text>
        <Text style={styles.noDataHint}>{copy.noSeasonPredictions}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {standings ? (
        <NbaSeasonStandingsViewPanelNative prediction={standings} />
      ) : null}
      {prediction ? (
        <NbaSeasonAwardsViewPanelNative
          prediction={prediction}
          catalog={candidates.length > 0 ? candidates : undefined}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingHorizontal: 2,
    gap: 20,
  },
  muted: {
    marginTop: 16,
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    textAlign: "center",
  },
  loadingBox: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 28,
  },
  noDataBox: {
    marginTop: 16,
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
