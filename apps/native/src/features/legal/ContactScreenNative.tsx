import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc } from "firebase/firestore";
import LegalPageLayoutNative from "./LegalPageLayoutNative";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";
import { db, storage } from "../../lib/firebase";

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? "";

export type ContactType = "bug" | "feature" | "report" | "other";

type Props = {
  initialType?: ContactType;
  hideTypeSelect?: boolean;
  /** feature-request ページ用 */
  variant?: "contact" | "featureRequest";
};

export default function ContactScreenNative({
  initialType = "bug",
  hideTypeSelect = false,
  variant = "contact",
}: Props) {
  const navigation = useNavigation();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const isJa = language === "ja";
  const isFeature = variant === "featureRequest";

  const [type, setType] = useState<ContactType>(initialType);
  const [email, setEmail] = useState(fUser?.email ?? "");
  const [message, setMessage] = useState("");
  const [handle, setHandle] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (!fUser?.uid) return;
    void getDoc(doc(db, "users", fUser.uid)).then((snap) => {
      setHandle(typeof snap.data()?.handle === "string" ? snap.data()?.handle : null);
    });
  }, [fUser?.uid]);

  const labels = isJa
    ? {
        title: isFeature ? "機能リクエスト" : "お問い合わせ",
        description: isFeature
          ? "Uniterz で実装してほしい機能や改善案をお送りください。"
          : "不具合報告・ご要望・お問い合わせはこちらから送信できます。",
        intro: isFeature
          ? "送信いただいた要望は運営チームで確認し、今後の改善に活用します。"
          : "support@uniterz.app へのメールでもお問い合わせいただけます。",
        types: { bug: "不具合", feature: "要望", report: "報告", other: "その他" },
        email: "メールアドレス（任意）",
        message: "メッセージ",
        attach: "スクリーンショットを添付",
        submit: "送信",
        submitting: "送信中…",
        success: "送信完了",
        successBody: "お問い合わせを受け付けました。",
        err: "送信に失敗しました。",
        needMsg: "メッセージを10文字以上入力してください。",
        needApi: "API が未設定です。",
        updated: "最終更新: ",
      }
    : {
        title: isFeature ? "Feature Request" : "Contact",
        description: isFeature
          ? "Share feature ideas and improvements you want to see in Uniterz."
          : "Report bugs, send feedback, or contact us here.",
        intro: isFeature
          ? "Your request will be reviewed by the team."
          : "You can also email support@uniterz.app.",
        types: { bug: "Bug", feature: "Feature", report: "Report", other: "Other" },
        email: "Email (optional)",
        message: "Message",
        attach: "Attach screenshot",
        submit: "Send",
        submitting: "Sending…",
        success: "Sent",
        successBody: "We received your message.",
        err: "Failed to send.",
        needMsg: "Please enter at least 10 characters.",
        needApi: "API is not configured.",
        updated: "Last updated: ",
      };

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!picked.canceled && picked.assets[0]) {
      setImageUri(picked.assets[0].uri);
    }
  }

  async function uploadScreenshot(): Promise<string> {
    if (!imageUri || !fUser?.uid) return "";
    const res = await fetch(imageUri);
    const buf = await res.arrayBuffer();
    const fileRef = ref(storage, `contact_screenshots/${fUser.uid}/${Date.now()}.jpg`);
    await uploadBytes(fileRef, new Uint8Array(buf), { contentType: "image/jpeg" });
    return getDownloadURL(fileRef);
  }

  async function handleSubmit() {
    if (message.trim().length < 10) {
      Alert.alert("", labels.needMsg);
      return;
    }
    if (!API_BASE) {
      Alert.alert("", labels.needApi);
      return;
    }
    setSubmitting(true);
    try {
      let screenshotUrl = "";
      if (imageUri) screenshotUrl = await uploadScreenshot();
      const token = fUser ? await fUser.getIdToken() : undefined;
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type,
          email: email.trim(),
          message: message.trim(),
          screenshotUrl: screenshotUrl || undefined,
          handle: handle ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSubmitted(true);
    } catch {
      Alert.alert("", labels.err);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <LegalPageLayoutNative title={labels.title} description={labels.description}>
        <View style={styles.successBox}>
          <MaterialCommunityIcons name="check-circle-outline" size={40} color="#67e8f9" />
          <Text style={styles.successTitle}>{labels.success}</Text>
          <Text style={styles.successBody}>{labels.successBody}</Text>
          <Pressable style={styles.submitBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.submitBtnText}>OK</Text>
          </Pressable>
        </View>
      </LegalPageLayoutNative>
    );
  }

  return (
    <LegalPageLayoutNative
      title={labels.title}
      description={labels.description}
      updatedAt={isFeature ? "2026-04-10" : "2026-03-23"}
      lastUpdatedLabel={labels.updated}
    >
      <Text style={styles.intro}>{labels.intro}</Text>
      {!isFeature ? (
        <Text style={styles.emailHint}>
          support@uniterz.app
        </Text>
      ) : null}

      <View style={styles.formCard}>
        {!hideTypeSelect ? (
          <View style={styles.chipRow}>
            {(["bug", "feature", "report", "other"] as const).map((id) => (
              <Pressable
                key={id}
                style={[styles.chip, type === id && styles.chipActive]}
                onPress={() => setType(id)}
              >
                <Text style={[styles.chipLabel, type === id && styles.chipLabelActive]}>
                  {labels.types[id]}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>{labels.email}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="rgba(255,255,255,0.35)"
        />

        <Text style={styles.fieldLabel}>{labels.message}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={message}
          onChangeText={setMessage}
          multiline
          placeholderTextColor="rgba(255,255,255,0.35)"
        />

        <Pressable style={styles.attachBtn} onPress={() => void pickImage()}>
          <MaterialCommunityIcons name="image-outline" size={18} color="#67e8f9" />
          <Text style={styles.attachLabel}>{labels.attach}</Text>
        </Pressable>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        ) : null}

        <Pressable
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={() => void handleSubmit()}
          disabled={submitting}
        >
          <MaterialCommunityIcons name="send" size={16} color="#fff" />
          <Text style={styles.submitBtnText}>{submitting ? labels.submitting : labels.submit}</Text>
        </Pressable>
      </View>
    </LegalPageLayoutNative>
  );
}

export function FeatureRequestScreenNative() {
  return <ContactScreenNative initialType="feature" hideTypeSelect variant="featureRequest" />;
}

const styles = StyleSheet.create({
  intro: { fontSize: 12, lineHeight: 18, color: "rgba(255,255,255,0.75)", marginBottom: 8 },
  emailHint: { fontSize: 12, color: "#7dd3fc", fontWeight: "600", marginBottom: 16 },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(15,23,42,0.5)",
    padding: 20,
    gap: 10,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipActive: {
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.1)",
  },
  chipLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: "600" },
  chipLabelActive: { color: "#67e8f9" },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.75)", marginTop: 4 },
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
  textarea: { minHeight: 120, textAlignVertical: "top" },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  attachLabel: { fontSize: 13, color: "#67e8f9", fontWeight: "600" },
  preview: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  submitBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: "rgba(0,245,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
  },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  successBox: { alignItems: "center", gap: 12, paddingVertical: 32 },
  successTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  successBody: { fontSize: 14, color: "rgba(255,255,255,0.75)", textAlign: "center" },
});
