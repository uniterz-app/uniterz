/**
 * GET STARTED 直後の同意ゲート。
 * 利用規約・プライバシーの両方にチェックしてから登録画面へ進む。
 * 本文は別スタックに出さず、ゲート内で開いて BACK で戻る。
 * 言語: 端末設定が日本語なら ja、それ以外は en。
 */
import { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ModalActionButtonNative,
  ModalActionRowNative,
} from "../../ui/ModalActionButtonNative";
import UniterzLogoNative from "../profile/UniterzLogoNative";
import ProfileBackEdgeHandleNative from "../profile/ProfileBackEdgeHandleNative";
import LegalDocumentNative from "../legal/LegalDocumentNative";
import { AUTH_LANDING } from "./authLandingPalette";
import {
  PRIVACY_FOOTER,
  PRIVACY_INTRO,
  PRIVACY_PREAMBLE,
  PRIVACY_SECTIONS,
  PRIVACY_UPDATED_AT,
} from "@/lib/legal/privacyCopy";
import {
  TERMS_FOOTER,
  TERMS_INTRO,
  TERMS_PREAMBLE,
  TERMS_SECTIONS,
  TERMS_UPDATED_AT,
} from "@/lib/legal/termsCopy";
import {
  resolveDeviceAppLanguage,
  type NativeAppLanguage,
} from "../../i18n/resolveDeviceAppLanguage";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAgree: () => void;
};

type DocKind = "terms" | "privacy";

const COPY: Record<
  NativeAppLanguage,
  {
    title: string;
    message: string;
    termsAgree: string;
    privacyAgree: string;
    openLink: string;
    openTermsA11y: string;
    openPrivacyA11y: string;
    back: string;
    continue: string;
    closeA11y: string;
    backToConsentA11y: string;
    termsTitle: string;
    privacyTitle: string;
    lastUpdated: string;
  }
> = {
  ja: {
    title: "利用規約とプライバシーポリシーに同意しますか？",
    message:
      "アカウントを作成する前に、内容をご確認ください。両方に同意すると登録画面へ進みます。",
    termsAgree: "利用規約に同意する",
    privacyAgree: "プライバシーポリシーに同意する",
    openLink: "内容を見る",
    openTermsA11y: "利用規約を開く",
    openPrivacyA11y: "プライバシーポリシーを開く",
    back: "戻る",
    continue: "同意して続ける",
    closeA11y: "閉じる",
    backToConsentA11y: "同意画面に戻る",
    termsTitle: "利用規約",
    privacyTitle: "プライバシーポリシー",
    lastUpdated: "最終更新: ",
  },
  en: {
    title: "Agree to the Terms of Use and Privacy Policy?",
    message:
      "Please review both documents before creating an account. Agreeing to both continues to registration.",
    termsAgree: "I agree to the Terms of Use",
    privacyAgree: "I agree to the Privacy Policy",
    openLink: "View",
    openTermsA11y: "Open Terms of Use",
    openPrivacyA11y: "Open Privacy Policy",
    back: "Back",
    continue: "Agree & continue",
    closeA11y: "Close",
    backToConsentA11y: "Back to consent",
    termsTitle: "Terms of Use",
    privacyTitle: "Privacy Policy",
    lastUpdated: "Last updated: ",
  },
};

function CheckRow({
  checked,
  onToggle,
  onOpen,
  label,
  openLabel,
  openLinkLabel,
}: {
  checked: boolean;
  onToggle: () => void;
  onOpen: () => void;
  label: string;
  openLabel: string;
  openLinkLabel: string;
}) {
  return (
    <View style={styles.checkRow}>
      <Pressable
        onPress={onToggle}
        style={styles.checkHit}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
      >
        <View style={[styles.box, checked && styles.boxOn]}>
          {checked ? (
            <MaterialCommunityIcons name="check" size={14} color={AUTH_LANDING.onAccent} />
          ) : null}
        </View>
        <Text style={styles.checkLabel}>{label}</Text>
      </Pressable>
      <Pressable
        onPress={onOpen}
        hitSlop={8}
        accessibilityRole="link"
        accessibilityLabel={openLabel}
      >
        <Text style={styles.openLink}>{openLinkLabel}</Text>
      </Pressable>
    </View>
  );
}

