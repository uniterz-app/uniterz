import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";

export default function ProfileHomeScreen({
  bottomReserveY = 0,
  onSaved,
}: {
  /** フローティング下部ナビと被らないよう確保する余白（App.tsx から注入） */
  bottomReserveY?: number;
  onSaved?: () => void;
}) {
  const { fUser } = useFirebaseUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const isJa = language === "ja";
  const t = isJa
    ? {
        title: "PROFILE",
        loading: "読み込み中...",
        displayName: "表示名",
        displayNamePlaceholder: "表示名を入力",
        bio: "自己紹介",
        bioPlaceholder: "自己紹介を入力",
        language: "表示言語",
        save: "プロフィール保存",
        saving: "保存中...",
        account: "ログイン中アカウント",
        uid: "uid",
        logout: "ログアウト",
        invalidTitle: "入力不正",
        invalidName: "表示名は50文字以内で入力してください。",
        savedTitle: "保存完了",
        savedBody: "プロフィールを更新しました。",
        saveErrorTitle: "保存エラー",
        saveErrorBody: "プロフィール更新に失敗しました。",
      }
    : {
        title: "PROFILE",
        loading: "Loading...",
        displayName: "Display name",
        displayNamePlaceholder: "Enter display name",
        bio: "Bio",
        bioPlaceholder: "Enter bio",
        language: "Language",
        save: "Save profile",
        saving: "Saving...",
        account: "Signed-in account",
        uid: "uid",
        logout: "Log out",
        invalidTitle: "Invalid input",
        invalidName: "Display name must be 50 characters or fewer.",
        savedTitle: "Saved",
        savedBody: "Profile has been updated.",
        saveErrorTitle: "Save error",
        saveErrorBody: "Failed to update profile.",
      };

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!fUser?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "users", fUser.uid));
        if (!alive) return;
        const data = snap.data() as
          | { displayName?: unknown; bio?: unknown; language?: unknown }
          | undefined;
        setDisplayName(typeof data?.displayName === "string" ? data.displayName : "");
        setBio(typeof data?.bio === "string" ? data.bio : "");
        setLanguage(data?.language === "en" ? "en" : "ja");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [fUser?.uid]);

  async function handleSaveProfile() {
    if (!fUser?.uid || saving) return;
    const safeName = displayName.trim();
    const safeBio = bio.trim();
    if (safeName.length > 50) {
      Alert.alert(t.invalidTitle, t.invalidName);
      return;
    }
    setSaving(true);
    try {
      if (auth.currentUser && auth.currentUser.uid === fUser.uid) {
        await updateProfile(auth.currentUser, { displayName: safeName || null });
      }
      await setDoc(
        doc(db, "users", fUser.uid),
        {
          displayName: safeName,
          bio: safeBio,
          language,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      onSaved?.();
      Alert.alert(t.savedTitle, t.savedBody);
    } catch (error: any) {
      Alert.alert(t.saveErrorTitle, error?.message ?? t.saveErrorBody);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.card, { paddingBottom: spacing.lg + bottomReserveY }]}>
      <Text style={styles.title}>{t.title}</Text>
      {loading ? <Text style={styles.body}>{t.loading}</Text> : null}

      <Text style={styles.body}>{t.displayName}</Text>
      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
        placeholder={t.displayNamePlaceholder}
        placeholderTextColor={colors.textSecondary}
        maxLength={50}
      />
      <Text style={styles.metaText}>{displayName.length}/50</Text>
      <Text style={styles.body}>{t.bio}</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        style={[styles.input, styles.bioInput]}
        placeholder={t.bioPlaceholder}
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={280}
      />
      <Text style={styles.metaText}>{bio.length}/280</Text>
      <Text style={styles.body}>{t.language}</Text>
      <View style={styles.languageRow}>
        <Pressable
          style={[
            styles.languageChip,
            language === "ja" && styles.languageChipActive,
          ]}
          onPress={() => setLanguage("ja")}
        >
          <Text style={styles.languageChipText}>日本語</Text>
        </Pressable>
        <Pressable
          style={[
            styles.languageChip,
            language === "en" && styles.languageChipActive,
          ]}
          onPress={() => setLanguage("en")}
        >
          <Text style={styles.languageChipText}>English</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.saveButton, saving && styles.buttonDisabled]}
        onPress={() => void handleSaveProfile()}
        disabled={saving}
      >
        <Text style={styles.saveText}>{saving ? t.saving : t.save}</Text>
      </Pressable>

      <Text style={styles.body}>{t.account}</Text>
      <Text style={styles.value}>{fUser?.email ?? "-"}</Text>
      <Text style={styles.body}>{t.uid}</Text>
      <Text style={styles.value}>{fUser?.uid ?? "-"}</Text>

      <Pressable style={styles.logoutButton} onPress={() => void signOut(auth)}>
        <Text style={styles.logoutText}>{t.logout}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    maxHeight: "85%",
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
  title: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: "700",
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 11,
    alignSelf: "flex-end",
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,21,38,0.86)",
    color: colors.textPrimary,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bioInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  languageRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  languageChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,21,38,0.84)",
  },
  languageChipActive: {
    borderColor: "rgba(103,232,249,0.46)",
    backgroundColor: "rgba(124,92,255,0.22)",
  },
  languageChipText: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  saveButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(45,99,235,0.92)",
  },
  saveText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,21,38,0.84)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  logoutText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
