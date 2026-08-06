/**
 * Web `UnitEarnOverlay` 相当 — 中央カウントアップ → 金庫へ飛行加算。
 * カウントは Reanimated（UI スレッド）。JS の毎フレーム setState はしない。
 */
import {
  useEffect,
  useRef,
  type RefObject,
} from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
  type View as ViewType,
} from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { fonts } from "../../theme/tokens";
import {
  UNIT_EARN_ABSORB_MS,
  UNIT_EARN_COUNT_MS,
  UNIT_EARN_ENTER_MS,
  UNIT_EARN_EXIT_MS,
  UNIT_EARN_FLY_ARC,
  UNIT_EARN_FLY_MS,
  UNIT_EARN_HOLD_MS,
  UNIT_EARN_SCRIM_MS,
  UNIT_EARN_VAULT_COUNT_MS,
} from "../../../../../lib/units/unitEarnMotion";

type Props = {
  open: boolean;
  amount: number;
  label?: string | null;
  language?: "ja" | "en";
  vaultRef: RefObject<ViewType | null>;
  onAbsorb: () => void;
  onDone: () => void;
};

const EASE = Easing.bezier(0.25, 1, 0.5, 1);
/** easeUnitEarnCount 相当（worklet 用） */
const COUNT_EASE = Easing.bezier(0.22, 0.82, 0.28, 1);

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function formatCountWorklet(n: number): string {
  "worklet";
  const v = Math.max(0, Math.floor(n));
  const s = String(v);
  if (s.length <= 3) return s;
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const fromEnd = s.length - i;
    out += s[i];
    if (fromEnd > 1 && fromEnd % 3 === 1) out += ",";
  }
  return out;
}

