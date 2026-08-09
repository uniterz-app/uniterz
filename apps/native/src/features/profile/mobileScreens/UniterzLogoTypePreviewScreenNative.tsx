/**
 * Web `/dev/uniterz-logo` 相当 — 確定版ロゴ画像
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import UniterzLogoNative from "../UniterzLogoNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function UniterzLogoTypePreviewScreenNative({ onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="戻る"
        style={styles.back}
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 28 },
        ]}
      >
        <View style={styles.stage}>
          <UniterzLogoNative width={340} />
        </View>

        <View style={styles.stage}>
          <Text style={styles.caption}>Narrow</Text>
          <UniterzLogoNative width={220} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#03070b" },
  back: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },
  stage: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#000",
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  caption: {
    alignSelf: "flex-start",
    marginBottom: 12,
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
});
