/**
 * Web `/mobile/season-awards` · 順位予想 相当。
 * 試合サイドメニュー「アワード予想」「順位予想」からの入口。
 */
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { cyberAlert } from "../../../components/cyberAlert";
import GamesNbaSubpageShellNative from "../GamesNbaSubpageShellNative";
import type { GamesStackParamList } from "../../../navigation/types";
import NbaSeasonStandingsPredictPanelNative from "../predict/season/NbaSeasonStandingsPredictPanelNative";
import NbaSeasonStandingsViewPanelNative from "../predict/season/NbaSeasonStandingsViewPanelNative";
import NbaSeasonAwardsPredictPanelNative from "../predict/season/NbaSeasonAwardsPredictPanelNative";
import NbaSeasonAwardsViewPanelNative from "../predict/season/NbaSeasonAwardsViewPanelNative";
import {
  emptySeasonStandingsPrediction,
  isSeasonStandingsComplete,
  type NbaSeasonStandingsPrediction,
} from "../../../../../../lib/predict/nbaSeasonStandingsPredict";
import {
  emptySeasonAwardsPrediction,
  isSeasonAwardsComplete,
  type NbaAwardCandidate,
  type NbaSeasonAwardsPrediction,
} from "../../../../../../lib/predict/nbaSeasonAwardsPredict";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../../lib/rankings/nbaSeason";
import {
  fetchMeSeasonAwardsNative,
  saveMeSeasonAwardsNative,
} from "../../profile/seasonAwardsApiNative";
import {
  fetchMeSeasonStandingsNative,
  saveMeSeasonStandingsNative,
} from "../../profile/seasonStandingsApiNative";

