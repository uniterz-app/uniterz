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
import { DATE_LOCALE } from "../../../../../../lib/i18n/language";
import { L, resolveLocalizedLang } from "../../../../../../lib/i18n/localize";
import type { ProfileStackParamList } from "../../../navigation/types";
import {
  createMeRedemptionNative,
  fetchMeRedemptionsNative,
} from "../redemptionApiNative";
import {
  REDEMPTION_CATALOG,
  normalizeRedemptionProductKind,
  redemptionCatalogTitle,
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
  const lang = resolveLocalizedLang(language);
  /** 価格上限ラベルは ja|en のみ */
  const catalogLang = lang === "ja" ? ("ja" as const) : ("en" as const);
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
      description={L(lang, {
        ja: "購入は月末まとめ（おおよそ25日前後）。",
        en: "Purchase is batched near month-end (~25th).",
        ko: "구매는 월말 일괄(대략 25일 전후).",
        zh: "采购为月末集中（约 25 日前后）。",
        es: "La compra se agrupa a fin de mes (~día 25).",
        pt: "A compra é em lote no fim do mês (~dia 25).",
        fr: "Achat groupé en fin de mois (~25).",
      })}
    >
      <View style={styles.batchCard}>
        <Text style={styles.batchTitle}>{batch.short}</Text>
        <Text style={styles.batchBody}>{batch.detail}</Text>
      </View>

      <View style={styles.walletCard}>
        <Text style={styles.walletLine}>
          {L(lang, {
            ja: `利用可能 ${available.toLocaleString("ja-JP")} Unit`,
            en: `Available ${available.toLocaleString("en-US")} Units`,
            ko: `사용 가능 ${available.toLocaleString("en-US")} Unit`,
            zh: `可用 ${available.toLocaleString("en-US")} Unit`,
            es: `Disponibles ${available.toLocaleString("en-US")} Units`,
            pt: `Disponíveis ${available.toLocaleString("en-US")} Units`,
            fr: `Disponibles ${available.toLocaleString("en-US")} Units`,
          })}
        </Text>
        <Text style={styles.walletSub}>
          {L(lang, {
            ja: `保有 ${balance.toLocaleString("ja-JP")} − 申請中 ${reservedUnits.toLocaleString("ja-JP")} · 今シーズン ${seasonUnitsUsed}/${seasonCap}`,
            en: `Held ${balance.toLocaleString("en-US")} − reserved ${reservedUnits.toLocaleString("en-US")} · Season ${seasonUnitsUsed}/${seasonCap}`,
            ko: `보유 ${balance.toLocaleString("en-US")} − 신청 중 ${reservedUnits.toLocaleString("en-US")} · 시즌 ${seasonUnitsUsed}/${seasonCap}`,
            zh: `持有 ${balance.toLocaleString("en-US")} − 申请中 ${reservedUnits.toLocaleString("en-US")} · 赛季 ${seasonUnitsUsed}/${seasonCap}`,
            es: `Saldo ${balance.toLocaleString("en-US")} − reservado ${reservedUnits.toLocaleString("en-US")} · Temp. ${seasonUnitsUsed}/${seasonCap}`,
            pt: `Saldo ${balance.toLocaleString("en-US")} − reservado ${reservedUnits.toLocaleString("en-US")} · Temp. ${seasonUnitsUsed}/${seasonCap}`,
            fr: `Solde ${balance.toLocaleString("en-US")} − réservé ${reservedUnits.toLocaleString("en-US")} · Saison ${seasonUnitsUsed}/${seasonCap}`,
          })}
        </Text>
        {submitBlocked ? (
          <Text style={styles.walletWarn}>
            {redemptionApplyErrorMessage(afford.reason, lang)}
          </Text>
        ) : null}
      </View>

      <Text style={styles.label}>{L(lang, { ja: "商品区分", en: "Tier", ko: "상품 구분", zh: "商品档位", es: "Nivel", pt: "Nível", fr: "Niveau" })}</Text>
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
                {redemptionCatalogTitle(item, lang)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {selected ? (
        <Text style={styles.hint}>
          {selected.unitsRequired} Unit ·{" "}
          {redemptionPriceCapShort(selected, catalogLang)}
        </Text>
      ) : null}

      {(
        [
          [L(lang, { ja: "商品名", en: "Product name", ko: "상품명", zh: "商品名", es: "Producto", pt: "Produto", fr: "Produit" }), productName, setProductName],
          [L(lang, { ja: "URL", en: "URL", ko: "URL", zh: "URL", es: "URL", pt: "URL", fr: "URL" }), productUrl, setProductUrl],
          [L(lang, { ja: "販売店", en: "Store", ko: "판매점", zh: "店铺", es: "Tienda", pt: "Loja", fr: "Magasin" }), storeName, setStoreName],
          [L(lang, { ja: "サイズ", en: "Size", ko: "사이즈", zh: "尺码", es: "Talla", pt: "Tamanho", fr: "Taille" }), size, setSize],
          [L(lang, { ja: "カラー", en: "Color", ko: "색상", zh: "颜色", es: "Color", pt: "Cor", fr: "Couleur" }), color, setColor],
          [L(lang, { ja: "氏名", en: "Name", ko: "성명", zh: "姓名", es: "Nombre", pt: "Nome", fr: "Nom" }), shippingName, setShippingName],
          [L(lang, { ja: "郵便番号", en: "Postal", ko: "우편번호", zh: "邮编", es: "CP", pt: "CEP", fr: "CP" }), shippingPostalCode, setShippingPostalCode],
          [L(lang, { ja: "住所", en: "Address", ko: "주소", zh: "地址", es: "Dirección", pt: "Endereço", fr: "Adresse" }), shippingAddress, setShippingAddress],
          [L(lang, { ja: "電話", en: "Phone", ko: "전화", zh: "电话", es: "Teléfono", pt: "Telefone", fr: "Téléphone" }), shippingPhone, setShippingPhone],
          [L(lang, { ja: "国", en: "Country", ko: "국가", zh: "国家", es: "País", pt: "País", fr: "Pays" }), shippingCountry, setShippingCountry],
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
        <Text style={styles.label}>{L(lang, { ja: "補足", en: "Notes", ko: "메모", zh: "备注", es: "Notas", pt: "Notas", fr: "Notes" })}</Text>
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
          {L(lang, REDEMPTION_APPLY_CONSENT.label)}
        </Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          disabled={busy || submitBlocked}
          style={[styles.primaryBtn, submitBlocked && styles.btnDisabled]}
          onPress={() => void submit(false)}
        >
          <Text style={styles.primaryBtnText}>
            {L(lang, { ja: "申請する", en: "Submit", ko: "신청", zh: "提交", es: "Enviar", pt: "Enviar", fr: "Envoyer" })}
          </Text>
        </Pressable>
        <Pressable
          disabled={busy}
          style={styles.ghostBtn}
          onPress={() => void submit(true)}
        >
          <Text style={styles.ghostBtnText}>
            {L(lang, { ja: "下書き", en: "Draft", ko: "초안", zh: "草稿", es: "Borrador", pt: "Rascunho", fr: "Brouillon" })}
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
