import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import LegalPageLayoutNative from "../legal/LegalPageLayoutNative";
import { auth } from "../../lib/firebase";
import { useNativeUserLanguageFromAuth } from "../../hooks/useNativeUserLanguage";

export default function ProfilePasswordScreenNative() {
  const navigation = useNavigation();
  const { language } = useNativeUserLanguageFromAuth();
  const isJa = language === "ja";
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const labels = isJa
    ? {
        title: "パスワード変更",
        current: "現在のパスワード",
        next: "新しいパスワード",
        confirm: "新しいパスワード（確認）",
        save: "変更",
        saving: "変更中…",
        ok: "パスワードを変更しました。",
        err: "変更に失敗しました。",
        minLen: "新しいパスワードは6文字以上にしてください。",
        mismatch: "確認用パスワードが一致しません。",
      }
    : {
        title: "Change Password",
        current: "Current password",
        next: "New password",
        confirm: "Confirm new password",
        save: "Update",
        saving: "Updating…",
        ok: "Password updated.",
        err: "Update failed.",
        minLen: "New password must be at least 6 characters.",
        mismatch: "Confirmation does not match.",
      };

  async function handleSave() {
    const user = auth.currentUser;
    if (!user?.email) return;
    if (next.length < 6) {
      Alert.alert("", labels.minLen);
      return;
    }
    if (next !== confirm) {
      Alert.alert("", labels.mismatch);
      return;
    }
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, next);
      Alert.alert("", labels.ok);
      navigation.goBack();
    } catch {
      Alert.alert("", labels.err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <LegalPageLayoutNative title={labels.title}>
      <View style={styles.formCard}>
        <Text style={styles.label}>{labels.current}</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={current}
          onChangeText={setCurrent}
          placeholderTextColor="rgba(255,255,255,0.35)"
        />
        <Text style={styles.label}>{labels.next}</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={next}
          onChangeText={setNext}
          placeholderTextColor="rgba(255,255,255,0.35)"
        />
        <Text style={styles.label}>{labels.confirm}</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          placeholderTextColor="rgba(255,255,255,0.35)"
        />
        <Pressable
          style={[styles.cta, saving && { opacity: 0.7 }]}
          onPress={() => void handleSave()}
          disabled={saving}
        >
          <Text style={styles.ctaLabel}>{saving ? labels.saving : labels.save}</Text>
        </Pressable>
      </View>
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.5)",
    padding: 20,
    gap: 8,
  },
  label: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.75)", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  cta: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(0,245,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
  },
  ctaLabel: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
