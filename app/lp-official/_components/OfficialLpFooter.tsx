import { officialSite } from "@/lib/lp/officialSiteContent";

export default function OfficialLpFooter() {
  const year = new Date().getFullYear();
  const sns = [officialSite.sns.x, officialSite.sns.instagram];

  return (
    <footer className="border-t border-white/10 pb-16 pt-10">
      <div className="olp-wrap flex flex-col gap-8">
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="フッター">
          <a href={officialSite.termsHref} className="text-[13px] text-[#c5d0e4] no-underline">
            Terms of Service
          </a>
          <a href={officialSite.privacyHref} className="text-[13px] text-[#c5d0e4] no-underline">
            Privacy Policy
          </a>
          <a href="#company" className="text-[13px] text-[#c5d0e4] no-underline">
            Company
          </a>
          <a href="#contact" className="text-[13px] text-[#c5d0e4] no-underline">
            Contact
          </a>
        </nav>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#9eabc9]">
          {sns.map((item) =>
            item.href ? (
              <a key={item.label} href={item.href} className="text-inherit no-underline">
                {item.label}
              </a>
            ) : (
              <span key={item.label}>
                {item.label}: 準備中
              </span>
            )
          )}
        </div>

        <p className="m-0 text-[12px] tracking-[0.04em] text-[#8b97ad]">
          © {year} {officialSite.productName}
          {officialSite.company.name !== "準備中"
            ? ` / ${officialSite.company.name}`
            : ""}
        </p>
      </div>
    </footer>
  );
}
