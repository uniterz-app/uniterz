/**
 * Web `UnitLedgerPage` 相当
 */
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import type { ProfileStackParamList } from "../../../navigation/types";
import { fetchMeUnitLedgerNative } from "../unitLedgerApiNative";
import {
  formatUnitLedgerAmount,
  formatUnitLedgerDate,
} from "../../../../../../lib/units/formatUnitLedgerEntry";
import type { UnitLedgerEntry } from "../../../../../../lib/units/unitLedgerTypes";

const OX = "Oxanium_700Bold";

export default function UnitLedgerScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const isJa = language === "ja";
  const gateLang = isJa ? "ja" : "en";

  const [balance, setBalance] = useState(0);
  const [entries, setEntries] = useState<UnitLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!fUser?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMeUnitLedgerNative(gateLang);
      setBalance(data.balance ?? 0);
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [fUser?.uid, gateLang]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <LegalPageLayoutNative
      title="UNIT HISTORY"
      eyebrow="UNIT LEDGER"
      description={
        isJa
          ? "獲得・使用の記録。招待やバトル報酬などがここに並びます。"
          : "Earn and spend history — invites, battles, and more."
      }
    >
      <View style={styles.balanceCard}>
        <View style={styles.balanceMeta}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceValue}>
            {balance.toLocaleString("en-US")}
            <Text style={styles.balanceUnit}> UNIT</Text>
          </Text>
        </View>
        <Pressable
          onPress={() => void load()}
          style={({ pressed }) => [
            styles.refreshBtn,
            pressed && styles.refreshPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isJa ? "更新" : "Refresh"}
        >
          <Text style={styles.refreshText}>{isJa ? "更新" : "Refresh"}</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => navigation.navigate("Redeem")}
        style={styles.redeemBtn}
      >
        <Text style={styles.redeemBtnText}>
          {isJa ? "商品交換" : "Redeem"}
        </Text>
      </Pressable>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#67e8f9" />
          <Text style={styles.muted}>
            {isJa ? "読み込み中…" : "Loading…"}
          </Text>
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : entries.length === 0 ? (
        <Text style={styles.mutedCenter}>
          {isJa
            ? "まだ履歴がありません。招待達成などで Unit が付与されるとここに表示されます。"
            : "No history yet. Entries appear when you earn Units (e.g. referrals)."}
        </Text>
      ) : (
        <View style={styles.list}>
          {entries.map((row, index) => {
            const positive = row.amount > 0;
            const negative = row.amount < 0;
            return (
              <View
                key={row.id}
                style={[
                  styles.row,
                  index < entries.length - 1 ? styles.rowBorder : null,
                ]}
              >
                <Text style={styles.date}>
                  {formatUnitLedgerDate(row.createdAtMs, gateLang)}
                </Text>
                <View style={styles.rowBody}>
                  <Text style={styles.title} numberOfLines={1}>
                    {row.title}
                  </Text>
                  {row.detail ? (
                    <Text style={styles.detail} numberOfLines={1}>
                      {row.detail}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.amount,
                    positive
                      ? styles.amountPos
                      : negative
                        ? styles.amountNeg
                        : null,
                  ]}
                >
                  {formatUnitLedgerAmount(row.amount, gateLang)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(252, 211, 77, 0.25)",
    backgroundColor: "rgba(8, 10, 14, 0.92)",
  },
  balanceMeta: { flex: 1, minWidth: 0 },
  balanceLabel: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(253, 230, 138, 0.7)",
  },
  balanceValue: {
    marginTop: 4,
    fontFamily: OX,
    fontSize: 22,
    fontWeight: "800",
    fontStyle: "italic",
    letterSpacing: 0.6,
    color: "#fff",
  },
  balanceUnit: {
    fontSize: 11,
    fontWeight: "700",
    fontStyle: "normal",
    letterSpacing: 1.2,
    color: "rgba(253, 230, 138, 0.8)",
  },
  refreshBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshPressed: { opacity: 0.7 },
  refreshText: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
  },
  redeemBtn: {
    alignSelf: "flex-start",
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(103,232,249,0.4)",
    backgroundColor: "rgba(34,211,238,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  redeemBtnText: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#ecfeff",
  },
  center: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 10,
  },
  muted: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
  },
  mutedCenter: {
    paddingVertical: 40,
    textAlign: "center",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 20,
  },
  error: {
    paddingVertical: 40,
    textAlign: "center",
    fontSize: 13,
    color: "rgba(253, 164, 175, 0.9)",
  },
  list: {
    overflow: "hidden",
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(4, 9, 16, 0.97)",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  date: {
    width: 40,
    paddingTop: 2,
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
  },
  rowBody: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  detail: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  amount: {
    fontFamily: OX,
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
  },
  amountPos: { color: "#6ee7b7" },
  amountNeg: { color: "#fda4af" },
});
