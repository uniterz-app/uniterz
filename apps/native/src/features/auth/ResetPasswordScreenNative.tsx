import { useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import { Pressable, StyleSheet, Text, TextInput } from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { auth } from "../../lib/firebase";
import type { AuthStackParamList } from "../../navigation/types";
import AuthFormShellNative from "./AuthFormShellNative";
import { colors } from "../../theme/tokens";

export default function ResetPasswordScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleReset() {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      cyberAlert("Missing input", "Please enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, normalized);
      cyberAlert(
        "Reset link sent",
        "If this email is registered, we sent a reset link."
      );
      navigation.navigate("Login");
    } catch {
      cyberAlert(
        "Reset link sent",
        "If this email is registered, we sent a reset link."
      );
      navigation.navigate("Login");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFormShellNative title="RESET PASSWORD">
      <Text style={styles.desc}>登録メールアドレスを入力してください。</Text>
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Pressable style={styles.cta} onPress={handleReset} disabled={submitting}>
        <Text style={styles.ctaLabel}>{submitting ? "Sending..." : "SEND RESET LINK"}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Login")}>
        <Text style={styles.back}>Back to login</Text>
      </Pressable>
    </AuthFormShellNative>
  );
}

const styles = StyleSheet.create({
  desc: { color: colors.textSecondary, fontSize: 14, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.62)",
    borderRadius: 12,
    backgroundColor: "#010201",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 16,
  },
  cta: {
    minHeight: 46,
    backgroundColor: "rgba(6,182,212,0.26)",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.45)",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  ctaLabel: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 19,
    letterSpacing: 3,
    color: colors.textPrimary,
  },
  back: { color: "#7dd3fc", textAlign: "center", fontSize: 15, fontWeight: "600" },
});
