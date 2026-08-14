"use client";

import { officialNoGambling } from "@/lib/lp/officialSiteContent";
import OfficialLpReveal from "./OfficialLpReveal";

export default function OfficialLpNoGambling() {
  return (
    <section id="no-gambling" className="olp-section">
      <OfficialLpReveal>
        <div className="olp-wrap">
          <div className="border border-[var(--olp-line)] bg-[rgba(8,18,28,0.92)] px-6 py-10 sm:px-10 sm:py-12">
            <h2 className="olp-h2">{officialNoGambling.heading}</h2>
            <p className="mt-4 max-w-[40rem] text-[1.2rem] font-semibold leading-8 text-white text-pretty">
              {officialNoGambling.lead}
            </p>
            <ul className="mt-8 mb-0 grid list-none gap-3 p-0 sm:grid-cols-2">
              {officialNoGambling.statements.map((line) => (
                <li
                  key={line}
                  className="border border-[var(--olp-border)] bg-[rgba(4,8,14,0.45)] px-4 py-4 text-[1rem] leading-7 text-[#e6edf8]"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </OfficialLpReveal>
    </section>
  );
}
