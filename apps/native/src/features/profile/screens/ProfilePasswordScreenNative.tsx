import { useState } from "react";
import { cyberAlert } from "../../../components/cyberAlert";
import {
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import SlantCtaNative from "../../../ui/SlantCtaNative";
import { auth } from "../../../lib/firebase";
import { useNativeUserLanguageFromAuth } from "../../../hooks/useNativeUserLanguage";
import { resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import { changePasswordUiCopy } from "../../../../../../lib/settings/changePasswordUiCopy";

export default function ProfilePasswordScreenNative() {
  const navigation = useNavigation();
  const { language } = useNativeUserLanguageFromAuth();
  const lang = resolveLocalizedLang(language);
  const labels = changePasswordUiCopy(lang);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

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
      description={labels.description}
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
          <SlantCtaNative
            label={saving ? labels.saving : labels.save}
            variant="accent"
            onPress={() => void handleSave()}
            disabled={saving}
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
