/**
 * Web `.match-list-cyber-card` の角切り枠（Skia ストローク + 角マスク）
 */
import { type ReactNode, useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, { type AnimatedStyle } from "react-native-reanimated";
import { Canvas, Path, Skia } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";
import { GAMES_PAGE_BG_MASK } from "./gamesPageBackgroundTokens";
import {
  chamferedRectPathD,
  MATCH_LIST_CYBER_CUT_DENSE,
} from "./matchListCyberClipPath";

type Props = {
  children: ReactNode;
  cut?: number;
  predicted?: boolean;
  style?: StyleProp<ViewStyle>;
  shellStyle?: StyleProp<ViewStyle>;
  /** 入場時の枠線フェード（Web `match-list-cyber-card` border reveal） */
  strokeOpacityStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
};

function makeSkiaPath(width: number, height: number, cut: number) {
  const d = chamferedRectPathD(width, height, cut);
  if (!d) return null;
  const path = Skia.Path.MakeFromSVGString(d);
  return path;
}

function CornerCut({ style }: { style: ViewStyle }) {
  return (
    <View
      pointerEvents="none"
      style={[styles.cornerCut, style]}
    />
  );
}

export default function MatchListCyberClipNative({
  children,
  cut = MATCH_LIST_CYBER_CUT_DENSE,
  predicted = false,
  style,
  shellStyle,
  strokeOpacityStyle,
}: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const borderColor = predicted
    ? "rgba(148,163,184,0.46)"
    : "rgba(0,245,255,0.16)";

  const skiaPath = useMemo(
    () => (size.w > 0 && size.h > 0 ? makeSkiaPath(size.w, size.h, cut) : null),
    [size.w, size.h, cut]
  );

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) < 0.5 && Math.abs(height - size.h) < 0.5) return;
    setSize({ w: width, h: height });
  }

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      <View
        style={[
          styles.shell,
          predicted && styles.shellPredicted,
          shellStyle,
        ]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(9,13,20,0.95)",
            "rgba(6,9,15,0.93)",
            "rgba(4,7,12,0.91)",
          ]}
          locations={[0, 0.52, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View pointerEvents="none" style={styles.insetTopHighlight} />
        <View style={styles.content}>{children}</View>
        <CornerCut style={{ top: -1, left: -1 }} />
        <CornerCut style={{ top: -1, right: -1 }} />
        <CornerCut style={{ bottom: -1, left: -1 }} />
        <CornerCut style={{ bottom: -1, right: -1 }} />
      </View>
      {skiaPath ? (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, strokeOpacityStyle]}
        >
          <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Path
              path={skiaPath}
              style="stroke"
              strokeWidth={1}
              color={borderColor}
            />
          </Canvas>
        </Animated.View>
      ) : null}
    </View>
  );
}

const CUT = MATCH_LIST_CYBER_CUT_DENSE;
const styles = StyleSheet.create({
  root: {
    position: "relative",
    width: "100%",
    overflow: "visible",
  },
  shell: {
    position: "relative",
    overflow: "hidden",
    minHeight: 148,
    shadowColor: "#00f5ff",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 22,
    elevation: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.03)",
  },
  shellPredicted: {
    shadowColor: "rgba(148,163,184,0.35)",
    shadowOpacity: 0.06,
  },
  content: {
    position: "relative",
    zIndex: 1,
    flex: 1,
    minHeight: 0,
  },
  insetTopHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,245,255,0.12)",
    zIndex: 2,
  },
  cornerCut: {
    position: "absolute",
    width: CUT * 1.45,
    height: CUT * 1.45,
    backgroundColor: GAMES_PAGE_BG_MASK,
    transform: [{ rotate: "45deg" }],
    zIndex: 3,
  },
});
