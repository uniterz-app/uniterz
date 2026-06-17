import { StyleSheet, View } from "react-native";
import AppPageBackgroundNative from "./AppPageBackgroundNative";

/**
 * アプリ全体のページ背景（AppShellNative で1枚のみ）。
 */
export default function NativePageBackground() {
  return (
    <View pointerEvents="none" style={styles.layer} collapsable={false}>
      <AppPageBackgroundNative />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});
