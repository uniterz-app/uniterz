/**
 * Web `SquadBattleIntroOverlay` 相当。
 * アンバー〜レッドの戦闘警告系フルスクリーン。スキャンラインなし。
 */
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  useReducedMotion,
} from "react-native-reanimated";
import { fonts } from "../../theme/tokens";
import {
  SQUAD_BATTLE_INTRO_TAGLINE,
  SQUAD_BATTLE_SEASON_PHASES,
} from "../../../../../lib/squads/squadBattleMock";
import { SQUAD_BATTLE_INTRO_NOTICES } from "../../../../../lib/squads/squadBattleUiCopy";
import {
  SQUAD_INTRO_BG_FADE_MS,
  SQUAD_INTRO_ENTER_DELAY_MS,
  SQUAD_INTRO_ENTER_DURATION_MS,
  SQUAD_INTRO_KICKER_DELAY_MS,
  SQUAD_INTRO_LOOP_DELAY_MS,
  SQUAD_INTRO_PHASE_DURATION_MS,
  SQUAD_INTRO_RULE_DELAY_MS,
  SQUAD_INTRO_TITLE_DELAY_MS,
  SQUAD_INTRO_TITLE_DURATION_MS,
  squadIntroPhaseDelayMs,
} from "../../../../../lib/squads/squadBattleIntroMotion";
import { markSquadBattleIntroSeenNative } from "./squadBattleIntroSeenNative";

