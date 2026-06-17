import LegalScrollScreenNative from "./LegalScrollScreenNative";

export default function PrivacyScreenNative() {
  return (
    <LegalScrollScreenNative
      title="プライバシーポリシー"
      description="Uniterz におけるユーザー情報の取り扱いについて"
      updatedAt="2025-11-17"
      sections={[
        {
          title: "1. 基本方針",
          body: "Uniterz（以下「本サービス」）は、ユーザーのプライバシーを尊重し、個人情報およびそれに準ずる情報を適切に取り扱うよう努めます。",
        },
        {
          title: "2. 取得する情報",
          body: "アカウント情報、プロフィール情報、ユーザー入力データ、分析データ、アクセスログ等を取得する場合があります。",
        },
        {
          title: "3. 利用目的",
          body: "サービス提供、品質改善、不正利用防止、お問い合わせ対応等のために利用します。",
        },
        {
          title: "4. 第三者提供",
          body: "法令に基づく場合等を除き、本人の同意なく第三者に個人情報を提供しません。",
        },
      ]}
    />
  );
}
