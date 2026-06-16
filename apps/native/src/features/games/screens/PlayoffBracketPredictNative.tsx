import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import MobilePageShell from "../../profile/mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { colors } from "../../../theme/tokens";
import { BlocksPulseLoader } from "../../../components/BlocksPulseLoader";
import {
  isPlayoffBracketComplete,
  type SeriesId,
} from "../../../../../../lib/playoff-bracket";
import {
  createPlayoffBracket,
  loadPlayoffBracket,
  type BracketState,
} from "../../../../../../lib/playoff-bracket-firestore";
import { getSeriesTeams, pruneBracket } from "../../../../../../lib/playoff-bracket-utils";
import {
  buildRound1Series,
  getCurrentPlayoffSeason,
  getPlayoffBracketConfig,
  isPlayoffBracketSubmissionPastDeadline,
} from "../../../../../../lib/playoff-bracket-config";
import { getPlayoffBracketStrings } from "../../../../../../lib/i18n/playoffBracket";
import PlayoffBracketBoardNative from "../playoffBracket/PlayoffBracketBoardNative";

type Team = { code: string; seed: number };

/** Web `PlayoffBracketPredict` 相当：インタラクティブなブラケット予想 */
export default function PlayoffBracketPredictNative() {
  const navigation = useNavigation();
  const { fUser } = useFirebaseUser();
  const season = getCurrentPlayoffSeason();
  const language: "ja" | "en" = "ja";
  const t = getPlayoffBracketStrings(language);

  const [bracket, setBracket] = useState<BracketState>({});
  const [showR2E1, setShowR2E1] = useState(false);
  const [showR2E2, setShowR2E2] = useState(false);
  const [showR2W1, setShowR2W1] = useState(false);
  const [showR2W2, setShowR2W2] = useState(false);
  const [showCFE, setShowCFE] = useState(false);
  const [showCFW, setShowCFW] = useState(false);
  const [showFinals, setShowFinals] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(true);
  const [savedBracketLoading, setSavedBracketLoading] = useState(true);
  const [hasSubmittedBracket, setHasSubmittedBracket] = useState(false);
  const [canEditBracket, setCanEditBracket] = useState(true);
  const [deadlineNowMs, setDeadlineNowMs] = useState(() => Date.now());

  const isComplete = isPlayoffBracketComplete(bracket as Parameters<typeof isPlayoffBracketComplete>[0]);
  const config = useMemo(() => getPlayoffBracketConfig(season), [season]);
  const allowSubmission = config.allowSubmission !== false;

  useEffect(() => {
    const id = setInterval(() => setDeadlineNowMs(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);

  const pastDeadline = isPlayoffBracketSubmissionPastDeadline(season, deadlineNowMs);
  const submitButtonDisabled = !allowSubmission || pastDeadline;
  const submitButtonLabel = !allowSubmission
    ? t.submitLockedSeedingShort
    : pastDeadline
      ? t.submitBracketClosedShort
      : t.submitBracketCta;

  const { eastR1, westR1 } = useMemo(() => {
    const built = buildRound1Series(config);
    return {
      eastR1: built.eastR1.map((series, index) => ({
        id: `R1_E${index + 1}` as SeriesId,
        teams: series as [Team, Team],
      })),
      westR1: built.westR1.map((series, index) => ({
        id: `R1_W${index + 1}` as SeriesId,
        teams: series as [Team, Team],
      })),
    };
  }, [config]);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedBracket() {
      if (!fUser?.uid) {
        setBracket({});
        setHasSubmittedBracket(false);
        setCanEditBracket(true);
        setSavedBracketLoading(false);
        return;
      }

      try {
        setSavedBracketLoading(true);
        const data = await loadPlayoffBracket(fUser.uid, season);
        if (cancelled) return;

        if (!data) {
          setBracket({});
          setHasSubmittedBracket(false);
          setCanEditBracket(true);
          return;
        }

        setBracket(data.bracket ?? {});
        setHasSubmittedBracket(true);
        setCanEditBracket(true);
      } catch {
        if (!cancelled) {
          setBracket({});
          setHasSubmittedBracket(false);
        }
      } finally {
        if (!cancelled) setSavedBracketLoading(false);
      }
    }

    void loadSavedBracket();
    return () => {
      cancelled = true;
    };
  }, [season, fUser?.uid]);

  const teamMap = useMemo(() => {
    const map: Record<string, Team> = {};
    [...eastR1, ...westR1].forEach((series) => {
      series.teams.forEach((team) => {
        map[team.code] = team;
      });
    });
    return map;
  }, [eastR1, westR1]);

  const eastR2Top = getSeriesTeams(bracket, teamMap, "R1_E1", "R1_E2");
  const eastR2Bottom = getSeriesTeams(bracket, teamMap, "R1_E3", "R1_E4");
  const westR2Top = getSeriesTeams(bracket, teamMap, "R1_W1", "R1_W2");
  const westR2Bottom = getSeriesTeams(bracket, teamMap, "R1_W3", "R1_W4");
  const eastCF = getSeriesTeams(bracket, teamMap, "R2_E1", "R2_E2");
  const westCF = getSeriesTeams(bracket, teamMap, "R2_W1", "R2_W2");
  const finalsTeams = getSeriesTeams(bracket, teamMap, "CF_E", "CF_W");

  useEffect(() => {
    setShowR2E1(Boolean(eastR2Top));
  }, [eastR2Top]);
  useEffect(() => {
    setShowR2E2(Boolean(eastR2Bottom));
  }, [eastR2Bottom]);
  useEffect(() => {
    setShowR2W1(Boolean(westR2Top));
  }, [westR2Top]);
  useEffect(() => {
    setShowR2W2(Boolean(westR2Bottom));
  }, [westR2Bottom]);
  useEffect(() => {
    setShowCFE(Boolean(eastCF));
  }, [eastCF]);
  useEffect(() => {
    setShowCFW(Boolean(westCF));
  }, [westCF]);
  useEffect(() => {
    setShowFinals(Boolean(finalsTeams));
  }, [finalsTeams]);

  function setWinner(seriesId: SeriesId, team: string) {
    if (!canEditBracket) return;
    setBracket((prev) => {
      const currentWinner = prev[seriesId]?.winner;
      const nextWinner = currentWinner === team ? undefined : team;
      return pruneBracket({
        ...prev,
        [seriesId]: { ...prev[seriesId], winner: nextWinner },
      });
    });
  }

  function setGames(seriesId: SeriesId, games: number) {
    if (!canEditBracket) return;
    setBracket((prev) => {
      const currentGames = prev[seriesId]?.games;
      return {
        ...prev,
        [seriesId]: {
          ...prev[seriesId],
          games: currentGames === games ? undefined : games,
        },
      };
    });
  }

  function handleOpenSubmitModal() {
    if (!fUser?.uid) {
      Alert.alert("", t.alertLoginRequired);
      return;
    }
    if (!allowSubmission) {
      Alert.alert("", t.alertSubmissionLockedBySeeding);
      return;
    }
    if (pastDeadline) {
      Alert.alert("", t.alertSubmissionClosedByDeadline);
      return;
    }

    Alert.alert(t.submitTitle, `${t.submitLine1}\n${t.submitLine2}\n${t.submitLine3}`, [
      { text: t.submitCancel, style: "cancel" },
      { text: t.submitConfirm, onPress: () => void handleSubmit() },
    ]);
  }

  async function handleSubmit() {
    if (!fUser?.uid || !isComplete || submitting) return;
    if (!allowSubmission) {
      Alert.alert("", t.alertSubmissionLockedBySeeding);
      return;
    }
    if (pastDeadline) {
      Alert.alert("", t.alertSubmissionClosedByDeadline);
      return;
    }

    try {
      setSubmitting(true);
      const existing = await loadPlayoffBracket(fUser.uid, season);
      if (existing) {
        Alert.alert("", t.alertAlreadySubmitted);
        setHasSubmittedBracket(true);
        return;
      }

      await createPlayoffBracket(fUser.uid, bracket, season);
      setHasSubmittedBracket(true);
      Alert.alert("", t.alertSubmittedOk);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t.alertSubmitFailed;
      Alert.alert("", msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!fUser?.uid) {
    return (
      <MobilePageShell title="Playoff Bracket" onClose={() => navigation.goBack()}>
        <Text style={styles.muted}>{t.alertLoginRequired}</Text>
      </MobilePageShell>
    );
  }

  return (
    <MobilePageShell title="Playoff Bracket" onClose={() => navigation.goBack()}>
      {pastDeadline && !hasSubmittedBracket ? (
        <Text style={styles.deadlineBanner}>{t.bannerSubmissionClosedByDeadline}</Text>
      ) : null}

      {savedBracketLoading ? (
        <View style={styles.loading}>
          <BlocksPulseLoader pixelScale={0.9} />
        </View>
      ) : (
        <ScrollView style={styles.fill} showsVerticalScrollIndicator={false}>
          <PlayoffBracketBoardNative
            bracket={bracket}
            eastR1={eastR1}
            westR1={westR1}
            eastR2Top={eastR2Top}
            eastR2Bottom={eastR2Bottom}
            westR2Top={westR2Top}
            westR2Bottom={westR2Bottom}
            eastCF={eastCF}
            westCF={westCF}
            finalsTeams={finalsTeams}
            showR2E1={showR2E1}
            showR2E2={showR2E2}
            showR2W1={showR2W1}
            showR2W2={showR2W2}
            showCFE={showCFE}
            showCFW={showCFW}
            showFinals={showFinals}
            isComplete={isComplete}
            hasSubmittedBracket={hasSubmittedBracket}
            savedBracketLoading={savedBracketLoading}
            canEditBracket={canEditBracket}
            submitButtonDisabled={submitButtonDisabled}
            submitButtonLabel={submitButtonLabel}
            hideSubmitButton={pastDeadline && !hasSubmittedBracket}
            onSelectWinner={setWinner}
            onSelectGames={setGames}
            onSubmitClick={handleOpenSubmitModal}
          />
        </ScrollView>
      )}

      <Modal visible={rulesOpen} transparent animationType="fade" onRequestClose={() => setRulesOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>{t.rulesTitle}</Text>
            <ScrollView style={styles.rulesScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.rulesHeading}>{t.scoringHeading}</Text>
              <Text style={styles.rulesLine}>{t.scoringR1}</Text>
              <Text style={styles.rulesLine}>{t.scoringR2}</Text>
              <Text style={styles.rulesLine}>{t.scoringCF}</Text>
              <Text style={styles.rulesLine}>{t.scoringFinals}</Text>
              <Text style={styles.rulesLine}>{t.scoringGamesBonus}</Text>
              <Text style={styles.rulesHeading}>{t.importantHeading}</Text>
              <Text style={styles.rulesLine}>{t.importantGamesBonus}</Text>
              <Text style={styles.rulesLine}>{t.importantWrongWinner}</Text>
              <Text style={styles.rulesLine}>{t.importantInvalidAdvance}</Text>
              <Text style={styles.rulesHeading}>{t.totalHeading}</Text>
              <Text style={styles.rulesLine}>{t.totalMax}</Text>
              <Text style={styles.rulesHeading}>{t.afterSubmitHeading}</Text>
              <Text style={styles.rulesLine}>{t.afterSubmitNoEdit}</Text>
            </ScrollView>
            <Pressable style={styles.rulesBtn} onPress={() => setRulesOpen(false)}>
              <Text style={styles.rulesBtnText}>{t.rulesConfirmButton}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  loading: { alignItems: "center", paddingVertical: 32 },
  muted: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    padding: 24,
  },
  deadlineBanner: {
    color: "rgba(252, 211, 77, 0.9)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    padding: 20,
  },
  rulesCard: {
    maxHeight: "85%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#0a1118",
    padding: 20,
    gap: 12,
  },
  rulesTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  rulesScroll: { maxHeight: 360 },
  rulesHeading: {
    color: "rgba(103,232,249,0.9)",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  rulesLine: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  rulesBtn: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: "#163a5f",
    paddingVertical: 14,
    alignItems: "center",
  },
  rulesBtnText: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
});
