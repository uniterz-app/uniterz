"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function usePageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : "");

    // GA4 の page_view
    window.gtag?.("event", "page_view", {
      page_path: url,
    });
  }, [pathname, searchParams]);
}
