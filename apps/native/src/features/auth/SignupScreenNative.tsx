import { useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { auth, db } from "../../lib/firebase";
import type { AuthStackParamList } from "../../navigation/types";
import AuthFormShellNative from "./AuthFormShellNative";
import { mapAuthErrorMessage } from "./authShared";
import SlantCtaNative from "../../ui/SlantCtaNative";
import { spacing } from "../../theme/tokens";
import { bindMeReferralNative } from "../profile/referralApiNative";
import { normalizeReferralInviteCode } from "../../../../../lib/referral/referralInviteCode";

const BTN_SKEW = "-10deg";
const BTN_UNSKEW = "10deg";

export default function SignupScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, "Signup">>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState(
    normalizeReferralInviteCode(route.params?.inviteCode ?? "")
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSignup() {
    if (submitting) return;
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) {
      cyberAlert("Missing input", "Please enter both email and password.");
      return;
    }
    if (password.length < 6) {
      cyberAlert("Missing input", "Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        normalized,
        password
      );
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
      const code = normalizeReferralInviteCode(inviteCode);
      if (code) {
        try {
          await bindMeReferralNative(code);
        } catch {
          /* bind 失敗でもサインアップは継続 */
        }
      }
    } catch (e) {
      cyberAlert("Authentication error", mapAuthErrorMessage(e, "signup"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFormShellNative
      title="CREATE ACCOUNT"
      footer={
        <View style={styles.footer}>
          <Text style={styles.helperText}>
            すでにアカウントをお持ちの方は
            <Text
              style={styles.helperLinkInline}
              onPress={() => navigation.navigate("Login")}
            >
              {" LOGIN"}
            </Text>
          </Text>
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
          placeholder="Password (6+ characters)"
          placeholderTextColor="rgba(186,200,210,0.45)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <View style={styles.field}>
        <TextInput
          style={styles.input}
          placeholder="Invite code (optional)"
          placeholderTextColor="rgba(186,200,210,0.45)"
          autoCapitalize="characters"
          autoCorrect={false}
          value={inviteCode}
          onChangeText={(t) => setInviteCode(normalizeReferralInviteCode(t))}
        />
      </View>
      <Text style={styles.inviteHint}>
        友達からコードをもらった場合のみ入力
      </Text>
      <SlantCtaNative
        display
        label={submitting ? "Creating..." : "SIGN UP"}
        onPress={handleSignup}
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
  inviteHint: {
    marginTop: -4,
    marginBottom: 2,
    paddingHorizontal: 2,
    color: "rgba(186,200,210,0.45)",
    fontSize: 11,
    lineHeight: 15,
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
  footer: { marginTop: 8, alignItems: "center" },
  helperText: {
    color: "rgba(226,232,240,0.72)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  helperLinkInline: {
    color: "rgba(0,245,255,0.85)",
    textDecorationLine: "underline",
  },
});
