/**
 * Unit / 商品交換の規約・プライバシー追記（docs/unit-redemption-design.md）
 */
export type LegalLang = "ja" | "en";

export const UNIT_TERMS_SECTION = {
  title: {
    ja: "Unit（ユニット）",
    en: "Units",
  },
  bullets: {
    ja: [
      "Unit は、運営が条件達成者に無償で付与する報酬ポイントです。",
      "Unit の購入、換金、払戻し、譲渡、販売はできません。",
      "Unit は、運営が定める条件の範囲内で、指定の商品との交換申請にのみ使用できます。",
      "付与条件、有効期限、残高表示は運営が定め、予告のうえ変更することがあります。",
    ],
    en: [
      "Units are reward points granted free of charge by the operator when conditions are met.",
      "Units cannot be purchased, cashed out, refunded, transferred, or sold.",
      "Units may only be used to apply for exchange for designated products under the operator's rules.",
      "Grant conditions, validity, and balance display may change with notice.",
    ],
  },
} as const;

export const REDEMPTION_TERMS_SECTION = {
  title: {
    ja: "商品交換（Unit 交換）",
    en: "Product Exchange (Unit Redemption)",
  },
  bullets: {
    ja: [
      "ユーザーは保有 Unit を用い、運営が定めるカタログ条件の範囲で NBA 関連商品との交換を申請できます。",
      "必要 Unit 数・商品価格上限・シーズン交換上限はアプリ内カタログおよび運営告知に従います。価格が上限未満でも必要 Unit は変わりません。",
      "申請時に必要 Unit は交換申請中として一時拘束され、運営が商品を購入した時点で消費済みとなります。注文前の取消・却下時は保有中へ戻ります。",
      "交換申請は月中いつでも受け付け、その月の申請はおおよそ毎月 25 日前後にまとめて購入します。申請時点の在庫が注文時点で欠品となる場合があります。",
      "対象は運営が承認した正規販売店の新品に限ります。中古・転売・ギフトカード・予約・カスタム等は対象外です。",
      "通常の国内・海外送料は原則運営負担です。関税・輸入税・現地手数料等はユーザー負担となる場合があります。",
      "商品注文後のサイズ・カラー・配送先変更、およびユーザー都合のキャンセル・返品は受け付けません（販売店規定・法令に基づく初期不良等を除く）。",
      "NBA・チーム・選手等の名称・ロゴは各権利者に帰属します。本サービスは NBA またはその関係会社の公式サービスではありません。",
    ],
    en: [
      "Users may apply to exchange held Units for NBA-related products within the catalog rules set by the operator.",
      "Required Units, price caps, and season caps follow the in-app catalog and operator notices. Required Units do not change if the item price is below the cap.",
      "On application, required Units are temporarily reserved; they are consumed when the operator purchases the item. On cancel/reject before order, Units return to available balance.",
      "Applications are accepted anytime in the month and are typically purchased in a batch around the 25th. Stock available at application may sell out before order.",
      "Only new items from operator-approved authorized retailers are eligible. Used, resale, gift cards, preorders, and custom items are excluded.",
      "Ordinary domestic/international shipping is generally paid by the operator. Duties, import taxes, and local fees may be borne by the user.",
      "After the retailer order, changes to size/color/address and user-initiated cancel/return are not accepted (except defects under retailer policy or law).",
      "NBA, team, and player names/logos belong to their respective owners. This Service is not an official NBA service or affiliate.",
    ],
  },
} as const;

export const REDEMPTION_PRIVACY_ADDITIONS = {
  collect: {
    ja: "商品交換申請に伴う配送情報（氏名、住所、電話番号、国、商品希望内容 等）",
    en: "Shipping and fulfillment details for product exchange applications (name, address, phone, country, requested product details, etc.)",
  },
  purpose: {
    ja: "商品交換の審査・購入・配送およびユーザーへの連絡のため",
    en: "To review, purchase, and ship product exchanges and to contact users about applications",
  },
  thirdParty: {
    ja: "商品の注文・配送に必要な範囲で、氏名・住所・電話番号等を販売店、配送会社その他の委託先へ提供することがあります。海外の販売店から直接発送する場合、個人情報が海外事業者へ提供される可能性があります。",
    en: "To the extent necessary for ordering and delivery, we may provide name, address, phone, and similar details to retailers, carriers, and other processors. When an overseas retailer ships directly, personal data may be provided to overseas operators.",
  },
} as const;

export const REDEMPTION_APPLY_CONSENT = {
  label: {
    ja: "配送に必要な個人情報を販売店・配送会社等へ提供すること、および利用規約・プライバシーポリシーに同意します。",
    en: "I agree that shipping details may be shared with retailers/carriers as needed, and I agree to the Terms and Privacy Policy.",
  },
  requiredError: {
    ja: "申請には同意が必要です。",
    en: "Consent is required to submit.",
  },
} as const;
