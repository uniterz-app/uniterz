/**
 * 寸法計測 + 暗いベース塗り。子に SVG 装飾・オーバーレイを載せる。
 */
import { useCallback, useState, type ReactNode } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FUTURISTIC_BG_THEME } from "./theme";

type Props = {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  children?: (size: { width: number; height: number }) => ReactNode;
  overlay?: ReactNode;
};

export default function ProfileBgCanvas({
  width: widthProp,
  height: heightProp,
  style,
  children,
  overlay,
}: Props) {
  const [measured, setMeasured] = useState({ width: 0, height: 0 });

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (widthProp != null && heightProp != null) return;
      const { width, height } = e.nativeEvent.layout;
      setMeasured((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    },
    [widthProp, heightProp],
  );

  const w = widthProp ?? measured.width;
  const h = heightProp ?? measured.height;
  const ready = w > 0 && h > 0;

  return (
    <View
      style={[
        styles.root,
        widthProp != null && heightProp != null
          ? { width: widthProp, height: heightProp }
          : StyleSheet.absoluteFillObject,
        style,
      ]}
      onLayout={onLayout}
    >
      {/* ベース: 上ほど暗い navy グラデ */}
      <LinearGradient
        colors={[
          FUTURISTIC_BG_THEME.background,
          FUTURISTIC_BG_THEME.navy,
          FUTURISTIC_BG_THEME.deepNavy,
        ]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {ready ? children?.({ width: w, height: h }) : null}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden",
    backgroundColor: FUTURISTIC_BG_THEME.background,
  },
});
