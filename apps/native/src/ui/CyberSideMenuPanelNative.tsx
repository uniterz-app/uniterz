import { ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CYBER_SIDE_MENU_PANEL } from "./cyberSideMenuNative";
import CyberSideMenuFrameNative from "./CyberSideMenuFrameNative";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * true: 親の高さいっぱいに伸ばす（従来）
   * false/省略: 中身の高さに合わせる（ランキング等の短いドロワー向け。flex:1 だと親高さ未定で 0 になる）
   */
  fillHeight?: boolean;
  /** 端密着 — 四方枠の浮きカード感を消し、内側辺に影を落とす */
  edgeAttach?: boolean;
  /** edgeAttach 時の画面端（プロフィールは right） */
  edgeSide?: "left" | "right";
};

/** Web `cyber-side-menu-panel` + `CyberSideMenuFrame` ラッパー */
export default function CyberSideMenuPanelNative({
  children,
  style,
  fillHeight = false,
  edgeAttach = false,
  edgeSide = "left",
}: Props) {
  const attachRight = edgeAttach && edgeSide === "right";
  return (
    <View
      style={[
        styles.panel,
        fillHeight && styles.panelFill,
        edgeAttach && styles.edgeAttach,
        style,
      ]}
    >
      {edgeAttach ? (
        <LinearGradient
          colors={[...CYBER_SIDE_MENU_PANEL.backgroundFadeHorizontal]}
          locations={[...CYBER_SIDE_MENU_PANEL.backgroundFadeHorizontalLocations]}
          start={attachRight ? { x: 1, y: 0.5 } : { x: 0, y: 0.5 }}
          end={attachRight ? { x: 0, y: 0.5 } : { x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <LinearGradient
          colors={[...CYBER_SIDE_MENU_PANEL.backgroundGradient]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <View
        style={[styles.frameWrap, edgeAttach && styles.frameWrapFade]}
        pointerEvents="none"
      >
        <CyberSideMenuFrameNative />
      </View>
      {edgeAttach ? (
        <LinearGradient
          colors={[...CYBER_SIDE_MENU_PANEL.edgeLineColors]}
          locations={[...CYBER_SIDE_MENU_PANEL.edgeLineLocations]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            styles.edgeLine,
            attachRight ? { left: 0, right: undefined } : { right: 0 },
          ]}
          pointerEvents="none"
        />
      ) : null}
      <View style={[styles.content, fillHeight && styles.contentFill]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
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
  edgeAttach: {
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  frameWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  frameWrapFade: {
    opacity: 0.7,
  },
  edgeLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1.5,
    zIndex: 3,
    shadowColor: "#00F5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  panelFill: {
    flex: 1,
  },
  content: {
    zIndex: 10,
  },
  contentFill: {
    flex: 1,
  },
});
