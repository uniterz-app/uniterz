import { useEffect, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
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
import { SUPPORT_EMAIL } from "@/lib/contact/companyEmails";
import { L, resolveLocalizedLang } from "../../../../../lib/i18n/localize";

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
  const lang = resolveLocalizedLang(language);
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

  const labels = {
    title: isFeature
      ? L(lang, {
          ja: "機能リクエスト",
          en: "Feature Request",
          ko: "기능 요청",
          zh: "功能请求",
          es: "Solicitud de función",
          pt: "Pedido de recurso",
          fr: "Demande de fonctionnalité",
        })
      : L(lang, {
          ja: "お問い合わせ",
          en: "Contact",
          ko: "문의",
          zh: "联系我们",
          es: "Contacto",
          pt: "Contato",
          fr: "Contact",
        }),
    description: isFeature
      ? L(lang, {
          ja: "Uniterz で実装してほしい機能や改善案をお送りください。",
          en: "Share feature ideas and improvements you want to see in Uniterz.",
          ko: "Uniterz에 원하는 기능·개선안을 보내 주세요.",
          zh: "请提交您希望 Uniterz 实现的功能或改进建议。",
          es: "Comparte ideas y mejoras que quieras ver en Uniterz.",
          pt: "Compartilhe ideias e melhorias que deseja no Uniterz.",
          fr: "Partagez les idées et améliorations que vous voulez pour Uniterz.",
        })
      : L(lang, {
          ja: "不具合報告・ご要望・お問い合わせはこちらから送信できます。",
          en: "Report bugs, send feedback, or contact us here.",
          ko: "버그 제보·요청·문의는 여기서 보낼 수 있습니다.",
          zh: "可在此提交故障报告、反馈或联系我们。",
          es: "Informa errores, envía comentarios o contáctanos aquí.",
          pt: "Relate bugs, envie feedback ou fale conosco aqui.",
          fr: "Signalez des bugs, envoyez des retours ou contactez-nous ici.",
        }),
    intro: isFeature
      ? L(lang, {
          ja: "送信いただいた要望は運営チームで確認し、今後の改善に活用します。",
          en: "Your request will be reviewed by the team.",
          ko: "보내주신 요청은 운영팀이 검토해 개선에 활용합니다.",
          zh: "您提交的请求将由运营团队审核并用于后续改进。",
          es: "Tu solicitud será revisada por el equipo.",
          pt: "Seu pedido será analisado pela equipe.",
          fr: "Votre demande sera examinée par l’équipe.",
        })
      : L(lang, {
          ja: `${SUPPORT_EMAIL} へのメールでもお問い合わせいただけます。`,
          en: `You can also email ${SUPPORT_EMAIL}.`,
          ko: `${SUPPORT_EMAIL}로도 문의할 수 있습니다.`,
          zh: `也可发送邮件至 ${SUPPORT_EMAIL}。`,
          es: `También puedes escribir a ${SUPPORT_EMAIL}.`,
          pt: `Você também pode e-mail ${SUPPORT_EMAIL}.`,
          fr: `Vous pouvez aussi écrire à ${SUPPORT_EMAIL}.`,
        }),
    types: {
      bug: L(lang, { ja: "不具合", en: "Bug", ko: "버그", zh: "故障", es: "Error", pt: "Bug", fr: "Bug" }),
      feature: L(lang, { ja: "要望", en: "Feature", ko: "요청", zh: "功能", es: "Función", pt: "Recurso", fr: "Fonctionnalité" }),
      report: L(lang, { ja: "報告", en: "Report", ko: "신고", zh: "举报", es: "Informe", pt: "Denúncia", fr: "Signalement" }),
      other: L(lang, { ja: "その他", en: "Other", ko: "기타", zh: "其他", es: "Otro", pt: "Outro", fr: "Autre" }),
    },
    email: L(lang, {
      ja: "メールアドレス（任意）",
      en: "Email (optional)",
      ko: "이메일(선택)",
      zh: "邮箱（可选）",
      es: "Email (opcional)",
      pt: "E-mail (opcional)",
      fr: "E-mail (facultatif)",
    }),
    message: L(lang, {
      ja: "メッセージ",
      en: "Message",
      ko: "메시지",
      zh: "留言",
      es: "Mensaje",
      pt: "Mensagem",
      fr: "Message",
    }),
    attach: L(lang, {
      ja: "スクリーンショットを添付",
      en: "Attach screenshot",
      ko: "스크린샷 첨부",
      zh: "附加截图",
      es: "Adjuntar captura",
      pt: "Anexar captura",
      fr: "Joindre une capture",
    }),
    submit: L(lang, { ja: "送信", en: "Send", ko: "보내기", zh: "发送", es: "Enviar", pt: "Enviar", fr: "Envoyer" }),
    submitting: L(lang, {
      ja: "送信中…",
      en: "Sending…",
      ko: "보내는 중…",
      zh: "发送中…",
      es: "Enviando…",
      pt: "Enviando…",
      fr: "Envoi…",
    }),
    success: L(lang, { ja: "送信完了", en: "Sent", ko: "전송 완료", zh: "已发送", es: "Enviado", pt: "Enviado", fr: "Envoyé" }),
    successBody: L(lang, {
      ja: "お問い合わせを受け付けました。",
      en: "We received your message.",
      ko: "문의가 접수되었습니다.",
      zh: "我们已收到您的消息。",
      es: "Recibimos tu mensaje.",
      pt: "Recebemos sua mensagem.",
      fr: "Nous avons reçu votre message.",
    }),
    err: L(lang, {
      ja: "送信に失敗しました。",
      en: "Failed to send.",
      ko: "전송에 실패했습니다.",
      zh: "发送失败。",
      es: "Error al enviar.",
      pt: "Falha ao enviar.",
      fr: "Échec de l’envoi.",
    }),
    needMsg: L(lang, {
      ja: "メッセージを10文字以上入力してください。",
      en: "Please enter at least 10 characters.",
      ko: "메시지를 10자 이상 입력하세요.",
      zh: "请输入至少 10 个字符。",
      es: "Introduce al menos 10 caracteres.",
      pt: "Digite pelo menos 10 caracteres.",
      fr: "Saisissez au moins 10 caractères.",
    }),
    needApi: L(lang, {
      ja: "API が未設定です。",
      en: "API is not configured.",
      ko: "API가 설정되지 않았습니다.",
      zh: "未配置 API。",
      es: "La API no está configurada.",
      pt: "API não configurada.",
      fr: "API non configurée.",
    }),
    updated: L(lang, {
      ja: "最終更新: ",
      en: "Last updated: ",
      ko: "최종 업데이트: ",
      zh: "最后更新：",
      es: "Última actualización: ",
      pt: "Última atualização: ",
      fr: "Dernière mise à jour : ",
    }),
    rateLimit: L(lang, {
      ja: "送信上限に達しました。明日またお試しください。",
      en: "Daily limit reached. Try again tomorrow.",
      ko: "일일 전송 한도에 도달했습니다. 내일 다시 시도하세요.",
      zh: "已达每日发送上限。请明天再试。",
      es: "Límite diario alcanzado. Inténtalo mañana.",
      pt: "Limite diário atingido. Tente amanhã.",
      fr: "Limite quotidienne atteinte. Réessayez demain.",
    }),
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
      cyberAlert("", labels.needMsg);
      return;
    }
    if (!API_BASE) {
      cyberAlert("", labels.needApi);
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
      if (!res.ok) {
        if (res.status === 429) {
          cyberAlert("", labels.rateLimit);
          return;
        }
        throw new Error("failed");
      }
      setSubmitted(true);
    } catch {
      cyberAlert("", labels.err);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <LegalPageLayoutNative
        title={isFeature ? "REQUEST" : "CONTACT"}
        description={labels.description}
      >
        <View style={styles.successBox}>
          <MaterialCommunityIcons name="check-circle-outline" size={40} color="#ffffff" />
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
      title={isFeature ? "REQUEST" : "CONTACT"}
      description={labels.description}
      updatedAt={isFeature ? "2026-04-10" : "2026-03-23"}
      lastUpdatedLabel={labels.updated}
    >
      <Text style={styles.intro}>{labels.intro}</Text>
      {!isFeature ? (
        <Text style={styles.emailHint}>{SUPPORT_EMAIL}</Text>
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
          placeholderTextColor="rgba(255,255,255,0.4)"
        />

        <Text style={styles.fieldLabel}>{labels.message}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={message}
          onChangeText={setMessage}
          multiline
          placeholderTextColor="rgba(255,255,255,0.4)"
        />

        <Pressable style={styles.attachBtn} onPress={() => void pickImage()}>
          <MaterialCommunityIcons name="image-outline" size={18} color="#ffffff" />
          <Text style={styles.attachLabel}>{labels.attach}</Text>
        </Pressable>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        ) : null}

        <Pressable
          style={[styles.submitBtn, submitting && { opacity: 0.55 }]}
          onPress={() => void handleSubmit()}
          disabled={submitting}
        >
          <MaterialCommunityIcons name="send" size={16} color="#000000" />
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
  emailHint: { fontSize: 12, color: "#ffffff", fontWeight: "600", marginBottom: 16 },
  formCard: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#000000",
    padding: 20,
    gap: 10,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#000000",
  },
  chipActive: {
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
  },
  chipLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  chipLabelActive: { color: "#000000" },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.7)", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#ffffff",
    fontSize: 14,
    backgroundColor: "#000000",
  },
  textarea: { minHeight: 120, textAlignVertical: "top" },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#000000",
  },
  attachLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  preview: {
    width: "100%",
    height: 120,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  submitBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 0,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  submitBtnText: { color: "#000000", fontWeight: "700", fontSize: 15 },
  successBox: { alignItems: "center", gap: 12, paddingVertical: 32 },
  successTitle: { fontSize: 18, fontWeight: "700", color: "#ffffff" },
  successBody: { fontSize: 14, color: "rgba(255,255,255,0.75)", textAlign: "center" },
});
