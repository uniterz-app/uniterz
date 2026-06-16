import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { colors } from "../../../theme/tokens";

function openSubscriptionManagement() {
  const url =
    Platform.OS === "ios"
      ? "https://apps.apple.com/account/subscriptions"
      : "https://play.google.com/store/account/subscriptions";
  void Linking.openURL(url);
}

export default function CancelPlanScreenNative() {
  const navigation = useNavigation();
  return (
    <MobilePageShell title="解約" onClose={() => navigation.goBack()}>
      <View style={styles.content}>
        <Text style={styles.desc}>
          解約は App Store / Google Play のサブスクリプション管理から行えます。
        </Text>
        <Pressable
          style={styles.cta}
          onPress={() => {
            openSubscriptionManagement();
            navigation.navigate("CancelComplete" as never);
          }}
        >
          <Text style={styles.ctaLabel}>管理画面を開く</Text>
        </Pressable>
      </View>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 24, gap: 16 },
  desc: { color: colors.textSecondary, lineHeight: 22, fontSize: 15 },
  cta: {
    marginTop: 8,
    backgroundColor: "rgba(34,211,238,0.18)",
    borderWidth: 1,
    borderColor: colors.accentCyan,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "700" },
});
