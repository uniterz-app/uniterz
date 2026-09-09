import { useMemo, useState } from "react";
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
import SlantCtaNative from "../../ui/SlantCtaNative";
import { spacing } from "../../theme/tokens";
import { authFormCopy } from "@/lib/auth/authFormCopy";
import { resolveDeviceAppLanguage } from "../../i18n/resolveDeviceAppLanguage";

export default function LoginScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const copy = useMemo(() => authFormCopy(resolveDeviceAppLanguage()), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (submitting) return;
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      cyberAlert(copy.missingInputTitle, copy.missingBoth);
      return;
    }
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, normalized, password);
    } catch (e) {
      cyberAlert(copy.authErrorTitle, mapAuthErrorMessage(e, "login"));
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
            <Text style={styles.link}>{copy.forgotCombined}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.linkAccent}>CREATE ACCOUNT</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.field}>
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
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgba(186,200,210,0.45)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <SlantCtaNative
        display
        label={submitting ? "Logging in..." : "LOG IN"}
        onPress={handleLogin}
        disabled={submitting}
      />
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
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#f1f5f9",
    fontSize: 16,
    minHeight: 52,
  },
  footer: { gap: spacing.sm, marginTop: spacing.xs, alignItems: "center" },
  link: { color: "rgba(226,232,240,0.72)", fontSize: 14 },
  linkAccent: {
    color: "rgba(0,245,255,0.85)",
    fontFamily: "BebasNeue_400Regular",
    fontSize: 18,
    letterSpacing: 1.8,
    transform: [{ skewX: "-10deg" }],
  },
});
