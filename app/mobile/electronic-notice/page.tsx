"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import {
  COMPANY_ADDRESS,
  COMPANY_CORPORATE_NUMBER,
  COMPANY_FOUNDED,
  COMPANY_LEGAL_NAME,
  COMPANY_REPRESENTATIVE_DISPLAY,
  COMPANY_WEB_URL,
} from "@/lib/legal/companyInfo";

const NOTICE_URL = `${COMPANY_WEB_URL}/web/electronic-notice`;

const ROWS = [
  { label: "会社名", value: COMPANY_LEGAL_NAME },
  { label: "所在地", value: COMPANY_ADDRESS },
  { label: "代表者", value: COMPANY_REPRESENTATIVE_DISPLAY },
  { label: "設立", value: COMPANY_FOUNDED },
  { label: "法人番号", value: COMPANY_CORPORATE_NUMBER },
  { label: "公告の方法", value: "電子公告" },
  { label: "公告掲載 URL", value: NOTICE_URL },
  { label: "公告事項", value: "現在、公告すべき事項はありません。" },
] as const;

export default function MobileElectronicNoticePage() {
  return (
    <LegalPageLayout
      variant="mobile"
      title="NOTICE"
      description="会社法の規定に基づく電子公告ページです。"
    >
      <div className="space-y-4 text-sm leading-relaxed text-white/80">
        <p>
          {COMPANY_LEGAL_NAME}
          は、会社法の規定に基づき、電子公告により公告します。
        </p>
        <dl className="space-y-3">
          {ROWS.map((row) => (
            <div key={row.label}>
              <dt className="font-semibold text-white">{row.label}</dt>
              <dd className="mt-1 break-all">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </LegalPageLayout>
  );
}
