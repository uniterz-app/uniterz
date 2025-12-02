"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function usePageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const sp = searchParams?.toString() ?? "";
    const url = sp ? `${pathname}?${sp}` : pathname;

    window.gtag?.("event", "page_view", {
      page_path: url,
    });
  }, [pathname, searchParams]);
}
