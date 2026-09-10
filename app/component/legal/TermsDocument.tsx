import LegalDocument from "@/app/component/legal/LegalDocument";
import {
  TERMS_FOOTER,
  TERMS_PREAMBLE,
  TERMS_SECTIONS,
  type LegalLang,
} from "@/lib/legal/termsCopy";

export default function TermsDocument({ language }: { language: LegalLang }) {
  const lang: LegalLang = language === "ja" ? "ja" : "en";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {TERMS_PREAMBLE[lang].map((text) => (
          <p key={text.slice(0, 48)}>{text}</p>
        ))}
      </div>
      <LegalDocument language={lang} sections={TERMS_SECTIONS} showIndex={false} />
      <div className="space-y-1 border-t border-white/10 pt-4 text-sm text-white/70">
        {TERMS_FOOTER[lang].map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
