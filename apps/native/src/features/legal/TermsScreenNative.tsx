/**
 * Web `/mobile/terms` → `TermsDocument` 相当。
 * `lib/legal/termsCopy` をアプリ内表示（WebView / 外部接続なし）。
 */
import LegalDocumentNative from "./LegalDocumentNative";
import LegalPageLayoutNative from "./LegalPageLayoutNative";
import {
  TERMS_FOOTER,
  TERMS_INTRO,
  TERMS_PREAMBLE,
  TERMS_SECTIONS,
  TERMS_UPDATED_AT,
} from "@/lib/legal/termsCopy";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../hooks/useNativeUserLanguage";

export default function TermsScreenNative() {
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const lang = language === "ja" ? "ja" : "en";

  return (
    <LegalPageLayoutNative
      title="TERMS"
      description={TERMS_INTRO[lang]}
      updatedAt={TERMS_UPDATED_AT}
      lastUpdatedLabel={lang === "en" ? "Last updated: " : "最終更新: "}
    >
      <LegalDocumentNative
        language={lang}
        preamble={TERMS_PREAMBLE[lang]}
        sections={TERMS_SECTIONS}
        footer={TERMS_FOOTER[lang]}
        showIndex={false}
      />
    </LegalPageLayoutNative>
  );
}
