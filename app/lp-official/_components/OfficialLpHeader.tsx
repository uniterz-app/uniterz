"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { officialSite } from "@/lib/lp/officialSiteContent";

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
    <header className="sticky top-0 z-[var(--olp-z-sticky)] border-b border-white/8 bg-[#070b12]/86 backdrop-blur-md">
      <div className="olp-wrap flex h-[64px] items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2.5 no-underline">
          <span className="relative h-8 w-8 shrink-0">
            <Image
              src="/logo/logo.png"
              alt=""
              fill
              priority
              className="object-contain"
            />
          </span>
          <span
            className="text-[22px] tracking-[0.12em] text-white"
            style={{ fontFamily: "var(--font-auth-condensed), sans-serif" }}
          >
            {officialSite.productName}
          </span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="ページ内">
          {officialSite.nav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-[13px] font-semibold tracking-[0.04em] text-[#c5d0e4] no-underline transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span
            className="olp-btn olp-btn-solid hidden sm:inline-flex"
            aria-disabled="true"
          >
            Coming Soon
          </span>
          <button
            type="button"
            className="olp-btn olp-btn-ghost lg:hidden"
            aria-expanded={open}
            aria-controls="olp-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="olp-mobile-nav"
          className="border-t border-white/8 bg-[#070b12] lg:hidden"
        >
          <nav className="olp-wrap flex flex-col py-3" aria-label="モバイル">
            {officialSite.nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="py-3 text-[15px] font-semibold text-white no-underline"
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
