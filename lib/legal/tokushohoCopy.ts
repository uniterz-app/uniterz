/**
 * 特定商取引法に基づく表記。
 * 弁護士たたき台をベースに、サービス設計で補完した運用正。
 * （利用規約の定義は第2条。第12条第4項ただし書き＝再配達送料）
 * 日本語が法令表記の正。英語は UI 表示用。
 */

import { SUPPORT_EMAIL } from "@/lib/contact/companyEmails";
import {
  companyAddress,
  companyLegalName,
  companyRepresentative,
  REDELIVERY_SHIPPING_FEE_JPY,
  SEASON_PASS_END_MONTH_DAY,
  SEASON_PASS_END_MONTH_DAY_EN,
  TERMS_URL,
  type CompanyLang,
} from "@/lib/legal/companyInfo";

export const TOKUSHOHO_UPDATED_AT = "2026-09-09";

export const TOKUSHOHO_HEADING = {
  ja: "特定商取引法に基づく表記",
  en: "Notation Based on the Act on Specified Commercial Transactions",
} as const;

export function tokushohoLead(lang: CompanyLang): string {
  if (lang === "en") {
    return `Unless otherwise specified, terms in this notice follow Article 2 (Definitions) and other provisions of the Uniterz Terms of Use (${TERMS_URL}) (the "Terms"). Prices are planned tax-included amounts on the Japan App Store; the purchase screen display prevails.`;
  }
  return `本表記内の用語は特に指定がない場合、Uniterz利用規約（${TERMS_URL}。以下「本規約」といいます。）第2条（定義）その他の本規約上の条項に従うものとします。料金は日本の App Store における税込予定価格であり、購入画面の表示が優先します。`;
}

/** @deprecated 日本語固定。新規は `tokushohoLead("ja")` */
export const TOKUSHOHO_LEAD = tokushohoLead("ja");

export type TokushohoRow = { label: string; value: string; id: string };

