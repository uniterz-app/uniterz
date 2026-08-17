import { officialSite } from "@/lib/lp/officialSiteContent";

export default function OfficialLpFooter() {
  const year = new Date().getFullYear();
  const sns = [officialSite.sns.x, officialSite.sns.instagram];

  return (
    <footer className="olp-footer">
      <div className="olp-wrap">
        <nav aria-label="フッター">
          <a href={officialSite.termsHref}>利用規約</a>
          <a href={officialSite.privacyHref}>プライバシーポリシー</a>
          <a href={officialSite.tokushohoHref}>特定商取引法に基づく表記</a>
          <a href={officialSite.electronicNoticeHref}>電子公告</a>
          <a href={officialSite.companyHref}>運営会社</a>
          <a href="/lp#contact">お問い合わせ</a>
        </nav>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#8b97ad]">
          {sns.map((item) =>
            item.href ? (
              <a key={item.label} href={item.href} className="text-inherit no-underline">
                {item.label}
              </a>
            ) : (
              <span key={item.label}>{item.label}: 準備中</span>
            )
          )}
        </div>

        <p className="olp-copy">
          © {year} {officialSite.productName} / {officialSite.company.name}
        </p>
      </div>
    </footer>
  );
}
