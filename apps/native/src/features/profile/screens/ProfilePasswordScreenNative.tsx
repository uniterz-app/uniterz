import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { auth } from "../../../lib/firebase";
import { colors, spacing } from "../../../theme/tokens";

export default function ProfilePasswordScreenNative() {
  const navigation = useNavigation();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const user = auth.currentUser;
    if (!user?.email || next.length < 6) {
      Alert.alert("", "新しいパスワードは6文字以上にしてください。");
      return;
    }
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, next);
      Alert.alert("", "パスワードを変更しました。");
      navigation.goBack();
    } catch {
      Alert.alert("エラー", "変更に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobilePageShell title="パスワード変更" onClose={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="現在のパスワード"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={current}
          onChangeText={setCurrent}
        />
        <TextInput
          style={styles.input}
          placeholder="新しいパスワード"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={next}
          onChangeText={setNext}
        />
        <Pressable style={styles.cta} onPress={handleSave} disabled={saving}>
          <Text style={styles.ctaLabel}>{saving ? "変更中..." : "変更"}</Text>
        </Pressable>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
  },
  cta: {
    marginTop: spacing.md,
    backgroundColor: "rgba(34,211,238,0.18)",
    borderWidth: 1,
    borderColor: colors.accentCyan,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "700" },
});
