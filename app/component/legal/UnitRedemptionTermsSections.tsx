/** 利用規約に差し込む Unit / 商品交換セクション */
import {
  REDEMPTION_TERMS_SECTION,
  UNIT_TERMS_SECTION,
  type LegalLang,
} from "@/lib/legal/unitRedemptionLegalCopy";

export default function UnitRedemptionTermsSections({
  language,
  headingClassName = "mb-1 text-base font-semibold text-white",
  listClassName = "list-disc space-y-1 pl-5",
  unitNumber = "14",
  redemptionNumber = "15",
}: {
  language: LegalLang;
  headingClassName?: string;
  listClassName?: string;
  unitNumber?: string;
  redemptionNumber?: string;
}) {
  const lang = language === "en" ? "en" : "ja";
  return (
    <>
      <div>
        <h2 className={headingClassName}>
          {unitNumber}. {UNIT_TERMS_SECTION.title[lang]}
        </h2>
        <ul className={listClassName}>
          {UNIT_TERMS_SECTION.bullets[lang].map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className={headingClassName}>
          {redemptionNumber}. {REDEMPTION_TERMS_SECTION.title[lang]}
        </h2>
        <ul className={listClassName}>
          {REDEMPTION_TERMS_SECTION.bullets[lang].map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
