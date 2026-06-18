import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

/** 透明コンテンツシェル（背景は AppShellNative で描画） */
export default function NativeScreenChrome({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root} collapsable={false}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
