import type { Metadata } from "next";
import { officialSite, officialTokushoho } from "@/lib/lp/officialSiteContent";
import { TOKUSHOHO_UPDATED_AT } from "@/lib/legal/tokushohoCopy";
import OfficialLpLogo from "../_components/OfficialLpLogo";
import OfficialLpBackTab from "../_components/OfficialLpBackTab";
import "../official-lp.css";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 — Uniterz",
  description: officialTokushoho.lead,
};

export default function TokushohoPage() {
  return (
    <div className="official-lp relative min-h-screen overflow-x-hidden">
      <div className="olp-stage" aria-hidden>
        <div className="olp-stage-grain" />
      </div>
      <header className="olp-header">
        <div className="olp-wrap olp-header-inner">
          <a href="/lp" className="olp-logo">
            <OfficialLpLogo />
          </a>
        </div>
      </header>
      <OfficialLpBackTab />
      <main className="olp-section">
        <div className="olp-wrap">
          <p className="olp-h2-en olp-metric">Legal Notice</p>
          <h1 className="olp-h2">{officialTokushoho.heading}</h1>
          <p className="olp-lead">{officialTokushoho.lead}</p>
          <p className="olp-price-note">最終更新: {TOKUSHOHO_UPDATED_AT}</p>
          <dl className="olp-dl">
            {officialTokushoho.rows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>
                  {row.label === "メールアドレス" ? (
                    <a
                      href={`mailto:${officialSite.supportEmail}`}
                      className="text-[#4ff7f4] no-underline"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <nav className="olp-legal-links" aria-label="関連ページ">
            <a href={officialSite.termsHref}>利用規約</a>
            <a href={officialSite.privacyHref}>プライバシーポリシー</a>
            <a href={officialSite.companyHref}>運営会社</a>
            <a href="/lp#contact">お問い合わせ</a>
          </nav>
        </div>
      </main>
    </div>
  );
}
