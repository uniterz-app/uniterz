/**
 * Web `/mobile/uniterz-pro-badge` 相当 — PRO タグ案。本番バッジは未差し替え。
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import UniterzLogoNative from "../UniterzLogoNative";
import UniterzUMarkNative from "../../units/UniterzUMarkNative";
import UniterzProBadgeNative from "../../units/UniterzProBadgeNative";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function UniterzProBadgePreviewScreenNative({
  language,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const ja = language === "ja";

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
        <Text style={styles.eyebrow}>PRO badge</Text>
        <Text style={styles.title}>UNITERZ PRO</Text>
        <Text style={styles.lead}>
          {ja
            ? "選んだ生成画像。金は今のバッジ色。本番に差し替え済み。"
            : "Chosen generated tag + current gold. Now live on profile and rankings."}
        </Text>

        <View style={styles.stage}>
          <Text style={styles.caption}>Gold</Text>
          <UniterzProBadgeNative height={72} tone="gold" />
        </View>

        <View style={styles.stage}>
          <Text style={styles.caption}>White</Text>
          <UniterzProBadgeNative height={72} />
        </View>

        <View style={styles.stage}>
          <Text style={styles.caption}>On a name</Text>
          <View style={styles.nameRow}>
            <Text style={styles.nameLg}>KAMIYA</Text>
            <UniterzProBadgeNative height={22} tone="gold" />
          </View>
          <View style={[styles.nameRow, { marginTop: 14 }]}>
            <Text style={styles.nameSm}>ranking row</Text>
            <UniterzProBadgeNative height={16} tone="gold" />
          </View>
          <Text style={[styles.caption, { marginTop: 20 }]}>
            Now（本番）
          </Text>
          <View style={styles.nameRow}>
            <Text style={styles.nameLg}>KAMIYA</Text>
            <ProCyberBadgeNative premium />
          </View>
        </View>

        <View style={styles.stage}>
          <Text style={styles.caption}>Sizes</Text>
          <View style={styles.sizes}>
            <UniterzProBadgeNative height={48} tone="gold" />
            <UniterzProBadgeNative height={28} tone="gold" />
            <UniterzProBadgeNative height={18} tone="gold" />
            <UniterzProBadgeNative height={14} tone="gold" />
          </View>
        </View>

        <View style={styles.stage}>
          <Text style={styles.caption}>Family</Text>
          <View style={styles.family}>
            <UniterzUMarkNative size={48} color="#ffffff" />
            <UniterzProBadgeNative height={22} tone="gold" />
          </View>
          <View style={{ marginTop: 20, width: "100%" }}>
            <UniterzLogoNative width={340} />
          </View>
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
  scroll: { paddingHorizontal: 16, paddingTop: 4 },
  eyebrow: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 4,
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  lead: {
    marginTop: 8,
    marginBottom: 16,
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    lineHeight: 20,
  },
  stage: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#000",
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  caption: {
    alignSelf: "flex-start",
    marginBottom: 14,
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  nameRow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameLg: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    fontStyle: "italic",
  },
  nameSm: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "700",
    fontStyle: "italic",
  },
  sizes: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  family: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 20,
  },
});
