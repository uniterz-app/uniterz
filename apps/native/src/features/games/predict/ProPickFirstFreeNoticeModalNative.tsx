/** 予想フォームを開いたとき、初回の PRO PICK が無料だと一度だけ知らせる */
import { Modal, StyleSheet, Text, View } from "react-native";
import { proPickAdCopy } from "../../../../../../lib/predict/proPickAdCopy";
import {
  ModalActionButtonNative,
  ModalActionRowNative,
} from "../../../ui/ModalActionButtonNative";
import ProCyberBadgeNative from "../../profile/kinetik/ProCyberBadgeNative";
import { OXANIUM_700, OXANIUM_800 } from "../../profile/reports/reportThemeNative";

type Props = {
  visible: boolean;
  language: string;
  onSee: () => void;
  onLater: () => void;
};

export default function ProPickFirstFreeNoticeModalNative({
  visible,
  language,
  onSee,
  onLater,
}: Props) {
  const copy = proPickAdCopy(language);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onLater}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <ProCyberBadgeNative premium />
          </View>
          <Text style={styles.kicker}>PRO PICK</Text>
          <Text style={styles.title}>{copy.firstFreeModalTitle}</Text>
          <Text style={styles.body}>{copy.firstFreeModalBody}</Text>
          <ModalActionRowNative>
            <ModalActionButtonNative
              label={copy.firstFreeModalLater}
              tone="ghost"
              onPress={onLater}
            />
            <ModalActionButtonNative
              label={copy.firstFreeModalSee}
              tone="primary"
              onPress={onSee}
            />
          </ModalActionRowNative>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "rgba(246,195,68,0.7)",
    backgroundColor: "#050508",
    padding: 20,
    gap: 12,
  },
  badge: {
    alignItems: "center",
    transform: [{ scale: 1.15 }],
    marginBottom: 2,
  },
  kicker: {
    fontFamily: OXANIUM_700,
    color: "#F6C344",
    fontSize: 11,
    letterSpacing: 2.2,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
  },
  title: {
    fontFamily: OXANIUM_800,
    color: "#fff",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  body: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 4,
  },
});
