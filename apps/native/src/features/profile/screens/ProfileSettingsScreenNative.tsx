import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { auth, db } from "../../../lib/firebase";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { colors, spacing } from "../../../theme/tokens";

export default function ProfileSettingsScreenNative() {
  const navigation = useNavigation();
  const { fUser } = useFirebaseUser();
  const [displayName, setDisplayName] = useState(fUser?.displayName ?? "");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!fUser) return;
    setSaving(true);
    try {
      await updateProfile(fUser, { displayName: displayName.trim() });
      await setDoc(
        doc(db, "users", fUser.uid),
        { displayName: displayName.trim(), bio: bio.trim(), updatedAt: serverTimestamp() },
        { merge: true }
      );
      Alert.alert("", "保存しました。");
      navigation.goBack();
    } catch {
      Alert.alert("エラー", "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobilePageShell title="プロフィール編集" onClose={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>表示名</Text>
        <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, styles.textarea]} value={bio} onChangeText={setBio} multiline />
        <Pressable style={styles.cta} onPress={handleSave} disabled={saving}>
          <Text style={styles.ctaLabel}>{saving ? "保存中..." : "保存"}</Text>
        </Pressable>
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm },
  label: { color: colors.textSecondary, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
  },
  textarea: { minHeight: 80, textAlignVertical: "top" },
  cta: {
    marginTop: spacing.md,
    backgroundColor: "rgba(34,211,238,0.18)",
    borderWidth: 1,
    borderColor: colors.accentCyan,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "700" },
});
