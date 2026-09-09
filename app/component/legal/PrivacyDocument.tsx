import LegalDocument from "@/app/component/legal/LegalDocument";
import {
  PRIVACY_FOOTER,
  PRIVACY_PREAMBLE,
  PRIVACY_SECTIONS,
  type LegalLang,
} from "@/lib/legal/privacyCopy";

export default function PrivacyDocument({ language }: { language: LegalLang }) {
  const lang: LegalLang = language === "en" ? "en" : "ja";

  return (
    <div className="space-y-6">
      <div className="space-y-3 whitespace-pre-line">
        {PRIVACY_PREAMBLE[lang].map((text) => (
          <p key={text.slice(0, 48)}>{text}</p>
        ))}
      </div>
      <LegalDocument language={lang} sections={PRIVACY_SECTIONS} showIndex={false} />
      <div className="space-y-1 border-t border-white/10 pt-4 text-sm text-white/70">
        {PRIVACY_FOOTER[lang].map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
