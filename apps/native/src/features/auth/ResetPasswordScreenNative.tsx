import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput } from "react-native";
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
      Alert.alert("Missing input", "Please enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, normalized);
      Alert.alert(
        "Reset link sent",
        "If this email is registered, we sent a reset link."
      );
      navigation.navigate("Login");
    } catch {
      Alert.alert(
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
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  cta: {
    backgroundColor: "rgba(34,211,238,0.18)",
    borderWidth: 1,
    borderColor: colors.accentCyan,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaLabel: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 20,
    letterSpacing: 1.5,
    color: colors.textPrimary,
  },
  back: { color: colors.accentCyan, textAlign: "center", fontSize: 14 },
});
