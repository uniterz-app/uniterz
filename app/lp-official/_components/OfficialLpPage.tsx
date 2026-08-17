"use client";

import { useEffect } from "react";
import { nameOxanium } from "@/lib/fonts";
import OfficialLpHeader from "./OfficialLpHeader";
import OfficialLpHero from "./OfficialLpHero";
import OfficialLpWhat from "./OfficialLpWhat";
import OfficialLpHow from "./OfficialLpHow";
import OfficialLpUnit from "./OfficialLpUnit";
import OfficialLpFeatures from "./OfficialLpFeatures";
import OfficialLpPreview from "./OfficialLpPreview";
import OfficialLpSports from "./OfficialLpSports";
import OfficialLpPro from "./OfficialLpPro";
import OfficialLpNoGambling from "./OfficialLpNoGambling";
import OfficialLpLegal from "./OfficialLpLegal";
import OfficialLpFairness from "./OfficialLpFairness";
import OfficialLpFaq from "./OfficialLpFaq";
import OfficialLpContact from "./OfficialLpContact";
import OfficialLpFooter from "./OfficialLpFooter";

export default function OfficialLpPage() {
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) html.style.scrollBehavior = "smooth";
    return () => {
      html.style.scrollBehavior = previous;
    };
  }, []);

  return (
    <div
      className="official-lp relative min-h-screen overflow-x-hidden"
      style={{ ["--olp-metric" as string]: nameOxanium.style.fontFamily }}
    >
      <span className={`${nameOxanium.className} olp-sr`} aria-hidden>
        .
      </span>
      <div className="olp-stage" aria-hidden>
        <div className="olp-stage-grain" />
      </div>
      <a href="#about" className="olp-skip">
        本文へスキップ
      </a>
      <OfficialLpHeader />
      <main>
        <OfficialLpHero />
        <OfficialLpWhat />
        <OfficialLpHow />
        <OfficialLpFeatures />
        <OfficialLpUnit />
        <OfficialLpPreview />
        <OfficialLpSports />
        <OfficialLpPro />
        <OfficialLpNoGambling />
        <OfficialLpLegal />
        <OfficialLpFairness />
        <OfficialLpFaq />
        <OfficialLpContact />
      </main>
      <OfficialLpFooter />
    </div>
  );
}
