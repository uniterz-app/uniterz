/**
 * 起動 Landing / Auth 背景。地は黒。シアンの柱光は置かない。
 */
import { StyleSheet, View } from "react-native";

export default function AuthLandingBackgroundNative() {
  return <View style={styles.root} pointerEvents="none" />;
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
});
