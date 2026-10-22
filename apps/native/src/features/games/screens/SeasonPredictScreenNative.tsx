/**
 * Web `/mobile/season-awards` · 順位予想 相当。
 * 試合サイドメニュー「アワード予想」「順位予想」からの入口。
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { cyberAlert } from "../../../components/cyberAlert";
import GamesNbaSubpageShellNative from "../GamesNbaSubpageShellNative";
import type { GamesStackParamList } from "../../../navigation/types";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { keyboardAvoidingBehavior } from "../../../ui/keyboardAvoidingBehaviorNative";
import NbaSeasonStandingsPredictPanelNative from "../predict/season/NbaSeasonStandingsPredictPanelNative";
import NbaSeasonStandingsViewPanelNative from "../predict/season/NbaSeasonStandingsViewPanelNative";
import NbaSeasonStandingsMarketPanelNative from "../predict/season/NbaSeasonStandingsMarketPanelNative";
import NbaSeasonAwardsPredictPanelNative from "../predict/season/NbaSeasonAwardsPredictPanelNative";
import NbaSeasonAwardsViewPanelNative from "../predict/season/NbaSeasonAwardsViewPanelNative";
import NbaSeasonAwardsMarketPanelNative from "../predict/season/NbaSeasonAwardsMarketPanelNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../../rankings/CyberSlantedTabNative";
import SeasonPredictRulesChipNative from "../predict/season/SeasonPredictRulesChipNative";
import ReferralPreseasonInviteCardNative from "../../referral/ReferralPreseasonInviteCardNative";
import { isReferralPreseasonOpen } from "../../../../../../lib/referral/referralPreseasonBonus";
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
  seasonPredictAwardsNudgeCopy,
  seasonPredictPageUiCopy,
  seasonPredictStandingsIncompleteError,
  seasonPredictStandingsPageSubtitle,
  type SeasonPredictUiLang,
} from "../../../../../../lib/predict/seasonPredictUiCopy";
import { useNativeUserLanguageFromAuth } from "../../../i18n/useNativeUserLanguageFromAuth";

type PanelMode = "loading" | "edit" | "view" | "locked";
type ViewTab = "mine" | "crowd";
type PreviewState = "idle" | "loading" | "ready" | "pending";

export default function SeasonPredictScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const route = useRoute<RouteProp<GamesStackParamList, "SeasonPredict">>();
  const mode = route.params?.mode ?? "standings";
  const { language: userLanguage } = useNativeUserLanguageFromAuth();
  const language: SeasonPredictUiLang = resolveSeasonPredictUiLang(userLanguage);
  const pageCopy = seasonPredictPageUiCopy(language);
  const alerts = seasonPredictAlertCopy(language);
  const { bottomContentReserveY } = useBottomTabBarInsets();
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
  const [standingsHasMine, setStandingsHasMine] = useState(false);
  const [awardsHasMine, setAwardsHasMine] = useState(false);
  const [awardsMine, setAwardsMine] = useState<{
    prediction: NbaSeasonAwardsPrediction | null;
    candidates: NbaAwardCandidate[];
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesAutoShown, setRulesAutoShown] = useState(false);
  const routeView = route.params?.view;
  const [viewTab, setViewTab] = useState<ViewTab>(routeView ?? "mine");
  useEffect(() => {
    if (routeView) setViewTab(routeView);
  }, [routeView]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const inviteOfferedRef = useRef(false);

  /** 順位・アワードの両方を出し終えた直後に 1 回だけ招待カード。出したら true */
  const offerPreseasonInvite = useCallback((): boolean => {
    if (inviteOfferedRef.current || !isReferralPreseasonOpen()) return false;
    inviteOfferedRef.current = true;
    setInviteOpen(true);
    return true;
  }, []);
  const [standingsPreview, setStandingsPreview] = useState<PreviewState>("idle");
  const [awardsPreview, setAwardsPreview] = useState<PreviewState>("idle");

  const loadedRef = useRef({ standings: false, awards: false });
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const switchKind = useCallback(
    (next: "awards" | "standings") => {
      if (next === mode) return;
      navigation.setParams({ mode: next });
    },
    [mode, navigation]
  );

  const previewRequestedRef = useRef({ standings: false, awards: false });

  /** 締切前・提出済みの「みんなの予想」— 種目ごとに初回だけ読む */
  useEffect(() => {
    if (!submitOpen || viewTab !== "crowd") return;
    const kind = mode === "awards" ? "awards" : "standings";
    if (previewRequestedRef.current[kind]) return;
    previewRequestedRef.current[kind] = true;
    const setState = kind === "awards" ? setAwardsPreview : setStandingsPreview;
    setState("loading");
    (async () => {
      let ready = false;
      try {
        const data = await fetchSeasonPredictMarketNative({
          season,
          kind,
          preview: true,
        });
        if (kind === "awards" && data.awards) {
          setAwardsMarket(data.awards);
          ready = true;
        } else if (kind === "standings" && data.standings) {
          setStandingsMarket(data.standings);
          ready = true;
        }
      } catch (e) {
        console.error("fetchSeasonPredictMarketNative preview", e);
      }
      setState(ready ? "ready" : "pending");
      // 未提出・失敗は次にタブを開いたとき（提出後など）取り直す
      if (!ready) previewRequestedRef.current[kind] = false;
    })();
  }, [mode, season, submitOpen, viewTab]);

  useEffect(() => {
    setRulesAutoShown(false);
    setRulesOpen(false);
  }, [mode]);

  useEffect(() => {
    if (mode !== "awards" || loadedRef.current.awards) return;
    loadedRef.current.awards = true;
    setAwardsMode("loading");
    (async () => {
      if (!submitOpen) {
        const [marketRes, mineRes] = await Promise.allSettled([
          fetchSeasonPredictMarketNative({ season, kind: "awards" }),
          fetchMeSeasonAwardsNative(season),
        ]);
        if (!mountedRef.current) return;
        if (marketRes.status === "fulfilled") {
          setAwardsMarket(marketRes.value.awards ?? null);
        } else {
          console.error("fetchSeasonPredictMarketNative awards", marketRes.reason);
          setAwardsMarket(null);
        }
        const mine =
          mineRes.status === "fulfilled" ? mineRes.value.prediction : null;
        if (mineRes.status === "fulfilled") {
          setAwardsMine({
            prediction: mine,
            candidates: mineRes.value.candidates ?? [],
          });
          if (mine) {
            setAwards(mine);
            setCandidates(mineRes.value.candidates ?? []);
          }
        } else {
          console.error("fetchMeSeasonAwardsNative", mineRes.reason);
          setAwardsMine(null);
        }
        setAwardsHasMine(Boolean(mine));
        if (!routeView) setViewTab(mine ? "mine" : "crowd");
        setAwardsMode("locked");
        return;
      }
      try {
        const data = await fetchMeSeasonAwardsNative(season);
        if (!mountedRef.current) return;
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
        if (mountedRef.current) {
          setError(msg);
          setAwardsMode("edit");
        }
      }
    })();
  }, [mode, routeView, season, submitOpen]);

  useEffect(() => {
    if (mode !== "standings" || loadedRef.current.standings) return;
    loadedRef.current.standings = true;
    setStandingsMode("loading");
    (async () => {
      if (!submitOpen) {
        const [marketRes, mineRes] = await Promise.allSettled([
          fetchSeasonPredictMarketNative({ season, kind: "standings" }),
          fetchMeSeasonStandingsNative(season),
        ]);
        if (!mountedRef.current) return;
        if (marketRes.status === "fulfilled") {
          setStandingsMarket(marketRes.value.standings ?? null);
        } else {
          console.error("fetchSeasonPredictMarketNative standings", marketRes.reason);
          setStandingsMarket(null);
        }
        const mine =
          mineRes.status === "fulfilled" ? mineRes.value.prediction : null;
        if (mine) {
          setStandings(mine);
        } else if (mineRes.status === "rejected") {
          console.error("fetchMeSeasonStandingsNative", mineRes.reason);
        }
        setStandingsHasMine(Boolean(mine));
        if (!routeView) setViewTab(mine ? "mine" : "crowd");
        setStandingsMode("locked");
        return;
      }
      try {
        const data = await fetchMeSeasonStandingsNative(season);
        if (!mountedRef.current) return;
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
        if (mountedRef.current) {
          setError(msg);
          setStandingsMode("edit");
        }
      }
    })();
  }, [mode, routeView, season, submitOpen]);

  const activeMode = mode === "awards" ? awardsMode : standingsMode;

  /** 未提出で入ったらルールモーダルを自動表示 */
  useEffect(() => {
    if (activeMode !== "edit" || rulesAutoShown) return;
    setRulesOpen(true);
    setRulesAutoShown(true);
  }, [activeMode, rulesAutoShown]);

  /** アワード提出後 — 順位予想が未提出なら案内。出したら true */
  const offerStandingsNudge = useCallback(async (): Promise<boolean> => {
    try {
      const existing = await fetchMeSeasonStandingsNative(season);
      if (existing.prediction) return false;
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
    return true;
  }, [language, navigation, season]);

  /** 順位予想提出後 — アワード未提出なら案内。出したら true */
  const offerAwardsNudge = useCallback(async (): Promise<boolean> => {
    try {
      const existing = await fetchMeSeasonAwardsNative(season);
      if (existing.prediction) return false;
    } catch {
      /* 未提出扱いで案内 */
    }
    const nudge = seasonPredictAwardsNudgeCopy(language);
    cyberAlert(nudge.title, nudge.body, [
      {
        text: nudge.later,
        style: "cancel",
      },
      {
        text: nudge.goAwards,
        onPress: () => {
          navigation.navigate("SeasonPredict", { mode: "awards" });
        },
      },
    ], { variant: "success" });
    return true;
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
      if (!(await offerStandingsNudge())) offerPreseasonInvite();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "submit failed";
      setError(msg);
      cyberAlert(alerts.submitFailedTitle, msg);
    } finally {
      setSubmitting(false);
    }
  }, [alerts, awards, language, offerPreseasonInvite, offerStandingsNudge, submitOpen, submitting]);

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
      if (!(await offerAwardsNudge()) && !offerPreseasonInvite()) {
        cyberAlert(
          alerts.submittedTitle,
          alerts.standingsSavedBody,
          undefined,
          { variant: "success" }
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "submit failed";
      setError(msg);
      cyberAlert(alerts.submitFailedTitle, msg);
    } finally {
      setSubmitting(false);
    }
  }, [alerts, language, offerAwardsNudge, offerPreseasonInvite, standings, submitOpen, submitting]);

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

  const kindTabs = (
    <View style={styles.kindTabs}>
      <CyberSlantedTabBarNative fill>
        {(["awards", "standings"] as const).map((kind) => (
          <CyberSlantedTabNative
            key={kind}
            label={kind === "awards" ? "AWARDS" : "STANDINGS"}
            active={mode === kind}
            fill
            compact
            onPress={() => switchKind(kind)}
          />
        ))}
      </CyberSlantedTabBarNative>
    </View>
  );

  const viewToggle = (
    <View style={styles.viewToggle}>
      {(["mine", "crowd"] as const).map((tab) => {
        const active = viewTab === tab;
        return (
          <Pressable
            key={tab}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setViewTab(tab)}
            style={[styles.viewToggleBtn, active ? styles.viewToggleBtnActive : null]}
          >
            <Text
              style={[
                styles.viewToggleText,
                active ? styles.viewToggleTextActive : null,
              ]}
            >
              {tab === "mine" ? pageCopy.myPicksTab : pageCopy.crowdTab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const notSubmitted = (
    <Text style={[styles.locked, styles.notSubmitted]}>
      {pageCopy.myPicksNotSubmitted}
    </Text>
  );

  const lockedCrowd = (panel: ReactNode) =>
    panel ?? (
      <View style={{ gap: 8 }}>
        <Text style={styles.pendingTitle}>{pageCopy.marketPending}</Text>
        <Text style={styles.locked}>{marketPendingBody}</Text>
      </View>
    );

  const renderCrowd = (state: PreviewState, panel: ReactNode) =>
    state === "ready" ? (
      <View style={{ gap: 10 }}>
        <Text style={styles.locked}>{pageCopy.marketPreviewNote}</Text>
        {panel}
      </View>
    ) : state === "pending" ? (
      <View style={{ gap: 8 }}>
        <Text style={styles.pendingTitle}>{pageCopy.marketPending}</Text>
        <Text style={styles.locked}>{pageCopy.marketPreviewPendingBody}</Text>
      </View>
    ) : (
      <View style={styles.loading}>
        <ActivityIndicator color="rgba(103,232,249,0.8)" />
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={keyboardAvoidingBehavior}
    >
    <GamesNbaSubpageShellNative
      eyebrow="NBA · SEASON"
      title={title}
      subtitle={subtitle}
      onHelpPress={() => setRulesOpen(true)}
      contentStyle={{ paddingBottom: bottomContentReserveY + 48 }}
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
      {kindTabs}

      {mode === "standings" ? (
        standingsMode === "loading" ? (
          <View style={styles.loading}>
            <ActivityIndicator color="rgba(103,232,249,0.8)" />
          </View>
        ) : standingsMode === "locked" ? (
          <View style={{ gap: 12 }}>
            {viewToggle}
            {viewTab === "crowd"
              ? lockedCrowd(
                  standingsMarket ? (
                    <NbaSeasonStandingsMarketPanelNative
                      market={standingsMarket}
                      language={language}
                    />
                  ) : null
                )
              : standingsHasMine ? (
                  <NbaSeasonStandingsViewPanelNative
                    prediction={standings}
                    showBrandLogo
                  />
                ) : (
                  notSubmitted
                )}
          </View>
        ) : standingsMode === "view" ? (
          <View style={{ gap: 12 }}>
            {viewToggle}
            {viewTab === "crowd" && submitOpen ? (
              renderCrowd(
                standingsPreview,
                standingsMarket ? (
                  <NbaSeasonStandingsMarketPanelNative
                    market={standingsMarket}
                    language={language}
                  />
                ) : null
              )
            ) : (
            <NbaSeasonStandingsViewPanelNative
              prediction={standings}
              showBrandLogo
            />
            )}
            {viewTab === "crowd" && submitOpen ? null : submitOpen ? (
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
      ) : awardsMode === "locked" ? (
        <View style={{ gap: 12 }}>
          {viewToggle}
          {viewTab === "crowd"
            ? lockedCrowd(
                awardsMarket ? (
                  <NbaSeasonAwardsMarketPanelNative
                    market={awardsMarket}
                    language={language}
                    mine={awardsMine ?? undefined}
                  />
                ) : null
              )
            : awardsHasMine ? (
                <NbaSeasonAwardsViewPanelNative
                  prediction={awards}
                  catalog={candidates.length > 0 ? candidates : undefined}
                  showBrandLogo
                />
              ) : (
                notSubmitted
              )}
        </View>
      ) : awardsMode === "view" ? (
        <View style={{ gap: 12 }}>
          {viewToggle}
          {viewTab === "crowd" && submitOpen ? (
            renderCrowd(
              awardsPreview,
              awardsMarket ? (
                <NbaSeasonAwardsMarketPanelNative
                  market={awardsMarket}
                  language={language}
                  mine={{ prediction: awards, candidates }}
                />
              ) : null
            )
          ) : (
          <NbaSeasonAwardsViewPanelNative
            prediction={awards}
            catalog={candidates.length > 0 ? candidates : undefined}
            showBrandLogo
          />
          )}
          {viewTab === "crowd" && submitOpen ? null : submitOpen ? (
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
      <ReferralPreseasonInviteCardNative
        visible={inviteOpen}
        language={userLanguage}
        onClose={() => setInviteOpen(false)}
      />
    </GamesNbaSubpageShellNative>
    </KeyboardAvoidingView>
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
  kindTabs: { marginBottom: 12 },
  viewToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.35)",
  },
  viewToggleBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
  },
  viewToggleBtnActive: {
    backgroundColor: "rgba(103,232,249,0.16)",
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
  },
  viewToggleTextActive: {
    color: "#cffafe",
  },
  error: { fontSize: 12, color: "rgba(255,138,180,0.85)", lineHeight: 18 },
  locked: { fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 18 },
  notSubmitted: { paddingVertical: 32, textAlign: "center", fontSize: 13 },
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
