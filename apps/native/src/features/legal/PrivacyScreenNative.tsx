/**
 * Web `/mobile/privacy` → `PrivacyDocument` 相当。
 * `lib/legal/privacyCopy` をアプリ内表示（WebView / 外部接続なし）。
 */
import LegalDocumentNative from "./LegalDocumentNative";
import LegalPageLayoutNative from "./LegalPageLayoutNative";
import {
  PRIVACY_FOOTER,
  PRIVACY_INTRO,
  PRIVACY_PREAMBLE,
  PRIVACY_SECTIONS,
  PRIVACY_UPDATED_AT,
} from "@/lib/legal/privacyCopy";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";

export default function PrivacyScreenNative() {
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const lang = language === "ja" ? "ja" : "en";

  return (
    <LegalPageLayoutNative
      title="PRIVACY"
      description={PRIVACY_INTRO[lang]}
      updatedAt={PRIVACY_UPDATED_AT}
      lastUpdatedLabel={lang === "en" ? "Last updated: " : "最終更新: "}
    >
      <LegalDocumentNative
        language={lang}
        preamble={PRIVACY_PREAMBLE[lang]}
        sections={PRIVACY_SECTIONS}
        footer={PRIVACY_FOOTER[lang]}
        showIndex={false}
      />
    </LegalPageLayoutNative>
  );
}
