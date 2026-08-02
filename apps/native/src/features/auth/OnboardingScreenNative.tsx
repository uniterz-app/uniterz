import { useEffect, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import AuthFormShellNative from "./AuthFormShellNative";
import { colors, spacing } from "../../theme/tokens";
import { LEAGUES } from "../../../../../lib/leagues";
import { hideNativeBootSplash } from "../../bootstrap/nativeBootSplash";

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

export default function OnboardingScreenNative() {
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    hideNativeBootSplash();
  }, []);

  const canSubmit = displayName.trim().length > 0;

  async function handleSubmit() {
    const user = auth.currentUser;
    if (!user || !canSubmit) return;
    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const existing = snap.exists() ? snap.data() : {};

      const body = {
        displayName: displayName.trim(),
        language,
        preferredLeague: LEAGUES.NBA,
        countryCode: existing.countryCode ?? "",
      };

      if (API_BASE) {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE}/api/me/profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("profile save failed");
      } else {
        const { setDoc, serverTimestamp } = await import("firebase/firestore");
        const handle = displayName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 20);
        await setDoc(
          userRef,
          {
            ...body,
            handle: existing.handle || handle,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (e) {
      cyberAlert("Error", "プロフィールの保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <AuthFormShellNative title="WELCOME">
        <Text style={styles.desc}>表示名と言語を設定してください</Text>
        <TextInput
          style={styles.input}
          placeholder="Display Name"
          placeholderTextColor={colors.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <View style={styles.row}>
          {(["ja", "en"] as const).map((lang) => (
            <Pressable
              key={lang}
              style={[styles.chip, language === lang && styles.chipActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[styles.chipLabel, language === lang && styles.chipLabelActive]}>
                {lang === "ja" ? "日本語" : "English"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={[styles.cta, !canSubmit && styles.ctaDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || saving}
        >
          <Text style={styles.ctaLabel}>{saving ? "Saving..." : "GET STARTED"}</Text>
        </Pressable>
      </AuthFormShellNative>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: "center", paddingVertical: spacing.xl },
  desc: { color: colors.textSecondary, fontSize: 14, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.62)",
    borderRadius: 12,
    backgroundColor: "#010201",
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 16,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(15,23,42,0.72)",
    justifyContent: "center",
  },
  chipActive: { borderColor: "rgba(103,232,249,0.45)", backgroundColor: "rgba(6,182,212,0.18)" },
  chipLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  chipLabelActive: { color: "#7dd3fc" },
  cta: {
    minHeight: 46,
    backgroundColor: "rgba(6,182,212,0.26)",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.45)",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaLabel: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 19,
    letterSpacing: 3,
    color: colors.textPrimary,
  },
});
