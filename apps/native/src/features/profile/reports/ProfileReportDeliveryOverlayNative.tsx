/** Web `ProfileReportDeliveryOverlay` 相当 */
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatReportPeriodLabel } from "../../../../../../lib/reports/reportDelivery";
import type { ActiveReportOverlayNative } from "./useProReportDeliveryOverlayNative";
import WeeklyReportViewNative from "./WeeklyReportViewNative";
import MonthlyReportViewNative from "./MonthlyReportViewNative";
import { OXANIUM_800 } from "./reportThemeNative";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

type Props = {
  active: ActiveReportOverlayNative;
  language: string;
  onDismiss: () => void;
};

export default function ProfileReportDeliveryOverlayNative({
  active,
  language,
  onDismiss,
}: Props) {
  const insets = useSafeAreaInsets();
  const lang = resolveLocalizedLang(language);
  const kind = active.candidate.kind;
  const title = kind === "weekly" ? "WEEKLY REPORT" : "MONTHLY REPORT";
  const period = formatReportPeriodLabel(
    kind,
    active.candidate.periodKey,
    lang
  );

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.period}>{period}</Text>
            {active.preview ? (
              <Text style={styles.preview}>PREVIEW</Text>
            ) : null}
          </View>
          <Pressable onPress={onDismiss} style={styles.closeBtn} hitSlop={8}>
            <Text style={styles.closeText}>{L(lang, { ja: "閉じる", en: "Close", ko: "닫기", zh: "关闭", es: "Cerrar", pt: "Fechar", fr: "Fermer" })}</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {kind === "weekly" && active.weekly ? (
            <WeeklyReportViewNative report={active.weekly} language={lang} />
          ) : null}
          {kind === "monthly" && active.monthly ? (
            <MonthlyReportViewNative
              report={active.monthly}
              language={lang}
            />
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <Text style={styles.footerHint}>
            {L(lang, {
              ja: "Report タブに保存されました。いつでも見返せます。",
              en: "Saved to the Report tab. You can revisit anytime.",
              ko: "Report 탭에 저장되었습니다. 언제든 다시 볼 수 있습니다.",
              zh: "已保存到 Report 标签，可随时回看。",
              es: "Guardado en la pestaña Report. Puedes volver cuando quieras.",
              pt: "Salvo na aba Report. Você pode rever a qualquer momento.",
              fr: "Enregistré dans l’onglet Report. Vous pouvez y revenir.",
            })}
          </Text>
          <Pressable onPress={onDismiss} style={styles.okBtn}>
            <Text style={styles.okText}>{L(lang, { ja: "OK", en: "Got it", ko: "확인", zh: "知道了", es: "Entendido", pt: "Entendi", fr: "Compris" })}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070b14",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerText: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: OXANIUM_800,
    color: "#a5f3fc",
    fontSize: 11,
    letterSpacing: 1.6,
  },
  period: { marginTop: 2, color: "rgba(255,255,255,0.55)", fontSize: 12 },
  preview: {
    marginTop: 4,
    color: "rgba(253,230,138,0.85)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  closeBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeText: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingVertical: 16, paddingBottom: 24 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  footerHint: {
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    lineHeight: 16,
  },
  okBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.4)",
    backgroundColor: "rgba(34,211,238,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  okText: { color: "#a5f3fc", fontSize: 14, fontWeight: "700" },
});
