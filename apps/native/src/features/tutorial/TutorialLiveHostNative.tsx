/**
 * Web `TutorialLiveHost` 相当 — 各タブ初訪問ヒント（連鎖なし）
 */
import { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../../navigation/types";
import type { Language } from "../../../../../lib/i18n/language";
import { t as i18nT } from "../../../../../lib/i18n/t";
import TutorialLiveCoachNative from "./TutorialLiveCoachNative";
import PredictionScoringRulesBodyNative from "../games/PredictionScoringRulesBodyNative";
import PredictOverlaySubmitButtonNative from "../games/PredictOverlaySubmitButtonNative";
import { toNativeGamesLanguage } from "../games/gamesI18n";
import {
  resolveScoringRulesLang,
  scoringRulesCopy,
} from "../../../../../lib/predict/scoringRulesCopy";
import {
  MATCH_CARD_DISPLAY_FONT,
  MATCH_CARD_METRIC_FONT,
} from "../games/matchCardTypography";
import {
  readTutorialLivePhaseNative,
  writeTutorialLivePhaseNative,
  subscribeTutorialLivePhaseNative,
  type TutorialLivePhase,
} from "./tutorialLivePhaseNative";
import { clearTutorialLivePickNative } from "./tutorialLivePickNative";
import { markAppTutorialSeenNative } from "./tutorialSeenNative";
import {
  fetchAppTutorialSeenNative,
  readAppTutorialSeenNative,
} from "./tutorialSeenNative";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import {
  getTutorialHorizonSubstepNative,
  setTutorialHorizonSubstepNative,
  subscribeTutorialHorizonSubstepNative,
} from "./tutorialHorizonSubstepNative";
import { navigateNativeTabForHorizonStep } from "./tutorialHorizonNavigateNative";
import {
  getTutorialLiveTrackNative,
  hydrateTutorialLiveTrackNative,
  setTutorialLiveTrackNative,
} from "./tutorialLiveTrackNative";
import {
  buildHorizonFeatureSteps,
  horizonFeatureProgressLabel,
  horizonStepHost,
} from "../../../../../lib/tutorial/tutorialHorizonSteps";
import { tutorialSkipConfirmProps } from "../../../../../lib/tutorial/tutorialSkipConfirmProps";
import {
  subscribeTutorialRestartNative,
  requestTutorialClearedNative,
} from "./tutorialRestartEventsNative";
import { setTutorialWelcomeAudienceNative } from "./tutorialWelcomeAudienceNative";
import {
  markTutorialPageTipSeenNative,
  readTutorialPageTipSeenNative,
  type TutorialPageTipId,
} from "./tutorialPageTipsNative";

type HostSurface = "rankings" | "groups" | "profile" | "games" | "results";

type Props = {
  page: HostSurface;
  language: Language;
};

const PAGE_TO_TIP: Record<
  HostSurface,
  "rankings" | "groups" | "profile" | "results" | null
> = {
  games: null,
  results: "results",
  rankings: "rankings",
  groups: "groups",
  profile: "profile",
};

const PAGE_TO_PHASE: Record<
  "rankings" | "groups" | "profile" | "results",
  TutorialLivePhase
> = {
  rankings: "rankings",
  groups: "groups",
  profile: "profile",
  results: "results",
};

export default function TutorialLiveHostNative({ page, language }: Props) {
  const { fUser } = useFirebaseUser();
  const navigation =
    useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const m = i18nT(language);
  const skipConfirm = tutorialSkipConfirmProps(m.tutorial);
  const [phase, setPhase] = useState<TutorialLivePhase | null>(null);
  const [horizonFeatureStep, setHorizonFeatureStep] = useState(0);
  const [scoringRulesOpen, setScoringRulesOpen] = useState(false);
  const [rankingsTipStep, setRankingsTipStep] = useState(0);
  const [profileTipStep, setProfileTipStep] = useState(0);

  const syncPhaseFromStore = useCallback(async () => {
    const p = await readTutorialLivePhaseNative();
    await hydrateTutorialLiveTrackNative();
    setPhase(p && p !== "done" ? p : null);
    if (p === "horizon") {
      setHorizonFeatureStep(getTutorialHorizonSubstepNative());
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const p = await readTutorialLivePhaseNative();
        await hydrateTutorialLiveTrackNative();
        if (cancelled) return;
        setPhase(p && p !== "done" ? p : null);
        if (p === "horizon") {
          setHorizonFeatureStep(getTutorialHorizonSubstepNative());
        }

        const uid = fUser?.uid;
        const tip = PAGE_TO_TIP[page];
        if (!uid || !tip) return;
        if (await readAppTutorialSeenNative(uid)) return;
        if (await readTutorialPageTipSeenNative(uid, tip)) return;
        const seen = await fetchAppTutorialSeenNative(uid);
        if (cancelled || seen) return;
        if (await readTutorialPageTipSeenNative(uid, tip)) return;
        const existing = await readTutorialLivePhaseNative();
        if (
          existing === "welcome" ||
          existing === "gamesPickup" ||
          existing === "horizon" ||
          existing === "games" ||
          existing === "gamesStats"
        ) {
          return;
        }
        const phaseForTip = PAGE_TO_PHASE[tip];
        if (existing === phaseForTip) return;
        await writeTutorialLivePhaseNative(phaseForTip);
        if (!cancelled) {
          setPhase(phaseForTip);
          if (tip === "rankings") setRankingsTipStep(0);
          if (tip === "profile") setProfileTipStep(0);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [fUser?.uid, page])
  );

  useEffect(() => {
    void syncPhaseFromStore();
  }, [syncPhaseFromStore]);

  useEffect(() => {
    return subscribeTutorialRestartNative(() => {
      setPhase(null);
      setHorizonFeatureStep(0);
      setTutorialHorizonSubstepNative(0);
      setTutorialLiveTrackNative(null);
    });
  }, []);

  useEffect(() => {
    return subscribeTutorialLivePhaseNative((p) => {
      setPhase(p && p !== "done" ? p : null);
      if (p === "horizon") {
        setHorizonFeatureStep(getTutorialHorizonSubstepNative());
      }
    });
  }, []);

  useEffect(() => {
    return subscribeTutorialHorizonSubstepNative(() => {
      setHorizonFeatureStep(getTutorialHorizonSubstepNative());
    });
  }, []);

  const setPhaseAndStore = useCallback(
    async (next: TutorialLivePhase | null) => {
      await writeTutorialLivePhaseNative(next);
      setPhase(next && next !== "done" ? next : null);
    },
    []
  );

  const finishAll = useCallback(() => {
    void markAppTutorialSeenNative(fUser?.uid ?? null);
    void writeTutorialLivePhaseNative(null);
    setTutorialLiveTrackNative(null);
    setTutorialWelcomeAudienceNative(null);
    void clearTutorialLivePickNative();
    setPhase(null);
    requestTutorialClearedNative();
  }, [fUser?.uid]);

  const dismissPageTip = useCallback(
    async (tip: TutorialPageTipId) => {
      await markTutorialPageTipSeenNative(fUser?.uid, tip);
      await writeTutorialLivePhaseNative(null);
      setPhase(null);
    },
    [fUser?.uid]
  );

  const advanceHorizonStep = useCallback(
    (next: number, prevHost: ReturnType<typeof horizonStepHost>) => {
      setHorizonFeatureStep(next);
      setTutorialHorizonSubstepNative(next);
      if (horizonStepHost(next) !== prevHost) {
        navigateNativeTabForHorizonStep(navigation, next);
      }
    },
    [navigation]
  );

  if (!phase) return null;

  const scoringRules = scoringRulesCopy(resolveScoringRulesLang(language));
  const scoringModal = (
    <Modal
      visible={scoringRulesOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setScoringRulesOpen(false)}
    >
      <View style={scoringStyles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => setScoringRulesOpen(false)}
          accessibilityRole="button"
          accessibilityLabel={m.common.close}
        />
        <View style={scoringStyles.sheet}>
          <View style={scoringStyles.header}>
            <Text style={scoringStyles.headerTitle}>SCORING RULES</Text>
            <Text style={scoringStyles.headerHint}>{scoringRules.headerHint}</Text>
          </View>
          <ScrollView
            style={scoringStyles.scroll}
            contentContainerStyle={scoringStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <PredictionScoringRulesBodyNative
              language={toNativeGamesLanguage(language)}
              league="nba"
            />
          </ScrollView>
          <View style={scoringStyles.footer}>
            <PredictOverlaySubmitButtonNative
              label={m.common.close}
              enabled
              onPress={() => setScoringRulesOpen(false)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (page === "rankings" && phase === "rankings") {
    const p = m.tutorial.practice;
    const step0 = rankingsTipStep === 0;
    return (
      <>
        <TutorialLiveCoachNative
          open
          title={step0 ? p.rankingsTitle : p.rankingsBoardsTitle}
          body={step0 ? p.rankingsBody : p.rankingsBoardsBody}
          skipLabel={m.tutorial.skip}
          nextLabel={step0 ? m.tutorial.next : m.common.ok}
          backLabel={step0 ? undefined : m.tutorial.back}
          altNextLabel={step0 ? p.rankingsScoreHelpCta : undefined}
          target={step0 ? null : "rankings-division"}
          allowInteractBehind={step0}
          {...skipConfirm}
          onSkip={() => void dismissPageTip("rankings")}
          onAltNext={
            step0 ? () => setScoringRulesOpen(true) : undefined
          }
          onBack={step0 ? undefined : () => setRankingsTipStep(0)}
          onNext={() => {
            if (step0) setRankingsTipStep(1);
            else void dismissPageTip("rankings");
          }}
        />
        {scoringModal}
      </>
    );
  }

  if (page === "results" && phase === "results") {
    return (
      <TutorialLiveCoachNative
        open
        title={m.tutorial.practice.resultsTitle}
        body={m.tutorial.practice.resultsBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.common.ok}
        allowInteractBehind
        {...skipConfirm}
        onSkip={() => void dismissPageTip("results")}
        onNext={() => void dismissPageTip("results")}
      />
    );
  }

  if (page === "groups" && phase === "groups") {
    return (
      <TutorialLiveCoachNative
        open
        title={m.tutorial.practice.groupsTitle}
        body={m.tutorial.practice.groupsBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.common.ok}
        target="groups-create"
        allowInteractBehind
        {...skipConfirm}
        onSkip={() => void dismissPageTip("groups")}
        onNext={() => void dismissPageTip("groups")}
      />
    );
  }

  if (page === "profile" && phase === "profile") {
    const p = m.tutorial.practice;
    const featureSteps = buildHorizonFeatureSteps(p);
    if (profileTipStep === 0) {
      return (
        <TutorialLiveCoachNative
          open
          title={p.profileTitle}
          body={p.profileBody}
          skipLabel={m.tutorial.skip}
          nextLabel={m.tutorial.next}
          allowInteractBehind
          {...skipConfirm}
          onSkip={() => void dismissPageTip("profile")}
          onNext={() => setProfileTipStep(1)}
        />
      );
    }
    const fi = Math.min(profileTipStep - 1, featureSteps.length - 1);
    const step = featureSteps[fi]!;
    const isLast = fi >= featureSteps.length - 1;
    return (
      <TutorialLiveCoachNative
        open
        title={step.title}
        body={step.body}
        skipLabel={m.tutorial.skip}
        nextLabel={isLast ? m.common.ok : m.tutorial.next}
        backLabel={m.tutorial.back}
        target={step.target}
        visual={step.visual}
        accentTone="feature"
        allowInteractBehind={!step.target}
        {...skipConfirm}
        onSkip={() => void dismissPageTip("profile")}
        onBack={() => setProfileTipStep(profileTipStep - 1)}
        onNext={() => {
          if (!isLast) setProfileTipStep(profileTipStep + 1);
          else void dismissPageTip("profile");
        }}
      />
    );
  }

  if (page === "groups" && phase === "horizon") {
    if (horizonStepHost(horizonFeatureStep) !== "groups") return null;
    const p = m.tutorial.practice;
    const featureSteps = buildHorizonFeatureSteps(p);
    const stepIndex = Math.min(horizonFeatureStep, featureSteps.length - 1);
    const step = featureSteps[stepIndex]!;
    const isLast = horizonFeatureStep >= featureSteps.length - 1;
    const featureProgress = horizonFeatureProgressLabel(
      getTutorialLiveTrackNative() === "features" ? null : null,
      p.horizonFeatureTag,
      horizonFeatureStep
    );

    return (
      <TutorialLiveCoachNative
        open
        title={step.title}
        body={step.body}
        skipLabel={m.tutorial.skip}
        nextLabel={isLast ? m.common.ok : m.tutorial.next}
        backLabel={m.tutorial.back}
        visual={step.visual}
        progressLabel={featureProgress}
        accentTone="feature"
        {...skipConfirm}
        onSkip={finishAll}
        onBack={() => {
          if (horizonFeatureStep > 0) {
            advanceHorizonStep(
              horizonFeatureStep - 1,
              horizonStepHost(horizonFeatureStep)
            );
            return;
          }
          void setPhaseAndStore("welcome");
          navigation.navigate("GamesTab", { screen: "GamesHome" });
        }}
        onNext={() => {
          if (!isLast) {
            advanceHorizonStep(
              horizonFeatureStep + 1,
              horizonStepHost(horizonFeatureStep)
            );
            return;
          }
          finishAll();
          navigation.navigate("GamesTab", { screen: "GamesHome" });
        }}
      />
    );
  }

  if (page === "profile" && phase === "horizon") {
    if (horizonStepHost(horizonFeatureStep) !== "profile") return null;
    const p = m.tutorial.practice;
    const featureSteps = buildHorizonFeatureSteps(p);
    const stepIndex = Math.min(horizonFeatureStep, featureSteps.length - 1);
    const step = featureSteps[stepIndex]!;
    const isLast = horizonFeatureStep >= featureSteps.length - 1;
    const featureProgress = horizonFeatureProgressLabel(
      null,
      p.horizonFeatureTag,
      horizonFeatureStep
    );

    return (
      <TutorialLiveCoachNative
        open
        title={step.title}
        body={step.body}
        skipLabel={m.tutorial.skip}
        nextLabel={isLast ? m.common.ok : m.tutorial.next}
        backLabel={m.tutorial.back}
        target={step.target}
        visual={step.visual}
        progressLabel={featureProgress}
        accentTone="feature"
        {...skipConfirm}
        onSkip={finishAll}
        onBack={() => {
          if (horizonFeatureStep > 0) {
            advanceHorizonStep(
              horizonFeatureStep - 1,
              horizonStepHost(horizonFeatureStep)
            );
            return;
          }
          void setPhaseAndStore("welcome");
          navigation.navigate("GamesTab", { screen: "GamesHome" });
        }}
        onNext={() => {
          if (!isLast) {
            advanceHorizonStep(
              horizonFeatureStep + 1,
              horizonStepHost(horizonFeatureStep)
            );
            return;
          }
          finishAll();
          navigation.navigate("GamesTab", { screen: "GamesHome" });
        }}
      />
    );
  }

  return null;
}

const scoringStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 24,
  },
  sheet: {
    maxHeight: "88%",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.22)",
    backgroundColor: "#05080c",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: MATCH_CARD_DISPLAY_FONT,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "400",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.96)",
  },
  headerHint: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
});
