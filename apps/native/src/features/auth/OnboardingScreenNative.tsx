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
import { doc, getDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../../lib/firebase";
import AuthFormShellNative from "./AuthFormShellNative";
import { colors, spacing } from "../../theme/tokens";
import type { PreferredLeague } from "../../../../../lib/user/preferredLeague";

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

export default function OnboardingScreenNative() {
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const [preferredLeague, setPreferredLeague] = useState<PreferredLeague | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = displayName.trim().length > 0 && preferredLeague !== null;

  async function handleSubmit() {
    const user = auth.currentUser;
    if (!user || !canSubmit || !preferredLeague) return;
    setSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const existing = snap.exists() ? snap.data() : {};

      const body = {
        displayName: displayName.trim(),
        language,
        preferredLeague,
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
      Alert.alert("Error", "プロフィールの保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <AuthFormShellNative title="WELCOME">
        <Text style={styles.desc}>表示名とリーグを設定してください</Text>
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
        <View style={styles.row}>
          {(
            [
              ["nba", "NBA"],
              ["wc", "World Cup"],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              style={[styles.chip, preferredLeague === id && styles.chipActive]}
              onPress={() => setPreferredLeague(id as PreferredLeague)}
            >
              <Text
                style={[
                  styles.chipLabel,
                  preferredLeague === id && styles.chipLabelActive,
                ]}
              >
                {label}
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
    minHeight: 52,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    backgroundColor: "#010201",
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: colors.textPrimary,
    fontSize: 16,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  chipActive: { borderColor: colors.accentCyan, backgroundColor: "rgba(34,211,238,0.12)" },
  chipLabel: { color: colors.textSecondary, fontSize: 13 },
  chipLabelActive: { color: colors.accentCyan },
  cta: {
    backgroundColor: "rgba(124,58,237,0.88)",
    borderWidth: 0,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "rgba(6,182,212,0.55)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 8,
  },
  ctaDisabled: { opacity: 0.5 },
  ctaLabel: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 20,
    letterSpacing: 1.5,
    color: colors.textPrimary,
  },
});
