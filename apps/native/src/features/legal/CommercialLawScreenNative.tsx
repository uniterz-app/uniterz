import LegalScrollScreenNative from "./LegalScrollScreenNative";

export default function CommercialLawScreenNative() {
  return (
    <LegalScrollScreenNative
      title="特定商取引法に基づく表記"
      description="Uniterz Pro プラン等の有料サービスに関する表示"
      updatedAt="2025-11-17"
      sections={[
        {
          title: "販売事業者",
          body: "Uniterz 運営者。正式な事業者情報は、決済提供開始時または法令上必要な範囲でアプリ内・Web 上に掲載します。",
        },
        {
          title: "所在地・連絡先",
          body: "所在地および電話番号は、請求があった場合に遅滞なく開示します。お問い合わせはアプリ内のお問い合わせ画面から受け付けます。",
        },
        {
          title: "販売価格",
          body: "各プラン画面に表示される金額（税込）をご確認ください。表示価格、提供内容、条件は事前告知のうえ変更される場合があります。",
        },
        {
          title: "代金の支払時期・方法",
          body: "決済サービス（Stripe 等）を通じて、申込み時または契約更新時に決済されます。利用可能な支払方法は決済画面に表示されます。",
        },
        {
          title: "提供時期",
          body: "決済完了後、システム処理が完了し次第、Pro 機能が利用可能になります。",
        },
        {
          title: "解約・返金",
          body: "解約はアプリ内の所定手続きから行えます。サブスクリプションの性質上、原則として返金は行いません。詳細は返金ポリシーをご確認ください。",
        },
      ]}
    />
  );
}
