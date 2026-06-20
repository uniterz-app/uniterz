import { LegalWebOrNativeScreen } from "./legalWebViewRoutesNative";

export default function TermsScreenNative() {
  return (
    <LegalWebOrNativeScreen
      path="/mobile/terms"
      fallbackTitle="利用規約"
      fallbackDescription="Uniterz におけるご利用条件を定めたページです。ご利用前に必ずご確認ください。"
      updatedAt="2026-03-23"
      fallbackBody="本規約は、Uniterz の利用に関する条件を定めるものです。アカウント登録、禁止事項、免責事項等の詳細は Web 版をご確認ください。"
    />
  );
}