const AMBER = "#FBBF24";
const TITLE = "#FFF7E6";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SquadBattleIntroOverlayNative({
  open,
  onClose,
}: Props) {
  const reduceMotion = useReducedMotion();

  async function handleDismiss() {
    await markSquadBattleIntroSeenNative();
    onClose();
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType={reduceMotion ? "none" : "fade"}
      onRequestClose={() => {
        void handleDismiss();
      }}
      statusBarTranslucent
    >
      <View style={styles.root} accessibilityViewIsModal>
        <View style={styles.bgBase} pointerEvents="none" />
        <LinearGradient
          colors={[
            "rgba(180,40,20,0.38)",
            "transparent",
            "rgba(251,191,36,0.10)",
          ]}
          locations={[0, 0.55, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        <Animated.View
          entering={
            reduceMotion
              ? undefined
              : FadeIn.duration(200).delay(200)
          }
          style={styles.closeWrap}
        >
          <Pressable
            onPress={() => {
              void handleDismiss();
            }}
            accessibilityRole="button"
            accessibilityLabel="スキップ"
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && styles.closeBtnPressed,
            ]}
            hitSlop={8}
          >
            <MaterialCommunityIcons
              name="close"
              size={16}
              color="rgba(254,243,199,0.9)"
            />
          </Pressable>
        </Animated.View>

        <View style={styles.body}>
          <Animated.Text
            style={styles.kicker}
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.duration(280).delay(SQUAD_INTRO_KICKER_DELAY_MS)
            }
          >
            Season cycle · every 2 months
          </Animated.Text>

          <Animated.View
            style={styles.titleWrap}
            entering={
              reduceMotion
                ? undefined
                : FadeIn.duration(SQUAD_INTRO_TITLE_DURATION_MS).delay(
                    SQUAD_INTRO_TITLE_DELAY_MS
                  )
            }
          >
            {!reduceMotion ? (
              <>
                <Text
                  style={[styles.titleGhost, styles.titleGhostRose]}
                  pointerEvents="none"
                >
                  Squad Battle
                </Text>
                <Text
                  style={[styles.titleGhost, styles.titleGhostAmber]}
                  pointerEvents="none"
                >
                  Squad Battle
                </Text>
              </>
            ) : null}
            <Text style={styles.title} accessibilityRole="header">
              Squad Battle
            </Text>
          </Animated.View>

          <Animated.Text
            style={styles.rule}
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.duration(280).delay(SQUAD_INTRO_RULE_DELAY_MS)
            }
          >
            {SQUAD_BATTLE_INTRO_TAGLINE}
          </Animated.Text>

          <View style={styles.timeline}>
            <View style={styles.rail} pointerEvents="none" />
            {SQUAD_BATTLE_SEASON_PHASES.map((phase, i) => (
              <Animated.View
                key={phase.key}
                style={styles.phaseRow}
                entering={
                  reduceMotion
                    ? undefined
                    : FadeInLeft.duration(SQUAD_INTRO_PHASE_DURATION_MS).delay(
                        squadIntroPhaseDelayMs(i)
                      )
                }
              >
                <View style={styles.dot} />
                <View style={styles.phaseCard}>
                  <View style={styles.phaseHeader}>
                    <Text style={styles.phaseLabel}>{phase.label}</Text>
                    <Text style={styles.phasePeriod}>{phase.period}</Text>
                  </View>
                  <Text style={styles.phaseDesc}>{phase.desc}</Text>
                </View>
              </Animated.View>
            ))}

            <Animated.View
              style={styles.loopRow}
              entering={
                reduceMotion
                  ? undefined
                  : FadeIn.duration(280).delay(SQUAD_INTRO_LOOP_DELAY_MS)
              }
            >
              <MaterialCommunityIcons
                name="refresh"
                size={12}
                color="rgba(253,230,138,0.5)"
              />
              <Text style={styles.loopText}>Loop · next season</Text>
            </Animated.View>

            {/* 告知・禁止事項（Web と同文言） */}
            <View style={styles.noticesBox}>
              {SQUAD_BATTLE_INTRO_NOTICES.map((line) => (
                <View key={line} style={styles.noticeRow}>
                  <View style={styles.noticeDot} />
                  <Text style={styles.noticeText}>{line}</Text>
                </View>
              ))}
            </View>
          </View>

          <Animated.View
            style={styles.enterWrap}
            entering={
              reduceMotion
                ? undefined
                : FadeInDown.duration(SQUAD_INTRO_ENTER_DURATION_MS).delay(
                    SQUAD_INTRO_ENTER_DELAY_MS
                  )
            }
          >
            <Pressable
              onPress={() => {
                void handleDismiss();
              }}
              accessibilityRole="button"
              accessibilityLabel="Enter"
              style={({ pressed }) => [
                styles.enterBtn,
                pressed && styles.enterBtnPressed,
              ]}
            >
              <Text style={styles.enterText}>Enter</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Modal の fade が BG フェード相当（SQUAD_INTRO_BG_FADE_MS） */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.srOnly}
        >
          <Text>
            スクワッドバトルの説明。3〜5人で平均スコアを競う。募集約1〜2週間、バトル約1ヶ月、結果確定後に上位へ Unit 配布。
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0402",
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0a0402",
  },
  closeWrap: {
    position: "absolute",
    top: 48,
    right: 12,
    zIndex: 20,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  closeBtnPressed: {
    borderColor: "rgba(252,211,77,0.55)",
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  kicker: {
    marginBottom: 12,
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3.2,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.7)",
    textAlign: "center",
  },
  titleWrap: {
    position: "relative",
    marginBottom: 8,
    alignItems: "center",
  },
  titleGhost: {
    position: "absolute",
    fontFamily: fonts.metricExtra,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  titleGhostRose: {
    color: "rgba(244,63,94,0.5)",
    transform: [{ translateX: -2 }, { translateY: 1 }],
  },
  titleGhostAmber: {
    color: "rgba(252,211,77,0.4)",
    transform: [{ translateX: 2 }, { translateY: -1 }],
  },
  title: {
    fontFamily: fonts.metricExtra,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: TITLE,
    textAlign: "center",
    textShadowColor: "rgba(251,191,36,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  rule: {
    marginBottom: 24,
    maxWidth: 360,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  timeline: {
    position: "relative",
    width: "100%",
    maxWidth: 360,
  },
  rail: {
    position: "absolute",
    left: 11,
    top: 12,
    bottom: 36,
    width: 1,
    backgroundColor: "rgba(251,191,36,0.28)",
  },
  phaseRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    paddingLeft: 4,
    marginBottom: 10,
  },
  dot: {
    marginTop: 14,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.8)",
    backgroundColor: "rgba(251,191,36,0.9)",
    shadowColor: AMBER,
    shadowOpacity: 0.65,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  phaseCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.28)",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  phaseLabel: {
    fontFamily: fonts.metricExtra,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(254,243,199,1)",
  },
  phasePeriod: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.55)",
    flexShrink: 0,
  },
  phaseDesc: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.55)",
  },
  loopRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loopText: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.5)",
  },
  noticesBox: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  noticeDot: {
    marginTop: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(251,191,36,0.7)",
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.5)",
  },
  enterWrap: {
    marginTop: 32,
    width: "100%",
    maxWidth: 360,
  },
  enterBtn: {
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.55)",
    backgroundColor: "rgba(251,191,36,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: AMBER,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  enterBtnPressed: {
    backgroundColor: "rgba(251,191,36,0.3)",
  },
  enterText: {
    fontFamily: fonts.metricExtra,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 4,
    textTransform: "uppercase",
    color: "rgba(255,251,235,1)",
    textShadowColor: "rgba(251,191,36,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});

/** Modal fade 時間の参照用（Web SQUAD_INTRO_BG_FADE_MS 相当） */
export const SQUAD_BATTLE_INTRO_MODAL_FADE_MS = SQUAD_INTRO_BG_FADE_MS;
