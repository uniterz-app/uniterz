/**
 * Web `SideMenuDrawer` 相当 — 画面高さ全体の左スライドドロワー
 */
import { ReactNode, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { nativeBlurViewExtraProps } from "./nativeBlurProps";
import CyberSideMenuPanelNative from "./CyberSideMenuPanelNative";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** パネル幅（mobile デフォルト 268–320） */
  panelWidth?: number;
};

const DEFAULT_PANEL_W = Math.min(
  320,
  Math.max(268, Math.round(Dimensions.get("window").width * 0.52))
);

export default function SideMenuDrawerNative({
  open,
  onClose,
  children,
  panelWidth = DEFAULT_PANEL_W,
}: Props) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(-panelWidth - 24)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const contentPad = useMemo(
    () => ({
      paddingTop: insets.top + 12,
      paddingBottom: Math.max(insets.bottom, 12),
    }),
    [insets.top, insets.bottom]
  );

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          friction: 9,
          tension: 68,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: -panelWidth - 24,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open, slide, backdrop, panelWidth]);

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <BlurView
              intensity={Platform.OS === "ios" ? 14 : 10}
              tint="dark"
              {...nativeBlurViewExtraProps()}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <View style={styles.backdropDim} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.panelWrap,
            {
              width: panelWidth,
              transform: [{ translateX: slide }],
            },
          ]}
        >
          <CyberSideMenuPanelNative fillHeight edgeAttach style={styles.panel}>
            <View style={[styles.panelInner, contentPad]}>{children}</View>
          </CyberSideMenuPanelNative>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  panelWrap: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  panel: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  panelInner: {
    flex: 1,
  },
});