export default function AuthLegalConsentGateNative({
  visible,
  onClose,
  onAgree,
}: Props) {
  const { height } = useWindowDimensions();
  const lang = useMemo(() => resolveDeviceAppLanguage(), []);
  const t = COPY[lang];
  const [termsOk, setTermsOk] = useState(false);
  const [privacyOk, setPrivacyOk] = useState(false);
  const [doc, setDoc] = useState<DocKind | null>(null);
  const canContinue = termsOk && privacyOk;

  useEffect(() => {
    if (visible) return;
    setTermsOk(false);
    setPrivacyOk(false);
    setDoc(null);
  }, [visible]);

  if (!visible) return null;

  const docTitle = doc === "privacy" ? t.privacyTitle : t.termsTitle;
  const docIntro = doc === "privacy" ? PRIVACY_INTRO[lang] : TERMS_INTRO[lang];
  const docUpdated = doc === "privacy" ? PRIVACY_UPDATED_AT : TERMS_UPDATED_AT;

  return (
    <View style={styles.root} pointerEvents="auto">
      <Pressable
        style={styles.scrim}
        onPress={doc ? () => setDoc(null) : onClose}
        accessibilityLabel={t.closeA11y}
      />
      {doc ? (
        <View style={[styles.docWrap, { height: Math.min(height * 0.82, 640) }]}>
          <View style={styles.docCard}>
            <Text style={styles.docTitle}>{docTitle}</Text>
            <Text style={styles.docMeta}>
              {t.lastUpdated}
              {docUpdated}
            </Text>
            <ScrollView
              style={styles.docScroll}
              contentContainerStyle={styles.docScrollContent}
              showsVerticalScrollIndicator
            >
              <Text style={styles.docIntro}>{docIntro}</Text>
              <LegalDocumentNative
                language={lang}
                preamble={
                  doc === "terms" ? TERMS_PREAMBLE[lang] : PRIVACY_PREAMBLE[lang]
                }
                sections={doc === "privacy" ? PRIVACY_SECTIONS : TERMS_SECTIONS}
                footer={doc === "terms" ? TERMS_FOOTER[lang] : PRIVACY_FOOTER[lang]}
                showIndex={false}
              />
            </ScrollView>
          </View>
        </View>
      ) : (
        <View style={styles.cardWrap}>
          <View style={styles.card}>
            <View style={styles.headerBrandRow} pointerEvents="none">
              <View style={styles.headerBrandLine} />
              <UniterzLogoNative width={112} />
              <View style={styles.headerBrandLine} />
            </View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.message}>{t.message}</Text>

            <View style={styles.checks}>
              <CheckRow
                checked={termsOk}
                onToggle={() => setTermsOk((v) => !v)}
                onOpen={() => setDoc("terms")}
                label={t.termsAgree}
                openLabel={t.openTermsA11y}
                openLinkLabel={t.openLink}
              />
              <CheckRow
                checked={privacyOk}
                onToggle={() => setPrivacyOk((v) => !v)}
                onOpen={() => setDoc("privacy")}
                label={t.privacyAgree}
                openLabel={t.openPrivacyA11y}
                openLinkLabel={t.openLink}
              />
            </View>

            <View style={styles.actions}>
              <ModalActionRowNative>
                <ModalActionButtonNative
                  label={t.back}
                  tone="ghost"
                  onPress={onClose}
                />
                <ModalActionButtonNative
                  label={t.continue}
                  tone="primary"
                  onPress={() => {
                    if (!canContinue) return;
                    onAgree();
                  }}
                  disabled={!canContinue}
                />
              </ModalActionRowNative>
            </View>
          </View>
        </View>
      )}
      {doc ? (
        <ProfileBackEdgeHandleNative
          onPress={() => setDoc(null)}
          accessibilityLabel={t.backToConsentA11y}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 50,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  cardWrap: {
    width: "100%",
    maxWidth: 340,
  },
  card: {
    width: "100%",
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.22)",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 14,
    width: "100%",
  },
  headerBrandLine: {
    flex: 1,
    maxWidth: 52,
    height: 1,
    backgroundColor: "rgba(0,245,255,0.55)",
    shadowColor: "#00f5ff",
    shadowOpacity: 0.65,
    shadowRadius: 8,
  },
  title: {
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(248,250,252,0.96)",
    textAlign: "center",
    lineHeight: 22,
  },
  message: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    color: "rgba(148,163,184,0.94)",
  },
  checks: {
    marginTop: 18,
    gap: 10,
  },
  actions: {
    marginTop: 20,
    width: "100%",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 36,
  },
  checkHit: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: {
    backgroundColor: AUTH_LANDING.accent,
    borderColor: AUTH_LANDING.accent,
  },
  checkLabel: {
    flex: 1,
    color: "rgba(226,232,240,0.9)",
    fontSize: 13,
    lineHeight: 18,
  },
  openLink: {
    color: AUTH_LANDING.accentSoft,
    fontSize: 11,
    textDecorationLine: "underline",
  },
  docWrap: {
    width: "100%",
    maxWidth: 360,
  },
  docCard: {
    width: "100%",
    flex: 1,
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.22)",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  docTitle: {
    color: "rgba(248,250,252,0.96)",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  docMeta: {
    marginTop: 4,
    marginBottom: 10,
    color: "rgba(148,163,184,0.8)",
    fontSize: 11,
  },
  docScroll: {
    flex: 1,
  },
  docScrollContent: {
    gap: 16,
    paddingBottom: 12,
  },
  docIntro: {
    color: "rgba(226,232,240,0.82)",
    fontSize: 13,
    lineHeight: 20,
  },
});
