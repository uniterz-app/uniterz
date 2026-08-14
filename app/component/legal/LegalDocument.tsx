import type { LegalLang, LegalSection } from "@/lib/legal/legalSection";

export default function LegalDocument({
  language,
  sections,
}: {
  language: LegalLang;
  sections: readonly LegalSection[];
}) {
  const lang: LegalLang = language === "en" ? "en" : "ja";

  return (
    <section className="space-y-6">
      {sections.map((section, index) => (
        <div key={section.id}>
          <h2 className="mb-1 text-base font-semibold text-white">
            {index + 1}. {section.title[lang]}
          </h2>
          {section.paragraphs?.[lang].map((text) => (
            <p key={text} className="mt-2 first:mt-0">
              {text}
            </p>
          ))}
          {section.bullets ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {section.bullets[lang].map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          {section.subsections?.map((sub) => (
            <div key={sub.title[lang]} className="mt-3">
              <h3 className="font-semibold text-white">{sub.title[lang]}</h3>
              {sub.paragraphs?.[lang].map((text) => (
                <p key={text} className="mt-2">
                  {text}
                </p>
              ))}
              {sub.bullets ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {sub.bullets[lang].map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
