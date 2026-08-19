/**
 * Uniterz 利用規約本文。
 * 現行のサービス設計（予想無料、Pro は分析・通知・レポート・見た目、
 * Unit は無償付与のみ、Free/Pro で競技条件同一）に合わせた確定稿。
 * 弁護士確認済み。
 */
import type { LegalSection } from "@/lib/legal/legalSection";
import {
  REDEMPTION_TERMS_SECTION,
  UNIT_TERMS_SECTION,
  type LegalLang,
} from "@/lib/legal/unitRedemptionLegalCopy";

export type { LegalLang };

export const TERMS_UPDATED_AT = "2026-08-18";

export const TERMS_INTRO = {
  ja: "Uniterz におけるご利用条件を定めたページです。ご利用前に必ずご確認ください。",
  en: "This page sets forth the terms and conditions for using Uniterz. Please review them carefully before using the Service.",
} as const;

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    id: "apply",
    title: { ja: "適用", en: "Scope" },
    paragraphs: {
      ja: [
        "本規約は、Uniterz（以下「本サービス」）の利用に関する条件を定めるものです。本サービスを利用した時点で、本規約に同意したものとみなします。",
        "本規約は、モバイルアプリ、Web、および本サービスに付随する機能のすべてに適用されます。",
      ],
      en: [
        "These Terms set the conditions for using Uniterz (the \"Service\"). By using the Service, you agree to these Terms.",
        "These Terms apply to the mobile app, the web version, and all related features.",
      ],
    },
  },
  {
    id: "define",
    title: { ja: "定義", en: "Definitions" },
    bullets: {
      ja: [
        "「当社」：本サービスの運営者（株式会社UNITERZ）をいいます。法人情報は特定商取引法に基づく表記をご確認ください。",
        "「ユーザー」：本サービスを利用する個人をいいます。",
        "「予想」：試合の勝敗、スコアその他、当社が定める項目についての投稿をいいます。",
        "「スコア」：予想結果に基づき、ランキング算出のために付与される本サービス内の成績指標をいいます。金銭的価値はなく、購入・換金・譲渡・商品交換はできません。",
        "「ランキング」：スコアその他当社が定める指標に基づく順位表示をいいます。",
        "「Unit」：当社が条件達成者に無償で付与するアプリ内報酬をいいます。",
        "「Pro」：分析、通知、レポート、見た目等を提供する有料プランをいいます。",
      ],
      en: [
        "\"We\" / \"the operator\" means UNITERZ Inc., the operator of the Service. Corporate details are published on the legally required notices page.",
        "\"User\" means an individual who uses the Service.",
        "\"Prediction\" means a submission on win/loss, score, or other items we specify.",
        "\"Score\" means an in-Service performance metric used to calculate rankings. It has no monetary value and cannot be purchased, cashed out, transferred, or exchanged for goods.",
        "\"Rankings\" means ranking displays based on Score and other metrics we specify.",
        "\"Units\" means in-app rewards we grant free of charge when conditions are met.",
        "\"Pro\" means the paid plan for analysis, alerts, reports, visuals, and similar features.",
      ],
    },
  },
  {
    id: "nature",
    title: { ja: "サービスの性質", en: "Nature of the Service" },
    paragraphs: {
      ja: [
        "本サービスは、NBAなどの試合結果を無料で予想し、的中などの成績をランキングで競うスポーツ予想アプリです。現金を賭けるサービス、ベッティングサービス、投資助言サービスではありません。",
      ],
      en: [
        "The Service is a sports prediction app where you freely predict results of NBA and other matches and compete on accuracy and related performance in rankings. It is not a cash-betting service, a betting service, or an investment advisory service.",
      ],
    },
    bullets: {
      ja: [
        "試合結果の予想は無料で行えます。予想が外れても、財産を失う仕組みではありません。",
        "現金を賭けることはできません。",
        "Unit を購入することはできません。",
        "Unit を現金に換えることはできません。",
        "Pro の対価は、後記の Pro 機能の利用対価であり、予想の参加費、Unit の購入代金、商品交換の対価ではありません。",
      ],
      en: [
        "Predictions are free. A wrong prediction does not cause you to lose money or property.",
        "You cannot bet cash.",
        "You cannot buy Units.",
        "You cannot cash out Units.",
        "Pro fees are consideration for the Pro features described below, not an entry fee for predictions, a purchase of Units, or payment for product exchange.",
      ],
    },
  },
  {
    id: "account",
    title: { ja: "アカウント", en: "Account" },
    bullets: {
      ja: [
        "登録情報は正確かつ最新の内容を維持してください。",
        "アカウントは本人のみが利用できます。貸与、共有、譲渡はできません。",
        "ログイン情報の管理はユーザーの責任です。",
        "未成年者が利用する場合は、保護者の同意を得たうえで利用してください。Pro の購入および商品交換の申請についても同様です。",
        "当社は、不正利用が疑われる場合、利用制限、利用権の取消し、アカウント停止等の措置を行うことがあります。",
      ],
      en: [
        "Keep your registration information accurate and up to date.",
        "An account may be used only by its holder. Lending, sharing, or transferring accounts is not allowed.",
        "You are responsible for your login credentials.",
        "Minors may use the Service only with a parent or guardian's consent. The same applies to Pro purchases and product-exchange applications.",
        "If we suspect misuse, we may restrict use, revoke Pro access, or suspend the account.",
      ],
    },
  },
  {
    id: "predict",
    title: { ja: "予想、スコア、ランキング", en: "Predictions, Scores, and Rankings" },
    bullets: {
      ja: [
        "予想の投稿および変更は、原則として試合開始前までです。開始後はロックされます。",
        "試合終了後、公式の試合結果等を反映して成績を集計します。公式記録の訂正、データ遅延、障害等により、表示や集計が後から変わることがあります。",
        "スコアおよびランキングは、当社が定める計算方法に基づきます。将来の的中や順位を保証するものではありません。",
        "スコアの計算方法、ランキングへの参加条件、Unit の付与条件および付与量、商品交換の条件は、Free と Pro で同一です。Pro 加入による加点、Unit 増量、当選枠の優遇その他の競技上の優位はありません。",
        "計算方法、対象試合、表示項目は、改善のため変更することがあります。",
      ],
      en: [
        "Predictions may be submitted or edited only before the match starts, unless we specify otherwise. They lock after tip-off.",
        "After a match ends, we tally results based on official records and similar sources. Displays and tallies may later change due to official corrections, data delays, or outages.",
        "Scores and rankings follow our calculation rules. They do not guarantee future accuracy or rank.",
        "Scoring, ranking eligibility, Unit grant conditions and amounts, and product-exchange conditions are the same for Free and Pro. Pro does not add score bonuses, extra Units, better odds of rewards, or other competitive advantages.",
        "We may change calculation methods, eligible matches, and display items to improve the Service.",
      ],
    },
  },
  {
    id: "unit",
    title: UNIT_TERMS_SECTION.title,
    paragraphs: {
      ja: [
        "Pro 利用料金は Pro 機能の利用対価であり、Unit の購入代金または商品交換の対価ではありません。",
      ],
      en: [
        "Pro fees are consideration for Pro features, not a purchase of Units or payment for product exchange.",
      ],
    },
    bullets: UNIT_TERMS_SECTION.bullets,
  },
  {
    id: "redemption",
    title: REDEMPTION_TERMS_SECTION.title,
    bullets: REDEMPTION_TERMS_SECTION.bullets,
  },
  {
    id: "pro",
    title: { ja: "Pro プラン", en: "Pro Plan" },
    paragraphs: {
      ja: [
        "Pro は、ユーザー自身の予想を支援するための有料プランです。的中、順位上昇、Unit 獲得、商品交換を保証するものではありません。",
      ],
      en: [
        "Pro is a paid plan to support your own predictions. It does not guarantee hits, higher rank, Units, or product exchange.",
      ],
    },
    bullets: {
      ja: [
        "Pro で提供し得る機能は、PRO INSIGHT、試合直前の重要変化アラート、週次レポート、月次レポート、Pro Skin、Pro バッジ、その他当社が定める見た目および分析機能です。",
        "PRO INSIGHT は、無料でも見られる情報を要約し、見るべき点を整理する機能です。勝敗を断定したり、特定の予想を推奨したりするものではありません。",
        "週次レポートは Pro の各プランで提供します。月次レポートは Monthly および Season Pass で提供し、Weekly には含まれません。",
        "Pro Skin および Pro バッジは、有効な Pro 利用権がある期間に限り表示・装着できます。解約後は通常表示に戻ります。",
        "機能の詳細、対象スポーツ、提供時期はアプリ内の表示に従います。",
      ],
      en: [
        "Pro may include PRO INSIGHT, late-breaking alerts, weekly reports, monthly reports, Pro Skin, Pro Badge, and other visuals or analysis we specify.",
        "PRO INSIGHT summarizes information also available on Free and highlights what to watch. It does not declare a winner or recommend a specific prediction.",
        "Weekly reports are included in Pro plans. Monthly reports are included in Monthly and Season Pass only, not Weekly.",
        "Pro Skin and Pro Badge may be shown or equipped only while Pro access is active. After cancellation, the usual appearance returns.",
        "Feature details, sports coverage, and availability follow in-app notices.",
      ],
    },
  },
  {
    id: "billing",
    title: { ja: "料金、支払、解約、返金", en: "Fees, Payment, Cancellation, and Refunds" },
    paragraphs: {
      ja: [
        "Pro の契約内容、税込価格、利用期間、自動更新の有無、解約方法は、購入画面および特定商取引法に基づく表記の表示が優先します。地域、通貨、ストアによって表示価格が異なる場合があります。",
      ],
      en: [
        "The purchase screen and the legally required commercial-transaction notice control Pro contract details, tax-included price, term, auto-renewal, and how to cancel. Displayed prices may differ by region, currency, and store.",
      ],
    },
    subsections: [
      {
        title: { ja: "プランの種類", en: "Plan types" },
        bullets: {
          ja: [
            "Weekly：7日間の自動更新。日本の App Store における税込予定価格は 280 円 / 7日です。",
            "Monthly：1か月間の自動更新。同 780 円 / 月です。",
            "Season Pass：対象シーズン終了までの買い切り。同 5,000 円です。自動更新しません。購入時期にかかわらず終了日は同一です。",
            "無料体験を提供する場合、対象プラン、期間、終了後の料金および解約期限は購入画面の表示に従います。Season Pass に無料体験は付きません。",
          ],
          en: [
            "Weekly: auto-renews every 7 days. Planned Japan App Store price is ¥280 per 7 days, tax included.",
            "Monthly: auto-renews monthly. Planned Japan App Store price is ¥780 per month, tax included.",
            "Season Pass: one-time purchase until the end of the designated season. Planned Japan App Store price is ¥5,000, tax included. It does not auto-renew. The end date is the same regardless of when you buy.",
            "If a free trial is offered, the eligible plan, length, post-trial price, and cancel-by date follow the purchase screen. Season Pass has no free trial.",
          ],
        },
      },
      {
        title: { ja: "支払", en: "Payment" },
        paragraphs: {
          ja: [
            "支払は、App Store その他、提供時点で対応するストアが定める方法によります。ストアの利用規約および課金条件も適用されます。",
          ],
          en: [
            "Payment is made through the App Store or another store we support at the time, under that store's terms and billing rules.",
          ],
        },
      },
      {
        title: { ja: "解約", en: "Cancellation" },
        paragraphs: {
          ja: [
            "Weekly および Monthly の解約は、購入したストアのサブスクリプション管理画面から行ってください。アプリを削除してもストアの定期購入は解約されません。",
            "解約後も、すでに支払い済みの期間が終了するまでは Pro 機能を利用できます。期間終了後は Free に戻ります。",
            "Season Pass は自動更新しないため、期間途中の解約による残期間の払戻しは、法令およびストアの方針が認める場合を除き行いません。",
          ],
          en: [
            "Cancel Weekly and Monthly in the subscription settings of the store you used. Deleting the app does not cancel a store subscription.",
            "After you cancel, Pro features remain available until the paid period ends. You then return to Free.",
            "Season Pass does not auto-renew. We do not refund unused time mid-season except where required by law or store policy.",
          ],
        },
      },
      {
        title: { ja: "返金", en: "Refunds" },
        paragraphs: {
          ja: [
            "返金は、購入したストアの返金手続および適用法令に従います。デジタルコンテンツの性質上、当社独自の返金は原則として行いません。ただし、法令により返金または契約解除が認められる場合は、その定めに従います。",
          ],
          en: [
            "Refunds follow the store's refund process and applicable law. Given the nature of digital content, we generally do not issue separate refunds. Where law requires a refund or cancellation, we follow that law.",
          ],
        },
      },
    ],
  },
  {
    id: "alerts",
    title: { ja: "通知", en: "Notifications" },
    paragraphs: {
      ja: [
        "通知は、端末設定、通信環境、外部データの更新状況等により遅延または未達となることがあり、到達を保証しません。",
      ],
      en: [
        "Notifications may be delayed or fail depending on device settings, connectivity, and third-party data updates. Delivery is not guaranteed.",
      ],
    },
  },
  {
    id: "prohibited",
    title: { ja: "禁止事項", en: "Prohibited Conduct" },
    bullets: {
      ja: [
        "法令または本規約に違反する行為",
        "他者または当社になりすます行為",
        "自動化、過剰アクセス、不正アクセス、システムの妨害",
        "チート、複数アカウントによる無料体験の重複取得、決済情報の不正利用",
        "Pro 機能の内容を組織的に転載し、または再販売する行為",
        "他のユーザーへの迷惑行為、誹謗中傷",
        "知的財産権その他の権利を侵害する行為",
      ],
      en: [
        "Violating law or these Terms",
        "Impersonating others or us",
        "Automation, excessive requests, unauthorized access, or interfering with systems",
        "Cheating, creating multiple accounts to repeat a free trial, or misusing payment information",
        "Systematically copying or reselling Pro features",
        "Harassment or defamation",
        "Infringing intellectual property or other rights",
      ],
    },
  },
  {
    id: "ip",
    title: { ja: "知的財産権", en: "Intellectual Property" },
    paragraphs: {
      ja: [
        "本サービスに関する権利は、当社または正当な権利者に帰属します。ユーザーが投稿した予想その他の内容について、当社は本サービスの運営、表示、品質改善に必要な範囲で利用できるものとします。",
        "NBA、チーム、選手等の名称・ロゴは各権利者に帰属します。本サービスは NBA またはその関係会社の公式サービスではありません。",
      ],
      en: [
        "Rights in the Service belong to us or the rightful owners. We may use predictions and other content you submit as needed to operate, display, and improve the Service.",
        "NBA, team, and player names and logos belong to their respective owners. The Service is not an official NBA service or affiliate.",
      ],
    },
  },
  {
    id: "privacy",
    title: { ja: "個人情報", en: "Personal Information" },
    paragraphs: {
      ja: [
        "個人情報の取扱いは、プライバシーポリシーに従います。",
      ],
      en: [
        "We handle personal information under our Privacy Policy.",
      ],
    },
  },
  {
    id: "change",
    title: { ja: "サービスの変更、停止", en: "Changes and Suspension" },
    bullets: {
      ja: [
        "当社は、機能の追加、変更、停止、終了を行うことがあります。",
        "料金、課金周期、利用期間、主要機能の廃止、Season Pass の終了日など重大な変更は、原則として事前に告知します。",
        "メンテナンス、外部データの障害、災害その他の事情により、一時的に利用できないことがあります。",
      ],
      en: [
        "We may add, change, suspend, or end features.",
        "We will generally give prior notice of material changes such as price, billing cycle, term, removal of a core feature, or the Season Pass end date.",
        "Maintenance, third-party data outages, disasters, or similar events may temporarily interrupt the Service.",
      ],
    },
  },
  {
    id: "liability",
    title: { ja: "免責", en: "Limitation of Liability" },
    bullets: {
      ja: [
        "試合情報、スタッツ、Injury、PRO INSIGHT、通知その他の情報について、正確性、完全性、特定目的への適合性を保証しません。",
        "当社の故意または重過失による場合を除き、当社は本サービスの利用により生じた損害について、法令で認められる範囲でのみ責任を負います。",
        "前項に基づき当社が責任を負う場合でも、当社の軽過失による通常損害については、当該ユーザーが直近1か月間に当社へ支払った Pro 対価の総額を上限とします。無料で利用しているユーザーについては、法令で認められる範囲に限ります。",
        "本規約のうち、消費者契約法その他の法令により無効とされる部分があっても、その他の部分は効力を有します。",
      ],
      en: [
        "We do not warrant the accuracy, completeness, or fitness for a particular purpose of match data, stats, injury information, PRO INSIGHT, notifications, or other information.",
        "Except in cases of our willful misconduct or gross negligence, we are liable for damages from use of the Service only to the extent permitted by law.",
        "Where we are liable for ordinary damages caused by our slight negligence, our liability is capped at the Pro fees that user paid us in the preceding one-month period. For users who paid nothing, liability is limited to what the law requires.",
        "If any part of these Terms is invalid under consumer-contract or other law, the rest remains in effect.",
      ],
    },
  },
  {
    id: "amend",
    title: { ja: "規約の変更", en: "Changes to These Terms" },
    paragraphs: {
      ja: [
        "当社は、必要に応じて本規約を変更できます。変更後の規約は、本サービス上で告知した時点から効力を生じます。変更後に本サービスを利用した場合、変更後の規約に同意したものとみなします。",
      ],
      en: [
        "We may amend these Terms as needed. An amendment takes effect when posted on the Service. Continued use after that posting means you accept the amended Terms.",
      ],
    },
  },
  {
    id: "law",
    title: { ja: "準拠法および管轄", en: "Governing Law and Venue" },
    paragraphs: {
      ja: [
        "本規約は日本法に準拠します。本サービスに関する紛争は、東京地方裁判所を第一審の専属的合意管轄裁判所とします。",
      ],
      en: [
        "These Terms are governed by the laws of Japan. The Tokyo District Court has exclusive first-instance jurisdiction over disputes relating to the Service.",
      ],
    },
  },
  {
    id: "contact",
    title: { ja: "お問い合わせ", en: "Contact" },
    paragraphs: {
      ja: [
        "本規約に関するお問い合わせは、support@uniterz.app までご連絡ください。",
      ],
      en: [
        "Questions about these Terms: support@uniterz.app.",
      ],
    },
  },
] as const;
