import { useState } from "react";
import { cyberAlert } from "../../../components/cyberAlert";
import {
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import PredictOverlaySubmitButtonNative from "../../games/PredictOverlaySubmitButtonNative";
import { auth } from "../../../lib/firebase";
import { useNativeUserLanguageFromAuth } from "../../../hooks/useNativeUserLanguage";

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
      cyberAlert("", labels.minLen);
      return;
    }
    if (next !== confirm) {
      cyberAlert("", labels.mismatch);
      return;
    }
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, current);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, next);
      cyberAlert("", labels.ok);
      navigation.goBack();
    } catch {
      cyberAlert("", labels.err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <LegalPageLayoutNative
      title="PASSWORD"
      description={
        isJa
          ? "ログイン用パスワードを変更できます。"
          : "Update the password you use to sign in."
      }
    >
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
        <View style={styles.ctaWrap}>
          <PredictOverlaySubmitButtonNative
            label={labels.save}
            disabledLabel={labels.saving}
            enabled={!saving}
            onPress={() => void handleSave()}
          />
        </View>
      </View>
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  formCard: {
    gap: 8,
  },
  label: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.75)", marginTop: 4 },
  input: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 255, 0.28)",
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#fff",
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  ctaWrap: {
    marginTop: 12,
  },
});