export function tokushohoRows(lang: CompanyLang): readonly TokushohoRow[] {
  if (lang === "en") {
    return [
      {
        id: "contact",
        label: "Service provider, address, and contact",
        value: [
          `Business name: ${companyLegalName("en")}`,
          `Representative Director: ${companyRepresentative("en")}`,
          `Address: ${companyAddress("en")}`,
          "Phone (support): Disclosed without delay upon request",
          `Email: ${SUPPORT_EMAIL}`,
        ].join("\n"),
      },
      {
        id: "fees",
        label: "Fees for the service",
        value: [
          "General users",
          "· Usage fee: Free",
          `· Shipping under Article 12(4) proviso of the Terms: flat ${REDELIVERY_SHIPPING_FEE_JPY} JPY (tax included) nationwide`,
          "",
          "Pro users",
          "· Usage fee: amounts under the plans below (may vary by region, currency, and store; purchase screen prevails)",
          "  Weekly: 280 JPY (tax included) / 7 days (auto-renew)",
          "  Monthly: 780 JPY (tax included) / 1 month (auto-renew)",
          `  Season Pass: 5,000 JPY (tax included) / one-time through the end of the eligible NBA season (no auto-renew; end date follows the purchase screen, generally ${SEASON_PASS_END_MONTH_DAY_EN} of that year)`,
          `· Shipping under Article 12(4) proviso of the Terms: flat ${REDELIVERY_SHIPPING_FEE_JPY} JPY (tax included) nationwide`,
          "",
          "Match predictions and other Free features cost 0 JPY. Pro fees are consideration for analysis, alerts, performance reports, appearance, and similar benefits — not an entry fee for predictions, Unit purchases, or product exchanges.",
        ].join("\n"),
      },
      {
        id: "other-costs",
        label: "Costs other than service fees",
        value:
          "· Payment fees for Pro and communication costs are borne by the user.\n· Customs, import taxes, and local fees for product exchanges may be borne by the user under the Terms.",
      },
      {
        id: "timing",
        label: "When the service is provided",
        value:
          "· Available immediately after registration.\n· Pro is available immediately after the Pro agreement is formed.",
      },
      {
        id: "payment",
        label: "Pro payment method and timing",
        value: [
          "· Pro fees are paid when the Pro agreement is formed via App Store, Google Play, or similar store payment systems.",
          "· Weekly and Monthly are charged again on renewal unless canceled. Timing of the first charge for any free trial follows the purchase screen.",
          "· Shipping under Article 12(4) proviso of the Terms (cash on delivery) is paid when the product arrives.",
        ].join("\n"),
      },
      {
        id: "term",
        label: "Contract term and auto-renewal",
        value: [
          "· Weekly: 7 days. Auto-renews every 7 days unless canceled. No minimum purchase count.",
          "· Monthly: 1 month. Auto-renews monthly unless canceled. No minimum purchase count.",
          `· Season Pass: through the end of the eligible NBA season (generally ${SEASON_PASS_END_MONTH_DAY_EN} of that year; purchase screen prevails). Does not auto-renew. The next season requires a new purchase.`,
          "· Cancel Weekly/Monthly in the store subscription settings where you purchased. Deleting the app does not cancel the store subscription.",
        ].join("\n"),
      },
      {
        id: "cancel",
        label: "Cancellation and refunds",
        value: [
          "· To withdraw, complete our prescribed withdrawal process; withdrawal takes effect when that process finishes.",
          "· After we receive Pro fees, we do not prorate or refund on cancellation, except for our willful misconduct or gross negligence. Store refund procedures and refunds required by law remain available.",
          "· On completed withdrawal, you lose user status and the account; the agreement ends. Debts incurred before withdrawal remain payable afterward.",
          "· After canceling Weekly or Monthly, Pro features remain until the already-paid period ends, then you return to a general user.",
        ].join("\n"),
      },
      {
        id: "env",
        label: "Operating environment",
        value:
          "iOS and Android apps and a corresponding web version are planned. Supported OS details appear at launch and on store pages. An internet connection is required.",
      },
    ];
  }

  return [
    {
      id: "contact",
      label: "役務提供事業者・所在地・ご連絡先",
      value: [
        `事業者名：${companyLegalName("ja")}`,
        `代表取締役：${companyRepresentative("ja")}`,
        `所在地：${companyAddress("ja")}`,
        `電話番号（お問い合わせ窓口）：請求があった場合に遅滞なく開示します`,
        `メールアドレス：${SUPPORT_EMAIL}`,
      ].join("\n"),
    },
    {
      id: "fees",
      label: "サービス提供の対価",
      value: [
        "一般ユーザー",
        "・利用料金：無償",
        `・本規約第12条第4項ただし書きに基づく商品の配送料：全国一律${REDELIVERY_SHIPPING_FEE_JPY}円（税込）`,
        "",
        "Proユーザー",
        "・利用料金：以下のプランに従った金額（地域・通貨・ストアにより異なる場合があり、購入画面の表示が優先します）",
        "　Weekly：280円（税込）／7日（自動更新）",
        "　Monthly：780円（税込）／1か月（自動更新）",
        `　Season Pass：5,000円（税込）／対象NBAシーズン終了までの買い切り（自動更新なし。終了日は購入画面の表示を優先し、原則として当該年の${SEASON_PASS_END_MONTH_DAY}）`,
        `・本規約第12条第4項ただし書きに基づく商品の配送料：全国一律${REDELIVERY_SHIPPING_FEE_JPY}円（税込）`,
        "",
        "試合予想など Free の範囲の利用料金は 0円です。Pro の利用料金は、分析結果・アラート・成績レポート・見た目等の特典に対する対価であり、試合予想の参加費、Unit の購入代金、商品交換の対価ではありません。",
      ].join("\n"),
    },
    {
      id: "other-costs",
      label: "サービス提供の対価以外に必要な費用",
      value:
        "・Pro利用料金の決済手数料、通信費はユーザーの負担とします。\n・商品交換における通常の送料並びに関税・輸入税・現地手数料等は、原則として当社が負担します（本規約第12条）。住所誤り等による再配達送料はユーザー負担とします。",
    },
    {
      id: "timing",
      label: "サービスの提供時期",
      value:
        "・ユーザー登録後、すぐにご利用いただけます。\n・Proについても、利用契約成立後すぐにご利用いただけます。",
    },
    {
      id: "payment",
      label: "Proの利用料金の支払方法及び支払時期",
      value: [
        "・Proの利用料金は、Proの利用契約の成立時に、App Store、Google Play等アプリストアが提供する決済システムを用いてお支払いいただきます。",
        "・WeeklyおよびMonthlyは、解約しない限り更新時にも課金されます。無料体験を提供する場合の初回請求時期は、購入画面の表示に従います。",
        "・本規約第12条第4項ただし書きに基づく商品の配送料（着払い）は、当該商品の到達時にお支払いいただきます。",
      ].join("\n"),
    },
    {
      id: "term",
      label: "契約期間および自動更新",
      value: [
        "・Weekly：7日間。解約しない限り7日ごとに自動更新します。最低購入回数はありません。",
        "・Monthly：1か月間。解約しない限り1か月ごとに自動更新します。最低購入回数はありません。",
        `・Season Pass：対象NBAシーズン終了まで（原則として当該年の${SEASON_PASS_END_MONTH_DAY}。購入画面の表示を優先）。自動更新しません。次シーズンは再購入が必要です。`,
        "・WeeklyおよびMonthlyの解約は、購入したストアのサブスクリプション管理画面から行ってください。アプリを削除してもストアの定期購入は解約されません。",
      ].join("\n"),
    },
    {
      id: "cancel",
      label: "キャンセル・返金について",
      value: [
        "・ユーザーは、退会を希望する場合、当社所定の手続により、退会手続を行うこととし、同退会手続が完了した後、退会となります。",
        "・当社が、ユーザーからPro利用料金を一度受領した後は、解約時に日割り計算による減額等は行わず、当社に故意又は重過失がある場合を除き、一切の返金を行いません。ただし、各アプリストアが定める返金手続による場合、及び法令により返金等が認められる場合は、この限りではありません。",
        "・ユーザーは、退会手続が完了した時点で、ユーザーとしての資格及びアカウントを失うものとし、利用契約は終了するものとします。ただし、当該ユーザーは、退会の効力が発生する前に生じた当社への債務について、退会後も引き続き義務を負うものとします。",
        "・WeeklyまたはMonthlyを解約した後も、すでに支払い済みの期間が終了するまでは Pro 機能を利用できます。期間終了後は一般ユーザーに戻ります。",
      ].join("\n"),
    },
    {
      id: "env",
      label: "動作環境",
      value:
        "iOSおよびAndroidアプリ、ならびに対応するWeb版を予定しています。対応OSの詳細は公開時およびアプリのストアページに表示します。本サービスの利用にはインターネット接続が必要です。",
    },
  ];
}

/** @deprecated 日本語固定。新規は `tokushohoRows("ja")` */
export const TOKUSHOHO_ROWS = tokushohoRows("ja");
