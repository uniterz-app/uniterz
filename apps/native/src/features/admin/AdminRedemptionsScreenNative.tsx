/**
 * Web `/mobile/admin/redemptions` 相当
 */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, limit, onSnapshot, query } from "firebase/firestore";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { db } from "../../lib/firebase";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";
import { isAdminUid } from "../../../../../lib/constants";
import { formatAdminInboxDate } from "../../../../../lib/admin/adminInbox";
import { parseRedemptionRequestClient } from "../../../../../lib/redemption/parseRedemptionClient";
import { redemptionStatusLabel } from "../../../../../lib/redemption/redemptionStatus";
import type { RedemptionRequest } from "../../../../../lib/redemption/redemptionTypes";
import type { ProfileStackParamList } from "../../navigation/types";

export default function AdminRedemptionsScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const isJa = language === "ja";
  const [items, setItems] = useState<RedemptionRequest[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAdminUid(fUser?.uid)) {
      setReady(true);
      return;
    }
    const q = query(collection(db, "unit_redemptions"), limit(200));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) =>
          parseRedemptionRequestClient(
            d.id,
            d.data() as Record<string, unknown>
          )
        );
        rows.sort(
          (a, b) =>
            (b.updatedAtMs || b.createdAtMs) - (a.updatedAtMs || a.createdAtMs)
        );
        setItems(rows);
        setReady(true);
      },
      () => setReady(true)
    );
    return () => unsub();
  }, [fUser?.uid]);

  return (
    <MobilePageShell
      eyebrow="ADMIN"
      title="REDEEM"
      subtitle={
        isJa
          ? "ユーザーの商品交換申請です。未処理は赤バッジで表示されます。"
          : "Product exchange requests. Pending items show a red badge."
      }
      onClose={() => navigation.goBack()}
    >
      <ScrollView contentContainerStyle={styles.listPad}>
        {!ready ? (
          <Text style={styles.muted}>{isJa ? "読み込み中…" : "Loading…"}</Text>
        ) : items.length === 0 ? (
          <Text style={styles.muted}>
            {isJa ? "商品交換申請はまだありません" : "No redemption requests yet"}
          </Text>
        ) : (
          items.map((row) => {
            const pending = row.status === "pending";
            return (
              <Pressable
                key={row.id}
                onPress={() =>
                  navigation.navigate("AdminRedemptionDetail", { id: row.id })
                }
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
              >
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>
                    {row.productName || row.productKind}
                  </Text>
                  {pending ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.meta}>
                  {redemptionStatusLabel(row.status, isJa ? "ja" : "en")} ·{" "}
                  {row.unitsRequired} Unit
                </Text>
                <Text style={styles.meta}>
                  {formatAdminInboxDate(
                    row.updatedAtMs || row.createdAtMs,
                    isJa ? "ja" : "en"
                  )}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  listPad: { padding: 16, paddingBottom: 48, gap: 12 },
  muted: { color: "rgba(255,255,255,0.45)", fontSize: 13 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { color: "#fff", fontSize: 14, fontWeight: "700", flex: 1 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
  },
  meta: { marginTop: 6, color: "rgba(255,255,255,0.45)", fontSize: 12 },
});