export default function UnitEarnOverlayNative({
  open,
  amount,
  label = null,
  language = "ja",
  vaultRef,
  onAbsorb,
  onDone,
}: Props) {
  const isJa = language === "ja";
  const reduceMotion = useReducedMotion();
  const absorbedRef = useRef(false);
  const onAbsorbRef = useRef(onAbsorb);
  const onDoneRef = useRef(onDone);
  const safeAmount = Math.max(0, Math.floor(amount));

  onAbsorbRef.current = onAbsorb;
  onDoneRef.current = onDone;

  const scrim = useSharedValue(0);
  const payloadOpacity = useSharedValue(0);
  const payloadScale = useSharedValue(0.9);
  const payloadX = useSharedValue(0);
  const payloadY = useSharedValue(16);
  const labelOpacity = useSharedValue(1);
  const valueScale = useSharedValue(1);
  /** カウント進行 0→1（UI スレッド） */
  const countT = useSharedValue(0);
  const amountSV = useSharedValue(safeAmount);
  /** 1 のとき弧飛行（flyT / flyEnd* を使う） */
  const flying = useSharedValue(0);
  const flyT = useSharedValue(0);
  const flyEndX = useSharedValue(0);
  const flyEndY = useSharedValue(0);
  const flyEndScale = useSharedValue(0.35);

  const title = isJa ? "UNIT 獲得" : "UNITS EARNED";
  const sub =
    label?.trim() ||
    (isJa ? "プロフィールの残高に加算されます" : "Added to your vault");

  useEffect(() => {
    amountSV.value = safeAmount;
  }, [amountSV, safeAmount]);

  useEffect(() => {
    if (!open) {
      absorbedRef.current = false;
      scrim.value = 0;
      payloadOpacity.value = 0;
      payloadScale.value = 0.9;
      payloadX.value = 0;
      payloadY.value = 16;
      labelOpacity.value = 1;
      valueScale.value = 1;
      countT.value = 0;
      flying.value = 0;
      flyT.value = 0;
      return;
    }

    absorbedRef.current = false;
    let cancelled = false;
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    const runAbsorb = () => {
      if (absorbedRef.current) return;
      absorbedRef.current = true;
      onAbsorbRef.current();
    };

    const runDone = () => {
      if (!cancelled) onDoneRef.current();
    };

    const beginExit = () => {
      if (cancelled) return;
      scrim.value = withTiming(0, {
        duration: UNIT_EARN_EXIT_MS,
        easing: EASE,
      });
      payloadOpacity.value = withTiming(
        0,
        {
          duration: UNIT_EARN_EXIT_MS,
          easing: EASE,
        },
        (done) => {
          if (done) runOnJS(runDone)();
        }
      );
    };

    /** ヒット → 金庫カウントが見えてから退出 */
    const afterAbsorb = () => {
      runAbsorb();
      const holdMs = Math.max(
        UNIT_EARN_ABSORB_MS,
        Math.round(UNIT_EARN_VAULT_COUNT_MS * 0.55)
      );
      timers.push(setTimeout(beginExit, holdMs));
    };

    if (reduceMotion) {
      countT.value = 1;
      scrim.value = withTiming(1, { duration: 160 });
      payloadOpacity.value = 1;
      payloadScale.value = 1;
      payloadY.value = 0;
      timers.push(
        setTimeout(() => {
          runAbsorb();
          scrim.value = withTiming(0, { duration: UNIT_EARN_EXIT_MS });
          payloadOpacity.value = withTiming(
            0,
            { duration: UNIT_EARN_EXIT_MS },
            (finished) => {
              if (finished) runOnJS(runDone)();
            }
          );
        }, 360)
      );
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    countT.value = 0;
    scrim.value = withTiming(1, {
      duration: UNIT_EARN_SCRIM_MS,
      easing: EASE,
    });
    payloadOpacity.value = withTiming(1, {
      duration: UNIT_EARN_ENTER_MS,
      easing: EASE,
    });
    payloadScale.value = withTiming(1, {
      duration: UNIT_EARN_ENTER_MS,
      easing: EASE,
    });
    payloadY.value = withTiming(0, {
      duration: UNIT_EARN_ENTER_MS,
      easing: EASE,
    });

    const countDelayMs = UNIT_EARN_ENTER_MS + 16;
    const flyAtMs = countDelayMs + UNIT_EARN_COUNT_MS + UNIT_EARN_HOLD_MS;

    // カウントは入場完了後・UI スレッド（復帰直後の JS 負荷を避ける）
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        countT.value = 0;
        countT.value = withTiming(1, {
          duration: UNIT_EARN_COUNT_MS,
          easing: COUNT_EASE,
        });
        valueScale.value = 1.04;
        valueScale.value = withTiming(1, {
          duration: UNIT_EARN_COUNT_MS,
          easing: COUNT_EASE,
        });
      }, countDelayMs)
    );

    timers.push(
      setTimeout(() => {
        countT.value = 1;
        valueScale.value = 1;

        const { width: sw, height: sh } = Dimensions.get("window");
        const fromCx = sw / 2;
        const fromCy = sh / 2;

        const startFly = (toCx: number, toCy: number) => {
          labelOpacity.value = withTiming(0, {
            duration: Math.round(UNIT_EARN_FLY_MS * 0.3),
            easing: EASE,
          });
          scrim.value = withTiming(0.28, {
            duration: Math.round(UNIT_EARN_FLY_MS * 0.55),
            easing: EASE,
          });
          flyEndX.value = toCx - fromCx;
          flyEndY.value = toCy - fromCy;
          flyEndScale.value = 0.35;
          flyT.value = 0;
          flying.value = 1;
          flyT.value = withTiming(
            1,
            { duration: UNIT_EARN_FLY_MS, easing: Easing.out(Easing.cubic) },
            (finished) => {
              if (!finished) return;
              runOnJS(afterAbsorb)();
            }
          );
        };

        const vault = vaultRef.current;
        if (vault && typeof vault.measureInWindow === "function") {
          vault.measureInWindow((x, y, w, h) => {
            if (cancelled) return;
            startFly(x + w / 2, y + h / 2);
          });
        } else {
          startFly(sw - 48, 96);
        }
      }, flyAtMs)
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [
    amountSV,
    countT,
    flyEndScale,
    flyEndX,
    flyEndY,
    flyT,
    flying,
    labelOpacity,
    open,
    payloadOpacity,
    payloadScale,
    payloadX,
    payloadY,
    reduceMotion,
    safeAmount,
    scrim,
    valueScale,
    vaultRef,
  ]);

  const scrimStyle = useAnimatedStyle(() => ({
    // 裏の Pro 背景をほぼ隠して合成負荷を下げる
    opacity: scrim.value * 0.9,
  }));

  const payloadStyle = useAnimatedStyle(() => {
    if (flying.value < 0.5) {
      return {
        opacity: payloadOpacity.value,
        transform: [
          { translateX: payloadX.value },
          { translateY: payloadY.value },
          { scale: payloadScale.value },
        ],
      };
    }
    const t = flyT.value;
    const endX = flyEndX.value;
    const endY = flyEndY.value;
    const dist = Math.hypot(endX, endY) || 1;
    let nx = -endY / dist;
    let ny = endX / dist;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const lift = dist * UNIT_EARN_FLY_ARC;
    const cX = endX * 0.5 + nx * lift;
    const cY = endY * 0.5 + ny * lift;
    const s = 1 - t;
    const x = 2 * s * t * cX + t * t * endX;
    const y = 2 * s * t * cY + t * t * endY;
    const scale = 1 + (flyEndScale.value - 1) * t;
    return {
      opacity: payloadOpacity.value,
      transform: [
        { translateX: x },
        { translateY: y },
        { scale },
      ],
    };
  });

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const valueWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: valueScale.value }],
  }));

  const amountAnimProps = useAnimatedProps(() => {
    const n = Math.floor(amountSV.value * countT.value + 1e-6);
    return {
      text: `+${formatCountWorklet(n)}`,
      // iOS 向け
      value: `+${formatCountWorklet(n)}`,
    } as { text: string; value: string };
  });

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {
        if (!absorbedRef.current) {
          absorbedRef.current = true;
          onAbsorb();
        }
        onDone();
      }}
    >
      <View style={styles.root} pointerEvents="box-none">
        <Animated.View style={[styles.scrim, scrimStyle]} />
        <Animated.View style={[styles.payload, payloadStyle]}>
          <Animated.Text style={[styles.kicker, labelStyle]}>
            {title}
          </Animated.Text>
          <View style={styles.row}>
            <View style={styles.disc}>
              <View style={styles.discInner}>
                <Text style={styles.discU}>U</Text>
              </View>
            </View>
            <Animated.View style={valueWrapStyle}>
              <AnimatedTextInput
                editable={false}
                caretHidden
                underlineColorAndroid="transparent"
                pointerEvents="none"
                style={styles.valueInput}
                animatedProps={amountAnimProps}
                defaultValue="+0"
              />
            </Animated.View>
          </View>
          <Animated.Text style={[styles.sub, labelStyle]}>{sub}</Animated.Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  payload: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  kicker: {
    fontFamily: fonts.metricExtra,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2.2,
    color: "rgba(246,195,68,0.9)",
    textTransform: "uppercase",
  },
  row: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  disc: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#f6c344",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f6c344",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  discInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#d9a125",
    alignItems: "center",
    justifyContent: "center",
  },
  discU: {
    fontFamily: fonts.metricExtra,
    fontSize: 16,
    fontWeight: "800",
    color: "#241902",
  },
  valueInput: {
    fontFamily: fonts.metricExtra,
    fontSize: 48,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#ffe9a8",
    letterSpacing: -0.5,
    padding: 0,
    margin: 0,
    minWidth: 120,
    textAlign: "left",
    textShadowColor: "rgba(246,195,68,0.5)",
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  sub: {
    marginTop: 12,
    fontFamily: fonts.metric,
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
  },
});
