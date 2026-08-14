"use client";

import { officialFeatures } from "@/lib/lp/officialSiteContent";
import OfficialLpReveal from "./OfficialLpReveal";

export default function OfficialLpFeatures() {
  const featured = officialFeatures.items.filter((item) => item.featured);
  const rest = officialFeatures.items.filter((item) => !item.featured);

  return (
    <section id="features" className="olp-section">
      <OfficialLpReveal>
        <div className="olp-wrap">
          <h2 className="olp-h2">{officialFeatures.heading}</h2>
          <p className="olp-lead">{officialFeatures.lead}</p>

          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {featured.map((item) => (
              <article
                key={item.id}
                className="min-h-[180px] border border-[var(--olp-border)] bg-[linear-gradient(180deg,rgba(16,24,38,0.92),rgba(8,12,20,0.92))] p-6 sm:p-8"
              >
                <h3 className="m-0 text-[1.35rem] font-extrabold tracking-[-0.03em] text-white">
                  {item.name}
                </h3>
                <p className="mt-3 mb-0 max-w-[42ch] text-[0.98rem] leading-7 text-[var(--olp-muted)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <article
                key={item.id}
                className="border border-[var(--olp-border)] bg-[rgba(16,24,38,0.5)] p-5"
              >
                <h3 className="m-0 text-[1rem] font-bold text-white">{item.name}</h3>
                <p className="mt-2 mb-0 text-[0.9rem] leading-6 text-[var(--olp-muted)]">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </OfficialLpReveal>
    </section>
  );
}
