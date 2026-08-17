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
import { spacing } from "../../theme/tokens";

const BTN_SKEW = "-10deg";
const BTN_UNSKEW = "10deg";

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
            <Text style={styles.linkAccent}>CREATE ACCOUNT</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.field}>
        <View style={styles.fieldRail} />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="rgba(186,200,210,0.45)"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <View style={styles.field}>
        <View style={styles.fieldRail} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgba(186,200,210,0.45)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <View style={styles.ctaSkewWrap}>
        <Pressable style={styles.ctaPressable} onPress={handleLogin} disabled={submitting}>
          <View style={styles.ctaBorder}>
            <View style={styles.ctaFill}>
              <View style={styles.ctaRail} pointerEvents="none" />
              <View style={styles.ctaLabelWrap}>
                <Text style={styles.ctaLabel}>{submitting ? "Logging in..." : "LOG IN"}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </View>
    </AuthFormShellNative>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(4,10,14,0.72)",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  fieldRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(0,245,255,0.45)",
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#f1f5f9",
    fontSize: 16,
    minHeight: 52,
  },
  ctaSkewWrap: {
    width: "100%",
    marginTop: 6,
    transform: [{ skewX: BTN_SKEW }],
  },
  ctaPressable: { width: "100%" },
  ctaBorder: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.34)",
    backgroundColor: "rgba(8,14,22,0.96)",
    overflow: "hidden",
  },
  ctaFill: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  ctaRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "rgba(0,245,255,0.55)",
  },
  ctaLabelWrap: {
    transform: [{ skewX: BTN_UNSKEW }],
    alignItems: "center",
  },
  ctaLabel: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 24,
    letterSpacing: 4,
    color: "#e8eaed",
  },
  footer: { gap: spacing.sm, marginTop: spacing.xs, alignItems: "center" },
  link: { color: "rgba(226,232,240,0.72)", fontSize: 14 },
  linkAccent: {
    color: "rgba(0,245,255,0.85)",
    fontFamily: "BebasNeue_400Regular",
    fontSize: 18,
    letterSpacing: 1.4,
    textDecorationLine: "underline",
  },
});
