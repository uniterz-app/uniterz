"use client";

import { useEffect, useState } from "react";
import { officialSite } from "@/lib/lp/officialSiteContent";
import OfficialLpLogo from "./OfficialLpLogo";
import OfficialLpLoginCta from "./OfficialLpLoginCta";

export default function OfficialLpHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="olp-header">
      <div className="olp-wrap olp-header-inner">
        <a href="#top" className="olp-logo">
          <OfficialLpLogo priority />
        </a>

        <nav className="olp-nav olp-metric" aria-label="ページ内">
          {officialSite.nav.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <OfficialLpLoginCta className="olp-header-login" />
          <button
            type="button"
            className="olp-btn olp-btn-ghost olp-menu-btn lg:hidden"
            aria-expanded={open}
            aria-controls="olp-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open ? (
        <div id="olp-mobile-nav" className="olp-mobile-nav lg:hidden">
          <nav className="olp-wrap flex flex-col py-2" aria-label="モバイル">
            {officialSite.nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
