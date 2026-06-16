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
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { colors, spacing } from "../../theme/tokens";

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

type Props = { initialType?: "bug" | "feature" | "report" | "other" };

export default function ContactScreenNative({ initialType = "bug" }: Props) {
  const navigation = useNavigation();
  const { fUser } = useFirebaseUser();
  const [type, setType] = useState(initialType);
  const [email, setEmail] = useState(fUser?.email ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!message.trim()) {
      Alert.alert("", "メッセージを入力してください。");
      return;
    }
    if (!API_BASE) {
      Alert.alert("", "API が未設定です。");
      return;
    }
    setSubmitting(true);
    try {
      const token = fUser ? await fUser.getIdToken() : undefined;
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type, email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      Alert.alert("送信完了", "お問い合わせを受け付けました。");
      navigation.goBack();
    } catch {
      Alert.alert("エラー", "送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MobilePageShell title="お問い合わせ" onClose={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          {(
            [
              ["bug", "不具合"],
              ["feature", "要望"],
              ["report", "報告"],
              ["other", "その他"],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              style={[styles.chip, type === id && styles.chipActive]}
              onPress={() => setType(id)}
            >
              <Text style={[styles.chipLabel, type === id && styles.chipLabelActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="メッセージ"
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <Pressable style={styles.cta} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.ctaLabel}>{submitting ? "送信中..." : "送信"}</Text>
        </Pressable>
      </ScrollView>
    </MobilePageShell>
  );
}

export function FeatureRequestScreenNative() {
  return <ContactScreenNative initialType="feature" />;
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  chipActive: { borderColor: colors.accentCyan, backgroundColor: "rgba(34,211,238,0.12)" },
  chipLabel: { color: colors.textSecondary, fontSize: 13 },
  chipLabelActive: { color: colors.accentCyan },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  textarea: { minHeight: 120, textAlignVertical: "top" },
  cta: {
    backgroundColor: "rgba(34,211,238,0.18)",
    borderWidth: 1,
    borderColor: colors.accentCyan,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "700", fontSize: 16 },
});
