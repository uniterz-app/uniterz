import LegalDocument from "@/app/component/legal/LegalDocument";
import { TERMS_SECTIONS, type LegalLang } from "@/lib/legal/termsCopy";

export default function TermsDocument({ language }: { language: LegalLang }) {
  return <LegalDocument language={language} sections={TERMS_SECTIONS} />;
}
