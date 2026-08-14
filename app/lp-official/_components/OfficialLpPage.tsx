"use client";

import { useEffect } from "react";
import OfficialLpHeader from "./OfficialLpHeader";
import OfficialLpHero from "./OfficialLpHero";
import OfficialLpWhat from "./OfficialLpWhat";
import OfficialLpHow from "./OfficialLpHow";
import OfficialLpFeatures from "./OfficialLpFeatures";
import OfficialLpPreview from "./OfficialLpPreview";
import OfficialLpPro from "./OfficialLpPro";
import OfficialLpNoGambling from "./OfficialLpNoGambling";
import OfficialLpCompany from "./OfficialLpCompany";
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
    <div className="official-lp relative min-h-screen overflow-x-hidden">
      <div className="olp-grid" aria-hidden />
      <div className="olp-noise" aria-hidden />
      <a href="#about" className="olp-skip">
        本文へスキップ
      </a>
      <OfficialLpHeader />
      <main>
        <OfficialLpHero />
        <OfficialLpWhat />
        <OfficialLpHow />
        <OfficialLpFeatures />
        <OfficialLpPreview />
        <OfficialLpPro />
        <OfficialLpNoGambling />
        <OfficialLpCompany />
        <OfficialLpContact />
      </main>
      <OfficialLpFooter />
    </div>
  );
}
