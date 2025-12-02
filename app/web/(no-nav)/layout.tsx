// ★ 絶対に "use client" を書かない

import type { Metadata } from "next";
import WebClientWrapper from "../WebClientWrapper";

export const metadata: Metadata = {
  title: "Uniterz",
  description: "Sports prediction platform",
};

// layout.tsx は Server Component（クライアントコード禁止）
export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WebClientWrapper>{children}</WebClientWrapper>;
}
