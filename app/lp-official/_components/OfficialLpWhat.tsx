"use client";

import { officialWhat } from "@/lib/lp/officialSiteContent";
import OfficialLpReveal from "./OfficialLpReveal";

export default function OfficialLpWhat() {
  return (
    <section id="about" className="olp-section">
      <OfficialLpReveal>
        <div className="olp-wrap">
          <h2 className="olp-h2">{officialWhat.heading}</h2>
          <p className="olp-lead">{officialWhat.lead}</p>
          <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[var(--olp-border)] bg-[var(--olp-border)] sm:grid-cols-2">
            {officialWhat.facts.map((fact) => (
              <div key={fact.title} className="bg-[var(--olp-bg-2)] p-6 sm:p-7">
                <dt className="text-[1.05rem] font-bold tracking-[-0.02em] text-white">
                  {fact.title}
                </dt>
                <dd className="mt-2 m-0 max-w-[42ch] text-[0.95rem] leading-7 text-[var(--olp-muted)]">
                  {fact.text}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </OfficialLpReveal>
    </section>
  );
}
