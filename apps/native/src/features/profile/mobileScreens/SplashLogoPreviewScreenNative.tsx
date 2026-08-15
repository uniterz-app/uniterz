/**
 * DEV — スプラッシュプレビュー（演出は一旦オフ）。
 */
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { setAppBrandShelfHidden } from "@/lib/ui/appBrandShelfVisibility";
import { fonts } from "../../../theme/tokens";

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

export default function SplashLogoPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const isJa = language === "ja";

  useEffect(() => {
    setAppBrandShelfHidden(true);
    return () => setAppBrandShelfHidden(false);
  }, []);

  return (
    <View style={styles.root}>
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={isJa ? "戻る" : "Back"}
        style={[styles.back, { top: insets.top + 8 }]}
      >
        <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.kicker}>Splash Preview</Text>
        <Text style={styles.caption}>
          {isJa ? "スプラッシュ演出はオフです" : "Splash animation is off"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#090c15",
  },
  back: {
    position: "absolute",
    left: 12,
    zIndex: 10,
    padding: 10,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  kicker: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(103, 232, 249, 0.75)",
  },
  caption: {
    fontFamily: fonts.metric,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
});
