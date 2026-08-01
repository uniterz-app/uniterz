/**
 * Web `ProfileMenuEdgeHandle` 相当 — 画面左端の縦ハンドル + エッジスワイプ。
 * プロフィールカード内バーガー廃止に伴うサイドメニュー入口。
 */
import { useRef } from "react";
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

const OPEN_DX = 40;
const CANCEL_DY = 24;

export default function ProfileMenuEdgeHandleNative({
  onOpen,
  unreadCount = 0,
}: {
  onOpen: () => void;
  unreadCount?: number;
}) {
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        g.dx > 12 && Math.abs(g.dy) < CANCEL_DY,
      onPanResponderRelease: (_e, g) => {
        if (g.dx > OPEN_DX) onOpen();
      },
    })
  ).current;

  return (
    <>
      <View
        style={styles.edgeStrip}
        {...pan.panHandlers}
        pointerEvents="box-only"
      />
      <Pressable
        style={styles.handle}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel="メニュー"
        hitSlop={8}
      >
        {"MENU".split("").map((ch, i) => (
          <Text key={i} style={styles.letter}>
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
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  edgeStrip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
    zIndex: 19,
  },
  handle: {
    position: "absolute",
    left: 0,
    top: "46%",
    zIndex: 20,
    width: 19,
    paddingVertical: 9,
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: "rgba(250,204,21,0.55)",
    backgroundColor: "rgba(8,12,6,0.92)",
    shadowColor: "#facc15",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
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
    right: -6,
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
