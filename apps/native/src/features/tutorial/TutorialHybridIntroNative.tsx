/**
 * Web `TutorialHybridIntro` 相当（パターンC・短い3枚スライド）
 */
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOutLeft,
  useReducedMotion,
} from "react-native-reanimated";
import { fonts } from "../../theme/tokens";
import { t as i18nT } from "../../../../../lib/i18n/t";
import type { Language } from "../../../../../lib/i18n/language";
import {
  TUTORIAL_CYAN,
  TUTORIAL_CTA_DELAY_MS,
  TUTORIAL_SLIDE_DURATION_MS,
} from "../../../../../lib/tutorial/tutorialMotion";
import TutorialRichBodyNative from "./TutorialRichBodyNative";

export type TutorialHybridFinishReason = "skip" | "complete";

type Props = {
  open: boolean;
  language?: Language;
  onFinish: (reason: TutorialHybridFinishReason) => void;
};

export default function TutorialHybridIntroNative({
  open,
  language = "ja",
  onFinish,
}: Props) {
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const m = i18nT(language);

  const slides = useMemo(
    () => [
      {
        id: "welcome",
        kicker: m.tutorial.hybrid.welcomeKicker,
        title: m.tutorial.hybrid.welcomeTitle,
        body: m.tutorial.hybrid.welcomeBody,
      },
      {
        id: "flow",
        kicker: m.tutorial.hybrid.flowKicker,
        title: m.tutorial.hybrid.flowTitle,
        body: m.tutorial.hybrid.flowBody,
      },
      {
        id: "start",
        kicker: m.tutorial.hybrid.startKicker,
        title: m.tutorial.hybrid.startTitle,
        body: m.tutorial.hybrid.startBody,
      },
    ],
    [m]
  );

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const slide = slides[step];
  const isLast = step >= slides.length - 1;
  const cardWidth = Math.min(width - 32, 420);

  return (
    <Modal
      visible={open}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={() => onFinish("skip")}
      statusBarTranslucent
    >
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable
          style={styles.backdrop}
          onPress={() => onFinish("skip")}
          accessibilityLabel={m.tutorial.skip}
        />
        <Animated.View
          entering={reduceMotion ? undefined : FadeIn.duration(280)}
          style={[styles.card, { width: cardWidth }]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.kickerTop}>Tutorial</Text>
            <Pressable onPress={() => onFinish("skip")} hitSlop={8}>
              <Text style={styles.skip}>{m.tutorial.skip}</Text>
            </Pressable>
          </View>

          <Animated.View
            key={slide.id}
            entering={
              reduceMotion
                ? undefined
                : FadeInRight.duration(TUTORIAL_SLIDE_DURATION_MS)
            }
            exiting={
              reduceMotion
                ? undefined
                : FadeOutLeft.duration(TUTORIAL_SLIDE_DURATION_MS)
            }
          >
            <Text style={styles.kicker}>{slide.kicker}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <TutorialRichBodyNative text={slide.body} style={styles.body} />
          </Animated.View>

          <View style={styles.dots}>
            {slides.map((s, i) => (
              <Pressable
                key={s.id}
                onPress={() => setStep(i)}
                style={[
                  styles.dot,
                  i === step ? styles.dotOn : null,
                  { width: i === step ? 16 : 6 },
                ]}
              />
            ))}
          </View>

          <Animated.View
            entering={
              reduceMotion
                ? undefined
                : FadeIn.delay(TUTORIAL_CTA_DELAY_MS).duration(220)
            }
            style={styles.ctaRow}
          >
            {step > 0 ? (
              <Pressable
                onPress={() => setStep((s) => Math.max(0, s - 1))}
                style={styles.backBtn}
              >
                <Text style={styles.backText}>{m.tutorial.back}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                if (isLast) onFinish("complete");
                else setStep((s) => s + 1);
              }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextText}>
                {isLast ? m.tutorial.seeGames : m.tutorial.next}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 28,
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  card: {
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(7,16,24,0.96)",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  kickerTop: {
    fontFamily: fonts.metric,
    fontSize: 10,
    letterSpacing: 2,
    color: "rgba(103,232,249,0.7)",
    textTransform: "uppercase",
  },
  skip: {
    fontFamily: fonts.metric,
    fontSize: 11,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
  },
  kicker: {
    fontFamily: fonts.metricExtra,
    fontSize: 10,
    letterSpacing: 2,
    color: TUTORIAL_CYAN,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.65)",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  dotOn: {
    backgroundColor: TUTORIAL_CYAN,
  },
  ctaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  backText: {
    fontFamily: fonts.metric,
    fontSize: 12,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
  },
  nextBtn: {
    flex: 1,
    backgroundColor: TUTORIAL_CYAN,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: {
    fontFamily: fonts.metricExtra,
    fontSize: 13,
    letterSpacing: 1.5,
    color: "#050508",
    textTransform: "uppercase",
  },
});
