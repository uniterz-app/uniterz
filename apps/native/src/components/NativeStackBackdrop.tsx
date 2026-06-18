import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

/** スタック用の透明ラッパー（背景は AppShellNative の NativePageBackground） */
export default function NativeStackBackdrop({ children }: { children: ReactNode }) {
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
