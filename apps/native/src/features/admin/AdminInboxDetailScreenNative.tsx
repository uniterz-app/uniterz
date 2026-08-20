/**
 * Web `/mobile/admin/inbox/[id]` 相当
 */
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { db } from "../../lib/firebase";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";
import {
  adminContactTypeLabel,
  formatAdminInboxDate,
  parseAdminContactRow,
  type AdminContactRow,
} from "../../../../../lib/admin/adminInbox";
import type { ProfileStackParamList } from "../../navigation/types";

export default function AdminInboxDetailScreenNative() {
  const route = useRoute<RouteProp<ProfileStackParamList, "AdminInboxDetail">>();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const isJa = language === "ja";
  const { id } = route.params;
  const [row, setRow] = useState<AdminContactRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const ref = doc(db, "contacts", id);
      const snap = await getDoc(ref);
      if (!alive) return;
      if (!snap.exists()) {
        setRow(null);
        setLoading(false);
        return;
      }
      const parsed = parseAdminContactRow(
        snap.id,
        snap.data() as Record<string, unknown>
      );
      setRow(parsed);
      setLoading(false);
      if (parsed.status === "unread") {
        await updateDoc(ref, { status: "read" });
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <MobilePageShell
      eyebrow="ADMIN"
      title="DETAIL"
      subtitle={
        isJa
          ? "ユーザーから届いた内容です。"
          : "Message submitted by a user."
      }
      onClose={() => navigation.goBack()}
    >
      <ScrollView contentContainerStyle={styles.pad}>
        {loading ? (
          <Text style={styles.muted}>{isJa ? "読み込み中…" : "Loading…"}</Text>
        ) : !row ? (
          <Text style={styles.muted}>
            {isJa ? "見つかりませんでした" : "Not found"}
          </Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.line}>
                {isJa ? "種別" : "Type"}：
                {adminContactTypeLabel(row.type, isJa ? "ja" : "en")}
              </Text>
              <Text style={styles.line}>
                {isJa ? "ユーザー" : "User"}：
                {row.userDisplayName || (isJa ? "不明" : "Unknown")}
              </Text>
              {row.email ? (
                <Text style={styles.line}>
                  {isJa ? "メール" : "Email"}：{row.email}
                </Text>
              ) : null}
              <Text style={styles.meta}>
                {formatAdminInboxDate(row.createdAtMs, isJa ? "ja" : "en")}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.body}>{row.message}</Text>
            </View>
            {row.screenshotUrl ? (
              <Image
                source={{ uri: row.screenshotUrl }}
                style={styles.shot}
                resizeMode="contain"
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  pad: { padding: 16, paddingBottom: 48, gap: 12 },
  muted: { color: "rgba(255,255,255,0.45)", fontSize: 13 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 16,
    gap: 6,
  },
  line: { color: "#fff", fontSize: 13 },
  meta: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 },
  body: { color: "rgba(255,255,255,0.88)", fontSize: 14, lineHeight: 22 },
  shot: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
});
