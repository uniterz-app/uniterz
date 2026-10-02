/**
 * Web `RedemptionApplyPage` 相当
 */
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import LegalPageLayoutNative from "../../legal/LegalPageLayoutNative";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import { storage } from "../../../lib/firebase";
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
import type { RedemptionProductKind } from "../../../../../../lib/redemption/redemptionTypes";
import { REDEMPTION_APPLY_CONSENT } from "../../../../../../lib/legal/unitRedemptionLegalCopy";
import {
  canAffordRedemption,
  redemptionApplyErrorMessage,
  redemptionAvailableUnits,
} from "../../../../../../lib/redemption/redemptionApplyGate";
import {
  REDEMPTION_PRODUCT_IMAGE_MAX_BYTES,
  redemptionProductImageStoragePath,
} from "../../../../../../lib/redemption/uploadRedemptionProductImage";
import { cyberAlert } from "../../../components/cyberAlert";
import { redemptionApplyFlowCopy } from "../../../../../../lib/redemption/redemptionApplyFlowCopy";
import RedemptionApplyFlowModalNative from "./RedemptionApplyFlowModalNative";

const OX = "Oxanium_700Bold";

export default function RedemptionApplyScreenNative() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute<RouteProp<ProfileStackParamList, "RedeemApply">>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const lang = resolveLocalizedLang(language);

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
  const [imageUri, setImageUri] = useState<string | null>(null);
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
  const [flowOpen, setFlowOpen] = useState(true);
  const flowCopy = redemptionApplyFlowCopy(lang);

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

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      cyberAlert(
        "",
        L(lang, {
          ja: "写真ライブラリへのアクセスを許可してください。",
          en: "Please allow photo library access.",
          ko: "사진 라이브러리 접근을 허용해 주세요.",
          zh: "请允许访问相册。",
          es: "Permite el acceso a la galería.",
          pt: "Permita acesso à galeria.",
          fr: "Autorisez l’accès à la photothèque.",
        })
      );
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!picked.canceled && picked.assets[0]?.uri) {
      setImageUri(picked.assets[0].uri);
      setError(null);
    }
  }

  async function uploadProductImage(): Promise<string> {
    if (!imageUri || !fUser?.uid) return "";
    const res = await fetch(imageUri);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > REDEMPTION_PRODUCT_IMAGE_MAX_BYTES) {
      throw new Error(
        L(lang, {
          ja: "画像は 8MB 以下にしてください。",
          en: "Image must be 8MB or less.",
          ko: "이미지는 8MB 이하여야 합니다.",
          zh: "图片须不超过 8MB。",
          es: "La imagen debe ser de 8 MB o menos.",
          pt: "A imagem deve ter no máximo 8 MB.",
          fr: "L’image doit faire 8 Mo ou moins.",
        })
      );
    }
    const fileId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const fileRef = ref(
      storage,
      redemptionProductImageStoragePath(fUser.uid, fileId)
    );
    await uploadBytes(fileRef, new Uint8Array(buf), {
      contentType: "image/jpeg",
    });
    return getDownloadURL(fileRef);
  }

  async function submit(asDraft: boolean) {
    if (!asDraft && !consent) {
      setError(redemptionApplyErrorMessage("consent_required", lang));
      return;
    }
    if (!asDraft && !imageUri) {
      setError(redemptionApplyErrorMessage("image_required", lang));
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
      let imageUrl: string | undefined;
      if (imageUri) {
        imageUrl = await uploadProductImage();
      }
      const req = await createMeRedemptionNative(
        {
          productKind,
          productName,
          productUrl,
          storeName,
          size,
          color,
          notes,
          imageUrl,
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
        ja: "審査後に購入し、直送します。",
        en: "After review, we purchase and ship direct to you.",
        ko: "심사 후 구매해 직송합니다.",
        zh: "审核后采购并直送。",
        es: "Tras la revisión, compramos y enviamos directo a ti.",
        pt: "Após a análise, compramos e enviamos direto a você.",
        fr: "Après revue, nous achetons et expédions directement.",
      })}
    >
      <RedemptionApplyFlowModalNative
        open={flowOpen}
        language={lang}
        onClose={() => setFlowOpen(false)}
      />

      <Pressable onPress={() => setFlowOpen(true)} style={styles.reopenBtn}>
        <Text style={styles.reopenText}>{flowCopy.reopen}</Text>
      </Pressable>

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
          {redemptionPriceCapShort(selected, lang)}
        </Text>
      ) : null}

      <Text style={styles.label}>
        {L(lang, {
          ja: "商品画像（スクショ）※申請時必須",
          en: "Product screenshot (required)",
          ko: "상품 이미지(필수)",
          zh: "商品截图（必填）",
          es: "Captura del producto (obligatoria)",
          pt: "Captura do produto (obrigatória)",
          fr: "Capture produit (obligatoire)",
        })}
      </Text>
      <Pressable style={styles.imagePick} onPress={() => void pickImage()}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.imagePickText}>
            {L(lang, {
              ja: "タップして画像を選択",
              en: "Tap to choose image",
              ko: "탭하여 이미지 선택",
              zh: "点按选择图片",
              es: "Toca para elegir imagen",
              pt: "Toque para escolher imagem",
              fr: "Appuyez pour choisir une image",
            })}
          </Text>
        )}
      </Pressable>
      {imageUri ? (
        <Pressable onPress={() => setImageUri(null)} style={styles.removeImg}>
          <Text style={styles.removeImgText}>
            {L(lang, {
              ja: "画像を削除",
              en: "Remove image",
              ko: "이미지 삭제",
              zh: "删除图片",
              es: "Quitar imagen",
              pt: "Remover imagem",
              fr: "Supprimer l’image",
            })}
          </Text>
        </Pressable>
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
  reopenBtn: { alignSelf: "flex-start", marginBottom: 10 },
  reopenText: {
    fontSize: 11,
    color: "rgba(165,243,252,0.75)",
    textDecorationLine: "underline",
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
  imagePick: {
    minHeight: 140,
    marginBottom: 8,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imagePreview: { width: "100%", height: 160, resizeMode: "contain" },
  imagePickText: { fontSize: 12, color: "rgba(255,255,255,0.45)" },
  removeImg: { marginBottom: 10 },
  removeImgText: { fontSize: 11, color: "rgba(253,164,175,0.9)" },
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
