import LegalScrollScreenNative from "./LegalScrollScreenNative";

export default function ElectronicNoticeScreenNative() {
  return (
    <LegalScrollScreenNative
      title="電子公告"
      description="電子公告に関する事項"
      sections={[
        {
          title: "公告方法",
          body: "本サービスに関する公告は、本ページまたはアプリ内お知らせに掲載する方法により行います。",
        },
      ]}
    />
  );
}
