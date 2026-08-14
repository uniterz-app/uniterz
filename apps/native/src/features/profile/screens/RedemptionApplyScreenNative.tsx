/**
 * Web `RedemptionApplyPage` 相当
 */
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import type { ProfileStackParamList } from "../../../navigation/types";
import {
  createMeRedemptionNative,
  fetchMeRedemptionsNative,
} from "../redemptionApiNative";
import {
  REDEMPTION_CATALOG,
  normalizeRedemptionProductKind,
  redemptionPriceCapShort,
} from "../../../../../../lib/redemption/redemptionCatalog";
import { redemptionBatchScheduleCopy } from "../../../../../../lib/redemption/redemptionBatchScheduleCopy";
import type { RedemptionProductKind } from "../../../../../../lib/redemption/redemptionTypes";
import { REDEMPTION_APPLY_CONSENT } from "../../../../../../lib/legal/unitRedemptionLegalCopy";
import {
  canAffordRedemption,
  redemptionApplyErrorMessage,
  redemptionAvailableUnits,
} from "../../../../../../lib/redemption/redemptionApplyGate";

const OX = "Oxanium_700Bold";

export default function RedemptionApplyScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute<RouteProp<ProfileStackParamList, "RedeemApply">>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const isJa = language === "ja";
  const lang = isJa ? "ja" : "en";
  const batch = redemptionBatchScheduleCopy(lang);

  const initial =
    normalizeRedemptionProductKind(route.params?.kind) ?? "tshirt";
  const [productKind, setProductKind] =
    useState<RedemptionProductKind>(initial);
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [storeName, setStoreName] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingName, setShippingName] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingCountry, setShippingCountry] = useState("JP");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [reservedUnits, setReservedUnits] = useState(0);
  const [seasonUnitsUsed, setSeasonUnitsUsed] = useState(0);
  const [seasonCap, setSeasonCap] = useState(2000);
  const [walletReady, setWalletReady] = useState(false);

  const selected = useMemo(
    () => REDEMPTION_CATALOG.find((x) => x.kind === productKind),
    [productKind]
  );

  const available = redemptionAvailableUnits(balance, reservedUnits);
  const afford = selected
    ? canAffordRedemption({
        balance,
        reservedUnits,
        unitsRequired: selected.unitsRequired,
        seasonUnitsUsed,
        seasonCap,
      })
    : { ok: false as const, reason: "insufficient_units" as const };
  const submitBlocked = walletReady && !afford.ok;

  useEffect(() => {
    if (!fUser?.uid) return;
    let alive = true;
    void fetchMeRedemptionsNative()
      .then((data) => {
        if (!alive) return;
        setBalance(data.balance ?? 0);
        setReservedUnits(data.reservedUnits ?? 0);
        setSeasonUnitsUsed(data.seasonUnitsUsed ?? 0);
        setSeasonCap(data.seasonCap ?? 2000);
        setWalletReady(true);
      })
      .catch(() => {
        if (!alive) return;
        setWalletReady(true);
      });
    return () => {
      alive = false;
    };
  }, [fUser?.uid]);

  async function submit(asDraft: boolean) {
    if (!asDraft && !consent) {
      setError(redemptionApplyErrorMessage("consent_required", lang));
      return;
    }
    if (!asDraft && selected) {
      const gate = canAffordRedemption({
        balance,
        reservedUnits,
        unitsRequired: selected.unitsRequired,
        seasonUnitsUsed,
        seasonCap,
      });
      if (!gate.ok) {
        setError(redemptionApplyErrorMessage(gate.reason, lang));
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      const req = await createMeRedemptionNative(
        {
          productKind,
          productName,
          productUrl,
          storeName,
          size,
          color,
          notes,
          shippingName,
          shippingPostalCode,
          shippingAddress,
          shippingPhone,
          shippingCountry,
        },
        { asDraft }
      );
      navigation.replace("RedeemProgress", { id: req.id });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "error";
      setError(redemptionApplyErrorMessage(raw, lang));
    } finally {
      setBusy(false);
    }
  }

  return (
    <LegalPageLayoutNative
      title="APPLY"
      eyebrow="UNIT EXCHANGE"
      description={
        isJa
          ? "購入は月末まとめ（おおよそ25日前後）。"
          : "Purchase is batched near month-end (~25th)."
      }
    >
      <View style={styles.batchCard}>
        <Text style={styles.batchTitle}>{batch.short}</Text>
        <Text style={styles.batchBody}>{batch.detail}</Text>
      </View>

      <View style={styles.walletCard}>
        <Text style={styles.walletLine}>
          {isJa
            ? `利用可能 ${available.toLocaleString("ja-JP")} Unit`
            : `Available ${available.toLocaleString("en-US")} Units`}
        </Text>
        <Text style={styles.walletSub}>
          {isJa
            ? `保有 ${balance.toLocaleString("ja-JP")} − 申請中 ${reservedUnits.toLocaleString("ja-JP")} · 今シーズン ${seasonUnitsUsed}/${seasonCap}`
            : `Held ${balance.toLocaleString("en-US")} − reserved ${reservedUnits.toLocaleString("en-US")} · Season ${seasonUnitsUsed}/${seasonCap}`}
        </Text>
        {submitBlocked ? (
          <Text style={styles.walletWarn}>
            {redemptionApplyErrorMessage(afford.reason, lang)}
          </Text>
        ) : null}
      </View>

      <Text style={styles.label}>{isJa ? "商品区分" : "Tier"}</Text>
      <View style={styles.kindRow}>
        {REDEMPTION_CATALOG.map((item) => {
          const on = item.kind === productKind;
          return (
            <Pressable
              key={item.kind}
              onPress={() => setProductKind(item.kind)}
              style={[styles.kindChip, on && styles.kindChipOn]}
            >
              <Text style={[styles.kindText, on && styles.kindTextOn]}>
                {isJa ? item.titleJa : item.titleEn}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selected ? (
        <Text style={styles.hint}>
          {selected.unitsRequired} Unit ·{" "}
          {redemptionPriceCapShort(selected, lang)}
        </Text>
      ) : null}

      {(
        [
          [isJa ? "商品名" : "Product name", productName, setProductName],
          [isJa ? "URL" : "URL", productUrl, setProductUrl],
          [isJa ? "販売店" : "Store", storeName, setStoreName],
          [isJa ? "サイズ" : "Size", size, setSize],
          [isJa ? "カラー" : "Color", color, setColor],
          [isJa ? "氏名" : "Name", shippingName, setShippingName],
          [isJa ? "郵便番号" : "Postal", shippingPostalCode, setShippingPostalCode],
          [isJa ? "住所" : "Address", shippingAddress, setShippingAddress],
          [isJa ? "電話" : "Phone", shippingPhone, setShippingPhone],
          [isJa ? "国" : "Country", shippingCountry, setShippingCountry],
        ] as const
      ).map(([label, value, set]) => (
        <View key={label} style={styles.field}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={set}
            placeholderTextColor="rgba(255,255,255,0.25)"
            autoCapitalize="none"
          />
        </View>
      ))}

      <View style={styles.field}>
        <Text style={styles.label}>{isJa ? "補足" : "Notes"}</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholderTextColor="rgba(255,255,255,0.25)"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={styles.consentRow}
        onPress={() => setConsent((v) => !v)}
      >
        <View style={[styles.checkbox, consent && styles.checkboxOn]} />
        <Text style={styles.consentText}>
          {isJa
            ? REDEMPTION_APPLY_CONSENT.label.ja
            : REDEMPTION_APPLY_CONSENT.label.en}
        </Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          disabled={busy || submitBlocked}
          style={[styles.primaryBtn, submitBlocked && styles.btnDisabled]}
          onPress={() => void submit(false)}
        >
          <Text style={styles.primaryBtnText}>
            {isJa ? "申請する" : "Submit"}
          </Text>
        </Pressable>
        <Pressable
          disabled={busy}
          style={styles.ghostBtn}
          onPress={() => void submit(true)}
        >
          <Text style={styles.ghostBtnText}>
            {isJa ? "下書き" : "Draft"}
          </Text>
        </Pressable>
      </View>
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
  walletCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  walletLine: { fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  walletSub: {
    marginTop: 4,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },
  walletWarn: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(253,164,175,0.95)",
  },
  label: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 },
  kindRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  kindChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  kindChipOn: {
    borderColor: "rgba(103,232,249,0.5)",
    backgroundColor: "rgba(34,211,238,0.12)",
  },
  kindText: { fontSize: 11, color: "rgba(255,255,255,0.65)" },
  kindTextOn: { color: "#ecfeff", fontWeight: "700" },
  hint: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12 },
  field: { marginBottom: 10 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.4)",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    borderRadius: 2,
  },
  textarea: { minHeight: 72, textAlignVertical: "top" },
  error: { color: "rgba(253,164,175,0.9)", marginBottom: 8 },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    marginTop: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "transparent",
  },
  checkboxOn: {
    backgroundColor: "rgba(34,211,238,0.55)",
    borderColor: "rgba(103,232,249,0.8)",
  },
  consentText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.65)",
  },
  actions: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 24 },
  primaryBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(103,232,249,0.4)",
    backgroundColor: "rgba(34,211,238,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnDisabled: { opacity: 0.45 },
  primaryBtnText: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#ecfeff",
  },
  ghostBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ghostBtnText: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.7)",
  },
});
