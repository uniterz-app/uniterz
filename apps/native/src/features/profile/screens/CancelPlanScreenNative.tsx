/**
 * Web `app/mobile/cancel-plan/page.tsx` 相当
 * 解約手続き — サイバー HUD / レッドアクセント（完了画面と同系統）
 */
import { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { OXANIUM_700, OXANIUM_800 } from "../reports/reportThemeNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import type { ProfileStackParamList } from "../../../navigation/types";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import SlantCtaNative from "../../../ui/SlantCtaNative";
import {
  ModalActionButtonNative,
  ModalActionRowNative,
} from "../../../ui/ModalActionButtonNative";
import { PRO_SUCCESS_ACCENT } from "../../../../../../lib/pro/proSuccessAccent";

const A = PRO_SUCCESS_ACCENT.cancel;

function openSubscriptionManagement() {
  const url =
    Platform.OS === "ios"
      ? "https://apps.apple.com/account/subscriptions"
      : "https://play.google.com/store/account/subscriptions";
  void Linking.openURL(url);
}

export default function CancelPlanScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const [proUntil, setProUntil] = useState("-----");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!fUser) return;
    let alive = true;
    void (async () => {
      const snap = await getDoc(doc(db, "users", fUser.uid));
      if (!alive) return;
      const data = snap.data() as { proUntil?: { toDate?: () => Date } } | undefined;
      const d = data?.proUntil?.toDate?.();
      setProUntil(d ? d.toLocaleDateString("ja-JP") : "-----");
    })();
    return () => {
      alive = false;
    };
  }, [fUser]);

  const confirmCancel = () => {
    setConfirmOpen(false);
    openSubscriptionManagement();
    navigation.navigate("CancelComplete");
  };

  return (
    <MobilePageShell
      title="CANCEL"
      subtitle="Pro プランの解約手続きを行います。"
      appBackground
      onClose={() => navigation.goBack()}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomContentReserveY + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.frameOuter}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerBR} />
          <View style={styles.plate} />
          <View style={styles.card}>
            <View style={styles.strip}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stripEyebrow}>CANCEL_FLOW // TYPE: PRO</Text>
                <Text style={styles.stripTitle}>CANCEL PLAN</Text>
              </View>
              <View style={styles.stripMeta}>
                <Text style={styles.stripMetaText}>AUTH: PAID</Text>
                <Text style={styles.stripMetaText}>MODE: RENEWAL OFF</Text>
              </View>
            </View>

            <View style={styles.body}>
              <Text style={styles.title}>Proプランの解約</Text>
              <Text style={styles.desc}>
                ・解約後も次回更新日まではPro機能をご利用いただけます。
              </Text>
              <Text style={styles.desc}>
                ・即時解約ではなく、自動更新のみ停止されます。
              </Text>
              <Text style={styles.renewal}>
                次回更新日：
                <Text style={styles.renewalStrong}> {proUntil}</Text>
              </Text>

              <View style={{ gap: 10, marginTop: 8 }}>
                <SlantCtaNative
                  label="解約する"
                  variant="danger"
                  onPress={() => setConfirmOpen(true)}
                />
                <SlantCtaNative
                  label="戻る"
                  variant="ghost"
                  onPress={() => navigation.goBack()}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setConfirmOpen(false)}
        >
          <Pressable
            style={styles.modalFrame}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalCornerTL} />
            <View style={styles.modalCornerBR} />
            <View style={styles.modalPlate} />
            <View style={styles.modalCard}>
              <Text style={styles.modalEyebrow}>CONFIRM // CANCEL</Text>
              <Text style={styles.modalTitle}>解約をする</Text>
              <Text style={styles.modalBody}>
                解約後も{" "}
                <Text style={styles.renewalStrong}>{proUntil}</Text> までは
                Pro機能をご利用いただけます。
              </Text>
              <ModalActionRowNative>
                <ModalActionButtonNative
                  label="キャンセル"
                  tone="ghost"
                  onPress={() => setConfirmOpen(false)}
                />
                <ModalActionButtonNative
                  label="解約を確定"
                  tone="danger"
                  onPress={confirmCancel}
                />
              </ModalActionRowNative>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    justifyContent: "center",
  },
  frameOuter: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    paddingTop: 8,
    paddingLeft: 8,
    paddingRight: 7,
    paddingBottom: 7,
  },
  cornerTL: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 18,
    height: 18,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: A.main,
    zIndex: 20,
  },
  cornerBR: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: A.main,
    zIndex: 20,
  },
  plate: {
    ...StyleSheet.absoluteFillObject,
    top: 8,
    left: 8,
    backgroundColor: A.main,
    zIndex: 0,
  },
  card: {
    borderWidth: 2.5,
    borderColor: "#ffffff",
    backgroundColor: "#04080f",
    zIndex: 10,
  },
  strip: {
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: 2.5,
    borderBottomColor: "#ffffff",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stripEyebrow: {
    fontFamily: OXANIUM_700,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(0,0,0,0.55)",
    textTransform: "uppercase",
  },
  stripTitle: {
    fontFamily: OXANIUM_800,
    marginTop: 2,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#000",
    textTransform: "uppercase",
  },
  stripMeta: {
    borderLeftWidth: 2.5,
    borderLeftColor: "rgba(0,0,0,0.15)",
    paddingLeft: 10,
    justifyContent: "center",
  },
  stripMetaText: {
    fontFamily: OXANIUM_700,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(0,0,0,0.7)",
    textTransform: "uppercase",
    textAlign: "right",
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  title: {
    fontFamily: OXANIUM_800,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  desc: {
    color: "rgba(255,255,255,0.7)",
    lineHeight: 22,
    fontSize: 14,
    marginBottom: 6,
  },
  renewal: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 10,
    marginBottom: 18,
  },
  renewalStrong: { color: A.title, fontWeight: "800" },
  dangerBtn: {
    borderWidth: 2,
    borderColor: A.main,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 10,
  },
  dangerText: {
    fontFamily: OXANIUM_800,
    color: A.main,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  backBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingVertical: 12,
    alignItems: "center",
  },
  backText: {
    fontFamily: OXANIUM_700,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalFrame: {
    width: "100%",
    maxWidth: 360,
    paddingTop: 6,
    paddingLeft: 6,
    paddingRight: 5,
    paddingBottom: 5,
  },
  modalCornerTL: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 14,
    height: 14,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: A.main,
    zIndex: 20,
  },
  modalCornerBR: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: A.main,
    zIndex: 20,
  },
  modalPlate: {
    ...StyleSheet.absoluteFillObject,
    top: 6,
    left: 6,
    backgroundColor: A.main,
    zIndex: 0,
  },
  modalCard: {
    borderWidth: 2.5,
    borderColor: "#ffffff",
    backgroundColor: "#04080f",
    padding: 18,
    zIndex: 10,
  },
  modalEyebrow: {
    fontFamily: OXANIUM_700,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: A.metaLabel,
    textTransform: "uppercase",
  },
  modalTitle: {
    fontFamily: OXANIUM_800,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
    marginBottom: 12,
  },
  modalBody: {
    color: "rgba(255,255,255,0.7)",
    lineHeight: 21,
    marginBottom: 18,
    fontSize: 14,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingVertical: 11,
    alignItems: "center",
  },
  modalDanger: {
    flex: 1,
    backgroundColor: A.main,
    paddingVertical: 11,
    alignItems: "center",
  },
  modalDangerText: {
    fontFamily: OXANIUM_800,
    color: A.ink,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
});
