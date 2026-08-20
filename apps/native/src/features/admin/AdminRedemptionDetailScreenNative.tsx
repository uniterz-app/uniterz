/**
 * Web `/mobile/admin/redemptions/[id]` 相当
 */
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc } from "firebase/firestore";
import { cyberAlert } from "../../components/cyberAlert";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { db } from "../../lib/firebase";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";
import { parseRedemptionRequestClient, ADMIN_REDEMPTION_STATUSES } from "../../../../../lib/redemption/parseRedemptionClient";
import { redemptionStatusLabel } from "../../../../../lib/redemption/redemptionStatus";
import type {
  RedemptionRequest,
  RedemptionRequestStatus,
} from "../../../../../lib/redemption/redemptionTypes";
import type { ProfileStackParamList } from "../../navigation/types";
import { patchAdminRedemptionNative } from "./adminRedemptionsApiNative";

export default function AdminRedemptionDetailScreenNative() {
  const route =
    useRoute<RouteProp<ProfileStackParamList, "AdminRedemptionDetail">>();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const isJa = language === "ja";
  const { id } = route.params;
  const [row, setRow] = useState<RedemptionRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<RedemptionRequestStatus>("pending");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const [orderReference, setOrderReference] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const snap = await getDoc(doc(db, "unit_redemptions", id));
    if (!snap.exists()) {
      setRow(null);
      return;
    }
    const parsed = parseRedemptionRequestClient(
      snap.id,
      snap.data() as Record<string, unknown>
    );
    setRow(parsed);
    setStatus(parsed.status);
    setTrackingNumber(parsed.trackingNumber ?? "");
    setTrackingCarrier(parsed.trackingCarrier ?? "");
    setOrderReference(parsed.orderReference ?? "");
    setAdminNote(parsed.adminNote ?? "");
  }, [id]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        await load();
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  async function save() {
    if (!row) return;
    setBusy(true);
    try {
      await patchAdminRedemptionNative({
        id: row.id,
        status,
        trackingNumber: trackingNumber || null,
        trackingCarrier: trackingCarrier || null,
        orderReference: orderReference || null,
        adminNote: adminNote || null,
      });
      await load();
      cyberAlert("", isJa ? "保存しました" : "Saved");
    } catch (e) {
      cyberAlert("", e instanceof Error ? e.message : isJa ? "保存に失敗しました" : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MobilePageShell
      eyebrow="ADMIN"
      title="REDEEM"
      subtitle={
        isJa
          ? "申請内容の確認とステータス更新。"
          : "Review the request and update status."
      }
      onClose={() => navigation.goBack()}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
          {loading ? (
            <Text style={styles.muted}>{isJa ? "読み込み中…" : "Loading…"}</Text>
          ) : !row ? (
            <Text style={styles.muted}>
              {isJa ? "見つかりませんでした" : "Not found"}
            </Text>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.title}>{row.productName}</Text>
                <Text style={styles.line}>
                  {row.unitsRequired} Unit · {row.size} / {row.color}
                </Text>
                {row.productUrl ? (
                  <Text style={styles.url}>{row.productUrl}</Text>
                ) : null}
                <Text style={styles.ship}>
                  {row.shippingName}
                  {"\n"}
                  {row.shippingPostalCode} {row.shippingAddress}
                  {"\n"}
                  {row.shippingPhone}
                </Text>
              </View>

              <Text style={styles.label}>{isJa ? "ステータス" : "Status"}</Text>
              <View style={styles.chipWrap}>
                {ADMIN_REDEMPTION_STATUSES.map((s) => {
                  const active = status === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setStatus(s)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {redemptionStatusLabel(s, isJa ? "ja" : "en")}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {(
                [
                  [isJa ? "注文番号" : "Order ref", orderReference, setOrderReference],
                  [isJa ? "配送会社" : "Carrier", trackingCarrier, setTrackingCarrier],
                  [isJa ? "追跡番号" : "Tracking", trackingNumber, setTrackingNumber],
                  [isJa ? "メモ" : "Note", adminNote, setAdminNote],
                ] as const
              ).map(([label, value, set]) => (
                <View key={label}>
                  <Text style={styles.label}>{label}</Text>
                  <TextInput
                    value={value}
                    onChangeText={set}
                    style={styles.input}
                    placeholderTextColor="rgba(255,255,255,0.28)"
                    autoCapitalize="none"
                  />
                </View>
              ))}

              <Pressable
                onPress={() => void save()}
                disabled={busy}
                style={[styles.saveBtn, busy && { opacity: 0.6 }]}
              >
                <Text style={styles.saveText}>
                  {busy
                    ? isJa
                      ? "保存中…"
                      : "Saving…"
                    : isJa
                      ? "保存"
                      : "Save"}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: 16, paddingBottom: 48, gap: 8 },
  muted: { color: "rgba(255,255,255,0.45)", fontSize: 13 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16,
    gap: 6,
    marginBottom: 8,
  },
  title: { color: "#fff", fontSize: 15, fontWeight: "700" },
  line: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  url: { color: "#67e8f9", fontSize: 12 },
  ship: { color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 18, marginTop: 6 },
  label: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  chipActive: {
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.12)",
  },
  chipText: { fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: "600" },
  chipTextActive: { color: "#67e8f9" },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 14,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  saveBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(0,245,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
  },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
