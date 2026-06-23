/**
 * 予想オーバーレイ右上 — バーガー＋編集（左）／共有（下）フライアウト
 */
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import PredictOverlayCornerButtonNative from "./PredictOverlayCornerButtonNative";

const flyoutEasing = Easing.out(Easing.cubic);

type Props = {
  showEdit?: boolean;
  showShare?: boolean;
  onEdit?: () => void;
  onShare?: () => void;
  sharing?: boolean;
  menuLabel: string;
  editLabel: string;
  shareLabel: string;
};

export default function PredictOverlayActionFabNative({
  showEdit = false,
  showShare = false,
  onEdit,
  onShare,
  sharing = false,
  menuLabel,
  editLabel,
  shareLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!showEdit && !showShare) {
      setOpen(false);
    }
  }, [showEdit, showShare]);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: 300,
      easing: flyoutEasing,
    });
  }, [open, progress]);

  const shareFlyoutStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -8 }],
  }));

  const editFlyoutStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: (1 - progress.value) * 8 }],
  }));

  if (!showEdit && !showShare) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <View style={styles.cluster}>
        {showEdit ? (
          <Animated.View
            style={[styles.editFlyout, editFlyoutStyle]}
            pointerEvents={open ? "auto" : "none"}
          >
            <PredictOverlayCornerButtonNative
              embedded
              icon="edit"
              onPress={() => {
                setOpen(false);
                onEdit?.();
              }}
              accessibilityLabel={editLabel}
            />
          </Animated.View>
        ) : null}
        <PredictOverlayCornerButtonNative
          embedded
          icon="menu"
          open={open}
          onPress={() => setOpen((v) => !v)}
          accessibilityLabel={menuLabel}
          accessibilityState={{ expanded: open }}
        />
        {showShare ? (
          <Animated.View
            style={[styles.shareFlyout, shareFlyoutStyle]}
            pointerEvents={open ? "auto" : "none"}
          >
            <PredictOverlayCornerButtonNative
              embedded
              icon="share"
              onPress={() => {
                setOpen(false);
                onShare?.();
              }}
              accessibilityLabel={shareLabel}
            />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 30,
  },
  cluster: {
    position: "relative",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  shareFlyout: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 6,
    alignItems: "center",
    zIndex: 35,
  },
  editFlyout: {
    position: "absolute",
    right: "100%",
    top: "50%",
    marginRight: 6,
    marginTop: -14,
    zIndex: 35,
  },
});
