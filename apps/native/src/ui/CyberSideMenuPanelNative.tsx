import { ReactNode } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CYBER_SIDE_MENU_PANEL } from "./cyberSideMenuNative";
import CyberSideMenuFrameNative from "./CyberSideMenuFrameNative";

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

/** Web `cyber-side-menu-panel` + `CyberSideMenuFrame` ラッパー */
export default function CyberSideMenuPanelNative({ children, style }: Props) {
  return (
    <View style={[styles.panel, style]}>
      <LinearGradient
        colors={[...CYBER_SIDE_MENU_PANEL.backgroundGradient]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <CyberSideMenuFrameNative />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    borderWidth: 1,
    borderColor: CYBER_SIDE_MENU_PANEL.borderColor,
    borderRadius: 0,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: CYBER_SIDE_MENU_PANEL.shadowColor,
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.05,
        shadowRadius: 32,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  content: {
    flex: 1,
    zIndex: 10,
  },
});
