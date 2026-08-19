import { useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { auth } from "../../lib/firebase";
import type { AuthStackParamList } from "../../navigation/types";
import AuthFormShellNative from "./AuthFormShellNative";
import SlantCtaNative from "../../ui/SlantCtaNative";
import ProfileBackEdgeHandleNative from "../profile/ProfileBackEdgeHandleNative";
import { spacing } from "../../theme/tokens";

const BTN_SKEW = "-10deg";
const BTN_UNSKEW = "10deg";

export default function ResetPasswordScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function backToLogin() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Landing");
  }

  async function handleReset() {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      cyberAlert("Missing input", "Please enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, normalized);
      cyberAlert("Reset link sent", "If this email is registered, we sent a reset link.");
      backToLogin();
    } catch {
      cyberAlert("Reset link sent", "If this email is registered, we sent a reset link.");
      backToLogin();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <AuthFormShellNative title="RESET PASSWORD">
        <Text style={styles.desc}>登録メールアドレスを入力してください。</Text>
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
        <SlantCtaNative
          display
          label={submitting ? "Sending..." : "SEND RESET LINK"}
          onPress={handleReset}
          disabled={submitting}
        />
      </AuthFormShellNative>
      <ProfileBackEdgeHandleNative onPress={backToLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  desc: {
    color: "rgba(226,232,240,0.65)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 2,
  },
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
    fontSize: 20,
    letterSpacing: 2.5,
    color: "#e8eaed",
  },
});
