import { useEffect, useMemo, useRef } from "react";
import { Animated, Image, PanResponder, StyleSheet, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LAB_BG, type LabSceneProps } from "../lab3dKitNative";

const CARDS = {
  "pro-overall": { front: require("../assets/pro-overall-1.webp"), back: require("../assets/back-pro-1.webp"), label: "PRO 月間 1 位" },
  "pickup-overall": { front: require("../assets/pickup-overall-1.webp"), back: require("../assets/back-pickup-1.webp"), label: "PICK UP 月間 1 位" },
  "pro-scorer": { front: require("../assets/pro-scorer-1.webp"), back: require("../assets/back-pro-1.webp"), label: "PRO 得点王" },
  "pickup-upset": { front: require("../assets/pickup-upset-1.webp"), back: require("../assets/back-pickup-1.webp"), label: "PICK UP 番狂わせ王" },
} as const;
type CardKey = keyof typeof CARDS;
export const LAB_HOLO_CARDS: [string, string][] = [
  ["pro-overall", "PRO 1位"],
  ["pickup-overall", "PICK UP 1位"],
  ["pro-scorer", "得点王"],
  ["pickup-upset", "番狂わせ"],
];

const MAX = 24;
const HOLO = ["#e0309a", "#e0b43a", "#3ad68a", "#2ac8e0", "#7a5ce0", "#e0309a", "#e0b43a", "#3ad68a", "#2ac8e0", "#7a5ce0", "#e0309a"] as const;

/** 3D LAB: スマホを傾ける代わりにドラッグで傾け、光が動く。タップで裏返す */
export default function Lab3dHoloCardNative({ onHud, option }: LabSceneProps) {
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.8, 340);
  const card = CARDS[(option as CardKey) in CARDS ? (option as CardKey) : "pro-overall"];
  const tilt = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const flip = useRef(new Animated.Value(0)).current;
  const st = useRef({ touching: false, flipped: false, x: 0, y: 0, t0: 0, moved: 0 });

  useEffect(() => {
    onHud({ big: card.label, sub: "ドラッグで傾けると光が流れる（実機ならスマホを傾ける）。タップで裏返す" });
  }, [card, onHud]);

  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const loop = () => {
      const s = st.current;
      if (!s.touching) {
        const t = (Date.now() - start) / 1000;
        s.x += (Math.sin(t * 0.7) * 9 - s.x) * 0.04;
        s.y += (Math.cos(t * 0.5) * 6 - s.y) * 0.04;
        tilt.setValue({ x: s.x, y: s.y });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tilt]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          const s = st.current;
          s.touching = true;
          s.t0 = Date.now();
          s.moved = 0;
        },
        onPanResponderMove: (_, g) => {
          const s = st.current;
          s.moved = Math.max(s.moved, Math.hypot(g.dx, g.dy));
          s.x = Math.max(-MAX, Math.min(MAX, g.dx * 0.18));
          s.y = Math.max(-MAX, Math.min(MAX, -g.dy * 0.18));
          tilt.setValue({ x: s.x, y: s.y });
        },
        onPanResponderRelease: () => {
          const s = st.current;
          s.touching = false;
          if (s.moved < 8 && Date.now() - s.t0 < 350) {
            s.flipped = !s.flipped;
            Animated.spring(flip, { toValue: s.flipped ? 1 : 0, useNativeDriver: false, friction: 7, tension: 40 }).start();
          }
        },
      }),
    [tilt, flip]
  );

  const rotY = Animated.add(tilt.x, Animated.multiply(flip, 180));
  const deg = (v: Animated.AnimatedInterpolation<number> | Animated.Value | Animated.AnimatedAddition<number>) =>
    v.interpolate({ inputRange: [-720, 720], outputRange: ["-720deg", "720deg"] });
  const front = { transform: [{ perspective: 900 }, { rotateX: deg(tilt.y) }, { rotateY: deg(rotY) }] };
  const back = { transform: [{ perspective: 900 }, { rotateX: deg(tilt.y) }, { rotateY: deg(Animated.add(rotY, 180)) }] };
  const holoShift = { transform: [{ translateX: Animated.multiply(tilt.x, -size / 18) }, { translateY: Animated.multiply(tilt.y, size / 22) }] };
  const glareShift = { transform: [{ translateX: Animated.multiply(tilt.x, size / 12) }, { translateY: Animated.multiply(tilt.y, -size / 14) }, { rotate: "25deg" }] };

  return (
    <View style={styles.fill} {...pan.panHandlers}>
      <Animated.View style={[styles.face, { width: size, height: size }, front]}>
        <Image source={card.front} style={styles.img} />
        <Animated.View style={[styles.layer, { width: size * 1.8, height: size * 1.8, left: -size * 0.4, top: -size * 0.4, mixBlendMode: "overlay", opacity: 0.75 }, holoShift]} pointerEvents="none">
          <LinearGradient colors={HOLO} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={[styles.layer, { width: size * 0.5, height: size * 2.2, left: size * 0.25, top: -size * 0.6, mixBlendMode: "overlay" }, glareShift]} pointerEvents="none">
          <LinearGradient colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.95)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.face, { width: size, height: size }, back]}>
        <Image source={card.back} style={styles.img} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, backgroundColor: LAB_BG, alignItems: "center", justifyContent: "center" },
  face: { position: "absolute", backfaceVisibility: "hidden", overflow: "hidden", backgroundColor: LAB_BG },
  img: { width: "100%", height: "100%" },
  layer: { position: "absolute" },
});
