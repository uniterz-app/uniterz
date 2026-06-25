import { useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  Pressable, StyleSheet, Text, TextInput, View,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { auth } from "../../lib/firebase";
import type { AuthStackParamList } from "../../navigation/types";
import AuthFormShellNative from "./AuthFormShellNative";
import { mapAuthErrorMessage } from "./authShared";
import { colors, spacing } from "../../theme/tokens";

export default function LoginScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (submitting) return;
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      cyberAlert("Missing input", "Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, normalized, password);
    } catch (e) {
      cyberAlert("Authentication error", mapAuthErrorMessage(e, "login"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFormShellNative
      title="LOGIN"
      footer={
        <View style={styles.footer}>
          <Pressable onPress={() => navigation.navigate("ResetPassword")}>
            <Text style={styles.link}>パスワードをお忘れの方はこちら</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.linkAccent}>Create Account</Text>
          </Pressable>
        </View>
      }
    >
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.cta} onPress={handleLogin} disabled={submitting}>
        <Text style={styles.ctaLabel}>{submitting ? "Logging in..." : "LOG IN"}</Text>
      </Pressable>
    </AuthFormShellNative>
  );
}

const styles = StyleSheet.create({
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
  footer: { gap: spacing.sm, marginTop: spacing.xs, alignItems: "center" },
  link: { color: "rgba(226,232,240,0.88)", fontSize: 14 },
  linkAccent: { color: "#7dd3fc", fontSize: 15, fontWeight: "600" },
});
