/**
 * Web `SideMenuDrawer` 相当 — 左スライドドロワー
 */
import { ReactNode, useEffect, useRef } from "react";
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
import { BlurView } from "expo-blur";
import { nativeBlurViewExtraProps } from "./nativeBlurProps";
import CyberSideMenuPanelNative from "./CyberSideMenuPanelNative";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** パネル幅（mobile デフォルト 260–300） */
  panelWidth?: number;
};

const DEFAULT_PANEL_W = Math.min(
  300,
  Math.max(260, Math.round(Dimensions.get("window").width * 0.46))
);

export default function SideMenuDrawerNative({
  open,
  onClose,
  children,
  panelWidth = DEFAULT_PANEL_W,
}: Props) {
  const slide = useRef(new Animated.Value(-panelWidth - 24)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

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
          toValue: -16,
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
              intensity={Platform.OS === "ios" ? 12 : 8}
              tint="dark"
              {...nativeBlurViewExtraProps()}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <View style={styles.backdropDim} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[styles.panelWrap, { width: panelWidth, transform: [{ translateX: slide }] }]}
        >
          <CyberSideMenuPanelNative style={styles.panel}>
            <View style={styles.panelInner}>{children}</View>
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
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  panelWrap: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    paddingVertical: 16,
    paddingLeft: 0,
    paddingRight: 12,
  },
  panel: {
    flex: 1,
    maxHeight: Dimensions.get("window").height * 0.92,
  },
  panelInner: {
    flex: 1,
    paddingVertical: 8,
  },
});
