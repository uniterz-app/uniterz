import { officialSite } from "@/lib/lp/officialSiteContent";

const FIELDS = [
  { label: "法人名", value: officialSite.company.name },
  { label: "所在地", value: officialSite.company.address },
  { label: "代表者", value: officialSite.company.representative },
  { label: "設立", value: officialSite.company.founded },
  { label: "法人番号", value: officialSite.company.corporateNumber },
  { label: "事業内容", value: officialSite.company.business },
  { label: "運営サービス", value: officialSite.company.service },
] as const;

export default function OfficialLpCompany() {
  return (
    <section id="company" className="olp-section">
      <div className="olp-wrap">
        <p className="olp-h2-en olp-metric">Company</p>
        <h2 className="olp-h2">運営会社</h2>
        <p className="olp-lead">{officialSite.company.note}</p>
        <dl className="olp-dl">
          {FIELDS.map((field) => (
            <div key={field.label}>
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
