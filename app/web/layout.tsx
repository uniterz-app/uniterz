"use client";

import usePageView from "@/app/ga/usePageView";

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ★ ページ遷移ごとに GA4 page_view を送信
  usePageView();

  return <>{children}</>;
}
