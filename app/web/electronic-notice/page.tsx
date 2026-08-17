import type { Metadata } from "next";
import { officialSite } from "@/lib/lp/officialSiteContent";
import OfficialLpLogo from "@/app/lp-official/_components/OfficialLpLogo";
import OfficialLpBackTab from "@/app/lp-official/_components/OfficialLpBackTab";
import "@/app/lp-official/official-lp.css";

export const metadata: Metadata = {
  title: "電子公告 — 株式会社UNITERZ",
  description:
    "株式会社UNITERZの電子公告ページです。会社法の規定に基づき、公告事項を掲載します。",
};

const NOTICE_URL = "https://www.uniterz.app/web/electronic-notice";

export default function WebElectronicNoticePage() {
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
          <p className="olp-h2-en olp-metric">Electronic Notice</p>
          <h1 className="olp-h2">電子公告</h1>
          <p className="olp-lead">
            {officialSite.company.name}は、会社法の規定に基づき、電子公告により公告します。
          </p>
          <dl className="olp-dl">
            <div>
              <dt>会社名</dt>
              <dd>{officialSite.company.name}</dd>
            </div>
            <div>
              <dt>所在地</dt>
              <dd>{officialSite.company.address}</dd>
            </div>
            <div>
              <dt>代表者</dt>
              <dd>{officialSite.company.representative}</dd>
            </div>
            <div>
              <dt>公告の方法</dt>
              <dd>電子公告</dd>
            </div>
            <div>
              <dt>公告掲載 URL</dt>
              <dd>
                <a href={NOTICE_URL} className="text-[#4ff7f4] no-underline break-all">
                  {NOTICE_URL}
                </a>
              </dd>
            </div>
            <div>
              <dt>公告事項</dt>
              <dd>現在、公告すべき事項はありません。</dd>
            </div>
          </dl>
          <nav className="olp-legal-links" aria-label="関連ページ">
            <a href="/lp">公式サイト</a>
            <a href={officialSite.companyHref}>運営会社</a>
            <a href={officialSite.tokushohoHref}>特定商取引法に基づく表記</a>
            <a href="/lp#contact">お問い合わせ</a>
          </nav>
        </div>
      </main>
    </div>
  );
}
