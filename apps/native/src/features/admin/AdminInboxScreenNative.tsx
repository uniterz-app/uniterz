/**
 * Web `/mobile/admin/inbox` 相当 — 機能リクエスト / 問い合わせの一覧
 */
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { db } from "../../lib/firebase";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";
import { isAdminUid } from "../../../../../lib/constants";
import {
  adminContactTypeLabel,
  formatAdminInboxDate,
  isAdminContactUnread,
  matchesAdminInboxKind,
  parseAdminContactRow,
  type AdminContactRow,
} from "../../../../../lib/admin/adminInbox";
import type { ProfileStackParamList } from "../../navigation/types";

export default function AdminInboxScreenNative() {
  const route = useRoute<RouteProp<ProfileStackParamList, "AdminInbox">>();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const isJa = language === "ja";
  const kind = route.params.kind;
  const isFeature = kind === "feature";
  const [items, setItems] = useState<AdminContactRow[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAdminUid(fUser?.uid)) {
      setReady(true);
      return;
    }
    const q = query(
      collection(db, "contacts"),
      orderBy("createdAt", "desc"),
      limit(200)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: AdminContactRow[] = [];
        snap.forEach((docSnap) => {
          rows.push(
            parseAdminContactRow(
              docSnap.id,
              docSnap.data() as Record<string, unknown>
            )
          );
        });
        setItems(rows);
        setReady(true);
      },
      () => setReady(true)
    );
    return () => unsub();
  }, [fUser?.uid]);

  const visible = useMemo(
    () => items.filter((c) => matchesAdminInboxKind(c.type, kind)),
    [items, kind]
  );

  const title = isFeature ? "REQUESTS" : "INBOX";
  const subtitle = isFeature
    ? isJa
      ? "ユーザーから届いた機能リクエストです。開くと既読になります。"
      : "Feature requests from users. Opening marks them as read."
    : isJa
      ? "ユーザーから届いた問い合わせです。開くと既読になります。"
      : "Inquiries from users. Opening marks them as read.";
  const empty = isFeature
    ? isJa
      ? "機能リクエストはまだありません"
      : "No feature requests yet"
    : isJa
      ? "問い合わせはまだありません"
      : "No inquiries yet";

  return (
    <MobilePageShell
      eyebrow="ADMIN"
      title={title}
      subtitle={subtitle}
      onClose={() => navigation.goBack()}
    >
      <ScrollView contentContainerStyle={styles.listPad}>
        {!ready ? (
          <Text style={styles.muted}>{isJa ? "読み込み中…" : "Loading…"}</Text>
        ) : visible.length === 0 ? (
          <Text style={styles.muted}>{empty}</Text>
        ) : (
          visible.map((c) => {
            const unread = isAdminContactUnread(c.status);
            return (
              <Pressable
                key={c.id}
                onPress={() =>
                  navigation.navigate("AdminInboxDetail", { id: c.id, kind })
                }
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
              >
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>
                    {adminContactTypeLabel(c.type, isJa ? "ja" : "en")}
                  </Text>
                  {unread ? <View style={styles.unreadDot} /> : null}
                </View>
                <Text style={styles.cardBody} numberOfLines={2}>
                  {c.message}
                </Text>
                {c.userDisplayName ? (
                  <Text style={styles.meta}>@{c.userDisplayName}</Text>
                ) : null}
                <Text style={styles.meta}>
                  {formatAdminInboxDate(c.createdAtMs, isJa ? "ja" : "en")}
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
  cardBody: { marginTop: 6, color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 18 },
  meta: { marginTop: 6, color: "rgba(255,255,255,0.38)", fontSize: 11 },
});
