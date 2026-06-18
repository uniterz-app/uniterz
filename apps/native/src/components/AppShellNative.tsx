import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import NativePageBackground from "./NativePageBackground";

/**
 * Web の `GamesPageBackground`（fixed inset-0）相当。
 * ナビゲーション全体の背面に1枚だけ置き、タブ切替でもアンマウントしない。
 */
export default function AppShellNative({ children }: { children: ReactNode }) {
  return (
    <View style={styles.shell} collapsable={false}>
      <NativePageBackground />
      <View style={styles.content} collapsable={false}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    position: "relative",
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
    zIndex: 1,
  },
});
