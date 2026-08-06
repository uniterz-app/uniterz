/**
 * Web `RedemptionHubPage` 相当
 */
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
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
import { fetchMeRedemptionsNative } from "../redemptionApiNative";
import {
  REDEMPTION_DISCLAIMER_EN,
  REDEMPTION_DISCLAIMER_JA,
  REDEMPTION_EXCLUSIONS_EN,
  REDEMPTION_EXCLUSIONS_JA,
} from "../../../../../../lib/redemption/redemptionCatalog";
import { redemptionBatchScheduleCopy } from "../../../../../../lib/redemption/redemptionBatchScheduleCopy";
import { redemptionStatusLabel } from "../../../../../../lib/redemption/redemptionStatus";
import type {
  RedemptionCatalogItem,
  RedemptionProductKind,
  RedemptionRequest,
} from "../../../../../../lib/redemption/redemptionTypes";

const OX = "Oxanium_700Bold";

/** Web `/redemption/catalog-*.png` 相当 */
const CATALOG_IMAGES: Record<RedemptionProductKind, ImageSourcePropType> = {
  jersey: require("../../../../assets/redemption/catalog-jersey.png"),
  tshirt: require("../../../../assets/redemption/catalog-tshirt.png"),
  cap: require("../../../../assets/redemption/catalog-cap.png"),
};

export default function RedemptionHubScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const isJa = language === "ja";
  const batch = redemptionBatchScheduleCopy(isJa ? "ja" : "en");

  const [balance, setBalance] = useState(0);
  const [seasonUsed, setSeasonUsed] = useState(0);
  const [seasonCap, setSeasonCap] = useState(2000);
  const [unitsLive, setUnitsLive] = useState(false);
  const [catalog, setCatalog] = useState<RedemptionCatalogItem[]>([]);
  const [requests, setRequests] = useState<RedemptionRequest[]>([]);
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
      const data = await fetchMeRedemptionsNative();
      setBalance(data.balance ?? 0);
      setSeasonUsed(data.seasonUnitsUsed ?? 0);
      setSeasonCap(data.seasonCap ?? 2000);
      setUnitsLive(data.unitsLive === true);
      setCatalog(Array.isArray(data.catalog) ? [...data.catalog] : []);
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  }, [fUser?.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <LegalPageLayoutNative
      title="REDEEM"
      eyebrow="UNIT EXCHANGE"
      description={
        isJa
          ? "保有 Unit で交換申請。月末まとめ購入（おおよそ25日前後）。"
          : "Redeem Units. Monthly batch purchase (~25th)."
      }
    >
      <View style={styles.batchCard}>
        <Text style={styles.batchTitle}>{batch.short}</Text>
        <Text style={styles.batchBody}>{batch.detail}</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance</Text>
        <Text style={styles.balanceValue}>
          {balance.toLocaleString("en-US")}
          <Text style={styles.balanceUnit}> UNIT</Text>
        </Text>
        <Text style={styles.meta}>
          {isJa
            ? `今シーズン ${seasonUsed} / ${seasonCap} Unit`
            : `Season ${seasonUsed} / ${seasonCap} Units`}
          {!unitsLive
            ? isJa
              ? " · プレビュー（Unit ロックは弁護士後）"
              : " · Preview (lock after legal)"
            : ""}
        </Text>
        <View style={styles.rowBtns}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("RedeemApply", {})}
          >
            <Text style={styles.primaryBtnText}>
              {isJa ? "交換申請" : "Apply"}
            </Text>
          </Pressable>
          <Pressable
            style={styles.ghostBtn}
            onPress={() => navigation.navigate("UnitLedger")}
          >
            <Text style={styles.ghostBtnText}>
              {isJa ? "Unit 履歴" : "History"}
            </Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.section}>{isJa ? "カタログ" : "Catalog"}</Text>
      {catalog.map((item) => (
        <View key={item.kind} style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.thumbWrap}>
              <Image
                source={CATALOG_IMAGES[item.kind]}
                style={styles.thumb}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>
                  {isJa ? item.titleJa : item.titleEn}
                </Text>
                <Text style={styles.units}>{item.unitsRequired} U</Text>
              </View>
              <Text style={styles.cardMeta}>
                {isJa ? item.blurbJa : item.blurbEn}
              </Text>
              <Pressable
                onPress={() =>
                  navigation.navigate("RedeemApply", { kind: item.kind })
                }
              >
                <Text style={styles.link}>
                  {isJa ? "この区分で申請" : "Apply with this tier"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ))}

      <Text style={styles.section}>{isJa ? "対象外" : "Not eligible"}</Text>
      {(isJa ? REDEMPTION_EXCLUSIONS_JA : REDEMPTION_EXCLUSIONS_EN).map(
        (line) => (
          <Text key={line} style={styles.bullet}>
            · {line}
          </Text>
        )
      )}

      <Text style={styles.section}>{isJa ? "申請一覧" : "Requests"}</Text>
      {loading ? (
        <ActivityIndicator color="#67e8f9" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : requests.length === 0 ? (
        <Text style={styles.muted}>
          {isJa ? "まだ申請がありません。" : "No requests yet."}
        </Text>
      ) : (
        requests.map((row) => (
          <Pressable
            key={row.id}
            style={styles.card}
            onPress={() =>
              navigation.navigate("RedeemProgress", { id: row.id })
            }
          >
            <Text style={styles.cardTitle} numberOfLines={1}>
              {row.productName}
            </Text>
            <Text style={styles.cardMeta}>
              {redemptionStatusLabel(row.status, isJa ? "ja" : "en")} ·{" "}
              {row.unitsRequired} Unit
            </Text>
          </Pressable>
        ))
      )}

      <Text style={styles.disclaimer}>
        {isJa ? REDEMPTION_DISCLAIMER_JA : REDEMPTION_DISCLAIMER_EN}
      </Text>
    </LegalPageLayoutNative>
  );
}

