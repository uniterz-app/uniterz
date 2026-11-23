/**
 * ASK を初めて開いたときの説明。
 * アプリの質問は無制限、スタッツは無料 1 日分、ニュースは調べない。
 */
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { nbaAskIntroCopy } from "../../../../../../lib/nba/ask/nbaAskIntroCopy";
import { ModalActionButtonNative } from "../../../ui/ModalActionButtonNative";
import { CYBER_TAB_CYAN } from "../../../ui/cyberSideMenuNative";
import { JP_400, JP_600, OXANIUM_700 } from "../../profile/reports/reportThemeNative";

type Props = {
  open: boolean;
  language?: string | null;
  onClose: () => void;
};

export default function NbaAskIntroModalNative({ open, language, onClose }: Props) {
  const c = nbaAskIntroCopy(language);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel={c.cta}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.icon}>
            <MaterialCommunityIcons name="chat-processing-outline" size={26} color={CYBER_TAB_CYAN} />
          </View>
          <Text style={styles.eyebrow}>{c.eyebrow}</Text>
          <Text style={styles.title}>{c.title}</Text>

          <View style={styles.rows}>
            <Row label={c.appLabel} body={c.appBody} />
            <Row label={c.statsLabel} body={c.statsBody} />
            <Text style={styles.filter}>{c.limitBody}</Text>
          </View>

          <Text style={styles.note}>{c.note}</Text>

          <View style={styles.cta}>
            <ModalActionButtonNative label={c.cta} tone="primary" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ label, body }: { label: string; body: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLab}>{label}</Text>
      <Text style={styles.rowBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
    padding: 24,
  },
  sheet: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.55)",
    backgroundColor: "#0a0a0c",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
  },
  icon: {
    alignSelf: "center",
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.7)",
    backgroundColor: "rgba(0,245,255,0.12)",
    marginBottom: 12,
  },
  eyebrow: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    letterSpacing: 1.6,
    color: "rgba(0,245,255,0.85)",
    textAlign: "center",
  },
  title: {
    marginTop: 6,
    fontFamily: JP_600,
    fontSize: 17,
    color: "#fff",
    textAlign: "center",
  },
  rows: { marginTop: 16, gap: 12 },
  row: { gap: 4 },
  rowLab: {
    fontFamily: OXANIUM_700,
    fontSize: 11,
    letterSpacing: 0.8,
    color: CYBER_TAB_CYAN,
  },
  rowBody: {
    fontFamily: JP_400,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.78)",
  },
  filter: {
    fontFamily: JP_400,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.62)",
  },
  note: {
    marginTop: 14,
    fontFamily: JP_400,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.5)",
  },
  cta: { marginTop: 16 },
});
