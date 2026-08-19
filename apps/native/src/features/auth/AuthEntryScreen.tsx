/**
 * 認証エントリ（LOGIN / CREATE ACCOUNT）
 * Landing と同世界観: カード枠なし・地平線・スキュー CTA・地形背景。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { FirebaseError } from "firebase/app";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { spacing } from "../../theme/tokens";
import { auth, db } from "../../lib/firebase";
import { useRoute, useNavigation, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import type { AuthStackParamList } from "../../navigation/types";
import AuthLandingBackgroundNative from "./AuthLandingBackgroundNative";
import { AUTH_LANDING } from "./authLandingPalette";
import AuthLegalConsentGateNative from "./AuthLegalConsentGateNative";
import SlantCtaNative from "../../ui/SlantCtaNative";
import UniterzLogoNative from "../profile/UniterzLogoNative";
import ProfileBackEdgeHandleNative from "../profile/ProfileBackEdgeHandleNative";

type AuthMode = "login" | "signup" | "reset";

export type AuthEntryScreenProps = {
  embedded?: boolean;
  initialMode?: Exclude<AuthMode, "reset">;
  interactive?: boolean;
  onBack?: () => void;
};

const BTN_SKEW = "-10deg";
const BTN_UNSKEW = "10deg";

function mapAuthErrorMessage(error: unknown, mode: Exclude<AuthMode, "reset">): string {
  const code = (error as FirebaseError | undefined)?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
      return "Incorrect email address or password.";
    case "auth/user-not-found":
      return "No user was found with this email address.";
    case "auth/wrong-password":
      return "The password is incorrect.";
    case "auth/invalid-email":
      return "The email format is invalid.";
    case "auth/email-already-in-use":
      return "This email address is already registered.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/network-request-failed":
      return "Please check your network connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a while and try again.";
    default:
      return mode === "login"
        ? "Login failed. Please check your input."
        : "Account creation failed. Please check your input.";
  }
}

function HorizonRule() {
  return (
    <View style={styles.horizonSlot}>
      <LinearGradient
        colors={[
          "transparent",
          AUTH_LANDING.accentLine,
          AUTH_LANDING.ink,
          AUTH_LANDING.accentLine,
          "transparent",
        ]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.horizonLine}
      />
      <View style={styles.horizonCore} pointerEvents="none" />
    </View>
  );
}

export default function AuthEntryScreen({
  embedded = false,
  initialMode: initialModeProp,
  interactive = true,
  onBack,
}: AuthEntryScreenProps = {}) {
  const formWidth = Math.min(340, Dimensions.get("window").width - 40);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const routeInitial =
    route.name === "Login"
      ? (route as RouteProp<AuthStackParamList, "Login">).params?.initialMode
      : undefined;
  const initialMode = initialModeProp ?? routeInitial ?? "login";

  const { status, fUser } = useFirebaseUser();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [enter, mode]);

  const pressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 24,
      bounciness: 0,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 4,
    }).start();
  };

  const title = useMemo(
    () =>
      mode === "reset"
        ? "RESET PASSWORD"
        : mode === "signup"
          ? "CREATE ACCOUNT"
          : "LOGIN",
    [mode]
  );
  const cta = useMemo(
    () =>
      mode === "reset"
        ? "SEND RESET LINK"
        : mode === "signup"
          ? "SIGN UP"
          : "LOG IN",
    [mode]
  );
  const submittingLabel = useMemo(
    () =>
      mode === "reset"
        ? "Sending..."
        : mode === "login"
          ? "Logging in..."
          : "Creating...",
    [mode]
  );

  async function handleResetPassword() {
    if (submitting) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      cyberAlert("Missing input", "Please enter your email address.");
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      cyberAlert(
        "Reset link sent",
        "If this email is registered, we sent a reset link. Check spam if you don't see it."
      );
      setMode("login");
    } catch {
      cyberAlert(
        "Reset link sent",
        "If this email is registered, we sent a reset link. Check spam if you don't see it."
      );
      setMode("login");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (mode === "reset") {
      await handleResetPassword();
      return;
    }
    if (submitting) return;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      cyberAlert("Missing input", "Please enter both email and password.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      cyberAlert("Missing input", "Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
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
      }
    } catch (error: unknown) {
      cyberAlert("Authentication error", mapAuthErrorMessage(error, mode));
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "ready" && fUser) return null;

  const handleBack = () => {
    if (mode === "reset") {
      setMode("login");
      return;
    }
    if (onBack) {
      onBack();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("Landing");
  };

  const enterY = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View
        style={[styles.root, embedded && styles.rootEmbedded]}
        pointerEvents={interactive ? "auto" : "none"}
      >
        {embedded ? null : <AuthLandingBackgroundNative />}

        {interactive ? (
          <ProfileBackEdgeHandleNative
            onPress={handleBack}
            accessibilityLabel="Back to landing"
          />
        ) : null}

        <View
          style={[
            styles.screen,
            {
              paddingTop: insets.top + 48,
              paddingBottom: Math.max(insets.bottom + 24, 32),
            },
          ]}
        >
          <Animated.View
            style={[
              styles.form,
              {
                width: formWidth,
                opacity: enter,
                transform: [{ translateY: enterY }],
              },
            ]}
          >
            <View style={styles.logoWrap}>
              <UniterzLogoNative width={220} />
            </View>
            <HorizonRule />
            <View style={styles.titleWrap}>
              <Text
                style={[
                  styles.title,
                  mode === "login" ? styles.titleShort : styles.titleLong,
                ]}
              >
                {title}
              </Text>
            </View>

            {mode === "reset" ? (
              <Text style={styles.resetHint}>
                登録メールアドレスを入力してください。
              </Text>
            ) : null}

            <View style={[styles.field, styles.fieldEmail]}>
              <LinearGradient
                colors={[AUTH_LANDING.accentLine, "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fieldTopGlow}
                pointerEvents="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="rgba(186,200,210,0.45)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <View style={styles.fieldIcon} pointerEvents="none">
                <MaterialCommunityIcons name="email-outline" size={18} color={AUTH_LANDING.accentSoft} />
              </View>
            </View>

            {mode === "reset" ? null : (
            <View style={[styles.field, styles.fieldPassword]}>
              <LinearGradient
                colors={[AUTH_LANDING.accentLine, "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.fieldTopGlow}
                pointerEvents="none"
              />
              <TextInput
                style={[styles.input, styles.inputWithRight]}
                placeholder={mode === "signup" ? "Password (6+ characters)" : "Password"}
                placeholderTextColor="rgba(186,200,210,0.45)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <Pressable
                style={styles.fieldIconBtn}
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={16}
                  color={AUTH_LANDING.accentSoft}
                />
              </Pressable>
            </View>
            )}

            <SlantCtaNative
              display
              label={submitting ? submittingLabel : cta}
              onPress={handleSubmit}
              disabled={submitting}
            />

            {mode === "login" ? (
              <View style={styles.footer}>
                <Text style={styles.helperText}>
                  パスワードをお忘れの方は
                  <Text
                    style={styles.helperLinkInline}
                    onPress={() => setMode("reset")}
                  >
                    こちら
                  </Text>
                </Text>
                <Pressable onPress={() => setConsentOpen(true)}>
                  <Text style={styles.helperLink}>CREATE ACCOUNT</Text>
                </Pressable>
              </View>
            ) : mode === "signup" ? (
              <View style={styles.footer}>
                <Text style={styles.helperText}>
                  すでにアカウントをお持ちの方は
                  <Text style={styles.helperLinkInline} onPress={() => setMode("login")}>
                    {" LOGIN"}
                  </Text>
                </Text>
              </View>
            ) : (
              <View style={styles.footer}>
                <Pressable onPress={() => setMode("login")}>
                  <Text style={styles.helperLink}>BACK TO LOGIN</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </View>
        <AuthLegalConsentGateNative
          visible={consentOpen}
          onClose={() => setConsentOpen(false)}
          onAgree={() => {
            setConsentOpen(false);
            setMode("signup");
          }}
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: AUTH_LANDING.canvas,
  },
  rootEmbedded: {
    backgroundColor: "transparent",
  },
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  form: {
    gap: 14,
  },
  logoWrap: {
    alignSelf: "center",
    alignItems: "center",
  },
  horizonSlot: {
    alignSelf: "center",
    width: "72%",
    maxWidth: 240,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
    marginBottom: 2,
  },
  horizonLine: {
    width: "100%",
    height: 1.5,
  },
  horizonCore: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "rgba(120,240,255,1)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  titleWrap: {
    alignSelf: "center",
    alignItems: "center",
    transform: [{ skewX: "-10deg" }],
    marginBottom: 4,
  },
  title: {
    color: "rgba(248,250,252,0.95)",
    fontFamily: "BebasNeue_400Regular",
    textAlign: "center",
  },
  titleShort: {
    fontSize: 22,
    letterSpacing: 2.4,
    lineHeight: 26,
  },
  titleLong: {
    fontSize: 18,
    letterSpacing: 1.6,
    lineHeight: 22,
  },
  field: {
    minHeight: 52,
    borderWidth: 1,
    backgroundColor: "rgba(4,10,14,0.72)",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  fieldEmail: {
    borderColor: AUTH_LANDING.accentDim,
  },
  fieldPassword: {
    borderColor: AUTH_LANDING.accentDim,
  },
  fieldTopGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 48,
    color: "#f1f5f9",
    fontSize: 16,
    minHeight: 52,
  },
  inputWithRight: {
    paddingRight: 48,
  },
  fieldIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    marginTop: -12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldIconBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    marginTop: -17,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaSkewWrap: {
    width: "100%",
    marginTop: 6,
    transform: [{ skewX: BTN_SKEW }],
  },
  ctaPressable: {
    width: "100%",
  },
  ctaDisabled: {
    opacity: 0.55,
  },
  ctaBorder: {
    width: "100%",
    borderWidth: 1,
    borderColor: AUTH_LANDING.accent,
    overflow: "hidden",
    backgroundColor: AUTH_LANDING.accent,
  },
  ctaFill: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: AUTH_LANDING.accent,
  },
  ctaRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: AUTH_LANDING.onAccent,
    opacity: 0.28,
  },
  ctaLabelWrap: {
    transform: [{ skewX: BTN_UNSKEW }],
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 24,
    letterSpacing: 4,
    color: AUTH_LANDING.onAccent,
  },
  footer: {
    marginTop: 8,
    gap: 12,
    alignItems: "center",
  },
  helperText: {
    color: "rgba(226,232,240,0.72)",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  resetHint: {
    color: "rgba(226,232,240,0.65)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 2,
  },
  helperLinkInline: {
    color: AUTH_LANDING.accentSoft,
    textDecorationLine: "underline",
  },
  helperLink: {
    color: AUTH_LANDING.accentSoft,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 18,
    letterSpacing: 1.8,
    transform: [{ skewX: "-10deg" }],
  },
});