const styles = StyleSheet.create({
  batchCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(103,232,249,0.3)",
    backgroundColor: "rgba(34,211,238,0.06)",
  },
  batchTitle: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(165,243,252,0.85)",
  },
  batchBody: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(236,254,255,0.85)",
  },
  balanceCard: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(252,211,77,0.25)",
    backgroundColor: "rgba(8,10,14,0.92)",
  },
  balanceLabel: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "rgba(253,230,138,0.7)",
  },
  balanceValue: {
    marginTop: 4,
    fontFamily: OX,
    fontSize: 22,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#fff",
  },
  balanceUnit: {
    fontSize: 11,
    fontStyle: "normal",
    color: "rgba(253,230,138,0.8)",
  },
  meta: { marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.5)" },
  rowBtns: { flexDirection: "row", gap: 8, marginTop: 12 },
  primaryBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(103,232,249,0.4)",
    backgroundColor: "rgba(34,211,238,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryBtnText: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#ecfeff",
  },
  ghostBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ghostBtnText: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.7)",
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.55)",
  },
  card: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(4,9,16,0.97)",
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  thumbWrap: {
    width: 72,
    height: 72,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  thumb: { width: "100%", height: "100%" },
  cardBody: { flex: 1, minWidth: 0 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  cardMeta: { marginTop: 4, fontSize: 11, color: "rgba(255,255,255,0.45)" },
  units: {
    fontFamily: OX,
    fontSize: 16,
    fontWeight: "800",
    color: "#fde68a",
  },
  link: { marginTop: 8, fontSize: 11, color: "rgba(103,232,249,0.9)" },
  bullet: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 },
  muted: { fontSize: 13, color: "rgba(255,255,255,0.45)" },
  error: { fontSize: 13, color: "rgba(253,164,175,0.9)" },
  disclaimer: {
    marginTop: 16,
    marginBottom: 24,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
  },
});