export default function SeasonPredictScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const route = useRoute<RouteProp<GamesStackParamList, "SeasonPredict">>();
  const mode = route.params?.mode ?? "standings";
  const language: "ja" | "en" = "ja";
  const isJa = language === "ja";
  const season = CURRENT_NBA_SEASON_KEY;

  const [standings, setStandings] = useState<NbaSeasonStandingsPrediction>(() =>
    emptySeasonStandingsPrediction(season)
  );
  const [standingsMode, setStandingsMode] = useState<"loading" | "edit" | "view">(
    "loading"
  );
  const [awards, setAwards] = useState<NbaSeasonAwardsPrediction>(() =>
    emptySeasonAwardsPrediction(season)
  );
  const [candidates, setCandidates] = useState<NbaAwardCandidate[]>([]);
  const [awardsMode, setAwardsMode] = useState<"loading" | "edit" | "view">("loading");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "awards") return;
    let cancelled = false;
    setAwardsMode("loading");
    (async () => {
      try {
        const data = await fetchMeSeasonAwardsNative(season);
        if (cancelled) return;
        if (data.prediction) {
          setAwards(data.prediction);
          setCandidates(data.candidates ?? []);
          setAwardsMode("view");
        } else {
          setAwards(emptySeasonAwardsPrediction(season));
          setCandidates([]);
          setAwardsMode("edit");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "load failed";
        console.error("fetchMeSeasonAwardsNative", msg, e);
        if (!cancelled) {
          setError(msg);
          setAwardsMode("edit");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, season]);

  useEffect(() => {
    if (mode !== "standings") return;
    let cancelled = false;
    setStandingsMode("loading");
    (async () => {
      try {
        const data = await fetchMeSeasonStandingsNative(season);
        if (cancelled) return;
        if (data.prediction) {
          setStandings(data.prediction);
          setStandingsMode("view");
        } else {
          setStandings(emptySeasonStandingsPrediction(season));
          setStandingsMode("edit");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "load failed";
        console.error("fetchMeSeasonStandingsNative", msg, e);
        if (!cancelled) {
          setError(msg);
          setStandingsMode("edit");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, season]);

  const offerStandingsNudge = useCallback(async () => {
    try {
      const existing = await fetchMeSeasonStandingsNative(season);
      if (existing.prediction) return;
    } catch {
      /* 未提出扱いで案内 */
    }
    cyberAlert(
      isJa ? "順位予想もしますか？" : "Predict standings too?",
      isJa
        ? "アワード予想を提出しました。続けて East / West の順位予想もできます。"
        : "Awards submitted. Continue to East / West standings prediction?",
      [
        {
          text: isJa ? "あとで" : "Later",
          style: "cancel",
        },
        {
          text: isJa ? "順位予想へ" : "Go to standings",
          onPress: () => {
            navigation.navigate("SeasonPredict", { mode: "standings" });
          },
        },
      ],
      { variant: "success" }
    );
  }, [isJa, navigation, season]);

  const handleSubmitAwards = useCallback(async () => {
    if (submitting) return;
    if (!isSeasonAwardsComplete(awards)) {
      cyberAlert(
        isJa ? "未入力があります" : "Incomplete",
        isJa
          ? "7つのアワードすべて選んでから提出してください。"
          : "Pick all 7 awards before submitting."
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await saveMeSeasonAwardsNative({
        season: awards.season,
        picks: awards.picks,
      });
      if (!data.prediction) {
        throw new Error(isJa ? "提出レスポンスが不正です" : "Invalid submit response");
      }
      setAwards(data.prediction);
      setCandidates(data.candidates ?? []);
      setAwardsMode("view");
      await offerStandingsNudge();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "submit failed";
      setError(msg);
      cyberAlert(isJa ? "提出に失敗しました" : "Submit failed", msg);
    } finally {
      setSubmitting(false);
    }
  }, [awards, submitting, isJa, offerStandingsNudge]);

  const handleSubmitStandings = useCallback(async () => {
    if (submitting) return;
    if (!isSeasonStandingsComplete(standings)) {
      cyberAlert(
        isJa ? "未入力があります" : "Incomplete",
        isJa
          ? "East / West それぞれ 1〜15 位を埋めてから提出してください。"
          : "Fill East and West 1–15 before submitting."
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await saveMeSeasonStandingsNative({
        season: standings.season,
        east: standings.east,
        west: standings.west,
      });
      if (!data.prediction) {
        throw new Error(isJa ? "提出レスポンスが不正です" : "Invalid submit response");
      }
      setStandings(data.prediction);
      setStandingsMode("view");
      cyberAlert(
        isJa ? "提出しました" : "Submitted",
        isJa
          ? "順位予想を保存しました。"
          : "Standings prediction saved.",
        undefined,
        { variant: "success" }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "submit failed";
      setError(msg);
      cyberAlert(isJa ? "提出に失敗しました" : "Submit failed", msg);
    } finally {
      setSubmitting(false);
    }
  }, [standings, submitting, isJa]);

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
        standingsMode === "loading" ? (
          <View style={styles.loading}>
            <ActivityIndicator color="rgba(103,232,249,0.8)" />
          </View>
        ) : standingsMode === "view" ? (
          <View style={{ gap: 12 }}>
            <NbaSeasonStandingsViewPanelNative prediction={standings} />
            <Pressable
              onPress={() => {
                setError(null);
                setStandingsMode("edit");
              }}
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>Edit & resubmit</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <NbaSeasonStandingsPredictPanelNative
              value={standings}
              onChange={setStandings}
              onSubmit={() => void handleSubmitStandings()}
              submitDisabled={submitting}
            />
            {submitting ? (
              <Text style={styles.submitting}>
                {isJa ? "提出中…" : "Submitting…"}
              </Text>
            ) : null}
          </View>
        )
      ) : awardsMode === "loading" ? (
        <View style={styles.loading}>
          <ActivityIndicator color="rgba(252,211,77,0.8)" />
        </View>
      ) : awardsMode === "view" ? (
        <View style={{ gap: 12 }}>
          <NbaSeasonAwardsViewPanelNative
            prediction={awards}
            catalog={candidates.length > 0 ? candidates : undefined}
          />
          <Pressable
            onPress={() => {
              setError(null);
              setAwardsMode("edit");
            }}
            style={styles.editBtn}
          >
            <Text style={styles.editBtnText}>Edit & resubmit</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <NbaSeasonAwardsPredictPanelNative
            value={awards}
            onChange={setAwards}
            onSubmit={() => void handleSubmitAwards()}
            submitDisabled={submitting}
          />
          {submitting ? (
            <Text style={styles.submitting}>
              {isJa ? "提出中…" : "Submitting…"}
            </Text>
          ) : null}
        </View>
      )}
    </GamesNbaSubpageShellNative>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 48, alignItems: "center" },
  editBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  editBtnText: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    textAlign: "center",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
  },
  error: { fontSize: 12, color: "rgba(255,138,180,0.85)", lineHeight: 18 },
  submitting: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
});
