"use client";

import { officialSite } from "@/lib/lp/officialSiteContent";
import OfficialLpReveal from "./OfficialLpReveal";

const FIELDS = [
  { label: "会社名", value: officialSite.company.name },
  { label: "所在地", value: officialSite.company.address },
  { label: "代表者", value: officialSite.company.representative },
  { label: "設立日", value: officialSite.company.founded },
  { label: "事業内容", value: officialSite.company.business },
  { label: "運営サービス", value: officialSite.company.service },
] as const;

export default function OfficialLpCompany() {
  return (
    <section id="company" className="olp-section">
      <OfficialLpReveal>
        <div className="olp-wrap">
          <h2 className="olp-h2">Company</h2>
          <p className="olp-lead">{officialSite.company.note}</p>
          <dl className="mt-10 divide-y divide-white/8 border-y border-white/8">
            {FIELDS.map((field) => (
              <div
                key={field.label}
                className="grid gap-1 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-baseline"
              >
                <dt className="text-[13px] font-semibold tracking-[0.06em] text-[#9eabc9]">
                  {field.label}
                </dt>
                <dd className="m-0 text-[1.02rem] text-white">{field.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </OfficialLpReveal>
    </section>
  );
}
