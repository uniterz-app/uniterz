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
import NbaSeasonStandingsMarketPanelNative from "../predict/season/NbaSeasonStandingsMarketPanelNative";
import NbaSeasonAwardsPredictPanelNative from "../predict/season/NbaSeasonAwardsPredictPanelNative";
import NbaSeasonAwardsViewPanelNative from "../predict/season/NbaSeasonAwardsViewPanelNative";
import NbaSeasonAwardsMarketPanelNative from "../predict/season/NbaSeasonAwardsMarketPanelNative";
import SeasonPredictRulesChipNative from "../predict/season/SeasonPredictRulesChipNative";
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
import {
  isSeasonPredictSubmitOpen,
  seasonPredictSubmitDeadlineLabel,
  seasonPredictSubmitLockedMessage,
} from "../../../../../../lib/predict/seasonPredictDeadline";
import type {
  SeasonAwardsMarketSnapshot,
  SeasonStandingsMarketSnapshot,
} from "../../../../../../lib/predict/seasonPredictMarket";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../../lib/rankings/nbaSeason";
import {
  fetchMeSeasonAwardsNative,
  saveMeSeasonAwardsNative,
} from "../../profile/seasonAwardsApiNative";
import {
  fetchMeSeasonStandingsNative,
  saveMeSeasonStandingsNative,
} from "../../profile/seasonStandingsApiNative";
import { fetchSeasonPredictMarketNative } from "../../profile/seasonPredictMarketApiNative";
import {
  resolveSeasonPredictUiLang,
  seasonPredictAlertCopy,
  seasonPredictAwardsIncompleteError,
  seasonPredictAwardsPageSubtitle,
  seasonPredictInvalidSubmitError,
  seasonPredictMarketPendingBody,
  seasonPredictNudgeCopy,
  seasonPredictPageUiCopy,
  seasonPredictStandingsIncompleteError,
  seasonPredictStandingsPageSubtitle,
  type SeasonPredictUiLang,
} from "../../../../../../lib/predict/seasonPredictUiCopy";
import { useNativeUserLanguageFromAuth } from "../../../i18n/useNativeUserLanguageFromAuth";

type PanelMode = "loading" | "edit" | "view" | "market" | "market_pending";

