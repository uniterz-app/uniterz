import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { auth, db } from "../../lib/firebase";
import type { AuthStackParamList } from "../../navigation/types";
import AuthFormShellNative from "./AuthFormShellNative";
import { mapAuthErrorMessage } from "./authShared";
import { colors, spacing } from "../../theme/tokens";

export default function SignupScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSignup() {
    if (submitting) return;
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      Alert.alert("Missing input", "Please enter both email and password.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Missing input", "Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, normalized, password);
      await setDoc(
        doc(db, "users", cred.user.uid),
        {
          displayName: "",
          bio: "",
          photoURL: cred.user.photoURL ?? "",
          createdAt: serverTimestamp(),
          counts: { posts: 0 },
        },
        { merge: true }
      );
    } catch (e) {
      Alert.alert("Authentication error", mapAuthErrorMessage(e, "signup"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFormShellNative
      title="CREATE ACCOUNT"
      footer={
        <View style={styles.footer}>
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkAccent}>Already have an account? Log in</Text>
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
        placeholder="Password (6+ characters)"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.cta} onPress={handleSignup} disabled={submitting}>
        <Text style={styles.ctaLabel}>{submitting ? "Creating..." : "SIGN UP"}</Text>
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
  footer: { marginTop: spacing.xs, alignItems: "center" },
  linkAccent: { color: "#7dd3fc", fontSize: 15, fontWeight: "600" },
});
