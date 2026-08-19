/**
 * GET STARTED 直後の同意ゲート。
 * 利用規約・プライバシーの両方にチェックしてから登録画面へ進む。
 * 本文は別スタックに出さず、ゲート内で開いて BACK で戻る。
 */
import { useEffect, useState } from "react";
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
import { AUTH_LANDING } from "./authLandingPalette";
import type { LegalSection } from "@/lib/legal/legalSection";
import {
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  PRIVACY_UPDATED_AT,
} from "@/lib/legal/privacyCopy";
import {
  TERMS_INTRO,
  TERMS_SECTIONS,
  TERMS_UPDATED_AT,
} from "@/lib/legal/termsCopy";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAgree: () => void;
};

type DocKind = "terms" | "privacy";

function CheckRow({
  checked,
  onToggle,
  onOpen,
  label,
  openLabel,
}: {
  checked: boolean;
  onToggle: () => void;
  onOpen: () => void;
  label: string;
  openLabel: string;
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
        <Text style={styles.openLink}>内容を見る</Text>
      </Pressable>
    </View>
  );
}

function SectionBlock({ section }: { section: LegalSection }) {
  return (
    <View style={styles.docSection}>
      <Text style={styles.docH}>{section.title.ja}</Text>
      {section.paragraphs?.ja?.map((p) => (
        <Text key={p.slice(0, 24)} style={styles.docP}>
          {p}
        </Text>
      ))}
      {section.bullets?.ja?.map((b) => (
        <Text key={b.slice(0, 24)} style={styles.docP}>
          {`・${b}`}
        </Text>
      ))}
      {section.subsections?.map((sub) => (
        <View key={sub.title.ja} style={styles.docSub}>
          <Text style={styles.docH2}>{sub.title.ja}</Text>
          {sub.paragraphs?.ja?.map((p) => (
            <Text key={p.slice(0, 24)} style={styles.docP}>
              {p}
            </Text>
          ))}
          {sub.bullets?.ja?.map((b) => (
            <Text key={b.slice(0, 24)} style={styles.docP}>
              {`・${b}`}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export default function AuthLegalConsentGateNative({
  visible,
  onClose,
  onAgree,
}: Props) {
  const { height } = useWindowDimensions();
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

  const docTitle = doc === "privacy" ? "プライバシーポリシー" : "利用規約";
  const docIntro = doc === "privacy" ? PRIVACY_INTRO.ja : TERMS_INTRO.ja;
  const docUpdated = doc === "privacy" ? PRIVACY_UPDATED_AT : TERMS_UPDATED_AT;
  const docSections = doc === "privacy" ? PRIVACY_SECTIONS : TERMS_SECTIONS;

  return (
    <View style={styles.root} pointerEvents="auto">
      <Pressable
        style={styles.scrim}
        onPress={doc ? () => setDoc(null) : onClose}
        accessibilityLabel="閉じる"
      />
      {doc ? (
        <View style={[styles.docWrap, { height: Math.min(height * 0.82, 640) }]}>
          <View style={styles.docCard}>
            <Text style={styles.docTitle}>{docTitle}</Text>
            <Text style={styles.docMeta}>最終更新: {docUpdated}</Text>
            <ScrollView
              style={styles.docScroll}
              contentContainerStyle={styles.docScrollContent}
              showsVerticalScrollIndicator
            >
              <Text style={styles.docIntro}>{docIntro}</Text>
              {docSections.map((section) => (
                <SectionBlock key={section.id} section={section} />
              ))}
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
            <Text style={styles.title}>
              利用規約とプライバシーポリシーに同意しますか？
            </Text>
            <Text style={styles.message}>
              アカウントを作成する前に、内容をご確認ください。両方に同意すると登録画面へ進みます。
            </Text>

            <View style={styles.checks}>
              <CheckRow
                checked={termsOk}
                onToggle={() => setTermsOk((v) => !v)}
                onOpen={() => setDoc("terms")}
                label="利用規約に同意する"
                openLabel="利用規約を開く"
              />
              <CheckRow
                checked={privacyOk}
                onToggle={() => setPrivacyOk((v) => !v)}
                onOpen={() => setDoc("privacy")}
                label="プライバシーポリシーに同意する"
                openLabel="プライバシーポリシーを開く"
              />
            </View>

            <View style={styles.actions}>
              <ModalActionRowNative>
                <ModalActionButtonNative
                  label="戻る"
                  tone="ghost"
                  onPress={onClose}
                />
                <ModalActionButtonNative
                  label="同意して続ける"
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
          accessibilityLabel="同意画面に戻る"
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
  actionPressable: {
    marginTop: 20,
    width: "100%",
  },
  actionFrame: {
    width: "100%",
  },
  actionContent: {
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontFamily: Platform.select({
      ios: "Oxanium_700Bold",
      android: "Oxanium_700Bold",
      default: "sans-serif",
    }),
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(148,163,184,0.7)",
    textAlign: "center",
  },
  actionLabelOn: {
    color: "rgba(224,254,255,0.96)",
  },
  backHit: {
    marginTop: 12,
    alignItems: "center",
  },
  backLabel: {
    color: "rgba(148,163,184,0.88)",
    fontSize: 13,
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
  docSection: {
    gap: 6,
  },
  docSub: {
    marginTop: 6,
    gap: 4,
  },
  docH: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  docH2: {
    color: "rgba(248,250,252,0.92)",
    fontSize: 13,
    fontWeight: "700",
  },
  docP: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 20,
  },
});
