"use client";

import usePageView from "@/app/ga/usePageView";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ★ ページ遷移ごとに GA4 に page_view を送信
  usePageView();

  return <>{children}</>;
}
