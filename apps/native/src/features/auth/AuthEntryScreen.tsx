import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { FirebaseError } from "firebase/app";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { auth, db } from "../../lib/firebase";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";

type AuthMode = "login" | "signup";

function inferLanguage(): "ja" | "en" {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? "";
    return locale.toLowerCase().startsWith("ja") ? "ja" : "en";
  } catch {
    return "ja";
  }
}

function mapAuthErrorMessage(
  error: unknown,
  mode: AuthMode,
  language: "ja" | "en"
): string {
  const code = (error as FirebaseError | undefined)?.code ?? "";
  const ja = language === "ja";
  switch (code) {
    case "auth/invalid-credential":
      return ja
        ? "メールアドレスまたはパスワードが正しくありません。"
        : "Incorrect email address or password.";
    case "auth/user-not-found":
      return ja
        ? "このメールアドレスのユーザーは見つかりませんでした。"
        : "No user was found with this email address.";
    case "auth/wrong-password":
      return ja ? "パスワードが間違っています。" : "The password is incorrect.";
    case "auth/invalid-email":
      return ja
        ? "メールアドレスの形式が正しくありません。"
        : "The email format is invalid.";
    case "auth/email-already-in-use":
      return ja
        ? "このメールアドレスは既に登録されています。"
        : "This email address is already registered.";
    case "auth/weak-password":
      return ja
        ? "パスワードは6文字以上で入力してください。"
        : "Password must be at least 6 characters.";
    case "auth/network-request-failed":
      return ja
        ? "ネットワーク接続を確認して再試行してください。"
        : "Please check your network connection and try again.";
    case "auth/too-many-requests":
      return ja
        ? "試行回数が多すぎます。少し時間を空けてください。"
        : "Too many attempts. Please wait a while and try again.";
    default:
      return mode === "login"
        ? ja
          ? "ログインに失敗しました。入力内容を確認してください。"
          : "Login failed. Please check your input."
        : ja
        ? "アカウント作成に失敗しました。入力内容を確認してください。"
        : "Account creation failed. Please check your input.";
  }
}

export default function AuthEntryScreen() {
  const { status, fUser } = useFirebaseUser();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [language] = useState<"ja" | "en">(inferLanguage());
  const isJa = language === "ja";

  const title = useMemo(
    () =>
      mode === "login"
        ? isJa
          ? "ログイン"
          : "LOGIN"
        : isJa
        ? "アカウント作成"
        : "CREATE ACCOUNT",
    [mode, isJa]
  );

  const cta = useMemo(
    () =>
      mode === "login"
        ? isJa
          ? "ログイン"
          : "Log in"
        : isJa
        ? "アカウント作成"
        : "Create account",
    [mode, isJa]
  );

  async function handleSubmit() {
    if (submitting) return;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert(
        isJa ? "入力不足" : "Missing input",
        isJa
          ? "メールアドレスとパスワードを入力してください。"
          : "Please enter both email and password."
      );
      return;
    }
    if (mode === "signup" && password.length < 6) {
      Alert.alert(
        isJa ? "入力不足" : "Missing input",
        isJa
          ? "パスワードは6文字以上で入力してください。"
          : "Password must be at least 6 characters."
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
        isJa ? "認証エラー" : "Authentication error",
        mapAuthErrorMessage(error, mode, language)
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert(
        isJa ? "ログアウトエラー" : "Logout error",
        error?.message ??
          (isJa ? "ログアウトに失敗しました。" : "Failed to log out.")
      );
    }
  }

  if (status === "ready" && fUser) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{isJa ? "ログイン済み" : "Signed in"}</Text>
        <Text style={styles.body}>uid: {fUser.uid}</Text>
        <Text style={styles.body}>email: {fUser.email ?? "-"}</Text>
        <Pressable style={styles.secondaryButton} onPress={handleLogout}>
          <Text style={styles.secondaryButtonText}>
            {isJa ? "ログアウト" : "Log out"}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.modeRow}>
        <Pressable
          style={[styles.modeChip, mode === "login" && styles.modeChipActive]}
          onPress={() => setMode("login")}
        >
          <Text style={[styles.modeText, mode === "login" && styles.modeTextActive]}>
            {isJa ? "ログイン" : "LOGIN"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeChip, mode === "signup" && styles.modeChipActive]}
          onPress={() => setMode("signup")}
        >
          <Text style={[styles.modeText, mode === "signup" && styles.modeTextActive]}>
            {isJa ? "新規登録" : "SIGNUP"}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>
        {isJa
          ? "UIテイストを維持しながら、モバイル寸法向けに認証導線を移植中です。"
          : "Porting auth flow to mobile while preserving the web UI style."}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={isJa ? "メールアドレス" : "Email address"}
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder={isJa ? "パスワード" : "Password"}
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={mode === "login" ? "current-password" : "new-password"}
      />

      <Pressable
        style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
        onPress={handleSubmit}
      >
        <Text style={styles.primaryButtonText}>
          {submitting ? (isJa ? "処理中..." : "Processing...") : cta}
        </Text>
      </Pressable>

      <Text style={styles.caption}>
        {isJa ? "認証状態" : "Auth status"}: {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    marginHorizontal: spacing.xs,
    backgroundColor: "#0b1120",
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 5,
  },
  modeRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  modeChip: {
    flex: 1,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: spacing.xs,
    alignItems: "center",
    backgroundColor: "rgba(15,21,38,0.84)",
  },
  modeChipActive: {
    borderColor: "rgba(103,232,249,0.46)",
    backgroundColor: "rgba(124,92,255,0.22)",
  },
  modeText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  modeTextActive: {
    color: colors.textPrimary,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "700",
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.body,
    minHeight: 44,
    backgroundColor: "rgba(15,21,38,0.86)",
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(45,99,235,0.92)",
    marginTop: spacing.xs,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "700",
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
});
