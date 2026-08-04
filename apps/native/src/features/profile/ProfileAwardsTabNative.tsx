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

type Props = {
  uid: string | undefined;
  language: "ja" | "en";
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
  const isJa = language === "ja";
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
      <Text style={styles.muted}>
        {isJa ? "ログインが必要です" : "Sign in required"}
      </Text>
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
      <View style={styles.noDataBox}>
        <Text style={styles.noDataBebas}>NO DATA</Text>
        <Text style={styles.muted}>
          {isJa
            ? "提出済みのシーズン予想がありません"
            : "No season predictions submitted"}
        </Text>
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
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    gap: 8,
  },
  noDataBebas: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 36,
    letterSpacing: 4,
    color: "rgba(255,255,255,0.55)",
  },
});
