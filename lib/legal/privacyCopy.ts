/**
 * Uniterz プライバシーポリシー本文。
 * 現行設計（Firebase 認証・保存、App Store 課金、Expo 通知、
 * Unit 交換時の配送情報、海外クラウド）に合わせた確定稿。
 * 弁護士確認済み。
 */
import type { LegalSection } from "@/lib/legal/legalSection";
import { REDEMPTION_PRIVACY_ADDITIONS } from "@/lib/legal/unitRedemptionLegalCopy";

export const PRIVACY_UPDATED_AT = "2026-08-18";

export const PRIVACY_INTRO = {
  ja: "Uniterz におけるユーザー情報の取り扱いについて説明するページです。",
  en: "This page explains how Uniterz handles user information.",
} as const;

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    id: "operator",
    title: { ja: "事業者", en: "Operator" },
    paragraphs: {
      ja: [
        "本ポリシーは、Uniterz（以下「本サービス」）の運営者（以下「当社」）が、本サービスにおいて取り扱う個人情報およびそれに準ずる情報について定めるものです。",
        "法人名、所在地その他の事業者情報は、特定商取引法に基づく表記をご確認ください。お問い合わせは support@uniterz.app までお願いします。",
      ],
      en: [
        "This Policy explains how the operator of Uniterz (the \"Service\", \"we\") handles personal information and similar data.",
        "Our legal name, address, and other operator details are published on the legally required notices page. Contact: support@uniterz.app.",
      ],
    },
  },
  {
    id: "scope",
    title: { ja: "適用範囲", en: "Scope" },
    paragraphs: {
      ja: [
        "本ポリシーは、モバイルアプリ、Web、および本サービスに付随する機能を通じて当社が取得する情報に適用されます。本サービスを利用した時点で、本ポリシーに同意したものとみなします。",
      ],
      en: [
        "This Policy applies to information we obtain through the mobile app, the web version, and related features. By using the Service, you agree to this Policy.",
      ],
    },
  },
  {
    id: "collect",
    title: { ja: "取得する情報", en: "Information We Collect" },
    subsections: [
      {
        title: { ja: "アカウントおよびプロフィール", en: "Account and profile" },
        bullets: {
          ja: [
            "認証情報（メールアドレス、外部認証に伴う識別子 等）",
            "表示名、ハンドル、自己紹介、アイコン画像、国・地域",
            "Pro Skin、バッジ、公開プロフィールに表示する設定",
          ],
          en: [
            "Authentication details (email address, identifiers from sign-in providers, and similar)",
            "Display name, handle, bio, avatar, country or region",
            "Pro Skin, badges, and other public-profile settings",
          ],
        },
      },
      {
        title: { ja: "利用データ", en: "Usage data" },
        bullets: {
          ja: [
            "予想の内容、投稿・変更の履歴、締切後のロック状態",
            "スコア、ランキング、リザルト、レポートの算出に用いる成績データ",
            "お気に入り、通知設定、チュートリアルの進捗など、機能利用に必要な設定",
            "問い合わせの内容",
          ],
          en: [
            "Predictions, edit history, and lock status after a match starts",
            "Scores, rankings, results, and other performance data used for reports",
            "Favorites, notification settings, tutorial progress, and similar preferences",
            "Support messages",
          ],
        },
      },
      {
        title: { ja: "Pro および決済", en: "Pro and payments" },
        bullets: {
          ja: [
            "プランの種類、利用期間、自動更新の状態、ストア上の取引識別子",
            "決済そのものは App Store 等のストアが処理します。当社はクレジットカード番号を取得・保管しません。",
          ],
          en: [
            "Plan type, term, auto-renewal status, and store transaction identifiers",
            "The store (such as the App Store) processes payment. We do not collect or store credit-card numbers.",
          ],
        },
      },
      {
        title: { ja: "Unit および商品交換", en: "Units and product exchange" },
        bullets: {
          ja: [
            "Unit の付与、拘束、消費、失効の記録",
            REDEMPTION_PRIVACY_ADDITIONS.collect.ja,
            "申請した商品の内容、販売店、注文・配送の進捗",
          ],
          en: [
            "Records of Unit grants, holds, consumption, and expiry",
            REDEMPTION_PRIVACY_ADDITIONS.collect.en,
            "Requested products, retailers, and order or shipping status",
          ],
        },
      },
      {
        title: { ja: "端末およびログ", en: "Device and logs" },
        bullets: {
          ja: [
            "利用日時、IP アドレス、端末・OS の概要、アプリのバージョン",
            "プッシュ通知のためのトークン",
            "不正防止および障害対応に必要なアクセスログ",
          ],
          en: [
            "Time of use, IP address, device and OS overview, app version",
            "Push-notification tokens",
            "Access logs needed for abuse prevention and incident response",
          ],
        },
      },
    ],
  },
  {
    id: "how",
    title: { ja: "取得方法", en: "How We Collect It" },
    bullets: {
      ja: [
        "ユーザーが入力または送信した情報",
        "本サービスの利用に伴い自動的に記録される情報",
        "認証、決済、通知その他の外部事業者が、サービス提供に必要な範囲で当社へ返す情報",
      ],
      en: [
        "Information you enter or send",
        "Information recorded automatically as you use the Service",
        "Information returned to us by authentication, payment, notification, or other providers as needed to run the Service",
      ],
    },
  },
  {
    id: "purpose",
    title: { ja: "利用目的", en: "Purposes of Use" },
    bullets: {
      ja: [
        "アカウントの作成、認証、本人確認、設定の保存",
        "予想、ランキング、リザルト、レポートその他の機能の提供",
        "Pro 利用権の確認、購入状態の検証、サポート",
        "Unit の管理および商品交換の審査・購入・配送・連絡",
        "締切、試合開始、結果反映、重要なお知らせの通知",
        "不正利用、複数アカウント、スパム、決済不正の防止および調査",
        "障害対応、セキュリティ確保、品質改善、利用状況の統計",
        "利用規約、本ポリシー、法令に基づく対応",
      ],
      en: [
        "Creating accounts, authenticating users, and saving settings",
        "Providing predictions, rankings, results, reports, and other features",
        "Checking Pro access, verifying purchases, and providing support",
        "Administering Units and reviewing, purchasing, shipping, and communicating about product exchanges",
        "Notices about deadlines, match start, results, and important service updates",
        "Preventing and investigating abuse, multi-accounting, spam, and payment fraud",
        "Incident response, security, quality improvement, and aggregated usage statistics",
        "Complying with the Terms, this Policy, and applicable law",
      ],
    },
  },
  {
    id: "public",
    title: { ja: "公開される情報", en: "Information That May Be Public" },
    paragraphs: {
      ja: [
        "本サービスは競技の場であるため、次の情報は他のユーザーに表示されることがあります。非公開にしたい情報は、プロフィールや設定で公開範囲を確認してください。",
      ],
      en: [
        "Because the Service is competitive, the following may be visible to other users. Check profile and settings if you want to limit what is shown.",
      ],
    },
    bullets: {
      ja: [
        "表示名、ハンドル、アイコン、自己紹介、国・地域",
        "ランキング上の順位、スコア、予想成績の一部",
        "Pro バッジ、装着中の Pro Skin、実績バッジ",
        "コミュニティやグループに参加した場合の、その場での表示名および成績",
      ],
      en: [
        "Display name, handle, avatar, bio, country or region",
        "Rank, score, and some prediction performance on leaderboards",
        "Pro Badge, equipped Pro Skin, and achievement badges",
        "Display name and performance in communities or groups you join",
      ],
    },
  },
  {
    id: "not-do",
    title: { ja: "行わないこと", en: "What We Do Not Do" },
    bullets: {
      ja: [
        "個人データを販売しません。",
        "配送先住所を広告配信に使いません。",
        "Pro の購入情報を Unit の付与条件に使いません。",
        "連絡先帳や、サービス提供に不要な精密な位置情報は取得しません。",
        "氏名・住所などの配送情報を、外部の生成 AI へ送信しません。",
      ],
      en: [
        "We do not sell personal data.",
        "We do not use shipping addresses for advertising.",
        "We do not use Pro purchase data as a condition for granting Units.",
        "We do not collect your address book or precise location that the Service does not need.",
        "We do not send shipping details such as name and address to external generative AI.",
      ],
    },
  },
  {
    id: "processors",
    title: { ja: "委託および外部サービス", en: "Processors and External Services" },
    paragraphs: {
      ja: [
        "当社は、利用目的の達成に必要な範囲で、個人データの取扱いを外部事業者へ委託することがあります。委託先は必要な情報だけを取り扱い、適切な選定と監督を行います。",
      ],
      en: [
        "We may entrust handling of personal data to processors as needed for the purposes above. We provide only what they need and select and supervise them appropriately.",
      ],
    },
    bullets: {
      ja: [
        "認証、データベース、ファイル保存：Google Firebase 等のクラウド",
        "決済：App Store その他、提供時点で対応するストア",
        "プッシュ通知：Expo その他の通知基盤",
        "障害解析、メール配信、カスタマーサポート（利用する場合）",
        "商品の販売店および配送会社",
      ],
      en: [
        "Authentication, database, and file storage: cloud services such as Google Firebase",
        "Payments: the App Store or another store we support at the time",
        "Push notifications: Expo or similar notification infrastructure",
        "Crash analytics, email, and customer support when we use them",
        "Product retailers and carriers",
      ],
    },
  },
  {
    id: "third-party",
    title: { ja: "第三者提供", en: "Third-Party Disclosure" },
    paragraphs: {
      ja: [
        "法令に基づく場合を除き、本人の同意なく個人データを第三者に提供しません。配送会社やクラウド事業者など、当社の指示の下で取り扱う委託先への提供は、ここにいう第三者提供とは別に整理します。",
        REDEMPTION_PRIVACY_ADDITIONS.thirdParty.ja,
      ],
      en: [
        "Except as required by law, we do not provide personal data to third parties without your consent. Disclosure to processors who handle data under our instructions, such as carriers or cloud providers, is treated separately from third-party disclosure.",
        REDEMPTION_PRIVACY_ADDITIONS.thirdParty.en,
      ],
    },
  },
  {
    id: "foreign",
    title: { ja: "外国にある第三者への提供", en: "Transfers Outside Japan" },
    paragraphs: {
      ja: [
        "本サービスは、Firebase 等の海外クラウドを利用するため、アカウント情報、利用データ、ログ等が日本国外で取り扱われることがあります。",
        "海外の販売店から商品を直接発送する場合、氏名、住所、電話番号等を、その国または地域の事業者へ提供することがあります。この場合、申請時に提供先の国・地域および提供する情報を示したうえで同意を取得します。同意しない場合、当該配送方法は利用できません。",
      ],
      en: [
        "The Service uses overseas cloud providers such as Firebase, so account data, usage data, and logs may be processed outside Japan.",
        "If a product ships directly from an overseas retailer, we may provide name, address, phone, and similar details to an operator in that country or region. We will identify the destination and the data, then obtain consent at the time of the application. If you do not consent, that shipping method is unavailable.",
      ],
    },
  },
  {
    id: "ai",
    title: { ja: "AI の利用", en: "Use of AI" },
    paragraphs: {
      ja: [
        "PRO INSIGHT その他の分析機能では、試合データや公開スタッツ等を用いて文章や要約を生成することがあります。氏名、住所、電話番号などの配送情報は、外部の生成 AI へ送信しません。入力データを AI 事業者の学習に使用させないよう、契約または設定で対応します。",
        "アカウント停止、Unit の取消しその他の重大な措置は、AI の判定だけで自動確定しません。",
      ],
      en: [
        "PRO INSIGHT and similar analysis may generate text from match data and public stats. We do not send shipping details such as name, address, or phone to external generative AI. We use contracts or settings so that submitted data is not used to train the AI provider's models.",
        "Account suspension, Unit reversal, and other serious measures are not decided by AI alone.",
      ],
    },
  },
  {
    id: "fraud",
    title: { ja: "不正防止", en: "Abuse Prevention" },
    paragraphs: {
      ja: [
        "複数アカウント、招待の不正、決済不正、自動化等を防ぐため、端末情報、IP アドレス、登録日時、投稿パターン等を利用することがあります。同一の IP または同一端末であることだけを理由に、直ちに利用停止することはしません。不正防止の情報を広告目的には使いません。",
      ],
      en: [
        "To prevent multi-accounting, referral abuse, payment fraud, and automation, we may use device information, IP address, registration time, and posting patterns. We will not suspend an account solely because of a shared IP or device. We do not use abuse-prevention data for advertising.",
      ],
    },
  },
  {
    id: "cookies",
    title: { ja: "Cookie および類似技術", en: "Cookies and Similar Technologies" },
    paragraphs: {
      ja: [
        "Web 版では、ログイン状態の維持、セキュリティ、必要な機能の提供のために Cookie または類似技術を使用することがあります。広告目的のトラッキング Cookie を、現時点では埋め込みません。",
      ],
      en: [
        "The web version may use cookies or similar technologies to keep you signed in, protect security, and provide required features. We do not currently embed advertising tracking cookies.",
      ],
    },
  },
  {
    id: "retention",
    title: { ja: "保存期間", en: "Retention" },
    paragraphs: {
      ja: [
        "取得した情報は、利用目的に必要な期間保存し、不要になり次第、削除または匿名化します。法令、税務、紛争対応、不正調査のために必要な情報は、その目的の範囲で保存することがあります。",
      ],
      en: [
        "We keep information as long as needed for the purposes above, then delete or anonymize it. We may retain records required for law, tax, disputes, or abuse investigations, limited to those purposes.",
      ],
    },
    bullets: {
      ja: [
        "アカウントおよび通常のプロフィール：退会まで。退会後は、公開表示を停止し、原則として相当期間内に削除または匿名化します。",
        "予想およびランキング：サービスの運営およびランキングの保全に必要な期間。退会後は匿名化を基本とします。",
        "Pro の購入履歴：法令、税務、紛争対応に必要な期間",
        "Unit の記録：失効後も、台帳の保全に必要な期間",
        "商品交換および配送先：配送・返品対応の終了後、不要になり次第削除",
        "アクセスおよびセキュリティのログ：原則として1年程度",
      ],
      en: [
        "Account and ordinary profile: until you close the account. After that we hide public display and, as a rule, delete or anonymize within a reasonable period.",
        "Predictions and rankings: as needed to operate the Service and preserve rankings. After withdrawal we generally anonymize.",
        "Pro purchase history: as needed for law, tax, and disputes",
        "Unit records: as needed to preserve the ledger after expiry",
        "Product exchange and shipping addresses: deleted when no longer needed after delivery or returns",
        "Access and security logs: generally about one year",
      ],
    },
  },
  {
    id: "security",
    title: { ja: "安全管理", en: "Security" },
    paragraphs: {
      ja: [
        "当社は、不正アクセス、紛失、改ざん、漏えい等を防ぐため、アクセス制限、通信の暗号化、権限管理その他、取り扱う情報の性質に応じた措置を講じます。",
        "漏えいその他の事故が発生し、法令上の報告または通知が必要な場合は、状況に応じて本人および関係機関へ対応します。",
      ],
      en: [
        "We take measures suited to the data we handle, including access control, encryption in transit, and permission management, to reduce unauthorized access, loss, alteration, and leakage.",
        "If an incident occurs and law requires notice or reporting, we will notify affected individuals and authorities as appropriate.",
      ],
    },
  },
  {
    id: "minors",
    title: { ja: "未成年者", en: "Minors" },
    paragraphs: {
      ja: [
        "未成年者が本サービスを利用する場合、保護者の同意を得たうえで利用してください。Pro の購入および商品交換の申請（配送情報の提供を含みます）についても同様です。",
      ],
      en: [
        "Minors may use the Service only with a parent or guardian's consent. The same applies to Pro purchases and product-exchange applications, including sharing shipping details.",
      ],
    },
  },
  {
    id: "rights",
    title: { ja: "開示、訂正、利用停止等", en: "Access, Correction, and Cessation" },
    paragraphs: {
      ja: [
        "ユーザーは、自身の個人情報について、開示、訂正、追加、削除、利用停止等を求めることができます。表示名やプロフィールの一部は、アプリ内の設定から変更できます。その他の請求は support@uniterz.app までご連絡ください。本人確認のうえ、法令に従い対応します。",
      ],
      en: [
        "You may request disclosure, correction, addition, deletion, or cessation of use of your personal information. Some profile fields can be changed in settings. For other requests, email support@uniterz.app. We will verify identity and respond as required by law.",
      ],
    },
  },
  {
    id: "withdrawal",
    title: { ja: "退会後の取扱い", en: "After You Close Your Account" },
    bullets: {
      ja: [
        "ログインおよびプッシュ通知を停止します。",
        "公開プロフィール、Pro Skin、バッジの表示を停止します。",
        "未使用の Unit は失効します。未処理の商品交換申請がある場合は、その状況を確認します。",
        "法令または不正対応のために必要な記録を除き、個人情報の削除または匿名化を開始します。",
      ],
      en: [
        "We disable login and push notifications.",
        "We hide your public profile, Pro Skin, and badges.",
        "Unused Units expire. We review any pending product-exchange applications.",
        "Except records we must keep for law or abuse response, we begin deleting or anonymizing personal information.",
      ],
    },
  },
  {
    id: "changes",
    title: { ja: "ポリシーの変更", en: "Changes to This Policy" },
    paragraphs: {
      ja: [
        "当社は、必要に応じて本ポリシーを変更できます。変更後の内容は、本サービス上で告知した時点から効力を生じます。重要な変更がある場合は、アプリ内のお知らせ等でも案内します。",
      ],
      en: [
        "We may amend this Policy as needed. An amendment takes effect when posted on the Service. We will also notice material changes in the app when appropriate.",
      ],
    },
  },
  {
    id: "contact",
    title: { ja: "お問い合わせ", en: "Contact" },
    paragraphs: {
      ja: [
        "個人情報の取扱いに関するお問い合わせは、support@uniterz.app までご連絡ください。",
      ],
      en: [
        "Questions about this Policy: support@uniterz.app.",
      ],
    },
  },
] as const;
