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
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
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
  const lang = resolveLocalizedLang(language);

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
      const data = await fetchMeUnitLedgerNative(lang);
      setBalance(data.balance ?? 0);
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [fUser?.uid, lang]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <LegalPageLayoutNative
      title="UNIT HISTORY"
      eyebrow="UNIT LEDGER"
      description={L(lang, {
        ja: "獲得・使用の記録。招待やバトル報酬などがここに並びます。",
        en: "Earn and spend history — invites, battles, and more.",
        ko: "획득·사용 기록. 초대·배틀 보상 등이 여기에 표시됩니다.",
        zh: "获取与使用记录。邀请、对战奖励等会显示在此。",
        es: "Historial de ganancias y gastos: invitaciones, batallas y más.",
        pt: "Histórico de ganhos e gastos — convites, batalhas e mais.",
        fr: "Historique gains/dépenses — invitations, batailles, etc.",
      })}
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
          accessibilityLabel={L(lang, { ja: "更新", en: "Refresh", ko: "새로고침", zh: "刷新", es: "Actualizar", pt: "Atualizar", fr: "Actualiser" })}
        >
          <Text style={styles.refreshText}>{L(lang, { ja: "更新", en: "Refresh", ko: "새로고침", zh: "刷新", es: "Actualizar", pt: "Atualizar", fr: "Actualiser" })}</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={() => navigation.navigate("Redeem")}
        style={styles.redeemBtn}
      >
        <Text style={styles.redeemBtnText}>
          {L(lang, { ja: "商品交換", en: "Redeem", ko: "상품 교환", zh: "兑换", es: "Canjear", pt: "Resgatar", fr: "Échanger" })}
        </Text>
      </Pressable>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#67e8f9" />
          <Text style={styles.muted}>
            {L(lang, { ja: "読み込み中…", en: "Loading…", ko: "불러오는 중…", zh: "加载中…", es: "Cargando…", pt: "Carregando…", fr: "Chargement…" })}
          </Text>
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : entries.length === 0 ? (
        <Text style={styles.mutedCenter}>
          {L(lang, {
            ja: "まだ履歴がありません。招待達成などで Unit が付与されるとここに表示されます。",
            en: "No history yet. Entries appear when you earn Units (e.g. referrals).",
            ko: "아직 이력이 없습니다. 초대 달성 등으로 Unit이 지급되면 여기에 표시됩니다.",
            zh: "暂无记录。通过邀请等获得 Unit 后会显示在此。",
            es: "Aún no hay historial. Aparece al ganar Units (p. ej. referidos).",
            pt: "Ainda sem histórico. Aparece ao ganhar Units (ex.: indicações).",
            fr: "Pas encore d’historique. Apparaît quand vous gagnez des Units.",
          })}
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
                  {formatUnitLedgerDate(row.createdAtMs, lang)}
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
                  {formatUnitLedgerAmount(row.amount, lang)}
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
