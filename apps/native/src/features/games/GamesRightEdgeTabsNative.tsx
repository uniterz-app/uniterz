/** Web `GamesRightEdgeTabs` 相当 — STANDING を STATS の上に積む */
import { useEffect, useRef } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { TUTORIAL_STATS_EDGE_FADE_MS } from "../../../../../lib/tutorial/tutorialMotion";
import { registerTutorialTarget } from "../tutorial/tutorialMeasureNative";
import ProfileMenuEdgeHandleNative from "../profile/ProfileMenuEdgeHandleNative";

const OPEN_DX = 40;
const CANCEL_DY = 24;
const FADE_EASE = Easing.bezier(0.37, 0, 0.18, 1);

type WinRect = { x: number; y: number; width: number; height: number };

function measureNode(node: View | null): Promise<WinRect | null> {
  return new Promise((resolve) => {
    if (!node) {
      resolve(null);
      return;
    }
    node.measureInWindow((x, y, width, height) => {
      if (width < 1 || height < 1) {
        resolve(null);
        return;
      }
      resolve({ x, y, width, height });
    });
  });
}

function unionRects(a: WinRect, b: WinRect): WinRect {
  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.width, b.x + b.width);
  const bottom = Math.max(a.y + a.height, b.y + b.height);
  return { x: left, y: top, width: right - left, height: bottom - top };
}

type Props = {
  onOpenStanding: () => void;
  onOpenStats: () => void;
  hidden?: boolean;
  fadeIn?: boolean;
  /** STANDING + STATS まとめてチュートリアル穴 */
  statsTutorialTargetId?: string;
};

export default function GamesRightEdgeTabsNative({
  onOpenStanding,
  onOpenStats,
  hidden = false,
  fadeIn = false,
  statsTutorialTargetId,
}: Props) {
  const op = useSharedValue(hidden ? 0 : 1);
  const standingWrapRef = useRef<View>(null);
  const statsWrapRef = useRef<View>(null);

  useEffect(() => {
    if (hidden) {
      op.value = 0;
      return;
    }
    if (fadeIn) {
      op.value = withTiming(1, {
        duration: TUTORIAL_STATS_EDGE_FADE_MS,
        easing: FADE_EASE,
      });
      return;
    }
    op.value = 1;
  }, [fadeIn, hidden, op]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: op.value,
  }));

  useEffect(() => {
    if (!statsTutorialTargetId || hidden) return;
    return registerTutorialTarget(statsTutorialTargetId, async () => {
      const [standing, stats] = await Promise.all([
        measureNode(standingWrapRef.current),
        measureNode(statsWrapRef.current),
      ]);
      if (standing && stats) return unionRects(standing, stats);
      return standing ?? stats;
    });
  }, [statsTutorialTargetId, hidden]);

  const onOpenStatsRef = useRef(onOpenStats);
  onOpenStatsRef.current = onOpenStats;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        g.dx < -12 && Math.abs(g.dy) < CANCEL_DY,
      onPanResponderRelease: (_e, g) => {
        if (g.dx < -OPEN_DX) onOpenStatsRef.current();
      },
    })
  ).current;

  if (hidden && !fadeIn) return null;

  return (
    <Animated.View
      style={[styles.fadeRoot, fadeStyle]}
      pointerEvents={hidden ? "none" : "box-none"}
    >
      <View
        style={styles.edgeStrip}
        {...pan.panHandlers}
        pointerEvents={hidden ? "none" : "box-only"}
      />
      <View style={styles.rail} pointerEvents={hidden ? "none" : "box-none"}>
        <View
          ref={standingWrapRef}
          style={styles.standing}
          collapsable={false}
          pointerEvents="box-none"
        >
          <ProfileMenuEdgeHandleNative
            inline
            label="STANDING"
            onOpen={onOpenStanding}
          />
        </View>
        <View ref={statsWrapRef} collapsable={false} pointerEvents="box-none">
          <ProfileMenuEdgeHandleNative
            inline
            label="STATS"
            onOpen={onOpenStats}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fadeRoot: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
    zIndex: 20,
    elevation: 4,
  },
  edgeStrip: {
    position: "absolute",
    right: 0,
    top: "62%",
    bottom: 0,
    width: 20,
    zIndex: 19,
  },
  rail: {
    position: "absolute",
    right: 0,
    top: "46%",
    overflow: "visible",
    zIndex: 22,
    elevation: 8,
  },
  standing: {
    position: "absolute",
    right: 0,
    bottom: "100%",
    marginBottom: 8,
    zIndex: 1,
  },
});