export default function SeasonPredictScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const route = useRoute<RouteProp<GamesStackParamList, "SeasonPredict">>();
  const mode = route.params?.mode ?? "standings";
  const { language: userLanguage } = useNativeUserLanguageFromAuth();
  const language: SeasonPredictUiLang = resolveSeasonPredictUiLang(userLanguage);
  const pageCopy = seasonPredictPageUiCopy(language);
  const alerts = seasonPredictAlertCopy(language);
  const season = CURRENT_NBA_SEASON_KEY;
  const submitOpen = isSeasonPredictSubmitOpen();
  const deadlineLabel = seasonPredictSubmitDeadlineLabel(language);

  const [standings, setStandings] = useState<NbaSeasonStandingsPrediction>(() =>
    emptySeasonStandingsPrediction(season)
  );
  const [standingsMode, setStandingsMode] = useState<PanelMode>("loading");
  const [standingsMarket, setStandingsMarket] =
    useState<SeasonStandingsMarketSnapshot | null>(null);
  const [awards, setAwards] = useState<NbaSeasonAwardsPrediction>(() =>
    emptySeasonAwardsPrediction(season)
  );
  const [candidates, setCandidates] = useState<NbaAwardCandidate[]>([]);
  const [awardsMode, setAwardsMode] = useState<PanelMode>("loading");
  const [awardsMarket, setAwardsMarket] =
    useState<SeasonAwardsMarketSnapshot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesAutoShown, setRulesAutoShown] = useState(false);

  useEffect(() => {
    setRulesAutoShown(false);
    setRulesOpen(false);
  }, [mode]);

  useEffect(() => {
    if (mode !== "awards") return;
    let cancelled = false;
    setAwardsMode("loading");
    (async () => {
      if (!submitOpen) {
        try {
          const data = await fetchSeasonPredictMarketNative({
            season,
            kind: "awards",
          });
          if (cancelled) return;
          if (data.awards) {
            setAwardsMarket(data.awards);
            setAwardsMode("market");
          } else {
            setAwardsMarket(null);
            setAwardsMode("market_pending");
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "load failed";
          console.error("fetchSeasonPredictMarketNative awards", msg, e);
          if (!cancelled) {
            setError(msg);
            setAwardsMode("market_pending");
          }
        }
        return;
      }
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
  }, [mode, season, submitOpen]);

  useEffect(() => {
    if (mode !== "standings") return;
    let cancelled = false;
    setStandingsMode("loading");
    (async () => {
      if (!submitOpen) {
        try {
          const data = await fetchSeasonPredictMarketNative({
            season,
            kind: "standings",
          });
          if (cancelled) return;
          if (data.standings) {
            setStandingsMarket(data.standings);
            setStandingsMode("market");
          } else {
            setStandingsMarket(null);
            setStandingsMode("market_pending");
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "load failed";
          console.error("fetchSeasonPredictMarketNative standings", msg, e);
          if (!cancelled) {
            setError(msg);
            setStandingsMode("market_pending");
          }
        }
        return;
      }
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
  }, [mode, season, submitOpen]);

  const activeMode = mode === "awards" ? awardsMode : standingsMode;

  /** 未提出で入ったらルールモーダルを自動表示 */
  useEffect(() => {
    if (activeMode !== "edit" || rulesAutoShown) return;
    setRulesOpen(true);
    setRulesAutoShown(true);
  }, [activeMode, rulesAutoShown]);

  const offerStandingsNudge = useCallback(async () => {
    try {
      const existing = await fetchMeSeasonStandingsNative(season);
      if (existing.prediction) return;
    } catch {
      /* 未提出扱いで案内 */
    }
    const nudge = seasonPredictNudgeCopy(language);
    cyberAlert(nudge.title, nudge.body, [
      {
        text: nudge.later,
        style: "cancel",
      },
      {
        text: nudge.goStandings,
        onPress: () => {
          navigation.navigate("SeasonPredict", { mode: "standings" });
        },
      },
    ], { variant: "success" });
  }, [language, navigation, season]);

  const handleSubmitAwards = useCallback(async () => {
    if (submitting) return;
    if (!submitOpen) {
      cyberAlert(
        alerts.deadlinePassedTitle,
        seasonPredictSubmitLockedMessage(language)
      );
      return;
    }
    if (!isSeasonAwardsComplete(awards)) {
      cyberAlert(
        alerts.incompleteTitle,
        seasonPredictAwardsIncompleteError(language)
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
        throw new Error(seasonPredictInvalidSubmitError(language));
      }
      setAwards(data.prediction);
      setCandidates(data.candidates ?? []);
      setAwardsMode("view");
      await offerStandingsNudge();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "submit failed";
      setError(msg);
      cyberAlert(alerts.submitFailedTitle, msg);
    } finally {
      setSubmitting(false);
    }
  }, [alerts, awards, language, offerStandingsNudge, submitOpen, submitting]);

  const handleSubmitStandings = useCallback(async () => {
    if (submitting) return;
    if (!submitOpen) {
      cyberAlert(
        alerts.deadlinePassedTitle,
        seasonPredictSubmitLockedMessage(language)
      );
      return;
    }
    if (!isSeasonStandingsComplete(standings)) {
      cyberAlert(
        alerts.incompleteTitle,
        seasonPredictStandingsIncompleteError(language)
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
        throw new Error(seasonPredictInvalidSubmitError(language));
      }
      setStandings(data.prediction);
      setStandingsMode("view");
      cyberAlert(
        alerts.submittedTitle,
        alerts.standingsSavedBody,
        undefined,
        { variant: "success" }
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "submit failed";
      setError(msg);
      cyberAlert(alerts.submitFailedTitle, msg);
    } finally {
      setSubmitting(false);
    }
  }, [alerts, language, standings, submitOpen, submitting]);

  const title = !submitOpen
    ? "MARKET"
    : mode === "awards"
      ? "AWARDS"
      : "STANDINGS";

  const subtitle =
    mode === "awards"
      ? seasonPredictAwardsPageSubtitle(language, submitOpen)
      : seasonPredictStandingsPageSubtitle(language, submitOpen);

  const lockedMsg = seasonPredictSubmitLockedMessage(language);
  const marketPendingBody = seasonPredictMarketPendingBody(language);

  return (
    <GamesNbaSubpageShellNative
      eyebrow="NBA · SEASON"
      title={title}
      subtitle={subtitle}
      onHelpPress={() => setRulesOpen(true)}
      onBack={() => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.navigate("GamesHome");
      }}
    >
      <Text style={styles.deadline}>
        {submitOpen
          ? `${pageCopy.deadlineLabel} · ${deadlineLabel}`
          : pageCopy.marketPassed.toUpperCase()}
      </Text>

      {mode === "standings" ? (
        standingsMode === "loading" ? (
          <View style={styles.loading}>
            <ActivityIndicator color="rgba(103,232,249,0.8)" />
          </View>
        ) : standingsMode === "market" && standingsMarket ? (
          <NbaSeasonStandingsMarketPanelNative
            market={standingsMarket}
            language={language}
          />
        ) : standingsMode === "market_pending" ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.pendingTitle}>{pageCopy.marketPending}</Text>
            <Text style={styles.locked}>
              {marketPendingBody}
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        ) : standingsMode === "view" ? (
          <View style={{ gap: 12 }}>
            <NbaSeasonStandingsViewPanelNative prediction={standings} />
            {submitOpen ? (
              <Pressable
                onPress={() => {
                  setError(null);
                  setStandingsMode("edit");
                }}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>{pageCopy.editResubmit}</Text>
              </Pressable>
            ) : (
              <Text style={styles.locked}>{lockedMsg}</Text>
            )}
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!submitOpen ? (
              <Text style={styles.locked}>{lockedMsg}</Text>
            ) : (
              <NbaSeasonStandingsPredictPanelNative
                value={standings}
                onChange={setStandings}
                onSubmit={() => void handleSubmitStandings()}
                submitDisabled={submitting}
                language={language}
              />
            )}
            {submitting ? (
              <Text style={styles.submitting}>
                {pageCopy.submitting}
              </Text>
            ) : null}
          </View>
        )
      ) : awardsMode === "loading" ? (
        <View style={styles.loading}>
          <ActivityIndicator color="rgba(252,211,77,0.8)" />
        </View>
      ) : awardsMode === "market" && awardsMarket ? (
        <NbaSeasonAwardsMarketPanelNative
          market={awardsMarket}
          language={language}
        />
      ) : awardsMode === "market_pending" ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.pendingTitle}>{pageCopy.marketPending}</Text>
          <Text style={styles.locked}>
            {marketPendingBody}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      ) : awardsMode === "view" ? (
        <View style={{ gap: 12 }}>
          <NbaSeasonAwardsViewPanelNative
            prediction={awards}
            catalog={candidates.length > 0 ? candidates : undefined}
          />
          {submitOpen ? (
            <Pressable
              onPress={() => {
                setError(null);
                setAwardsMode("edit");
              }}
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>{pageCopy.editResubmit}</Text>
            </Pressable>
          ) : (
            <Text style={styles.locked}>{lockedMsg}</Text>
          )}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!submitOpen ? (
            <Text style={styles.locked}>{lockedMsg}</Text>
          ) : (
            <NbaSeasonAwardsPredictPanelNative
              value={awards}
              onChange={setAwards}
              onSubmit={() => void handleSubmitAwards()}
              submitDisabled={submitting}
              language={language}
            />
          )}
          {submitting ? (
            <Text style={styles.submitting}>
              {pageCopy.submitting}
            </Text>
          ) : null}
        </View>
      )}

      <SeasonPredictRulesChipNative
        kind={mode === "awards" ? "awards" : "standings"}
        language={language}
        showChip={false}
        open={rulesOpen}
        onOpenChange={setRulesOpen}
      />
    </GamesNbaSubpageShellNative>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 48, alignItems: "center" },
  deadline: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    marginBottom: 10,
  },
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
  locked: { fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 18 },
  pendingTitle: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(165,243,252,0.85)",
    textTransform: "uppercase",
  },
  submitting: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
});
