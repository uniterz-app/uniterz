import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/** Web `MatchListCyberDecor` 相当（カード上部のシアンビーム） */
export default function MatchListCyberDecorNative() {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <LinearGradient
        colors={["transparent", "rgba(34,211,238,0.4)", "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.beam}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 0,
    zIndex: 2,
    height: 1,
  },
  beam: {
    flex: 1,
    height: 1,
  },
});
