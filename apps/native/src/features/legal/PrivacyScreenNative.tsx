import { LegalWebOrNativeScreen } from "./legalWebViewRoutesNative";

export default function PrivacyScreenNative() {
  return (
    <LegalWebOrNativeScreen
      path="/mobile/privacy"
      fallbackTitle="プライバシーポリシー"
      fallbackDescription="Uniterz におけるユーザー情報の取り扱いについて"
      updatedAt="2026-03-23"
      fallbackBody="個人情報の取得・利用目的・第三者提供等について定めています。詳細は Web 版をご確認ください。"
    />
  );
}
