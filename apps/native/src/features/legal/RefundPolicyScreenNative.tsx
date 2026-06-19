import LegalScrollScreenNative from "./LegalScrollScreenNative";

export default function RefundPolicyScreenNative() {
  return (
    <LegalScrollScreenNative
      title="返金ポリシー"
      description="Pro プラン等のサブスクリプション料金に関する返金方針"
      updatedAt="2025-11-17"
      sections={[
        {
          title: "1. 基本方針",
          body: "サブスクリプションの性質上、原則として返金は行いません。年額プランを途中で解約した場合も、支払い済み期間に対する返金はありません。",
        },
        {
          title: "2. 解約後の利用",
          body: "解約後も、すでに支払い済みの契約期間終了日までは Pro 機能を利用できます。期間終了後は自動的に無料プランへ戻ります。",
        },
        {
          title: "3. 例外的な返金",
          body: "当社が特別に認めた場合、または法令上返金が必要とされる場合に限り、個別に返金対応を行うことがあります。",
        },
        {
          title: "4. 返金申請",
          body: "返金に関する問い合わせは、アプリ内のお問い合わせ画面から、対象アカウント・決済内容・理由を記載して送信してください。",
        },
      ]}
    />
  );
}
