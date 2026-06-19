import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { auth } from "../../../lib/firebase";
import { colors, fonts, spacing } from "../../../theme/tokens";
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
    <MobilePageShell title={t.title} appBackground onClose={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.backdropOrbA} pointerEvents="none" />
        <View style={styles.backdropOrbB} pointerEvents="none" />
        <View style={styles.card}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.desc}>{t.desc}</Text>
          <PasswordField placeholder={t.current} value={current} onChangeText={setCurrent} />
          <PasswordField placeholder={t.next} value={next} onChangeText={setNext} />
          <PasswordField placeholder={t.confirm} value={nextConfirm} onChangeText={setNextConfirm} />
          <Pressable onPress={handleSave} disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
            <LinearGradient colors={["#a855f7", "#6366f1", "#22d3ee"]} style={styles.cta}>
              <Text style={styles.ctaLabel}>{saving ? t.saving : t.save}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </MobilePageShell>
  );
}

function PasswordField({
  placeholder,
  value,
  onChangeText,
}: {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.inputWrap}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
      <MaterialCommunityIcons
        name="lock"
        size={18}
        color="rgba(255,255,255,0.82)"
        style={styles.lockIcon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    overflow: "hidden",
  },
  backdropOrbA: {
    position: "absolute",
    left: -80,
    bottom: 80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(0,220,200,0.18)",
  },
  backdropOrbB: {
    position: "absolute",
    right: -90,
    bottom: 56,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(16,120,255,0.18)",
  },
  card: {
    width: 320,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(15,23,42,0.72)",
    padding: 20,
    shadowColor: "rgba(34,211,238,0.55)",
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  desc: { color: "rgba(226,232,240,0.78)", fontSize: 13, lineHeight: 20, marginBottom: 16, textAlign: "center" },
  inputWrap: {
    position: "relative",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 40,
    color: colors.textPrimary,
    backgroundColor: "rgba(15,23,42,0.75)",
  },
  lockIcon: {
    position: "absolute",
    right: 12,
    top: 13,
  },
  cta: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "rgba(79,70,229,0.7)",
    shadowOpacity: 0.55,
    shadowRadius: 18,
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "700", letterSpacing: 0.5, fontFamily: fonts.metric },
});
