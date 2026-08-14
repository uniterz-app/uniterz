/**
 * MENU タブ同系 — 右端の縦 BACK タブ（白黒）。
 * ランキング / リザルト詳細 / チーム・プレイヤー詳細 / レポート等の戻り用。
 */
import { Pressable, StyleSheet, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = {
  onPress: () => void;
  accessibilityLabel?: string;
};

const BACK_LABEL = "BACK";
const FG = "rgba(248,250,252,0.92)";
const BORDER = "rgba(248,250,252,0.42)";

export default function ProfileBackEdgeHandleNative({
  onPress,
  accessibilityLabel = "Back",
}: Props) {
  return (
    <Pressable
      style={styles.handle}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <MaterialCommunityIcons
        name="chevron-left"
        size={11}
        color={FG}
        style={styles.icon}
      />
      {BACK_LABEL.split("").map((ch, i) => (
        <Text key={`${ch}-${i}`} style={styles.letter}>
          {ch}
        </Text>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  handle: {
    position: "absolute",
    right: 0,
    top: "46%",
    zIndex: 20,
    width: 19,
    paddingVertical: 7,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: BORDER,
    backgroundColor: "rgba(8,10,14,0.92)",
    shadowColor: "#ffffff",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  icon: {
    marginBottom: 1,
  },
  letter: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 8,
    color: FG,
  },
});
