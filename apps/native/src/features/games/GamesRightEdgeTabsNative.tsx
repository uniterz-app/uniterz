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
import ProfileMenuEdgeHandleNative from "../profile/ProfileMenuEdgeHandleNative";

const OPEN_DX = 40;
const CANCEL_DY = 24;
const FADE_EASE = Easing.bezier(0.37, 0, 0.18, 1);

type Props = {
  onOpenStanding: () => void;
  onOpenStats: () => void;
  hidden?: boolean;
  fadeIn?: boolean;
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
        <View style={styles.standing} pointerEvents="box-none">
          <ProfileMenuEdgeHandleNative
            inline
            label="STANDING"
            onOpen={onOpenStanding}
          />
        </View>
        <ProfileMenuEdgeHandleNative
          inline
          label="STATS"
          onOpen={onOpenStats}
          tutorialTargetId={statsTutorialTargetId}
        />
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
    width: 14,
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
