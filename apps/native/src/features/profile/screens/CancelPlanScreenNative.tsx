import { useEffect, useState } from "react";
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { db } from "../../../lib/firebase";
import type { ProfileStackParamList } from "../../../navigation/types";
import { colors } from "../../../theme/tokens";

function openSubscriptionManagement() {
  const url =
    Platform.OS === "ios"
      ? "https://apps.apple.com/account/subscriptions"
      : "https://play.google.com/store/account/subscriptions";
  void Linking.openURL(url);
}

export default function CancelPlanScreenNative() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
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
    <MobilePageShell title="解約" appBackground onClose={() => navigation.goBack()}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Proプランの解約</Text>
          <View style={styles.notice}>
            <Text style={styles.desc}>・解約後も次回更新日まではPro機能をご利用いただけます。</Text>
            <Text style={styles.desc}>・即時解約ではなく、自動更新のみ停止されます。</Text>
          </View>
          <Text style={styles.renewal}>
            次回更新日：<Text style={styles.renewalStrong}>{proUntil}</Text>
          </Text>
          <Pressable style={styles.dangerBtn} onPress={() => setConfirmOpen(true)}>
            <Text style={styles.dangerText}>解約する</Text>
          </Pressable>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>戻る</Text>
          </Pressable>
        </View>
      </View>
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>解約をする</Text>
            <Text style={styles.modalBody}>
              解約後も <Text style={styles.renewalStrong}>{proUntil}</Text> まではPro機能をご利用いただけます。
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setConfirmOpen(false)}>
                <Text style={styles.backText}>キャンセル</Text>
              </Pressable>
              <Pressable style={styles.modalDanger} onPress={confirmCancel}>
                <Text style={styles.dangerText}>解約を確定</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16, justifyContent: "center" },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 16 },
  notice: { gap: 8, marginBottom: 22 },
  desc: { color: colors.textSecondary, lineHeight: 22, fontSize: 15 },
  renewal: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 22 },
  renewalStrong: { color: "#fff", fontWeight: "800" },
  dangerBtn: {
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.45)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  dangerText: { color: "#f87171", fontWeight: "800" },
  backBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  backText: { color: "rgba(255,255,255,0.7)", fontWeight: "800" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#000",
    padding: 22,
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 12 },
  modalBody: { color: "rgba(255,255,255,0.7)", lineHeight: 21, marginBottom: 22 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalDanger: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.45)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
});
