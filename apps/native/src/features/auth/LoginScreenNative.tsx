import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
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
      Alert.alert("Missing input", "Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, normalized, password);
    } catch (e) {
      Alert.alert("Authentication error", mapAuthErrorMessage(e, "login"));
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
  footer: { gap: spacing.sm, marginTop: spacing.xs, alignItems: "center" },
  link: { color: colors.textSecondary, fontSize: 13 },
  linkAccent: { color: colors.accentCyan, fontSize: 14, fontWeight: "600" },
});
