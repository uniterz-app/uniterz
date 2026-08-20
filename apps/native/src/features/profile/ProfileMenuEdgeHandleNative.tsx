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

const VARIANTS = {
  menu: {
    top: "46%" as const,
    borderColor: "rgba(250,204,21,0.55)",
    backgroundColor: "rgba(8,12,6,0.92)",
    letterColor: "#facc15",
    shadowColor: "#facc15",
    zIndex: 20,
    elevation: 4,
  },
  mark: {
    top: "36%" as const,
    borderColor: "rgba(0,245,255,0.52)",
    backgroundColor: "rgba(6,12,14,0.92)",
    letterColor: "#a5f3fc",
    shadowColor: "#00f5ff",
    zIndex: 22,
    elevation: 10,
  },
} as const;

export default function ProfileMenuEdgeHandleNative({
  onOpen,
  unreadCount = 0,
  adminUnreadCount = 0,
  /** サイドメニュー開中は非表示（ドロワーと文字が被らないようにする） */
  hidden = false,
  /** 表示時にフェードイン（試合ページ着地など） */
  fadeIn = false,
  /** 縦書きラベル（既定 MENU） */
  label = "MENU",
  /** menu=黄 / mark=シアン */
  variant = "menu",
  /** 縦位置（variant 既定を上書き） */
  top,
  /** チュートリアル穴測定 */
  tutorialTargetId,
  /** 親レール内（absolute 位置・フェード・スワイプなし） */
  inline = false,
}: {
  onOpen: () => void;
  unreadCount?: number;
  /** 管理の新着。赤 */
  adminUnreadCount?: number;
  hidden?: boolean;
  fadeIn?: boolean;
  label?: string;
  variant?: keyof typeof VARIANTS;
  top?: `${number}%` | number;
  tutorialTargetId?: string;
  inline?: boolean;
}) {
  const theme = VARIANTS[variant];
  const handleTop = top ?? theme.top;
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

  if (hidden && !fadeIn && !inline) return null;

  const enableEdgeSwipe = !inline && variant === "menu";

  const letters = (
        <View ref={handleRef} collapsable={false} style={styles.handleMeasure}>
        {label
          .toUpperCase()
          .split("")
          .map((ch, i) => (
            <Text
              key={`${ch}-${i}`}
              style={[styles.letter, { color: theme.letterColor }]}
            >
              {ch}
            </Text>
          ))}
        {adminUnreadCount > 0 ? (
          <View style={styles.badgeAdmin}>
            <Text style={styles.badgeAdminText}>
              {adminUnreadCount > 9 ? "9+" : String(adminUnreadCount)}
            </Text>
          </View>
        ) : null}
        {unreadCount > 0 ? (
          <View
            style={[
              styles.badge,
              adminUnreadCount > 0 ? styles.badgeLower : null,
            ]}
          >
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : String(unreadCount)}
            </Text>
          </View>
        ) : null}
        </View>
  );

  if (inline) {
    return (
      <Pressable
        style={[
          styles.handleInline,
          {
            borderColor: theme.borderColor,
            backgroundColor: theme.backgroundColor,
            shadowColor: theme.shadowColor,
          },
        ]}
        onPress={onOpen}
        disabled={hidden}
        accessibilityRole="button"
        accessibilityLabel={label.toUpperCase()}
        hitSlop={inline ? { left: 8, right: 0, top: 0, bottom: 0 } : 8}
      >
        {letters}
      </Pressable>
    );
  }

  return (
    <Animated.View
      style={[
        styles.fadeRoot,
        fadeStyle,
        { zIndex: theme.zIndex, elevation: theme.elevation },
      ]}
      pointerEvents={hidden ? "none" : "box-none"}
    >
      {enableEdgeSwipe ? (
        <View
          style={styles.edgeStrip}
          {...pan.panHandlers}
          pointerEvents={hidden ? "none" : "box-only"}
        />
      ) : null}
      <Pressable
        style={[
          styles.handle,
          {
            top: handleTop,
            borderColor: theme.borderColor,
            backgroundColor: theme.backgroundColor,
            shadowColor: theme.shadowColor,
            zIndex: theme.zIndex,
            elevation: theme.elevation,
          },
        ]}
        onPress={onOpen}
        disabled={hidden}
        accessibilityRole="button"
        accessibilityLabel={label.toUpperCase()}
        accessibilityElementsHidden={hidden}
        importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
        hitSlop={8}
      >
        {letters}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fadeRoot: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible",
  },
  edgeStrip: {
    position: "absolute",
    right: 0,
    top: "42%",
    bottom: 0,
    width: 14,
    zIndex: 19,
  },
  handle: {
    position: "absolute",
    right: 0,
    width: 19,
    paddingVertical: 9,
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRightWidth: 0,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    overflow: "visible",
  },
  handleInline: {
    width: 19,
    paddingVertical: 9,
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRightWidth: 0,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    overflow: "visible",
  },
  handleMeasure: {
    alignItems: "center",
    gap: 3,
    overflow: "visible",
  },
  letter: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 8,
  },
  badge: {
    position: "absolute",
    top: -6,
    left: -6,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 3,
    borderRadius: 999,
    backgroundColor: "#00F5FF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  badgeLower: {
    top: 10,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#050508",
    fontVariant: ["tabular-nums"],
  },
  badgeAdmin: {
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
    zIndex: 3,
  },
  badgeAdminText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
});
