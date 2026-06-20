import { LegalWebOrNativeScreen } from "./legalWebViewRoutesNative";

export default function ElectronicNoticeScreenNative() {
  return (
    <LegalWebOrNativeScreen
      path="/mobile/electronic-notice"
      fallbackTitle="電子公告"
      fallbackBody="現在、公告事項はありません。"
    />
  );
}
