/**
 * Web `ProfileMenuEdgeHandle` 相当 — 画面右端の縦ハンドル + エッジスワイプ。
 * プロフィールカード内バーガー廃止に伴うサイドメニュー入口。
 */
import { useEffect, useRef } from "react";
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { registerTutorialTarget } from "../tutorial/tutorialMeasureNative";
import { TUTORIAL_STATS_EDGE_FADE_MS } from "../../../../../lib/tutorial/tutorialMotion";

const OPEN_DX = 40;
const CANCEL_DY = 24;
const FADE_EASE = Easing.bezier(0.37, 0, 0.18, 1);

export default function ProfileMenuEdgeHandleNative({
  onOpen,
  unreadCount = 0,
  /** サイドメニュー開中は非表示（ドロワーと文字が被らないようにする） */
  hidden = false,
  /** 表示時にフェードイン（試合ページ着地など） */
  fadeIn = false,
  /** 縦書きラベル（既定 MENU） */
  label = "MENU",
  /** チュートリアル穴測定 */
  tutorialTargetId,
}: {
  onOpen: () => void;
  unreadCount?: number;
  hidden?: boolean;
  fadeIn?: boolean;
  label?: string;
  tutorialTargetId?: string;
}) {
  const handleRef = useRef<View>(null);
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

  useEffect(() => {
    if (!tutorialTargetId || hidden) return;
    return registerTutorialTarget(tutorialTargetId, () =>
      new Promise((resolve) => {
        const node = handleRef.current;
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
      })
    );
  }, [tutorialTargetId, hidden]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        g.dx < -12 && Math.abs(g.dy) < CANCEL_DY,
      onPanResponderRelease: (_e, g) => {
        if (g.dx < -OPEN_DX) onOpen();
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
      <Pressable
        style={styles.handle}
        onPress={onOpen}
        disabled={hidden}
        accessibilityRole="button"
        accessibilityLabel={label.toUpperCase()}
        accessibilityElementsHidden={hidden}
        importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
        hitSlop={8}
      >
        <View ref={handleRef} collapsable={false} style={styles.handleMeasure}>
        {label
          .toUpperCase()
          .split("")
          .map((ch, i) => (
            <Text key={`${ch}-${i}`} style={styles.letter}>
              {ch}
            </Text>
          ))}
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : String(unreadCount)}
            </Text>
          </View>
        ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fadeRoot: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
    zIndex: 20,
  },
  edgeStrip: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 14,
    zIndex: 19,
  },
  handle: {
    position: "absolute",
    right: 0,
    top: "46%",
    zIndex: 20,
    width: 19,
    paddingVertical: 9,
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: "rgba(250,204,21,0.55)",
    backgroundColor: "rgba(8,12,6,0.92)",
    shadowColor: "#facc15",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  handleMeasure: {
    alignItems: "center",
    gap: 3,
  },
  letter: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 8,
    color: "#facc15",
  },
  badge: {
    position: "absolute",
    top: -6,
    left: -6,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
});
