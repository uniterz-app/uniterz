import {
  TOKUSHOHO_HEADING,
  tokushohoLead,
  tokushohoRows,
} from "@/lib/legal/tokushohoCopy";
import { SUPPORT_EMAIL } from "@/lib/contact/companyEmails";
import type { CompanyLang } from "@/lib/legal/companyInfo";

/** 特定商取引法に基づく表記の本文（Web / Mobile 共通） */
export default function TokushohoDocument({
  language = "ja",
}: {
  language?: CompanyLang;
}) {
  const lang: CompanyLang = language === "ja" ? "ja" : "en";
  const rows = tokushohoRows(lang);
  const emailPrefix = lang === "en" ? "Email: " : "メールアドレス：";

  return (
    <div className="space-y-5">
      <h2 className="text-base font-semibold text-white">
        {TOKUSHOHO_HEADING[lang]}
      </h2>
      <p className="text-sm leading-relaxed text-white/80">{tokushohoLead(lang)}</p>
      <dl className="space-y-5">
        {rows.map((row) => {
          const isContactBlock = row.id === "contact";
          return (
            <div key={row.id}>
              <dt className="text-sm font-semibold text-white">{row.label}</dt>
              <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-white/80">
                {isContactBlock ? (
                  <>
                    {row.value.split("\n").map((line) => {
                      if (line.startsWith(emailPrefix)) {
                        return (
                          <span key={line}>
                            {emailPrefix}
                            <a
                              href={`mailto:${SUPPORT_EMAIL}`}
                              className="text-cyan-300 underline-offset-2 hover:underline"
                            >
                              {SUPPORT_EMAIL}
                            </a>
                            {"\n"}
                          </span>
                        );
                      }
                      return (
                        <span key={line}>
                          {line}
                          {"\n"}
                        </span>
                      );
                    })}
                  </>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
