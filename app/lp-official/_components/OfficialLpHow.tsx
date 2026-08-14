"use client";

import { officialHow } from "@/lib/lp/officialSiteContent";
import OfficialLpReveal from "./OfficialLpReveal";

export default function OfficialLpHow() {
  return (
    <section id="how" className="olp-section">
      <OfficialLpReveal>
        <div className="olp-wrap">
          <h2 className="olp-h2">{officialHow.heading}</h2>
          <p className="olp-lead">{officialHow.lead}</p>
          <ol className="mt-10 m-0 grid list-none gap-5 p-0 md:grid-cols-4">
            {officialHow.steps.map((step, index) => (
              <li key={step.no} className="relative">
                {index < officialHow.steps.length - 1 ? (
                  <span
                    className="pointer-events-none absolute top-5 left-[3.2rem] hidden h-px w-[calc(100%-1rem)] bg-[var(--olp-line)] md:block"
                    aria-hidden
                  />
                ) : null}
                <p
                  className="m-0 text-[1.35rem] font-extrabold tracking-[0.08em] text-[var(--olp-accent)]"
                  style={{ fontFamily: "var(--font-auth-condensed), sans-serif" }}
                >
                  {step.no}
                </p>
                <h3 className="mt-3 mb-0 text-[1.15rem] font-bold tracking-[-0.02em] text-white">
                  {step.title}
                </h3>
                <p className="mt-2 mb-0 text-[0.92rem] leading-7 text-[var(--olp-muted)]">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </OfficialLpReveal>
    </section>
  );
}
