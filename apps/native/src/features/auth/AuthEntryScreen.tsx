import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Platform,
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
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { auth, db } from "../../lib/firebase";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp, NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import type { AuthStackParamList } from "../../navigation/types";

type AuthMode = "login" | "signup";

function mapAuthErrorMessage(
  error: unknown,
  mode: AuthMode
): string {
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

export default function AuthEntryScreen() {
  const formWidth = Math.min(330, Dimensions.get("window").width - 26);
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<AuthStackParamList, "Login">>();
  const initialMode = route.params?.initialMode ?? "login";

  const { status, fUser } = useFirebaseUser();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cardHeight, setCardHeight] = useState(0);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const lineFlow = useRef(new Animated.Value(0)).current;
  const frameFlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(lineFlow, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [lineFlow]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(frameFlow, {
        toValue: 1,
        duration: 3600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [frameFlow]);

  const lineTravel = lineFlow.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 180],
  });

  const edgeFlowX = frameFlow.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, formWidth + 120],
  });
  const edgeFlowY = frameFlow.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, Math.max(0, cardHeight) + 120],
  });

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
    () => (mode === "login" ? "LOGIN" : "CREATE ACCOUNT"),
    [mode]
  );

  const cta = useMemo(
    () => (mode === "login" ? "LOG IN" : "SIGN UP"),
    [mode]
  );
  const submittingLabel = useMemo(
    () => (mode === "login" ? "Logging in..." : "Creating..."),
    [mode]
  );

  async function handleResetPassword() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert("Missing input", "Please enter your email address.");
      return;
    }
    try {
      await Promise.race([
        sendPasswordResetEmail(auth, normalizedEmail),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 10000)
        ),
      ]);
      Alert.alert(
        "Reset link sent",
        "If this email is registered, we sent a reset link. Check spam if you don't see it."
      );
    } catch (e: any) {
      const code = e?.code as string | undefined;
      if (e?.message === "timeout") {
        Alert.alert(
          "Request timed out",
          "In DevTools -> Network, check identitytoolkit / sendOobCode."
        );
        return;
      }
      if (code === "auth/user-not-found" || code === "auth/invalid-email") {
        Alert.alert(
          "Reset link sent",
          "If this email is registered, we sent a reset link. Check spam if you don't see it."
        );
        return;
      }
      if (code === "auth/too-many-requests") {
        Alert.alert("Error", "Too many attempts. Please try again later.");
        return;
      }
      if (code === "auth/network-request-failed") {
        Alert.alert("Error", "Network error. Check your connection.");
        return;
      }
      Alert.alert("Error", "Failed to send. Please try again in a moment.");
    }
  }

  async function handleSubmit() {
    if (submitting) return;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert(
        "Missing input",
        "Please enter both email and password."
      );
      return;
    }
    if (mode === "signup" && password.length < 6) {
      Alert.alert(
        "Missing input",
        "Password must be at least 6 characters."
      );
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
        const cred = await createUserWithEmailAndPassword(
          auth,
          normalizedEmail,
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
      }
    } catch (error: unknown) {
      Alert.alert(
        "Authentication error",
        mapAuthErrorMessage(error, mode)
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "ready" && fUser) return null;

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("Landing");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={styles.root}>
      <View style={styles.backgroundDim} pointerEvents="none" />
      <Pressable
        style={[styles.backBtn, { top: insets.top + 8, left: spacing.md }]}
        onPress={handleBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back to landing"
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={24}
          color="rgba(0,245,255,0.78)"
        />
        <Text style={styles.backLabel}>BACK</Text>
      </Pressable>
      <View style={styles.background}>
        <View
          style={[styles.card, { width: formWidth }]}
          onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
        >
        <View style={styles.cardFlowLayer} pointerEvents="none">
          <Animated.View style={[styles.edgeTopFlow, { transform: [{ translateX: edgeFlowX }] }]}>
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(125,211,252,0.95)", "rgba(0,0,0,0)"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.edgeHLine}
            />
          </Animated.View>
          <Animated.View style={[styles.edgeBottomFlow, { transform: [{ translateX: edgeFlowX }] }]}>
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(125,211,252,0.7)", "rgba(0,0,0,0)"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.edgeHLine}
            />
          </Animated.View>
          <Animated.View style={[styles.edgeLeftFlow, { transform: [{ translateY: edgeFlowY }] }]}>
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(125,211,252,0.9)", "rgba(0,0,0,0)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.edgeVLine}
            />
          </Animated.View>
          <Animated.View style={[styles.edgeRightFlow, { transform: [{ translateY: edgeFlowY }] }]}>
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(125,211,252,0.72)", "rgba(0,0,0,0)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.edgeVLine}
            />
          </Animated.View>
        </View>
        <View style={styles.gridOverlay} pointerEvents="none" />
        <Text style={styles.brandWordmark}>UNITERZ</Text>
        <View style={styles.brandDivider}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.brandDividerFlowWrap,
              { transform: [{ translateX: lineTravel }] },
            ]}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0)", "rgba(103,232,249,0.95)", "rgba(0,0,0,0)"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.brandDividerFlow}
            />
          </Animated.View>
        </View>

      <Text style={[styles.title, mode === "signup" ? styles.titleLong : styles.titleShort]}>
        {title}
      </Text>

      <View style={styles.fieldWrap}>
        <LinearGradient
          colors={["#402fb5", "#1c191c", "#cf30aa", "#1c191c"]}
          locations={[0, 0.14, 0.6, 0.9]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inputFrame}
        >
          <View style={styles.inputInner}>
            <View style={styles.leftIconBox} pointerEvents="none">
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color="rgba(255,255,255,0.9)"
                style={styles.emailIcon}
              />
            </View>
            <TextInput
              style={[styles.input, styles.inputWithLeft]}
              placeholder="Email Address"
              placeholderTextColor="#c0b9c0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
        </LinearGradient>
      </View>

      <View style={styles.fieldWrap}>
        <LinearGradient
          colors={["#402fb5", "#1c191c", "#cf30aa", "#1c191c"]}
          locations={[0, 0.14, 0.6, 0.9]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inputFrame}
        >
          <View style={styles.inputInner}>
            <TextInput
              style={[styles.input, styles.inputWithRight]}
              placeholder="Password"
              placeholderTextColor="#c0b9c0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            <Pressable
              style={styles.rightEyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={16}
                color="rgba(255,255,255,0.9)"
              />
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      <Pressable
        style={[styles.primaryButtonWrap, submitting && styles.primaryButtonDisabled]}
        onPress={handleSubmit}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <LinearGradient
            colors={["#06b6d4", "#d946ef", "#7c3aed"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? submittingLabel : cta}
            </Text>
          </LinearGradient>
        </Animated.View>
      </Pressable>

        {mode === "login" ? (
          <>
            <Text style={styles.helperText}>
              パスワードをお忘れの方は
              <Text
                style={[styles.helperLink, styles.helperLinkReset]}
                onPress={handleResetPassword}
              >
                こちら
              </Text>
            </Text>
            <Text style={styles.helperText}>
              <Text style={styles.helperLink} onPress={() => setMode("signup")}>
                Create Account
              </Text>
            </Text>
          </>
        ) : (
          <Text style={styles.helperText}>
            すでにアカウントをお持ちの方は
            <Text style={styles.helperLink} onPress={() => setMode("login")}>
              {" Login"}
            </Text>
          </Text>
        )}
      </View>
      </View>
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  backgroundDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2,6,23,0.08)",
  },
  backBtn: {
    position: "absolute",
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingRight: 10,
  },
  backLabel: {
    color: "rgba(0,245,255,0.78)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginLeft: -2,
  },
  background: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
  },
  card: {
    position: "relative",
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: "rgba(8,14,24,0.72)",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 8,
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.34,
    shadowRadius: 30,
    elevation: 11,
  },
  cardFlowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.card,
    overflow: "hidden",
    zIndex: 5,
  },
  edgeTopFlow: {
    position: "absolute",
    top: 0,
    width: 100,
    height: 2,
  },
  edgeBottomFlow: {
    position: "absolute",
    bottom: 0,
    width: 100,
    height: 2,
  },
  edgeLeftFlow: {
    position: "absolute",
    left: 0,
    width: 2,
    height: 100,
  },
  edgeRightFlow: {
    position: "absolute",
    right: 0,
    width: 2,
    height: 100,
  },
  edgeHLine: {
    width: 100,
    height: 2,
  },
  edgeVLine: {
    width: 2,
    height: 100,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    backgroundColor: "transparent",
    borderRadius: radius.card,
  },
  brandWordmark: {
    color: "#e6e4de",
    fontFamily: "BebasNeue_400Regular",
    textAlign: "center",
    letterSpacing: 4.2,
    fontSize: 26,
    lineHeight: 26,
    marginBottom: 1,
    marginTop: 6,
  },
  brandDivider: {
    alignSelf: "center",
    width: "70%",
    maxWidth: 300,
    height: 1,
    marginBottom: 6,
    backgroundColor: "rgba(34,211,238,0.85)",
    shadowColor: "rgba(34,211,238,0.6)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
    overflow: "hidden",
  },
  brandDividerFlowWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 90,
  },
  brandDividerFlow: {
    width: 90,
    height: "100%",
  },
  title: {
    color: colors.textPrimary,
    fontFamily: "BebasNeue_400Regular",
    letterSpacing: 1.6,
    lineHeight: 38,
    textAlign: "center",
    marginBottom: 6,
  },
  titleShort: {
    fontSize: 33,
    letterSpacing: 1.2,
  },
  titleLong: {
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: 0.6,
  },
  inputFrame: {
    padding: 1.2,
    borderRadius: 12,
    shadowColor: "rgba(124,58,237,0.45)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: Platform.OS === "ios" ? 0.8 : 0,
    shadowRadius: 10,
  },
  fieldWrap: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  inputInner: {
    minHeight: 48,
    borderRadius: 11,
    backgroundColor: "#010201",
    position: "relative",
    justifyContent: "center",
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: 8,
    color: colors.textPrimary,
    fontSize: 16,
    minHeight: 44,
    backgroundColor: "transparent",
  },
  inputWithLeft: {
    paddingLeft: spacing.md,
    paddingRight: 52,
  },
  inputWithRight: {
    paddingRight: 50,
  },
  emailIcon: {
    textAlign: "center",
  },
  leftIconBox: {
    position: "absolute",
    right: 8,
    top: "50%",
    marginTop: -17,
    zIndex: 3,
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#151329",
    alignItems: "center",
    justifyContent: "center",
  },
  rightEyeButton: {
    position: "absolute",
    right: 8,
    top: "50%",
    marginTop: -17,
    zIndex: 3,
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#151329",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonWrap: {
    minHeight: 46,
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.28)",
  },
  primaryButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.textPrimary,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 3.0,
    lineHeight: 24,
    textAlign: "center",
    width: "100%",
    includeFontPadding: false,
    textAlignVertical: "center",
    transform: [{ translateY: 1 }],
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,21,38,0.84)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "600",
  },
  caption: {
    color: colors.accent,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  helperText: {
    color: "rgba(226,232,240,0.9)",
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
    textAlign: "center",
  },
  helperLink: {
    color: "#7dd3fc",
    textDecorationLine: "underline",
    fontFamily: "BebasNeue_400Regular",
    letterSpacing: 0.8,
    fontSize: 18,
  },
  helperLinkReset: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
