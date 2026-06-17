import LegalScrollScreenNative from "./LegalScrollScreenNative";

export default function TermsScreenNative() {
  return (
    <LegalScrollScreenNative
      title="利用規約"
      description="Uniterz サービス利用規約"
      updatedAt="2025-11-17"
      sections={[
        {
          title: "1. 適用",
          body: "本規約は、Uniterz の利用に関する条件を定めるものです。",
        },
        {
          title: "2. アカウント",
          body: "ユーザーは正確な情報を登録し、自己の責任でアカウントを管理するものとします。",
        },
        {
          title: "3. 禁止事項",
          body: "法令違反、他者への迷惑行為、不正アクセス、虚偽情報の投稿等を禁止します。",
        },
        {
          title: "4. 免責",
          body: "本サービスの利用により生じた損害について、当社は故意または重過失がある場合を除き責任を負いません。",
        },
      ]}
    />
  );
}
