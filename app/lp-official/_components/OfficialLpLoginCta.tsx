"use client";

import { useEffect, useState } from "react";
import { officialHero } from "@/lib/lp/officialSiteContent";

const MOBILE_MAX = 767;

type OfficialLpLoginCtaProps = {
  className?: string;
  onClick?: () => void;
};

function loginHref(width: number) {
  return width <= MOBILE_MAX
    ? officialHero.ctaHrefMobile
    : officialHero.ctaHrefWeb;
}

/** `/mobile/login` と `/web/login` を幅 768px で切り替える */
export default function OfficialLpLoginCta({
  className = "",
  onClick,
}: OfficialLpLoginCtaProps) {
  const [href, setHref] = useState(officialHero.ctaHrefWeb);

  useEffect(() => {
    const sync = () => setHref(loginHref(window.innerWidth));
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <a
      href={href}
      className={["olp-btn", "olp-btn-solid", className].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      {officialHero.ctaLabel}
    </a>
  );
}
