"use client";

import { officialPro } from "@/lib/lp/officialSiteContent";
import OfficialLpReveal from "./OfficialLpReveal";

export default function OfficialLpPro() {
  return (
    <section id="pro" className="olp-section">
      <OfficialLpReveal>
        <div className="olp-wrap">
          <h2 className="olp-h2">{officialPro.heading}</h2>
          <p className="olp-lead">{officialPro.lead}</p>
          <p className="mt-4 max-w-[62ch] text-[0.95rem] leading-7 text-[#d5deee]">
            {officialPro.revenue}
          </p>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-[var(--olp-border)]">
            <table className="w-full min-w-[520px] border-collapse text-left">
              <caption className="olp-sr">Free と Pro の機能比較</caption>
              <thead>
                <tr className="bg-[rgba(16,24,38,0.9)]">
                  <th className="px-5 py-4 text-[13px] font-semibold text-[#c5d0e4]">
                    機能
                  </th>
                  <th className="px-5 py-4 text-[13px] font-semibold text-[#c5d0e4]">
                    Free
                  </th>
                  <th className="px-5 py-4 text-[13px] font-semibold text-[var(--olp-accent)]">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {officialPro.rows.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-t border-[var(--olp-border)]"
                  >
                    <th className="px-5 py-3.5 text-[0.95rem] font-medium text-white">
                      {row.feature}
                    </th>
                    <td className="px-5 py-3.5 text-[0.95rem] text-[var(--olp-muted)]">
                      {row.free}
                    </td>
                    <td className="px-5 py-3.5 text-[0.95rem] text-white">
                      {row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </OfficialLpReveal>
    </section>
  );
}
