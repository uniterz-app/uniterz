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
import { colors } from "../../theme/tokens";

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            メールでのお問い合わせは{" "}
            <Text style={styles.noticeEmail}>support@uniterz.app</Text>
            までご連絡ください。
          </Text>
          <Text style={styles.updated}>最終更新: 2026-03-23</Text>
        </View>
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
  content: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 64, gap: 16 },
  notice: {
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.035)",
    padding: 14,
  },
  noticeText: { color: "rgba(226,232,240,0.8)", fontSize: 12, lineHeight: 20 },
  noticeEmail: { color: "rgb(125,211,252)", fontWeight: "700" },
  updated: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
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
  textarea: { minHeight: 120, textAlignVertical: "top" },
  cta: {
    backgroundColor: "rgba(14,165,233,0.24)",
    borderWidth: 1,
    borderColor: "rgba(125,211,252,0.45)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaLabel: { color: colors.textPrimary, fontWeight: "700", fontSize: 16 },
});
