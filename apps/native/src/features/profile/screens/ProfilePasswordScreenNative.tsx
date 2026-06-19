import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { auth } from "../../../lib/firebase";
import { colors, spacing } from "../../../theme/tokens";
import { useNativeLanguage } from "../../../i18n/NativeLanguageProvider";
import { getProfilePasswordTexts } from "../profileSettingsI18n";

/** Web `ChangePasswordForm` 相当 */
export default function ProfilePasswordScreenNative() {
  const navigation = useNavigation();
  const { language } = useNativeLanguage();
  const t = getProfilePasswordTexts(language);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [nextConfirm, setNextConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const user = auth.currentUser;
    if (!user?.email) {
      Alert.alert(t.errorTitle, t.loginRequired);
      return;
    }
    if (!current || !next || !nextConfirm) {
      Alert.alert(t.errorTitle, t.fillAll);
      return;
    }
    if (next !== nextConfirm) {
      Alert.alert(t.errorTitle, t.mismatch);
      return;
    }
    if (next.length < 6) {
      Alert.alert(t.errorTitle, t.tooShort);
      return;
    }

    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, next);
      Alert.alert("", t.success);
      navigation.goBack();
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : "";
      if (code === "auth/wrong-password") {
        Alert.alert(t.errorTitle, t.wrongCurrent);
      } else if (code === "auth/weak-password") {
        Alert.alert(t.errorTitle, t.weak);
      } else {
        Alert.alert(t.errorTitle, t.failed);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobilePageShell title={t.title} onClose={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.desc}>{t.desc}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.current}
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={current}
          onChangeText={setCurrent}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder={t.next}
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={next}
          onChangeText={setNext}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder={t.confirm}
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={nextConfirm}
          onChangeText={setNextConfirm}
          autoCapitalize="none"
        />
        <Pressable style={styles.cta} onPress={handleSave} disabled={saving}>
          <Text style={styles.ctaLabel}>{saving ? t.saving : t.save}</Text>
        </Pressable>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm },
  desc: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    backgroundColor: "rgba(15,23,42,0.75)",
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
