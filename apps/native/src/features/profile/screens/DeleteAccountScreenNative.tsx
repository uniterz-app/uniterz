/**
 * アカウント削除（Apple 要件向け in-app 導線）
 * 白黒四角パネル中央配置。削除／戻るボタン色は維持。
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
import { deleteAccountCopy } from "../deleteAccountCopy";

export default function DeleteAccountScreenNative() {
  const navigation = useNavigation();
  const { language } = useNativeUserLanguageFromAuth();
  const labels = deleteAccountCopy(language);
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
    <LegalPageLayoutNative
      title="DELETE"
      description={labels.desc}
      contentStyle={styles.shellContent}
    >
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.heading}>{labels.title}</Text>
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
                textAlign="center"
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
            textAlign="center"
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
            <Text style={styles.backText}>{labels.back}</Text>
          </Pressable>
        </View>
      </View>
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  shellContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  center: {
    width: "100%",
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 384,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "#000000",
    paddingHorizontal: 20,
    paddingVertical: 22,
    gap: 12,
  },
  heading: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "#ffffff",
  },
  desc: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.72)",
  },
  proNote: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.55)",
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.55)",
    textTransform: "uppercase",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#000000",
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
