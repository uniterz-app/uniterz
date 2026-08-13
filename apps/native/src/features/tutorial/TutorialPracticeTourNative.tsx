/**
 * Web `TutorialPracticeTour` 相当 — NBA モックで流れを体験
 */
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn, FadeOut, useReducedMotion } from "react-native-reanimated";
import { fonts } from "../../theme/tokens";
import { t as i18nT } from "../../../../../lib/i18n/t";
import type { Language } from "../../../../../lib/i18n/language";
import {
  gradeTutorialNbaPick,
  TUTORIAL_NBA_MOCK_GAME,
  type TutorialGrade,
  type TutorialPredictPick,
  type TutorialPracticePhase,
} from "../../../../../lib/tutorial/tutorialNbaMock";
import { TUTORIAL_CYAN } from "../../../../../lib/tutorial/tutorialMotion";
import TutorialRichBodyNative from "./TutorialRichBodyNative";

type Props = {
  open: boolean;
  language?: Language;
  onFinish: () => void;
};

const game = TUTORIAL_NBA_MOCK_GAME;

export default function TutorialPracticeTourNative({
  open,
  language = "ja",
  onFinish,
}: Props) {
  const reduceMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const m = i18nT(language);
  const en = language === "en";

  const [phase, setPhase] = useState<TutorialPracticePhase>("welcome");
  const [winner, setWinner] = useState<"home" | "away" | null>(null);
  const [scoreHome, setScoreHome] = useState("108");
  const [scoreAway, setScoreAway] = useState("110");
  const [grade, setGrade] = useState<TutorialGrade | null>(null);
  const [pick, setPick] = useState<TutorialPredictPick | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase("welcome");
    setWinner(null);
    setScoreHome("108");
    setScoreAway("110");
    setGrade(null);
    setPick(null);
    setFormError(null);
  }, [open]);

  useEffect(() => {
    if (phase !== "resolving" || !pick) return;
    const id = setTimeout(() => {
      setGrade(gradeTutorialNbaPick(game, pick));
      setPhase("result");
    }, reduceMotion ? 200 : 1200);
    return () => clearTimeout(id);
  }, [phase, pick, reduceMotion]);

  const homeLabel = en ? game.home.nameEn : game.home.nameJa;
  const awayLabel = en ? game.away.nameEn : game.away.nameJa;

  const tabLabels = useMemo(
    () => ({
      games: m.tutorial.practice.tabGames,
      result: m.tutorial.practice.tabResult,
      rankings: m.tutorial.practice.tabRankings,
      groups: m.tutorial.practice.tabGroups,
      profile: m.tutorial.practice.tabProfile,
    }),
    [m]
  );

  function submitPredict() {
    const sh = Number(scoreHome);
    const sa = Number(scoreAway);
    if (!winner) {
      setFormError(m.tutorial.practice.errNeedWinner);
      return;
    }
    if (!Number.isFinite(sh) || !Number.isFinite(sa) || sh < 0 || sa < 0) {
      setFormError(m.tutorial.practice.errNeedScore);
      return;
    }
    if (winner === "home" && sh <= sa) {
      setFormError(m.tutorial.practice.errHomeWinScore);
      return;
    }
    if (winner === "away" && sa <= sh) {
      setFormError(m.tutorial.practice.errAwayWinScore);
      return;
    }
    setFormError(null);
    const next: TutorialPredictPick = {
      winner,
      scoreHome: sh,
      scoreAway: sa,
    };
    setPick(next);
    setPhase("resolving");
  }

  const title = (() => {
    const p = m.tutorial.practice;
    switch (phase) {
      case "welcome":
        return p.welcomeTitle;
      case "tapCard":
        return p.tapTitle;
      case "predictGuide":
        return p.guideTitle;
      case "predictInput":
        return p.inputTitle;
      case "resolving":
        return p.resolvingTitle;
      case "result":
        return grade?.outcome === "hit" ? p.resultHitTitle : p.resultMissTitle;
      case "rankings":
        return p.rankingsTitle;
      case "groups":
        return p.groupsTitle;
      case "profile":
        return p.profileTitle;
      case "done":
        return p.doneTitle;
      default:
        return "";
    }
  })();

  const body = (() => {
    const p = m.tutorial.practice;
    switch (phase) {
      case "welcome":
        return p.welcomeBody;
      case "tapCard":
        return p.tapBody;
      case "predictGuide":
        return p.guideBody;
      case "predictInput":
        return p.inputBody;
      case "resolving":
        return p.resolvingBody;
      case "result":
        return grade?.outcome === "hit"
          ? p.resultHitBody
              .replace("{pts}", String(grade.points))
              .replace("{bonus}", grade.scoreExact ? p.resultScoreBonus : "")
          : p.resultMissBody;
      case "rankings":
        return p.rankingsBody;
      case "groups":
        return p.groupsBody;
      case "profile":
        return p.profileBody;
      case "done":
        return p.doneBody;
      default:
        return "";
    }
  })();

  const activeTab =
    phase === "result" || phase === "resolving"
      ? "result"
      : phase === "rankings"
        ? "rankings"
        : phase === "groups"
          ? "groups"
          : phase === "profile" || phase === "done"
            ? "profile"
            : "games";

  return (
    <Modal
      visible={open}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={onFinish}
      statusBarTranslucent
    >
      <View style={[styles.root, { maxHeight: height }]} accessibilityViewIsModal>
        <View style={styles.bg} pointerEvents="none" />
        <View style={styles.header}>
          <Text style={styles.headerKicker}>Practice · NBA</Text>
          <Pressable onPress={onFinish} hitSlop={8}>
            <Text style={styles.skip}>{m.tutorial.skip}</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            key={phase}
            entering={reduceMotion ? undefined : FadeIn.duration(220)}
            exiting={reduceMotion ? undefined : FadeOut.duration(160)}
          >
            <View style={styles.mock}>
              <View style={styles.tabs}>
                {(
                  ["games", "result", "rankings", "groups", "profile"] as const
                ).map((id) => {
                  const on = id === activeTab;
                  return (
                    <View
                      key={id}
                      style={[styles.tab, on ? styles.tabOn : null]}
                    >
                      <Text style={[styles.tabText, on ? styles.tabTextOn : null]}>
                        {tabLabels[id]}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {(phase === "welcome" ||
                phase === "tapCard" ||
                phase === "predictGuide" ||
                phase === "predictInput") && (
                <>
                  <Pressable
                    disabled={phase !== "tapCard"}
                    onPress={() => {
                      if (phase === "tapCard") setPhase("predictGuide");
                    }}
                    style={[
                      styles.card,
                      phase === "tapCard" ? styles.cardPulse : null,
                    ]}
                  >
                    <Text style={styles.cardKicker}>NBA</Text>
                    <View style={styles.vsRow}>
                      <View style={styles.side}>
                        <Text style={styles.abbr}>{game.away.abbr}</Text>
                        <Text style={styles.sideName}>{awayLabel}</Text>
                      </View>
                      <Text style={styles.at}>@</Text>
                      <View style={styles.side}>
                        <Text style={styles.abbr}>{game.home.abbr}</Text>
                        <Text style={styles.sideName}>{homeLabel}</Text>
                      </View>
                    </View>
                    {phase === "tapCard" ? (
                      <Text style={styles.tapCue}>{m.tutorial.pulseHint}</Text>
                    ) : null}
                  </Pressable>

                  {(phase === "predictGuide" || phase === "predictInput") && (
                    <View style={styles.form}>
                      <Text style={styles.cardKicker}>YOUR PICK</Text>
                      <View style={styles.winnerRow}>
                        {(
                          [
                            ["away", game.away.abbr] as const,
                            ["home", game.home.abbr] as const,
                          ]
                        ).map(([side, abbr]) => {
                          const on = winner === side;
                          return (
                            <Pressable
                              key={side}
                              disabled={phase !== "predictInput"}
                              onPress={() => setWinner(side)}
                              style={[
                                styles.winnerBtn,
                                on ? styles.winnerOn : null,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.winnerText,
                                  on ? styles.winnerTextOn : null,
                                ]}
                              >
                                {abbr}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      <View style={styles.scoreRow}>
                        <TextInput
                          editable={phase === "predictInput"}
                          keyboardType="number-pad"
                          value={scoreAway}
                          onChangeText={setScoreAway}
                          style={styles.scoreInput}
                        />
                        <Text style={styles.at}>—</Text>
                        <TextInput
                          editable={phase === "predictInput"}
                          keyboardType="number-pad"
                          value={scoreHome}
                          onChangeText={setScoreHome}
                          style={styles.scoreInput}
                        />
                      </View>
                      {formError ? (
                        <Text style={styles.err}>{formError}</Text>
                      ) : null}
                    </View>
                  )}
                </>
              )}

              {(phase === "resolving" || phase === "result") && (
                <View style={styles.form}>
                  {phase === "resolving" ? (
                    <Text style={styles.resolving}>
                      {m.tutorial.practice.resolvingSpin}
                    </Text>
                  ) : (
                    <>
                      <View style={styles.resultHead}>
                        <Text style={styles.cardKicker}>FINAL</Text>
                        <View
                          style={[
                            styles.badge,
                            grade?.outcome === "hit"
                              ? styles.badgeHit
                              : styles.badgeMiss,
                          ]}
                        >
                          <Text style={styles.badgeText}>
                            {grade?.outcome === "hit"
                              ? `HIT +${grade.points}pt`
                              : "MISS"}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.finalScore}>
                        {game.away.abbr} {game.finalAway} — {game.finalHome}{" "}
                        {game.home.abbr}
                      </Text>
                      {pick ? (
                        <Text style={styles.pickLine}>
                          {m.tutorial.practice.yourPickLabel}: {pick.scoreAway}–
                          {pick.scoreHome}
                        </Text>
                      ) : null}
                    </>
                  )}
                </View>
              )}

              {phase === "rankings" && (
                <View style={styles.form}>
                  {[
                    { rank: 1, name: "ace_shot", pts: "2,480", me: false },
                    {
                      rank: 2,
                      name: "you",
                      pts: grade?.outcome === "hit" ? "2,322" : "2,310",
                      me: true,
                    },
                    { rank: 3, name: "court_king", pts: "2,105", me: false },
                  ].map((r) => (
                    <View
                      key={r.rank}
                      style={[styles.rankRow, r.me ? styles.rankMe : null]}
                    >
                      <Text style={styles.rankNum}>{r.rank}</Text>
                      <Text style={styles.rankName}>{r.name}</Text>
                      <Text style={styles.rankPts}>{r.pts}</Text>
                    </View>
                  ))}
                </View>
              )}

              {phase === "groups" && (
                <View style={styles.form}>
                  <Text style={styles.cardKicker}>MY GROUP</Text>
                  <Text style={styles.groupTitle}>
                    {m.tutorial.practice.groupsMockName}
                  </Text>
                  <Text style={styles.pickLine}>
                    {m.tutorial.practice.groupsMockMeta}
                  </Text>
                </View>
              )}

              {(phase === "profile" || phase === "done") && (
                <View style={[styles.form, styles.profileBox]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>U</Text>
                  </View>
                  <Text style={styles.groupTitle}>@you</Text>
                  <Text style={styles.pickLine}>
                    {m.tutorial.practice.profileMockStats}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.title}>{title}</Text>
            <TutorialRichBodyNative text={body} style={styles.body} />
          </Animated.View>
        </ScrollView>

        <View style={styles.ctaWrap}>
          {phase === "welcome" ? (
            <Pressable style={styles.cta} onPress={() => setPhase("tapCard")}>
              <Text style={styles.ctaText}>{m.tutorial.next}</Text>
            </Pressable>
          ) : null}
          {phase === "tapCard" ? (
            <Text style={styles.hint}>{m.tutorial.practice.tapHint}</Text>
          ) : null}
          {phase === "predictGuide" ? (
            <Pressable
              style={styles.cta}
              onPress={() => setPhase("predictInput")}
            >
              <Text style={styles.ctaText}>
                {m.tutorial.practice.startPredict}
              </Text>
            </Pressable>
          ) : null}
          {phase === "predictInput" ? (
            <Pressable style={styles.cta} onPress={submitPredict}>
              <Text style={styles.ctaText}>
                {m.tutorial.practice.submitPredict}
              </Text>
            </Pressable>
          ) : null}
          {phase === "result" ? (
            <Pressable style={styles.cta} onPress={() => setPhase("rankings")}>
              <Text style={styles.ctaText}>{m.tutorial.next}</Text>
            </Pressable>
          ) : null}
          {phase === "rankings" ? (
            <Pressable style={styles.cta} onPress={() => setPhase("groups")}>
              <Text style={styles.ctaText}>{m.tutorial.next}</Text>
            </Pressable>
          ) : null}
          {phase === "groups" ? (
            <Pressable style={styles.cta} onPress={() => setPhase("profile")}>
              <Text style={styles.ctaText}>{m.tutorial.next}</Text>
            </Pressable>
          ) : null}
          {phase === "profile" ? (
            <Pressable style={styles.cta} onPress={() => setPhase("done")}>
              <Text style={styles.ctaText}>{m.tutorial.next}</Text>
            </Pressable>
          ) : null}
          {phase === "done" ? (
            <Pressable style={styles.cta} onPress={onFinish}>
              <Text style={styles.ctaText}>
                {m.tutorial.practice.finishCta}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#03060c" },
  bg: { ...StyleSheet.absoluteFillObject, backgroundColor: "#050810" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 8,
  },
  headerKicker: {
    fontFamily: fonts.metric,
    fontSize: 10,
    letterSpacing: 2,
    color: "rgba(103,232,249,0.7)",
    textTransform: "uppercase",
  },
  skip: {
    fontFamily: fonts.metric,
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16 },
  mock: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    backgroundColor: "rgba(6,10,18,0.9)",
    padding: 12,
    marginBottom: 14,
  },
  tabs: { flexDirection: "row", gap: 4, marginBottom: 10 },
  tab: { flex: 1, paddingVertical: 6, alignItems: "center" },
  tabOn: { backgroundColor: TUTORIAL_CYAN },
  tabText: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.4)" },
  tabTextOn: { color: "#050508" },
  card: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    padding: 12,
    marginBottom: 10,
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  cardPulse: {
    borderColor: TUTORIAL_CYAN,
    shadowColor: TUTORIAL_CYAN,
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  cardKicker: {
    fontFamily: fonts.metric,
    fontSize: 9,
    letterSpacing: 1.5,
    color: "rgba(103,232,249,0.7)",
    marginBottom: 8,
  },
  vsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  side: { flex: 1, alignItems: "center" },
  abbr: { color: "#fff", fontWeight: "800", fontSize: 14 },
  sideName: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 },
  at: { color: "rgba(255,255,255,0.35)", fontWeight: "700" },
  tapCue: {
    marginTop: 10,
    textAlign: "center",
    color: TUTORIAL_CYAN,
    fontFamily: fonts.metricExtra,
    fontSize: 10,
    letterSpacing: 1,
  },
  form: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  winnerRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  winnerBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  winnerOn: { backgroundColor: TUTORIAL_CYAN, borderColor: TUTORIAL_CYAN },
  winnerText: { color: "rgba(255,255,255,0.6)", fontWeight: "800" },
  winnerTextOn: { color: "#050508" },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  scoreInput: {
    width: 56,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    color: "#fff",
    textAlign: "center",
    paddingVertical: 8,
    fontWeight: "700",
  },
  err: { marginTop: 8, color: "#fda4af", textAlign: "center", fontSize: 11 },
  resolving: {
    textAlign: "center",
    paddingVertical: 28,
    color: TUTORIAL_CYAN,
    fontFamily: fonts.metricExtra,
    letterSpacing: 2,
  },
  resultHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  badgeHit: { backgroundColor: "#34d399" },
  badgeMiss: { backgroundColor: "#fb7185" },
  badgeText: { fontSize: 10, fontWeight: "900", color: "#052e1a" },
  finalScore: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    textAlign: "center",
  },
  pickLine: {
    marginTop: 8,
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  rankMe: {
    backgroundColor: "rgba(0,245,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
  },
  rankNum: { width: 20, color: TUTORIAL_CYAN, fontWeight: "800" },
  rankName: { flex: 1, color: "#fff", fontSize: 13 },
  rankPts: { color: "rgba(255,255,255,0.55)", fontSize: 12 },
  groupTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  profileBox: { alignItems: "center", paddingVertical: 18 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "rgba(0,245,255,0.1)",
  },
  avatarText: { color: "#a5f3fc", fontWeight: "800", fontSize: 18 },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  body: { color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 20 },
  ctaWrap: { paddingHorizontal: 16, paddingBottom: 28, paddingTop: 8 },
  cta: {
    backgroundColor: TUTORIAL_CYAN,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: {
    fontFamily: fonts.metricExtra,
    color: "#050508",
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  hint: {
    textAlign: "center",
    color: "rgba(165,243,252,0.75)",
    fontSize: 12,
  },
});
