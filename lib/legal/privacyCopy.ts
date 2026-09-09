/**
 * Uniterz プライバシーポリシー本文。
 * 弁護士たたき台をベースに、サービス設計で補完した運用正
 * （Firebase 認証・保存、App Store 課金、Expo 通知、Unit 交換配送、海外クラウド）。
 */
import type { LegalSection } from "@/lib/legal/legalSection";
import {
  COMPANY_ADDRESS,
  COMPANY_ADDRESS_FULL,
  COMPANY_LEGAL_NAME,
  companyAddress,
  companyAddressFull,
  companyLegalName,
  COMPANY_POSTAL_CODE,
  TOKUSHOHO_URL,
} from "@/lib/legal/companyInfo";
import { SUPPORT_EMAIL } from "@/lib/contact/companyEmails";
import { REDEMPTION_PRIVACY_ADDITIONS } from "@/lib/legal/unitRedemptionLegalCopy";
import type { LegalLang } from "@/lib/legal/unitRedemptionLegalCopy";

export type { LegalLang };

export const PRIVACY_UPDATED_AT = "2026-09-09";

export const PRIVACY_INTRO = {
  ja: "Uniterz におけるユーザー情報の取り扱いについて説明するページです。",
  en: "This page explains how Uniterz handles user information.",
} as const;

export const PRIVACY_PREAMBLE = {
  ja: [
    `個人情報保護への取り組み\n${COMPANY_LEGAL_NAME}（以下「当社」といいます。）は、事業活動において個人情報保護が当社の責務であると認識し、「個人情報保護方針」を定め、個人情報の保護に努めています。`,
    "個人情報保護方針\n当社は、ユーザー（当社と契約を締結するに至っているか否かを問わず、当社が個人情報を取り扱うに至った個人を含みます。）の個人情報の保護について、次のとおり当社が提供するサービス（以下「当社サービス」又は「本サービス」といいます。）に関するプライバシーポリシー（以下「本ポリシー」といいます。）を定め、本ポリシーに基づき適正に個人情報を取扱います。",
    "なお、当社が、個々の製品・サービス等に関する個別のプライバシーポリシー、利用規約またはその他の規程において本ポリシーの内容と異なる定め（以下「個別規定」といいます。）を置いた場合、当該個々の製品・サービス等については、個別規定が本ポリシーに優先して適用されるものとします。",
    "本ポリシーで使用する用語の意味は、個人情報の保護に関する法律（以下「個人情報保護法」といいます。）に準拠するものとします。",
    `法人名、所在地その他の事業者情報の詳細は、特定商取引法に基づく表記（${TOKUSHOHO_URL}）もご確認ください。`,
  ],
  en: [
    `Commitment to Privacy\n${COMPANY_LEGAL_NAME} ("we") recognizes protecting personal information as our responsibility and maintains this Privacy Policy.`,
    "This Privacy Policy (the \"Policy\") explains how we handle personal information of users of Uniterz (the \"Service\"), whether or not they have a contract with us.",
    "If a product-specific policy or the Terms differ from this Policy, that specific rule prevails for that product or service.",
    "Terms used here follow Japan's Act on the Protection of Personal Information (the \"APPI\").",
    `Operator details are also on our commercial-transaction notice (${TOKUSHOHO_URL}).`,
  ],
} as const;

