/**
 * Uniterz 利用規約本文。
 * 弁護士たたき台をベースに、サービス設計で補完した運用正。
 * （予想無料、Pro は分析・通知・レポート・見た目、Unit は無償付与のみ、
 * Free/Pro で競技条件同一、Season Pass は対象シーズン終了までの買い切り）
 */
import type { LegalSection } from "@/lib/legal/legalSection";
import {
  companyAddressFull,
  COMPANY_ADDRESS_FULL,
  COMPANY_LEGAL_NAME,
  companyLegalName,
  COMPANY_WEB_URL,
  PRIVACY_POLICY_URL,
  REDELIVERY_SHIPPING_FEE_JPY,
  SEASON_PASS_END_MONTH_DAY,
} from "@/lib/legal/companyInfo";
import { SUPPORT_EMAIL } from "@/lib/contact/companyEmails";
import type { LegalLang } from "@/lib/legal/unitRedemptionLegalCopy";

export type { LegalLang };

export const TERMS_UPDATED_AT = "2026-09-09";

export const TERMS_INTRO = {
  ja: "Uniterz におけるご利用条件を定めたページです。ご利用前に必ずご確認ください。",
  en: "This page sets forth the terms and conditions for using Uniterz. Please review them carefully before using the Service.",
} as const;

export const TERMS_PREAMBLE = {
  ja: [
    `Uniterz利用規約（以下「本規約」といいます）は、${COMPANY_LEGAL_NAME}（以下「当社」といいます）が運営する、NBA等のスポーツの試合結果に関するユーザーの分析力を競うプラットフォームである「Uniterz」を通じて提供する有償・無償の各サービス（以下「本サービス」といいます）の利用条件を定めるものです。本サービスをご利用いただくにあたっては、本規約及び当社プライバシーポリシー（${PRIVACY_POLICY_URL}）（以下「プライバシーポリシー」といいます）の全文をお読みいただいた上で、本規約及びプライバシーポリシーの全ての条項について承諾いただく必要があります。`,
    "本サービスをご利用いただいた場合、ユーザーが本規約及びプライバシーポリシーの内容を理解しており、かつ、本規約及びプライバシーポリシーの全ての条項について承諾したものとみなします。",
  ],
  en: [
    `These Uniterz Terms of Use (the "Terms") set the conditions for using the paid and free services (the "Service") provided through Uniterz, a platform operated by ${COMPANY_LEGAL_NAME} ("we") where users compete on analyzing NBA and other sports results. Before using the Service, please read these Terms and our Privacy Policy (${PRIVACY_POLICY_URL}) in full and accept all of their provisions.`,
    "By using the Service, you are deemed to understand and accept these Terms and the Privacy Policy in full.",
  ],
} as const;

