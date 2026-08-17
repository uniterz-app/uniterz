/**
 * アカウント削除（Apple 要件向け in-app 導線）
 */
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
} from "firebase/auth";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import { deleteMeAccountNative } from "../accountApiNative";
import { auth } from "../../../lib/firebase";
import { cyberAlert } from "../../../components/cyberAlert";
import { useNativeUserLanguageFromAuth } from "../../../hooks/useNativeUserLanguage";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";

export default function DeleteAccountScreenNative() {
  const navigation = useNavigation();
  const { language } = useNativeUserLanguageFromAuth();
  const isJa = language === "ja";
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  const user = auth.currentUser;
  const isPasswordUser = useMemo(
    () =>
      Boolean(
        user?.providerData.some((p) => p.providerId === "password")
      ),
    [user]
  );

  const labels = isJa
    ? {
        title: "アカウント削除",
        desc:
          "アカウントを削除すると、プロフィール情報は消去され、ログインできなくなります。投稿データなどの一部はシステム上に残る場合があります。",
        proNote:
          "Pro をご利用の場合は、削除前に App Store / Google Play でサブスクリプションを解約してください。",
        password: "現在のパスワード",
        typeDelete: "確認のため DELETE と入力",
        placeholder: "DELETE",
        submit: "アカウントを削除する",
        submitting: "削除中…",
        needDelete: "確認のため DELETE と入力してください。",
        needPassword: "パスワードを入力してください。",
        done: "アカウントを削除しました。",
        fail: "削除に失敗しました。時間をおいて再度お試しください。",
      }
    : {
        title: "Delete Account",
        desc:
          "Deleting your account removes your profile and you will no longer be able to sign in. Some historical data may remain in the system.",
        proNote:
          "If you have Pro, cancel your subscription in the App Store / Google Play before deleting.",
        password: "Current password",
        typeDelete: 'Type DELETE to confirm',
        placeholder: "DELETE",
        submit: "Delete my account",
        submitting: "Deleting…",
        needDelete: 'Please type DELETE to confirm.',
        needPassword: "Please enter your password.",
        done: "Your account has been deleted.",
        fail: "Deletion failed. Please try again later.",
      };

  async function handleDelete() {
    if (!user) return;
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      cyberAlert("", labels.needDelete);
      return;
    }
    if (isPasswordUser) {
      if (!password || !user.email) {
        cyberAlert("", labels.needPassword);
        return;
      }
    }

    setBusy(true);
    try {
      if (isPasswordUser && user.email) {
        const cred = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, cred);
      }
      await deleteMeAccountNative();
      try {
        await signOut(auth);
      } catch {
        // Auth 削除済みでも signOut は試みる
      }
      cyberAlert("", labels.done);
    } catch {
      cyberAlert("", labels.fail);
    } finally {
      setBusy(false);
    }
  }

  return (
    <LegalPageLayoutNative title="DELETE" description={labels.desc}>
      <View style={styles.card}>
        <Text style={styles.desc}>{labels.desc}</Text>
        <Text style={styles.proNote}>{labels.proNote}</Text>

        {isPasswordUser ? (
          <>
            <Text style={styles.label}>{labels.password}</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoCapitalize="none"
              editable={!busy}
            />
          </>
        ) : null}

        <Text style={styles.label}>{labels.typeDelete}</Text>
        <TextInput
          style={styles.input}
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder={labels.placeholder}
          placeholderTextColor="rgba(255,255,255,0.35)"
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!busy}
        />

        <Pressable
          style={[styles.dangerBtn, busy && { opacity: 0.7 }]}
          disabled={busy}
          onPress={() => void handleDelete()}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.dangerText}>{labels.submit}</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.backBtn}
          disabled={busy}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>{isJa ? "戻る" : "Back"}</Text>
        </Pressable>
      </View>
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(9,14,24,0.94)",
    padding: 16,
    gap: 10,
  },
  desc: {
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.62)",
  },
  proNote: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(251,191,36,0.85)",
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.35)",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  dangerBtn: {
    marginTop: 8,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.55)",
    backgroundColor: "rgba(251,113,133,0.14)",
  },
  dangerText: {
    color: "rgba(254,205,211,0.98)",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  backBtn: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
  },
  backText: {
    color: CYBER_TAB_CYAN,
    fontSize: 13,
    fontWeight: "700",
  },
});