export const PRIVACY_FOOTER = {
  ja: [
    `${PRIVACY_UPDATED_AT} 制定`,
    COMPANY_LEGAL_NAME,
    COMPANY_ADDRESS_FULL,
    `E-Mail：${SUPPORT_EMAIL}`,
    "TEL：請求があった場合に遅滞なく開示します",
  ],
  en: [
    `Adopted ${PRIVACY_UPDATED_AT}`,
    companyLegalName("en"),
    companyAddressFull("en"),
    `Email: ${SUPPORT_EMAIL}`,
    "Phone: Disclosed without delay upon request",
  ],
} as const;

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    id: "collect",
    title: {
      ja: "１　取得する個人情報の項目",
      en: "1. Personal Information We Collect",
    },
    paragraphs: {
      ja: [
        "当社は、ユーザーに関する次に掲げる個人情報を取得することがあります。なお、性別・生年月日、免許証・住民票等の公的証明書、クレジットカード番号及び金融機関口座情報は、原則として取得しません（決済はアプリストアが処理します）。",
      ],
      en: [
        "We may collect the following. As a rule we do not collect gender, date of birth, government ID documents, credit-card numbers, or bank-account details (stores process payment).",
      ],
    },
    subsections: [
      {
        title: {
          ja: "アカウント・本人認証に関する情報",
          en: "Account and authentication",
        },
        bullets: {
          ja: [
            "メールアドレス等の連絡先、アカウントのID及びパスワード、外部認証に伴う識別子",
            "表示名、ハンドル、自己紹介、アイコン画像、国・地域",
            "Pro Skin、バッジ、公開プロフィールに表示する設定",
          ],
          en: [
            "Email and similar contact details, account ID and password, identifiers from external sign-in",
            "Display name, handle, bio, avatar, country or region",
            "Pro Skin, badges, and other public-profile settings",
          ],
        },
      },
      {
        title: {
          ja: "お取引・Pro・決済に関する情報",
          en: "Transactions, Pro, and payment",
        },
        bullets: {
          ja: [
            "Proのプランの種類、利用期間、自動更新の状態、ストア上の取引識別子、購入履歴に関する情報",
            "決済そのものは App Store、Google Play 等のストアが処理します。当社はクレジットカード番号及び金融機関口座情報を取得・保管しません。",
          ],
          en: [
            "Pro plan type, term, auto-renewal status, store transaction IDs, and related purchase history",
            "Stores such as the App Store and Google Play process payment. We do not collect or store credit-card numbers or bank-account details.",
          ],
        },
      },
      {
        title: {
          ja: "Unit および商品交換に関する情報",
          en: "Units and product exchange",
        },
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
        title: {
          ja: "サービスのご利用に際して取得する情報",
          en: "Information from use of the Service",
        },
        bullets: {
          ja: [
            "予想の内容、投稿・変更の履歴、締切後のロック状態",
            "スコア（PT）、ランキング、リザルト、レポートの算出に用いる成績データ",
            "お気に入り、通知設定、チュートリアルの進捗など、機能利用に必要な設定",
            "クッキー（Cookie）ID等のオンライン上の識別子、端末・OSの概要、アプリのバージョン、閲覧履歴その他の利用状況（アクセスログ、IPアドレス、ブラウザ情報、ブラウザの言語設定等を含みます。）",
            "プッシュ通知のためのトークン",
            "サービス提供に不要な精密な位置情報、および連絡先帳は取得しません。",
          ],
          en: [
            "Predictions, edit history, and lock status after a match starts",
            "Scores (PT), rankings, results, and performance data used for reports",
            "Favorites, notification settings, tutorial progress, and similar preferences",
            "Online identifiers such as Cookie IDs, device/OS overview, app version, browsing and usage data (including access logs, IP address, browser info, and language)",
            "Push-notification tokens",
            "We do not collect precise location the Service does not need, or your address book.",
          ],
        },
      },
      {
        title: { ja: "その他の情報", en: "Other information" },
        bullets: {
          ja: [
            "ユーザーから当社へのお問い合わせ・ご連絡等に関する情報",
          ],
          en: ["Support messages and similar communications"],
        },
      },
    ],
  },
  {
    id: "purpose",
    title: { ja: "２　利用目的", en: "2. Purposes of Use" },
    paragraphs: {
      ja: [
        "当社は、ユーザーの個人情報を、次に掲げる利用目的（以下「利用目的」といいます。）の範囲内において取得及び利用します。当社は、ユーザーの個人情報を、利用目的を達するのに必要な期間に限り保持します。",
      ],
      en: [
        "We collect and use personal information only for the purposes below, and keep it only as long as needed for those purposes.",
      ],
    },
    bullets: {
      ja: [
        "当社サービスへの登録及びサービス利用時の本人認証並びにユーザーの管理のため",
        "当社サービスのご提供（予想、ランキング、リザルト、レポート、通知等）、アフターサービスのため",
        "Pro利用権の確認、購入状態の検証、対価のご請求及びサポートのため",
        "Unitの管理および商品交換の審査・購入・配送・連絡のため",
        "不正行為等の防止及び対応のため",
        "当社サービスの保守、管理、障害対応、セキュリティの調査のため",
        "マーケティングデータの調査及び分析並びにマーケティング施策の検討及び実施のため（個人を特定しない統計を含みます。）",
        "アンケートの実施のため",
        "当社サービスの改善のため並びに新たな商品等及びサービスの企画、研究及び開発のため",
        "お問い合わせ対応及びユーザーへのご連絡のため",
        "本ポリシーに基づく開示等の請求に対応するため",
        "本ポリシー記載の方法による、第三者に対する提供のため",
        "当社サービスに関する各種情報（新製品・サービス、新機能、機能改善等）のご案内のため",
        "利用規約、本ポリシー、法令に基づく対応のため",
      ],
      en: [
        "Registration, authentication, and user administration",
        "Providing the Service (predictions, rankings, results, reports, notices, etc.) and support",
        "Verifying Pro access and purchases, billing-related support",
        "Administering Units and reviewing, purchasing, shipping, and communicating about product exchanges",
        "Preventing and responding to abuse",
        "Maintenance, operations, incident response, and security investigations",
        "Marketing research and analysis (including non-identifying statistics) and related measures",
        "Surveys",
        "Improving the Service and planning new products or features",
        "Responding to inquiries and contacting users",
        "Handling disclosure and related requests under this Policy",
        "Third-party provision as described in this Policy",
        "Notices about new products, features, and improvements",
        "Complying with the Terms, this Policy, and law",
      ],
    },
  },
  {
    id: "public",
    title: {
      ja: "（参考）公開される情報",
      en: "(Note) Information That May Be Public",
    },
    paragraphs: {
      ja: [
        "本サービスは競技の場であるため、次の情報は他のユーザーに表示されることがあります。",
      ],
      en: [
        "Because the Service is competitive, the following may be visible to other users.",
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
    id: "security",
    title: {
      ja: "３　安全管理措置に関する事項",
      en: "3. Security Measures",
    },
    bullets: {
      ja: [
        "当社は、個人情報を取り扱う際に、個人情報保護法その他個人情報保護に関する諸法令に関し個人情報保護委員会及び所轄官庁が公表するガイドライン類に定められた義務並びに本ポリシーを遵守します。",
        "当社は、個人情報管理責任者の設置、内部規程の整備、役員及び従業員への教育並びに適正な内部監査の実施等を通じて、本ポリシーの見直しを含めた社内体制の継続的強化・改善に努め、個人情報を適正に管理します。",
        "当社は、安全管理措置として、情報セキュリティの教育を役員及び全従業員を対象に実施し、紛失、破壊、改ざん及び漏洩を防止します。アクセス制限、通信の暗号化、権限管理その他、取り扱う情報の性質に応じた措置を講じます。",
        "当社は、個人情報の取り扱いを委託する場合には、委託先と秘密を保持する契約を義務付け実施します。",
        "漏えいその他の事故が発生し、法令上の報告または通知が必要な場合は、状況に応じて本人および関係機関へ対応します。",
      ],
      en: [
        "We comply with the APPI, related guidelines, and this Policy when handling personal information.",
        "We appoint a personal-information manager, maintain internal rules, train staff, and audit as appropriate to keep improving our controls.",
        "We train officers and employees on information security and take measures suited to the data, including access control, encryption in transit, and permission management.",
        "When we entrust handling of personal information, we require confidentiality agreements with processors.",
        "If an incident requires notice or reporting under law, we will notify affected individuals and authorities as appropriate.",
      ],
    },
  },
  {
    id: "processors",
    title: {
      ja: "（参考）委託および外部サービス",
      en: "(Note) Processors and External Services",
    },
    paragraphs: {
      ja: [
        "当社は、利用目的の達成に必要な範囲で、個人データの取扱いを外部事業者へ委託することがあります。委託先は必要な情報だけを取り扱い、適切な選定と監督を行います。",
      ],
      en: [
        "We may entrust handling of personal data to processors as needed. We provide only what they need and supervise them appropriately.",
      ],
    },
    bullets: {
      ja: [
        "認証、データベース、ファイル保存：Google Firebase 等のクラウド",
        "決済：App Store、Google Play その他、提供時点で対応するストア",
        "プッシュ通知：Expo その他の通知基盤",
        "障害解析、メール配信、カスタマーサポート（利用する場合）",
        "商品の販売店および配送会社",
      ],
      en: [
        "Authentication, database, and file storage: cloud services such as Google Firebase",
        "Payments: the App Store, Google Play, or another store we support",
        "Push notifications: Expo or similar",
        "Crash analytics, email, and customer support when we use them",
        "Product retailers and carriers",
      ],
    },
  },
  {
    id: "third-party",
    title: { ja: "４　第三者提供", en: "4. Third-Party Disclosure" },
    paragraphs: {
      ja: [
        "当社は、当社が取り扱う個人情報を、あらかじめユーザーの同意を得ないで、第三者（日本国外にある者を含みます。）に提供しません。ただし、次に掲げる場合において第三者（日本国外にある者を含みます。）に提供する場合はこの限りではありません。",
        "配送会社やクラウド事業者など、当社の指示の下で取り扱う委託先への提供は、法令上の整理として委託に該当し得るものです。",
        REDEMPTION_PRIVACY_ADDITIONS.thirdParty.ja,
      ],
      en: [
        "Except as follows, we do not provide personal information to third parties (including those outside Japan) without prior consent.",
        "Disclosure to processors acting under our instructions (such as carriers or cloud providers) may be treated as entrustment under the APPI.",
        REDEMPTION_PRIVACY_ADDITIONS.thirdParty.en,
      ],
    },
    bullets: {
      ja: [
        "法令に基づく場合",
        "人の生命、身体または財産の保護のために必要がある場合であって、ユーザーの同意を得ることが困難である場合",
        "公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、ユーザーの同意を得ることが困難である場合",
        "国の機関若しくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、ユーザーの同意を得ることにより当該事務の遂行に支障を及ぼすおそれがある場合",
        "当社が利用目的の達成に必要な範囲内において個人情報の取扱いの全部または一部を委託する場合",
        "合併その他の事由による事業の承継に伴って個人情報が提供される場合",
      ],
      en: [
        "When required by law",
        "When necessary to protect life, body, or property and obtaining consent is difficult",
        "When especially necessary for public health or sound upbringing of children and obtaining consent is difficult",
        "When cooperating with a government authority performing legally mandated duties and obtaining consent could impede those duties",
        "When we entrust all or part of handling within the scope needed for the purposes of use",
        "When personal information is transferred in a merger or other business succession",
      ],
    },
  },
  {
    id: "foreign",
    title: {
      ja: "（参考）外国にある第三者への提供",
      en: "(Note) Transfers Outside Japan",
    },
    paragraphs: {
      ja: [
        "本サービスは、Firebase 等の海外クラウドを利用するため、アカウント情報、利用データ、ログ等が日本国外で取り扱われることがあります。",
        "海外の販売店から商品を直接発送する場合、氏名、住所、電話番号等を、その国または地域の事業者へ提供することがあります。この場合、申請時に提供先の国・地域および提供する情報を示したうえで同意を取得します。同意しない場合、当該配送方法は利用できません。",
      ],
      en: [
        "The Service uses overseas cloud providers such as Firebase, so account data, usage data, and logs may be processed outside Japan.",
        "If a product ships directly from an overseas retailer, we may provide name, address, phone, and similar details to an operator there, with consent at application time identifying the destination and data. Without consent, that shipping method is unavailable.",
      ],
    },
  },
  {
    id: "ai",
    title: { ja: "（参考）AI の利用", en: "(Note) Use of AI" },
    paragraphs: {
      ja: [
        "PRO INSIGHT その他の分析機能では、試合データや公開スタッツ等を用いて文章や要約を生成することがあります。氏名、住所、電話番号などの配送情報は、外部の生成 AI へ送信しません。入力データを AI 事業者の学習に使用させないよう、契約または設定で対応します。",
        "アカウント停止、Unit の取消しその他の重大な措置は、AI の判定だけで自動確定しません。",
      ],
      en: [
        "PRO INSIGHT and similar features may generate text from match data and public stats. We do not send shipping details to external generative AI. We use contracts or settings so submitted data is not used to train the provider's models.",
        "Serious measures such as account suspension or Unit reversal are not decided by AI alone.",
      ],
    },
  },
  {
    id: "not-do",
    title: { ja: "（参考）行わないこと", en: "(Note) What We Do Not Do" },
    bullets: {
      ja: [
        "個人データを販売しません。",
        "配送先住所を広告配信に使いません。",
        "Pro の購入情報を Unit の付与条件に使いません。",
      ],
      en: [
        "We do not sell personal data.",
        "We do not use shipping addresses for advertising.",
        "We do not use Pro purchase data as a condition for granting Units.",
      ],
    },
  },
  {
    id: "disclosure",
    title: { ja: "５　開示等の請求", en: "5. Disclosure and Related Requests" },
    paragraphs: {
      ja: [
        "当社は、次に定めるとおり開示等の請求（利用目的の通知、個人情報または第三者提供記録の開示、訂正・追加・削除、利用の停止・第三者提供の停止の請求をいいます。）に対応します。",
        `表示名やプロフィールの一部は、アプリ内の設定から変更できます。その他の請求は原則として ${SUPPORT_EMAIL} までご連絡ください。以下は、個人情報保護法に基づく正式な開示等の請求手続です。`,
      ],
      en: [
        "We handle requests for notice of purposes, disclosure of personal information or third-party provision records, correction/addition/deletion, and cessation of use or third-party provision as follows.",
        `Some profile fields can be changed in the app. For other requests, email ${SUPPORT_EMAIL}. The following is the formal APPI disclosure procedure.`,
      ],
    },
    subsections: [
      {
        title: {
          ja: "⑴ 利用目的の通知または開示",
          en: "(1) Notice of purposes or disclosure",
        },
        paragraphs: {
          ja: [
            "ユーザーは、下記⑷の手続に従い、個人情報保護法において認められる範囲内で、利用目的の通知又は個人情報若しくは第三者提供記録の開示を請求できます。ただし、次の場合は開示等を行わないことがあります。利用目的の通知又は開示を請求される場合には、下記⑷の開示手数料をいただきます。",
          ],
          en: [
            "You may request notice of purposes or disclosure of personal information or third-party provision records under the APPI via the procedure in (4). We may decline in the cases below. A fee under (4) applies to notice-of-purpose and disclosure requests.",
          ],
        },
        bullets: {
          ja: [
            "開示することでご本人様または第三者の生命、身体、財産その他の権利利益を害するおそれがある場合",
            "開示することで当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合",
            "開示することが法令に違反することとなる場合",
            "開示の請求がご本人様からであることが確認できない場合",
            "下記⑷に定める手続に従って開示等の請求をしていただけない場合",
          ],
          en: [
            "Disclosure would likely harm the life, body, property, or other rights of the individual or a third party",
            "Disclosure would seriously impede proper performance of our business",
            "Disclosure would violate law",
            "We cannot confirm the request is from the individual",
            "The request does not follow the procedure in (4)",
          ],
        },
      },
      {
        title: {
          ja: "⑵ 訂正・追加・削除",
          en: "(2) Correction, addition, deletion",
        },
        paragraphs: {
          ja: [
            "ユーザーは、下記⑷の手続に従い、個人情報の訂正・追加・削除を請求できます。当社は、利用目的の達成に必要な範囲内で遅滞なく調査し、個人情報保護法において認められる範囲内で対応します。",
          ],
          en: [
            "You may request correction, addition, or deletion via (4). We will investigate promptly within the scope needed for the purposes of use and respond as the APPI allows.",
          ],
        },
      },
      {
        title: {
          ja: "⑶ 利用の停止または第三者提供の停止",
          en: "(3) Cessation of use or third-party provision",
        },
        paragraphs: {
          ja: [
            "ユーザーは、下記⑷の手続に従い、個人情報の利用の停止または第三者提供の停止を請求できます。当社は、個人情報保護法に従って適切に対応します。",
          ],
          en: [
            "You may request cessation of use or third-party provision via (4). We will respond in accordance with the APPI.",
          ],
        },
      },
      {
        title: { ja: "⑷ 手続", en: "(4) Procedure" },
        paragraphs: {
          ja: [
            `ユーザーは、開示等の請求を行う場合、所定事項を記載した請求書に本人確認書類を添付の上、当社の指定する送付先まで郵送又は電磁的記録（電子メール等）で送付するものとします。利用目的の通知及び個人情報または第三者提供記録の開示については、1回の請求につき1,000円の手数料をいただきます（不開示及び利用目的の非通知の場合も同様です）。`,
            "郵送の場合：ユーザーの負担により1,000円分の定額小為替証書（発行日から2か月以内のもの。「指定受取人おなまえ」「おところ」「おなまえ」欄への記載は不要）を請求書に同封してください。",
            "電磁的記録を送付する方法の場合：手数料は当社指定の銀行口座への送金とします。振込手数料はユーザー負担です。振込先口座は、請求を受け付けた際に別途ご案内します。",
            `送付先（郵送）：〒${COMPANY_POSTAL_CODE} ${COMPANY_ADDRESS} ${COMPANY_LEGAL_NAME}　宛`,
            `送付先（電磁的記録）：${SUPPORT_EMAIL}`,
            "請求書記載事項：請求者の住所・氏名・電話番号／本人請求か代理人請求か／ご本人様の住所・氏名・電話番号／請求内容（利用目的の通知、開示、訂正・追加・削除、利用停止・第三者提供の停止から選択）／代理人の場合はその住所・氏名・電話番号及び本人との関係／開示方法（書面の郵送又は電磁的記録）／その他経緯・方法が分かる場合はその旨",
            "本人確認書類：本人請求の場合は個人番号カード（表面）、運転免許証、健康保険被保険者証又はパスポートの写しのいずれか。任意代理人は委任状及び代理人の本人確認書類を追加。法定代理人は法定代理権を確認できる書類及び法定代理人の本人確認書類を追加。",
          ],
          en: [
            "Submit a written request with the required details and ID documents by mail or electronic means (e.g. email). Notice-of-purpose and disclosure requests cost ¥1,000 per request (including when we decline).",
            "By mail: enclose a ¥1,000 fixed-amount postal money order (issued within 2 months; leave payee name/address fields blank) at your expense.",
            "By electronic means: pay the fee to our designated bank account (you bear transfer fees). We will provide account details when we accept the request.",
            `Mail to: ${companyLegalName("en")}, ${companyAddressFull("en")}`,
            `Email to: ${SUPPORT_EMAIL}`,
            "Request contents: requester address/name/phone; whether self or agent; subject's address/name/phone; type of request; agent details if any; preferred disclosure method (mail or electronic); other context if known.",
            "ID: for the individual, a copy of My Number Card (front), driver's license, health insurance card, or passport. Agents also need a power of attorney and their own ID; legal representatives also need proof of authority and their ID.",
          ],
        },
      },
    ],
  },
  {
    id: "cessation",
    title: {
      ja: "６　個人情報の利用停止等",
      en: "6. Cessation of Use, etc.",
    },
    paragraphs: {
      ja: [
        "当社は、ご本人様から、個人情報が利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」といいます。）を求められた場合には、遅滞なく必要な調査を行い、その結果に基づき、個人情報の利用停止等を行い、その旨ご本人様に通知します。ただし、個人情報の利用停止等に多額の費用を要する場合その他利用停止等を行うことが困難な場合であって、ご本人様の権利利益を保護するために必要なこれに代わるべき措置をとれる場合は、この代替策を講じます。",
      ],
      en: [
        "If you request cessation of use or erasure because personal information is handled beyond the purposes of use or was obtained improperly, we will investigate promptly, take appropriate action under the APPI, and notify you. If cessation would be unduly costly or difficult, we may take an alternative measure that adequately protects your interests.",
      ],
    },
  },
  {
    id: "cookies",
    title: { ja: "７　Cookieの取扱い", en: "7. Cookies" },
    subsections: [
      {
        title: { ja: "Cookieの利用について", en: "Use of cookies" },
        paragraphs: {
          ja: [
            "当社のウェブサイトでは、ユーザーにより適切なサービスをご提供するため、Cookie（クッキー）その他のトラッキングまたは解析を行うための類似技術（以下総称して「Cookie」といいます。）を使用することがあります。",
            "Cookieとは、任意の文字が書かれた小さなファイルのことで、ユーザーがウェブサイトを閲覧した際に、ウェブサーバとユーザーのブラウザとの間でやりとりされ、ユーザーの端末に保存されるものです。これにより、閲覧履歴、サービス利用履歴等の情報を取得することがあります。",
            "ユーザーは、ブラウザの設定により、Cookieの無効化及び保存済みCookieの削除をすることができます。Cookieの利用を拒否した場合、ウェブサイトでご利用いただける機能が制限される可能性があります。",
            "Web版では、ログイン状態の維持、セキュリティ、必要な機能の提供のためにCookie等を使用することがあります。広告目的のトラッキングCookieを、現時点では埋め込みません。",
          ],
          en: [
            "Our website may use cookies and similar technologies (\"Cookies\") to provide a better Service.",
            "Cookies are small files stored on your device when you browse. They may collect browsing and usage information.",
            "You can disable or delete Cookies in your browser; some site features may then be limited.",
            "The web version may use Cookies to keep you signed in, protect security, and provide required features. We do not currently embed advertising tracking cookies.",
          ],
        },
      },
      {
        title: {
          ja: "情報収集モジュールによる取得",
          en: "Analytics modules",
        },
        paragraphs: {
          ja: [
            "当社は、ウェブサイトの利用状況の分析、パフォーマンス改善やサービス向上のため、情報収集モジュールにより収集した情報を利用する場合があります。",
            "将来、Googleアナリティクスその他の情報収集モジュールを使用する可能性があります。使用を開始する場合は、本ポリシーの改定又はアプリ内告知等によりお知らせします。Googleアナリティクスを使用する場合の詳細は、利用規約（https://marketingplatform.google.com/about/analytics/terms/jp/）及びプライバシーポリシー（https://policies.google.com/technologies/partner-sites?hl=ja）をご確認ください。",
          ],
          en: [
            "We may use analytics modules to analyze site use and improve performance and the Service.",
            "We may use Google Analytics or similar modules in the future. If we do, we will update this Policy or notice in the app. See Google's terms and partner-sites privacy policy for details when applicable.",
          ],
        },
      },
      {
        title: {
          ja: "情報の第三者からの取得について",
          en: "Information from third parties",
        },
        paragraphs: {
          ja: [
            "当社は、現時点では、DMP事業者その他の広告会社等からユーザーの閲覧履歴等を取得して個人情報と紐づける取扱いは行いません。将来行う場合は、本ポリシーを改定のうえ告知します。",
          ],
          en: [
            "We do not currently obtain browsing history from DMPs or similar ad partners to link with personal information. If we do so in the future, we will amend this Policy and give notice.",
          ],
        },
      },
    ],
  },
  {
    id: "retention",
    title: { ja: "（参考）保存期間の目安", en: "(Note) Retention Guide" },
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
        "Account and ordinary profile: until you close the account; then we hide public display and generally delete or anonymize within a reasonable period",
        "Predictions and rankings: as needed to operate the Service; after withdrawal we generally anonymize",
        "Pro purchase history: as needed for law, tax, and disputes",
        "Unit records: as needed to preserve the ledger after expiry",
        "Product exchange and shipping addresses: deleted when no longer needed after delivery or returns",
        "Access and security logs: generally about one year",
      ],
    },
  },
  {
    id: "minors",
    title: { ja: "（参考）未成年者", en: "(Note) Minors" },
    paragraphs: {
      ja: [
        "未成年者が本サービスを利用する場合、保護者の同意を得たうえで利用してください。Pro の購入および商品交換の申請（配送情報の提供を含みます）についても同様です。",
      ],
      en: [
        "Minors may use the Service only with a parent or guardian's consent. The same applies to Pro purchases and product-exchange applications, including shipping details.",
      ],
    },
  },
  {
    id: "withdrawal",
    title: {
      ja: "（参考）退会後の取扱い",
      en: "(Note) After You Close Your Account",
    },
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
        "Except records required for law or abuse response, we begin deleting or anonymizing personal information.",
      ],
    },
  },
  {
    id: "changes",
    title: {
      ja: "（参考）ポリシーの変更",
      en: "(Note) Changes to This Policy",
    },
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
    title: { ja: "８　お問い合わせ窓口", en: "8. Contact" },
    paragraphs: {
      ja: [
        "当社個人情報保護方針や個人情報保護についてのお問い合わせは、以下の窓口にお願いします。",
        COMPANY_LEGAL_NAME,
        COMPANY_ADDRESS_FULL,
        `E-Mail：${SUPPORT_EMAIL}`,
        "TEL：請求があった場合に遅滞なく開示します（FAXはございません）",
      ],
      en: [
        "For questions about this Policy or our handling of personal information, contact:",
        companyLegalName("en"),
        companyAddressFull("en"),
        `Email: ${SUPPORT_EMAIL}`,
        "Phone: Disclosed without delay upon request (no fax)",
      ],
    },
  },
] as const;