export const TERMS_FOOTER = {
  ja: [
    `${TERMS_UPDATED_AT} 制定`,
    COMPANY_LEGAL_NAME,
    COMPANY_ADDRESS_FULL,
    `お問い合わせ：${SUPPORT_EMAIL}`,
    "電話番号：請求があった場合に遅滞なく開示します",
    `Web：${COMPANY_WEB_URL}`,
  ],
  en: [
    `Adopted ${TERMS_UPDATED_AT}`,
    companyLegalName("en"),
    companyAddressFull("en"),
    `Contact: ${SUPPORT_EMAIL}`,
    "Phone: Disclosed without delay upon request",
    `Web: ${COMPANY_WEB_URL}`,
  ],
} as const;

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    id: "apply",
    title: { ja: "第1条（適用）", en: "Article 1 (Scope)" },
    bullets: {
      ja: [
        "本規約は、利用契約その他ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。",
        "当社が本サービス又は当社ウェブサイト上で掲載する本サービスの利用に関するルールは、本規約の一部を構成するものとします（以下総称して「本規約等」といいます）。",
        "本規約の内容と、その他の本規約外における本サービスの説明等とが矛盾・抵触する場合は、当該説明等の規定を優先させる旨の特段の定めがない限り、本規約の規定が優先して適用されるものとします。",
        "本規約等のほか、本サービスからリンク・呼び出しされているサービスについては、そのサービスの利用規約に同意した上でご利用ください。",
      ],
      en: [
        "These Terms apply to all relationships between you and us concerning use of the Service, including the user agreement.",
        "Rules we post on the Service or our website about use of the Service form part of these Terms (together, the \"Terms etc.\").",
        "If these Terms conflict with other descriptions of the Service outside these Terms, these Terms prevail unless that description expressly says otherwise.",
        "For services linked or launched from the Service, please also accept that service's terms before use.",
      ],
    },
  },
  {
    id: "define",
    title: { ja: "第2条（定義）", en: "Article 2 (Definitions)" },
    bullets: {
      ja: [
        "「ユーザー」とは、当社と利用契約を締結し本サービスを利用する者（法人、個人を問いません）を指します。",
        "「本アプリ」とは、当社がApp Store、Google Play等のアプリストア上で配信する、本サービス提供のためのアプリケーションプログラムを指します。",
        "「対象試合」とは、本サービス内において当社が指定し、ユーザーが勝敗、スコア及び得点者等の予想の投稿を行うことができる個々のスポーツ等の試合をいいます。",
        "「PT」とは、対象試合の終了後、公式結果に基づき当社独自の基準によって計算した、予想結果の成績点を指します。なお、本アプリ内では「スコア」その他当社所定の名称で表示される場合があります。",
        "「Unit」とは、商品の交換にのみ利用できる本アプリ内報酬を指します。",
        "「Pro」とは、本サービスの有料プランを指します。",
        "「Proユーザー」とは、Proに登録し、これを利用するユーザーを指します。",
        "「一般ユーザー」とは、Proに登録していないユーザーを指します。",
        "「チームスタッツ」とは、対象試合に出場するチームに関する戦績、過去の対戦成績、得点率、所属選手の情報、その他チームに関する各種情報をいいます。",
        "「プレイヤースタッツ」とは、対象試合に出場するチームに所属する選手の得点及びアシスト数、成績その他選手個人に関する各種情報をいいます。",
        "「利用契約」とは、本規約等に基づき当社とユーザーの間で規律されるすべての契約関係を総称して呼称する場合に用います。",
        "「ユーザーID」とは、本サービスを利用するためにユーザーごとに付与される本サービス上のアカウント情報を指します。原則としてメールアドレス1個につき1個のIDを登録することができ、ログインIDとパスワードの組み合わせ、又は当社が認める外部認証サービスに紐づく識別子により構成されます。",
      ],
      en: [
        "\"User\" means a person (individual or entity) who enters into a user agreement with us and uses the Service.",
        "\"App\" means the application we distribute on the App Store, Google Play, or similar stores to provide the Service.",
        "\"Eligible Match\" means a sports match we designate in the Service for which users may post predictions such as win/loss, score, and scorers.",
        "\"PT\" means the performance points we calculate under our own rules from official results after an Eligible Match ends. The App may display PT as \"Score\" or another name we specify.",
        "\"Units\" means in-app rewards usable only to exchange for products.",
        "\"Pro\" means the Service's paid plan.",
        "\"Pro User\" means a User registered for and using Pro.",
        "\"General User\" means a User not registered for Pro.",
        "\"Team Stats\" means team records, head-to-head history, scoring rates, roster information, and other team information for teams in an Eligible Match.",
        "\"Player Stats\" means points, assists, and other individual player information for players on teams in an Eligible Match.",
        "\"User Agreement\" means all contractual relationships between you and us under the Terms etc.",
        "\"User ID\" means the account information issued per User. As a rule, one email address maps to one ID, composed of a login ID and password, or an identifier linked to an external authentication service we allow.",
      ],
    },
  },
  {
    id: "register",
    title: { ja: "第3条（登録）", en: "Article 3 (Registration)" },
    bullets: {
      ja: [
        "登録希望者が本規約を遵守することに同意し、かつ、当社が定める方法で登録事項を当社に提供することにより、当社に対し、本サービスの利用の登録を申請することができます。",
        "当社は、本条第5項の基準に従って、登録希望者の登録の可否を判断し、当社が登録を認める場合にはその旨を当社所定の方法にて、当該登録希望者に通知します。登録希望者のユーザーとしての登録は、当社が本項の通知を行ったことをもって完了します。",
        "前項に定める登録の完了時に、本規約を契約内容とする利用契約がユーザーと当社の間に成立します。ユーザーはこれをもって、本サービスを本規約に従って利用することができるものとします。",
        "本契約の有効期間は、本規約により本契約が解除若しくは解約されるまでの期間又はユーザーと当社が合意した期間とし、ユーザーは、当該期間に限り本サービスを利用することができるものとします。",
        "当社は、登録希望者が次のいずれかに該当する場合には、本サービスの利用登録を拒否することができます。（1）過去に本規約違反等により当社サービスの利用停止等を受けたことがある場合（2）提供情報に虚偽・誤記・記載漏れ等があった場合（3）未成年者等で法定代理人等の同意が得られていない場合（4）本規約に違反するおそれがある場合（5）第26条（反社会的勢力の排除）に違反し又は過去に違反していた場合（6）その他当社が不適当と判断した場合",
      ],
      en: [
        "A registration applicant may apply by agreeing to these Terms and providing registration details by the method we specify.",
        "We decide whether to accept registration under paragraph 5 of this Article and notify the applicant by our designated method if accepted. Registration completes upon that notice.",
        "Upon completion of registration, a User Agreement incorporating these Terms is formed, and the User may use the Service under these Terms.",
        "The agreement remains in effect until terminated under these Terms or for any other period we agree with the User.",
        "We may refuse registration if the applicant (1) was previously suspended from our services for Terms violations or similar, (2) submitted false or incomplete information, (3) is a minor or similarly restricted person without required guardian consent, (4) is likely to violate these Terms, (5) violates or previously violated Article 26 (Exclusion of Anti-Social Forces), or (6) we otherwise deem unsuitable.",
      ],
    },
  },
  {
    id: "eligibility",
    title: { ja: "第4条（利用資格）", en: "Article 4 (Eligibility)" },
    paragraphs: {
      ja: [
        "未成年者が本サービスを利用する場合には、事前に法定代理人の同意を得るものとします。未成年者が本サービスの利用を開始した時点で、本サービスの利用及び本規約の内容について法定代理人の同意があったものとみなします。",
      ],
      en: [
        "Minors must obtain a legal representative's consent before using the Service. Starting to use the Service is deemed to mean that consent was given to use of the Service and these Terms.",
      ],
    },
  },
  {
    id: "conditions",
    title: { ja: "第5条（利用条件）", en: "Article 5 (Conditions of Use)" },
    bullets: {
      ja: [
        "本サービスの利用中に発生したユーザー側の通信費その他の実費については、理由の如何を問わずユーザーが負担するものとします。",
        "当社は合理的努力により本サービスの安定稼働を維持するよう努めるものとし、ユーザーは、データの永続性や完全な稼働を保証するものではないことを理解して本サービスを利用するものとします。",
      ],
      en: [
        "Users bear their own communication and other out-of-pocket costs incurred while using the Service, for any reason.",
        "We use reasonable efforts to keep the Service running stably. Users understand that we do not guarantee data permanence or uninterrupted availability.",
      ],
    },
  },
  {
    id: "notice",
    title: { ja: "第6条（連絡/通知）", en: "Article 6 (Communications)" },
    bullets: {
      ja: [
        "当社からユーザーへの連絡及び通知は、メールの送信、当社ウェブサイトへの掲載若しくは書面の送付、本アプリ内通知、その他当社が定める方法により行います。",
        "ユーザーは、当社からユーザー宛に送信されるメールの受信を拒否する設定等を行ってはならないものとし、受信拒否設定やメールアドレス変更等により不着であっても、当社からの通知の発信時をもって通知がなされたものとみなします。",
        "前2項の場合に、ユーザーが当社からの通知を受領できなかったことで損害が生じても、当社は、故意又は重過失がある場合を除き、一切の責任を負いません。",
        `ユーザーから当社への問い合わせその他の連絡は、メール（${SUPPORT_EMAIL}）の送信その他当社が定める方法により行うものとします。`,
      ],
      en: [
        "We may contact Users by email, website posting, mail, in-app notice, or other methods we designate.",
        "Users must not block our emails. If mail fails due to blocking or an outdated address, notice is deemed given when we send it.",
        "Except for our willful misconduct or gross negligence, we are not liable for damages from a User not receiving notice.",
        `Users contact us by email (${SUPPORT_EMAIL}) or another method we designate.`,
      ],
    },
  },
  {
    id: "change-of-details",
    title: {
      ja: "第7条（届出事項の変更）",
      en: "Article 7 (Changes to Registered Details)",
    },
    paragraphs: {
      ja: [
        "ユーザーは、本サービスの申込み時に当社へ届け出た事項に変更が生じた場合、遅滞なく、当社の定める方法により、当該変更事項を当社に通知し、当社から要求された資料を提出するものとします。当該情報の変更がなされなかったことに起因してユーザーに生じた損害については、全て当該ユーザーが負担するものとし、当社は、当社に故意又は重過失がある場合を除き、一切の責任を負わないものとします。",
      ],
      en: [
        "If details you filed with us change, notify us promptly by our designated method and submit any documents we request. Except for our willful misconduct or gross negligence, you bear all damages from failure to update those details, and we have no liability.",
      ],
    },
  },
  {
    id: "amend-terms",
    title: {
      ja: "第8条（本規約の変更・更新）",
      en: "Article 8 (Amendment of These Terms)",
    },
    bullets: {
      ja: [
        "当社は、(1)ユーザーの一般の利益に適合するとき、又は(2)利用契約の目的に反せず、変更の必要性・相当性その他の事情に照らして合理的であるときに、本規約（本サービスの内容、利用料金を含みますがこれらに限られません）を変更できます。",
        "前項の場合、当社は、効力発生日の1ヶ月前までに、変更する旨、変更後の内容及び効力発生日を当社ウェブサイト等に掲載し、又は電子メールその他の方法によりユーザーに通知します。",
        "変更後の効力発生日以降にユーザーが本サービスを利用したときは、当該変更に同意したものとみなします。",
        "常に最新の本規約を確認することはユーザーの義務です。変更後の本規約に同意しない場合、ユーザーは第22条に従い利用契約を解約できます。",
        "前各項のほか、当社は、ユーザーの同意を得た上で本規約を変更することがあります。",
      ],
      en: [
        "We may amend these Terms (including Service content and fees) when (1) the change suits Users' general interests, or (2) it does not conflict with the purpose of the User Agreement and is reasonable in light of necessity and proportionality.",
        "In that case, at least one month before the effective date we will post or email notice of the change, the new text, and the effective date.",
        "Using the Service on or after the effective date is deemed acceptance of the change.",
        "Users must keep up with the latest Terms. If you disagree, you may terminate under Article 22.",
        "Separately, we may amend these Terms with your consent.",
      ],
    },
  },
  {
    id: "credentials",
    title: {
      ja: "第9条（認証情報の管理）",
      en: "Article 9 (Credential Management)",
    },
    bullets: {
      ja: [
        "ユーザーは、自己の責任において、ユーザーID及びパスワードその他の認証情報（以下「ユーザー認証情報」といいます）を適切に管理及び保管するものとし、第三者に利用させ、又は貸与、譲渡、名義変更、売買等をしてはなりません。",
        "当社は、ユーザー認証情報に基づき本サービスが利用されているときは、当該ユーザー本人が利用しているものとみなします。",
        "ユーザー認証情報の管理不十分、使用上の過誤、第三者の使用等によって生じた損害の責任はユーザーが負い、当社は一切の責任を負いません。",
      ],
      en: [
        "Users must properly manage User IDs, passwords, and other credentials (\"Credentials\") and must not let third parties use them or lend, transfer, rename, or sell them.",
        "When the Service is used with Credentials, we treat that as use by the registered User.",
        "Users are responsible for damages from poor Credential management, misuse, or third-party use; we have no liability.",
      ],
    },
  },
  {
    id: "features",
    title: {
      ja: "第10条（本サービスの機能）",
      en: "Article 10 (Service Features)",
    },
    paragraphs: {
      ja: [
        "当社は、ユーザーに対し、本サービスの利用契約期間中、本サービスの利用を許諾します。本サービスは、NBA等の試合結果に関するユーザーの分析力を競うプラットフォームであり、各機能の詳細は本サービス上及び当社ウェブサイト上の説明に従います。",
      ],
      en: [
        "During the User Agreement term, we license use of the Service. The Service is a platform for competing on analyzing NBA and other sports results; feature details follow in-Service and website descriptions.",
      ],
    },
    bullets: {
      ja: [
        "対象試合についての勝敗、スコア、得点者等の予想の投稿",
        "チームスタッツ、プレイヤースタッツ、出場及び欠場選手の情報その他対象試合に関する情報の閲覧",
        "PTの付与及び表示、並びに特定期間におけるランキングの表示",
        "Unitの付与、管理及び商品交換申請",
        "Proユーザー向けの分析結果、アラート通知、成績レポート並びに本アプリ内の見た目及びバッジその他当社が定める機能",
        "データ可視化機能（予想成績、ランキングその他当社が定める指標の集計及び表示）",
        "当社は、本サービスの機能の追加及び変更を随時実施することができます。",
      ],
      en: [
        "Posting predictions on win/loss, score, scorers, and similar for Eligible Matches",
        "Viewing Team Stats, Player Stats, availability information, and other Eligible Match information",
        "Granting and displaying PT, and rankings for designated periods",
        "Granting and managing Units and product-exchange applications",
        "Pro features such as analysis, alerts, performance reports, visuals, and badges",
        "Data visualization of prediction performance, rankings, and other metrics we specify",
        "We may add or change features at any time.",
      ],
    },
  },
  {
    id: "predict-unit",
    title: {
      ja: "第11条（試合結果等の予想、Unitの付与）",
      en: "Article 11 (Predictions and Unit Grants)",
    },
    bullets: {
      ja: [
        "ユーザーは対象の試合を選択し、勝敗、スコア、得点者等の予想を無償で投稿することができます。",
        "ユーザーは、前項に定める予想の投稿を行うにあたり、対象試合が本サービス上で公開された後、チームスタッツ、プレイヤースタッツ、出場及び欠場選手の情報その他対象試合に関する情報を確認することができます。なお、当該情報は公開時点における情報であり、当社はその完全性、正確性、最新性及び有用性等を何ら保証するものではありません。",
        "当社は、対象試合の終了後、PTをユーザーに付与の上、本アプリ内に表示します。",
        "当社は、特定の期間（週間、月間等）におけるユーザーの合計PTに基づきランキングを決定し、本アプリ内に表示します。",
        "当社は、当社所定の条件を満たしたユーザーのアカウントに対し、Unitを無償で付与します。なお当該条件の詳細は、本アプリ内に表示します。",
        "ユーザーはUnitを有償で購入し、他のユーザーその他第三者へ譲渡若しくは貸与し、又は換金することは一切できないものとします。",
      ],
      en: [
        "Users may select Eligible Matches and post free predictions such as win/loss, score, and scorers.",
        "When posting those predictions, Users may view Team Stats, Player Stats, availability information, and other Eligible Match information after the match is published on the Service. That information is as of publication; we do not warrant completeness, accuracy, currency, or usefulness.",
        "After an Eligible Match ends, we grant PT and display it in the App.",
        "We determine rankings from Users' total PT over designated periods (weekly, monthly, etc.) and display them in the App.",
        "We grant Units free of charge to accounts that meet our conditions; details are shown in the App.",
        "Users may not buy Units for value, transfer or lend them to others, or cash them out.",
      ],
    },
  },
  {
    id: "redemption",
    title: {
      ja: "第12条（Unitと商品の交換）",
      en: "Article 12 (Unit Product Exchange)",
    },
    bullets: {
      ja: [
        "ユーザーは、当社所定の方法により、保有するUnitとの交換を希望する商品の写真、販売元のWebサイトURL、規格及び配送先情報を指定して申請するものとし、当社が当該申請を承認した場合に限り、当該Unitと商品の交換を行うことができます。",
        "前項に定める商品交換の申請は、いつでも行うことができます。当社は申請を審査したうえ、購入及び発送の準備を進めます。",
        "当社は、第1項の申請を承認した場合、正規販売店から商品を購入し、当該ユーザーへ配送します。購入・発送にあたっては、配送先の国または地域に対応する正規オンラインストアからの直送を優先します。ユーザーは、当社による商品の購入完了時にUnitを消費するものとします。商品の品切れ、生産終了その他の事情により、当初予定していた商品を提供できない場合、Unitの消費は発生せず、当社からの代替品の発送等の対応は実施しません。",
        `商品の配送に要する送料並びに関税、輸入税及び現地手数料等は、原則として当社が負担するものとします。ただし、ユーザーが交換申請時に指定した配達先情報に誤りがあった場合、再配達及び配達先の変更等により生じた送料（着払い）は、当該ユーザーが負担するものとします。当該ユーザー負担となる送料は、全国一律${REDELIVERY_SHIPPING_FEE_JPY}円（税込）とします。`,
        "当社が購入した商品が、当社の責めに帰すべき事由によらずにユーザーに配達されなかった場合、当社は一切の責任を負わないものとします。",
        "当社は本サービス上において、交換対象となり得る商品のロゴ、画像等を掲載しないものとします。なお、商品カテゴリ、必要Unit数、価格上限その他のテキスト情報を表示する場合があります。",
      ],
      en: [
        "Users apply by our designated method with a photo of the desired product, the retailer's URL, specs, and shipping details. Exchange occurs only if we approve the application.",
        "Applications may be submitted anytime. After reviewing an application, we proceed with purchase and shipping preparation.",
        "If we approve an application, we buy the product from an authorized retailer and ship it to the User. We prioritize purchasing and shipping from the official online store for the User's shipping country or region (direct to the User). Units are consumed when our purchase completes. If we cannot supply the intended product due to stock-outs, discontinuation, or similar, Units are not consumed and we do not ship substitutes.",
        `Ordinary shipping and duties, import taxes, and local fees are generally borne by us. If shipping details the User provided are wrong, the User bears redelivery or address-change shipping (cash on delivery). That User-paid fee is a flat ¥${REDELIVERY_SHIPPING_FEE_JPY} (tax included) nationwide.`,
        "If a purchased product is not delivered for reasons not attributable to us, we have no liability.",
        "We do not post logos or images of potentially exchangeable products on the Service. We may still show text such as category, required Units, and price caps.",
      ],
    },
  },
  {
    id: "pro",
    title: {
      ja: "第13条（Proへの登録、特典の付与）",
      en: "Article 13 (Pro Registration and Benefits)",
    },
    paragraphs: {
      ja: [
        "Proの利用契約は、当社の指定する方法により、ユーザーが申込みを行い、当社がこれを承諾した時点で成立するものとします。",
        "ユーザーは、Proを利用する場合、その契約成立時に、当社がプランごとに定める利用料金を、App Store、Google Play等アプリストアが提供する決済システムを用いて支払うものとします。なお、当該支払いに要する決済手数料その他の一切の費用はユーザーの負担とします。詳細並びに表示価格は購入画面及び特定商取引法に基づく表記の表示を優先します。",
      ],
      en: [
        "A Pro agreement is formed when the User applies by our designated method and we accept.",
        "Users pay the plan fee at formation through App Store, Google Play, or similar store payment systems, and bear payment fees and related costs. Purchase-screen and legally required commercial notices control details and displayed prices.",
      ],
    },
    subsections: [
      {
        title: { ja: "プラン", en: "Plans" },
        bullets: {
          ja: [
            "Weekly：280円（税込・日本における予定価格）／7日間／自動更新",
            "Monthly：780円（税込・日本における予定価格）／1か月間／自動更新",
            `Season Pass：5,000円（税込・日本における予定価格）／対象NBAシーズン終了まで／買い切り（自動更新なし）。終了日は購入画面の表示を優先し、原則として当該年の${SEASON_PASS_END_MONTH_DAY}とします。次シーズンは再購入が必要です。`,
          ],
          en: [
            "Weekly: ¥280 (planned Japan tax-included price) / 7 days / auto-renews",
            "Monthly: ¥780 (planned Japan tax-included price) / 1 month / auto-renews",
            `Season Pass: ¥5,000 (planned Japan tax-included price) / until the end of the designated NBA season / one-time (no auto-renew). The purchase-screen end date controls; as a rule it is ${SEASON_PASS_END_MONTH_DAY} of that year. The next season requires a new purchase.`,
          ],
        },
      },
      {
        title: { ja: "特典", en: "Benefits" },
        paragraphs: {
          ja: [
            "当社は、ユーザーがProへの登録を完了した場合、下記の特典を付与します。なお、当該特典が付与される点以外に、Proユーザーと一般ユーザーとで利用できるサービス内容、Unitの付与条件及びその数量、Unitと交換できる商品の内容及び条件等に差異はないものとします。",
          ],
          en: [
            "When Pro registration completes, we grant the benefits below. Aside from those benefits, Pro and General Users have the same Service content, Unit grant conditions and amounts, and product-exchange terms.",
          ],
        },
        bullets: {
          ja: [
            "試合結果等の予想の参考となる分析結果",
            "試合直前のアラート通知（当社が公開した第11条第2項に定める情報の変更等に限ります）",
            "当該ユーザーの週次の成績レポート、並びにMonthly及びSeason Passにおける月次の成績レポート（Weeklyには月次レポートを含みません）",
            "Pro専用の本アプリ内における見た目及びバッジ",
          ],
          en: [
            "Analysis to support match predictions",
            "Pre-game alerts (limited to changes to information under Article 11(2) that we publish)",
            "Weekly performance reports for all Pro plans; monthly reports for Monthly and Season Pass only (not Weekly)",
            "Pro-only in-app visuals and badges",
          ],
        },
      },
      {
        title: { ja: "更新・返金・無料体験等", en: "Renewal, refunds, trials" },
        bullets: {
          ja: [
            "Weekly及びMonthlyは、契約期間満了日の前日までに各アプリストアのサブスクリプション管理その他当社所定の方法で解約しない限り、同一条件で自動更新されます。Season Passは自動更新されません。",
            "当社は、理由のいかんを問わず、一度受領した利用料金の返金、日割り計算による減額、及び途中解約に伴う払戻し等には一切応じません。ただし、各アプリストアが定める返金手続による場合、及び法令により返金等が認められる場合は、この限りではありません。",
            "当社は、利用料金及びサービスの内容等の変更を随時実施することができます。",
            "Proの利用料金は、本条の特典の付与に対する対価であり、試合結果の予想に参加するための費用又は当該予想を顕著に有利にするための対価ではありません。",
            "当社は、Weekly又はMonthlyの初回申込みに限り、当社所定の条件で無料体験期間（原則7日間）を付与することがあります。Season Passには無料体験を付与しません。条件は購入画面の表示に従います。",
          ],
          en: [
            "Weekly and Monthly auto-renew on the same terms unless canceled by the day before period end via store subscription settings or our designated method. Season Pass does not auto-renew.",
            "We do not refund fees once received, prorate, or refund mid-term cancellations, for any reason—except store refund processes and cases required by law.",
            "We may change fees and Service content at any time.",
            "Pro fees are consideration for the benefits in this Article, not an entry fee for predictions or payment to materially advantage predictions.",
            "We may offer a free trial (generally 7 days) on first Weekly or Monthly signup under our conditions. Season Pass has no free trial. Purchase-screen terms control.",
          ],
        },
      },
    ],
  },
  {
    id: "data",
    title: {
      ja: "第14条（データ及び個人情報の管理）",
      en: "Article 14 (Data and Personal Information)",
    },
    bullets: {
      ja: [
        "当社は、ユーザーが本サービスの利用にあたり当社が取得する情報及び個人情報（以下総称して「対象データ」といいます）を、当社が指定するクラウド環境において適切に管理・処理します。",
        "当社は、対象データを、原則として複数のユーザーでリソースを共有する共有環境で管理します。",
        "法令に基づき公的機関から開示又は差押えを求められた場合等には、法令の許す範囲で最小限度の情報を開示し、可能な範囲でユーザーに通知するよう努めます。",
        "当社は、対象データの漏えい、滅失又は毀損の防止その他の安全管理のため、必要かつ合理的な範囲で安全管理措置を講じます。",
        "セキュリティインシデント又は重大なシステム障害が発生し、対象データに影響を及ぼすと判断した場合には、速やかに調査し、ユーザーに必要な情報を報告します。",
        "当社は、本サービスに関するログ及びバックアップデータについて、当社の裁量により消去でき、消去済みデータの復元等の責任を負いません。",
        "ユーザーは、当社所定の方法で対象データの返還又は削除を請求できます。返還請求を受けた場合、当社はCSV形式その他一般的な電子ファイル形式で提供します。",
        "個人情報の取扱いは、プライバシーポリシーに従います。",
      ],
      en: [
        "We appropriately manage and process information and personal data obtained through use of the Service (\"Covered Data\") in cloud environments we designate.",
        "As a rule, Covered Data is managed in a shared environment.",
        "If a public authority lawfully demands disclosure or seizure, we may disclose the minimum allowed by law and will try to notify Users where permitted.",
        "We take necessary and reasonable security measures to prevent leakage, loss, or damage of Covered Data.",
        "If a security incident or major outage may affect Covered Data, we will investigate promptly and report needed information to Users.",
        "We may delete logs and backups at our discretion and have no duty to restore deleted data.",
        "Users may request return or deletion of Covered Data by our designated method. On a return request, we provide CSV or another common electronic format.",
        "Personal information is handled under the Privacy Policy.",
      ],
    },
  },
  {
    id: "data-rights",
    title: {
      ja: "第15条（対象データの権利）",
      en: "Article 15 (Rights in Covered Data)",
    },
    paragraphs: {
      ja: [
        "対象データに関する一切の権利は、ユーザー又は当該権利の正当な権利者に帰属します。ただし、当社は、次の目的及び範囲において無償で利用（複製、加工、分析等）でき、ユーザーはこれに同意します。（1）本サービスの円滑な運営、保守及び不具合の解消（2）本サービスの品質向上、新機能の開発及びマーケティング（3）新サービスの開発及びマーケティング",
      ],
      en: [
        "Rights in Covered Data belong to the User or rightful owner. We may freely use (copy, process, analyze, etc.) it for (1) operating, maintaining, and fixing the Service, (2) improving quality, developing features, and marketing, and (3) developing and marketing new services, and Users agree to this.",
      ],
    },
  },
  {
    id: "ip",
    title: { ja: "第16条（知的財産権）", en: "Article 16 (Intellectual Property)" },
    paragraphs: {
      ja: [
        "本サービスに関する知的財産権は、別途合意した場合を除き、全て当社又は当社に利用を許諾しているものに帰属しており、利用契約は本サービスに関する知的財産権の使用許諾を意味するものではありません。NBA、チーム、選手等の名称・ロゴは各権利者に帰属します。本サービスはNBA又はその関係会社の公式サービスではありません。",
      ],
      en: [
        "Except as separately agreed, IP in the Service belongs to us or our licensors; the User Agreement is not a license to that IP. NBA, team, and player names and logos belong to their owners. The Service is not an official NBA service or affiliate.",
      ],
    },
  },
  {
    id: "subcontract",
    title: {
      ja: "第17条（第三者への委託）",
      en: "Article 17 (Subcontracting)",
    },
    paragraphs: {
      ja: [
        "当社は、本サービスの提供に関する業務の全部又は一部を第三者に委託することができます。",
      ],
      en: [
        "We may subcontract all or part of work related to providing the Service.",
      ],
    },
  },
  {
    id: "prohibited",
    title: { ja: "第18条（禁止行為）", en: "Article 18 (Prohibited Conduct)" },
    paragraphs: {
      ja: [
        "ユーザーは、当社の事前の書面による同意なく、以下の行為を行い又は第三者をして行わせてはなりません。違反した場合、当社は直ちに利用停止若しくは利用契約の解約をし、損害の賠償を請求することがあります。",
      ],
      en: [
        "Without our prior written consent, Users must not do (or have others do) the following. On violation, we may immediately suspend use or terminate the User Agreement and claim damages.",
      ],
    },
    bullets: {
      ja: [
        "当社又は第三者に不利益又は損害を与えるおそれのある行為",
        "詐欺、脅迫その他犯罪を構成する行為、並びに犯罪の教唆・幇助等",
        "サーバーに不当な負荷をかける行為その他運営を妨げる行為",
        "当社又は本サービスの信用を毀損する行為",
        "虚偽の申告・届出・登録、及び判明後に直ちに訂正しない行為",
        "コンピューターウィルスその他有害プログラムの開発、使用、頒布又は提供",
        "登録したメールアドレス及びユーザーIDを第三者に入力させて利用させる行為",
        "本サービスにより取得した情報を、当社と契約していない第三者に提供する行為、又は目的外利用する行為",
        "対価の有無を問わず第三者の事務処理のために本サービスを利用する行為",
        "本サービスにより生成されたデータを第三者に販売する行為",
        "本サービスの全部又は一部のコピー、ダウンロード、リバースエンジニアリングその他の解析",
        "本サービスについて知的財産権を主張し、又は出願する行為",
        "管理権限へのアクセス試行、改造デバイスでの利用",
        "反社会的勢力の活動に関連して本サービスを使用する行為",
        "法令に違反する行為、前各号に準ずる行為、その他当社が不適切と判断する行為、運営を妨害するおそれのある行為",
      ],
      en: [
        "Conduct likely to harm us or third parties",
        "Fraud, threats, other crimes, or aiding such crimes",
        "Unreasonable server load or other interference with operations",
        "Damaging our or the Service's reputation",
        "False filings or registrations, or failing to correct them promptly",
        "Developing, using, distributing, or providing malware",
        "Letting third parties sign in with your email or User ID",
        "Giving Service-derived information to third parties not under contract with us, or using it off-purpose",
        "Using the Service to process third-party work, whether paid or not",
        "Selling data generated by the Service",
        "Copying, downloading, reverse engineering, or otherwise analyzing the Service",
        "Claiming or applying for IP rights in the Service",
        "Attempting admin access or using modified devices",
        "Using the Service in connection with anti-social forces",
        "Violating law, similar conduct, other conduct we deem inappropriate, or conduct likely to disrupt operations",
      ],
    },
  },
  {
    id: "assignment",
    title: { ja: "第19条（権利譲渡）", en: "Article 19 (Assignment)" },
    bullets: {
      ja: [
        "ユーザーは、予め当社の書面による承諾がない限り、本規約上の地位及び本規約に基づく権利又は義務の全部又は一部を第三者に譲渡してはなりません。ただし、当社が本サービスの内容として具体的に定めている場合は、この限りでありません。",
        "当社は、本サービスの全部又は一部を当社の裁量により第三者に譲渡することができ、その場合、譲渡された権利及び義務の範囲内でユーザーのアカウントを含む本サービスにかかるユーザーの一切の権利が譲渡先に移転します。",
      ],
      en: [
        "Users may not assign their status under these Terms or related rights or duties without our prior written consent, except where we specifically allow it as part of the Service.",
        "We may assign all or part of the Service at our discretion; within the assigned scope, Users' rights including accounts transfer to the assignee.",
      ],
    },
  },
  {
    id: "suspend",
    title: {
      ja: "第20条（本サービスの中断）",
      en: "Article 20 (Suspension of the Service)",
    },
    bullets: {
      ja: [
        "保守、障害、通信回線若しくはデータセンターの障害、不可抗力等により、事前通知のうえ（緊急時を除く）本サービスの全部又は一部を一時中断することがあります。",
        "利用料金の未払、規約違反、連絡不能等が確認された場合、事由解消を確認できるまで、事前連絡なく中断することがあります。",
        "前2項の中断によりユーザーが利用できなかったことによる損害等について、当社は一切の責任を負いません。",
      ],
      en: [
        "We may temporarily suspend all or part of the Service for maintenance, outages, network or data-center failures, or force majeure, with prior notice except in emergencies.",
        "We may suspend without prior notice until issues such as unpaid fees, Terms violations, or inability to contact the User are resolved.",
        "We have no liability for damages from inability to use the Service due to such suspension.",
      ],
    },
  },
  {
    id: "discontinue",
    title: {
      ja: "第21条（本サービスの廃止）",
      en: "Article 21 (Discontinuation)",
    },
    paragraphs: {
      ja: [
        "当社は、廃止日の60日前までにユーザーに通知した場合、又は不可抗力等やむをえない事由により継続提供できない場合、本サービスの全部又は一部を廃止し、廃止日をもって利用契約の全部又は一部を解約できます。",
      ],
      en: [
        "We may discontinue all or part of the Service and terminate all or part of the User Agreement as of the discontinuation date if we give 60 days' prior notice, or if force majeure or similar makes continued provision impossible.",
      ],
    },
  },
  {
    id: "user-terminate",
    title: {
      ja: "第22条（ユーザーによる本契約の終了）",
      en: "Article 22 (Termination by User)",
    },
    paragraphs: {
      ja: [
        "ユーザーは、当社の定める解約フォームから申込むことにより、いつでも本契約を解約することができます。この場合、ユーザーは、当社に対し、解約申込時点で既に発生している本サービスの利用料金（日割り計算による減額等は行いません。）を支払うものとします。",
      ],
      en: [
        "Users may terminate at any time via our designated cancellation form. Fees already incurred at the time of the request remain payable without proration.",
      ],
    },
  },
  {
    id: "our-terminate",
    title: {
      ja: "第23条（当社による本契約の終了）",
      en: "Article 23 (Termination by Us)",
    },
    paragraphs: {
      ja: [
        "当社は、ユーザーが禁止行為その他本規約違反、虚偽登録、第三者への加害目的の利用、運営妨害、支払停止・倒産手続、差押等、6ヶ月以上の未利用かつ連絡不能、その他継続が適当でないと判断した場合、事前の通知又は催告なく、利用の一時停止又は利用契約の解除ができます。この場合、ユーザーは期限の利益を失い、当社への債務を直ちに支払うものとします。当社は、故意又は重過失がある場合を除き、本条に基づく措置による損害について責任を負いません。",
      ],
      en: [
        "We may suspend use or terminate the User Agreement without prior notice if the User violates these Terms, registers falsely, uses the Service in ways likely to harm others, disrupts operations, becomes insolvent or subject to enforcement, is inactive for 6+ months with no response, or we otherwise deem continued use unsuitable. The User then loses the benefit of time and must pay all debts to us immediately. Except for our willful misconduct or gross negligence, we are not liable for damages from actions under this Article.",
      ],
    },
  },
  {
    id: "disclaimer",
    title: {
      ja: "第24条（免責及び保証の否認）",
      en: "Article 24 (Disclaimers and Limitation of Liability)",
    },
    bullets: {
      ja: [
        "当社は、チームスタッツその他本サービスにおいて提供するデータの完全性、正確性、及び特定の目的への適合性等について、いかなる保証も行わず、当該データに起因する損害について一切の責任を負いません。",
        "当社は、本サービスの内容変更、中断、終了、又は本サービスの利用により生じた損害について、故意又は重過失がある場合を除き、一切責任を負いません。",
        "ユーザーと第三者との紛争について、当社は保証しません。",
        "消費者契約に該当する場合、一切免責の規定は適用せず、当社に軽過失がある場合の損害賠償上限は、Proユーザーについては直近6ヶ月間に実際に支払ったPro利用料金の合計額、一般ユーザーについては10,000円とします。",
        "ユーザーは、他のユーザー又は第三者との紛争を自己の費用と責任で解決し、当社に迷惑を及ぼさないものとします。ユーザーの行為により第三者から当社が請求を受けた場合、ユーザーの費用と責任で解決し、当社が支払った損害等を償還するものとします。",
      ],
      en: [
        "We make no warranty as to completeness, accuracy, or fitness for purpose of Team Stats or other data on the Service, and have no liability for damages arising from that data.",
        "Except for our willful misconduct or gross negligence, we are not liable for damages from changes, suspension, or termination of the Service, or from use of the Service.",
        "We do not warrant the absence of disputes between Users and third parties.",
        "If the contract is a consumer contract, absolute disclaimers do not apply; for our slight negligence, liability is capped at Pro fees actually paid in the preceding 6 months for Pro Users, or ¥10,000 for General Users.",
        "Users resolve disputes with other Users or third parties at their own cost and must not burden us. If a third party claims against us due to a User's conduct, the User resolves it and reimburses us.",
      ],
    },
  },
  {
    id: "confidential",
    title: { ja: "第25条（秘密保持）", en: "Article 25 (Confidentiality)" },
    paragraphs: {
      ja: [
        "当社及びユーザーは、本サービスの利用に当たり開示された相手方の秘密情報（秘密である旨が指定若しくは明示された情報、又は商慣習上秘密にすべき情報を含みます）を、相手方の書面承諾なく第三者に開示・漏洩せず、利用契約の履行又は権利行使に必要な場合を除き利用しません。ただし、法令に基づく開示等はこの限りでなく、その場合は可能な限り事前通知します。公知情報、受領者の責めによらず公知となった情報、受領前から適法に保有していた情報、正当な第三者から守秘義務なく入手した情報、独自開発した情報は秘密情報に該当しません。利用契約終了後又は開示者の要求時、秘密情報を返却又は破棄します。本条は利用契約終了後も5年間存続します。",
      ],
      en: [
        "Each party must not disclose the other's confidential information (including information marked confidential or that customarily should be kept secret) without written consent, and may use it only as needed to perform the User Agreement—except lawful disclosures, with prior notice where possible. Public information, information that becomes public without the recipient's fault, information already lawfully held, information lawfully obtained from a third party without a duty of confidence, and independently developed information are not confidential. On termination or request, return or destroy confidential information. This Article survives for 5 years after termination.",
      ],
    },
  },
  {
    id: "antisocial",
    title: {
      ja: "第26条（反社会的勢力等の排除）",
      en: "Article 26 (Exclusion of Anti-Social Forces)",
    },
    paragraphs: {
      ja: [
        "当社及びユーザーは、暴力団、暴力団員、暴力団準構成員、暴力団関係企業、総会屋等、社会運動等標ぼうゴロ、特殊知能暴力集団等その他これらに準ずる者に該当しないこと、及び暴力的要求、法的責任を超えた不当要求、脅迫的言動若しくは暴力、風説の流布・偽計・威力による信用毀損若しくは業務妨害その他これらに準ずる行為を行わないことを表明・確約します。相手方がこれに違反した場合、利用契約を解除できます。",
      ],
      en: [
        "Each party represents it is not an organized-crime group or related party, and will not engage in violent or improper demands, threats, violence, or defamation/interference by rumor, fraud, or force. Either party may terminate the User Agreement if the other breaches this Article.",
      ],
    },
  },
  {
    id: "severability",
    title: { ja: "第27条（分離可能性）", en: "Article 27 (Severability)" },
    paragraphs: {
      ja: [
        "本規約の規定の一部が法令により違法、無効又は執行不能とされた場合でも、その他の規定は有効に存続し、当該部分は趣旨に沿う形で合理的に修正される範囲で有効に存続します。",
      ],
      en: [
        "If any provision is illegal, invalid, or unenforceable, the rest remains in effect, and the affected part remains effective to the extent reasonably modified to match its purpose.",
      ],
    },
  },
  {
    id: "governing-law",
    title: { ja: "第28条（準拠法）", en: "Article 28 (Governing Law)" },
    paragraphs: {
      ja: [
        "利用契約は日本法に準拠し日本法に従い解釈されるものとします。",
      ],
      en: [
        "The User Agreement is governed by and construed under the laws of Japan.",
      ],
    },
  },
  {
    id: "jurisdiction",
    title: {
      ja: "第29条（専属的合意管轄）",
      en: "Article 29 (Exclusive Jurisdiction)",
    },
    paragraphs: {
      ja: [
        "本サービス及び利用契約に基づく又はこれらに関連する一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。",
      ],
      en: [
        "The Tokyo District Court has exclusive first-instance jurisdiction over all disputes arising from or relating to the Service or the User Agreement.",
      ],
    },
  },
  {
    id: "discuss",
    title: { ja: "第30条（協議）", en: "Article 30 (Good-Faith Discussion)" },
    paragraphs: {
      ja: [
        "利用契約に定めのない事項及び利用契約各条項の解釈に疑義が生じた場合は、ユーザーと当社は誠意をもって協議し、その解決に努めるものとします。",
      ],
      en: [
        "For matters not covered by the User Agreement or doubts about interpretation, the User and we will discuss in good faith to resolve them.",
      ],
    },
  },
] as const;
