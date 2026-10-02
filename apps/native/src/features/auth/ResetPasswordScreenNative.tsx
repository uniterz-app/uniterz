import { useMemo, useState } from "react";
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
import { authFormCopy } from "@/lib/auth/authFormCopy";
import { resolveDeviceLocalizedLang } from "../../i18n/resolveDeviceAppLanguage";

export default function ResetPasswordScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const copy = useMemo(() => authFormCopy(resolveDeviceLocalizedLang()), []);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function backToLogin() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate("Landing");
  }

  async function handleReset() {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      cyberAlert(copy.missingInputTitle, copy.missingEmail);
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, normalized);
      cyberAlert(copy.resetSentTitle, copy.resetSentBody);
      backToLogin();
    } catch {
      cyberAlert(copy.resetSentTitle, copy.resetSentBody);
      backToLogin();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <AuthFormShellNative title="RESET PASSWORD">
        <Text style={styles.desc}>{copy.resetHint}</Text>
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
      <ProfileBackEdgeHandleNative onPress={backToLogin} accessibilityLabel={copy.backA11y} />
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
});
