import type { Metadata } from "next";
import { officialSite } from "@/lib/lp/officialSiteContent";
import OfficialLpLogo from "../_components/OfficialLpLogo";
import OfficialLpCompany from "../_components/OfficialLpCompany";
import OfficialLpBackTab from "../_components/OfficialLpBackTab";
import "../official-lp.css";

export const metadata: Metadata = {
  title: "運営会社 — Uniterz",
  description: `${officialSite.company.name}の会社概要です。`,
};

export default function CompanyPage() {
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
          <OfficialLpCompany />
          <nav className="olp-legal-links" aria-label="関連ページ">
            <a href="/lp">公式サイト</a>
            <a href={officialSite.tokushohoHref}>特定商取引法に基づく表記</a>
            <a href={officialSite.electronicNoticeHref}>電子公告</a>
            <a href="/lp#contact">お問い合わせ</a>
          </nav>
        </div>
      </main>
    </div>
  );
}
