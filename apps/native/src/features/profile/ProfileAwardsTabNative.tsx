/**
 * Web プロフィール「アワード」タブ相当。
 * 提出済みシーズン予想（アワード + 順位）を表示。
 * 締切前かつ自分プロフィールなら未提出分の提出導線を出す。
 */
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import { isSeasonPredictSubmitOpen } from "@/lib/predict/seasonPredictDeadline";
import { PROFILE_CHART_CYBER } from "./profileOverviewChartCyberTheme";
import {
  profileOverviewChartEmptyHintStyle,
  profileOverviewChartNoDataStyle,
} from "./profileOverviewChartShell";

type Props = {
  uid: string | undefined;
  language: string;
  /** 自分のプロフィールのときだけ提出 CTA を出す */
  isMe?: boolean;
  onSubmitAwards?: () => void;
  onSubmitStandings?: () => void;
  /** 明示指定時は fetch せずこれを表示（プレビュー用） */
  prediction?: NbaSeasonAwardsPrediction | null;
  candidates?: NbaAwardCandidate[];
  standings?: NbaSeasonStandingsPrediction | null;
};

export default function ProfileAwardsTabNative({
  uid,
  language,
  isMe = false,
  onSubmitAwards,
  onSubmitStandings,
  prediction: predictionProp,
  candidates: candidatesProp,
  standings: standingsProp,
}: Props) {
  const copy = profileAwardsBracketCopy(language);
  const controlled =
    predictionProp !== undefined || standingsProp !== undefined;
  const canOfferSubmit =
    isMe && isSeasonPredictSubmitOpen() && !controlled;
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
        <Text style={styles.noDataHint}>
          {canOfferSubmit ? copy.submitOpenHint : copy.noSeasonPredictions}
        </Text>
        {canOfferSubmit ? (
          <View style={styles.ctaCol}>
            {onSubmitAwards ? (
              <SubmitButton
                label={copy.submitAwardsCta}
                onPress={onSubmitAwards}
              />
            ) : null}
            {onSubmitStandings ? (
              <SubmitButton
                label={copy.submitStandingsCta}
                onPress={onSubmitStandings}
                outline
              />
            ) : null}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {standings ? (
        <NbaSeasonStandingsViewPanelNative prediction={standings} />
      ) : canOfferSubmit && onSubmitStandings ? (
        <MissingSubmitCard
          hint={copy.missingStandingsHint}
          ctaLabel={copy.submitStandingsCta}
          onPress={onSubmitStandings}
        />
      ) : null}
      {prediction ? (
        <NbaSeasonAwardsViewPanelNative
          prediction={prediction}
          catalog={candidates.length > 0 ? candidates : undefined}
        />
      ) : canOfferSubmit && onSubmitAwards ? (
        <MissingSubmitCard
          hint={copy.missingAwardsHint}
          ctaLabel={copy.submitAwardsCta}
          onPress={onSubmitAwards}
        />
      ) : null}
    </View>
  );
}

function MissingSubmitCard({
  hint,
  ctaLabel,
  onPress,
}: {
  hint: string;
  ctaLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.missingCard}>
      <Text style={styles.missingHint}>{hint}</Text>
      <SubmitButton label={ctaLabel} onPress={onPress} />
    </View>
  );
}

function SubmitButton({
  label,
  onPress,
  outline = false,
}: {
  label: string;
  onPress: () => void;
  outline?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.ctaBtn,
        outline ? styles.ctaBtnOutline : styles.ctaBtnSolid,
        pressed ? { opacity: 0.88 } : null,
      ]}
    >
      <Text
        style={[
          styles.ctaBtnText,
          outline ? styles.ctaBtnTextOutline : styles.ctaBtnTextSolid,
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
    maxWidth: 280,
  },
  ctaCol: {
    marginTop: 16,
    width: "100%",
    maxWidth: 300,
    gap: 8,
  },
  missingCard: {
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderRadius: 2,
    backgroundColor: PROFILE_CHART_CYBER.rankPlotInnerBg,
    borderWidth: 1,
    borderColor: PROFILE_CHART_CYBER.glassBorder,
    alignItems: "center",
    gap: 12,
  },
  missingHint: {
    ...profileOverviewChartEmptyHintStyle,
    maxWidth: 280,
  },
  ctaBtn: {
    width: "100%",
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtnSolid: {
    borderWidth: 2,
    borderColor: "#00F5FF",
    backgroundColor: "#00F5FF",
  },
  ctaBtnOutline: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.7)",
    backgroundColor: "transparent",
  },
  ctaBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  ctaBtnTextSolid: {
    color: "#050508",
  },
  ctaBtnTextOutline: {
    color: "#7DFAFF",
  },
});
