"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import CyberSubpageShell from "@/app/component/common/CyberSubpageShell";

type Props = {
  /** 例: NBA · SEASON */
  eyebrow?: string;
  /** ページ名（英語・大文字想定。WORLD CUP と同スタイル） */
  title: string;
  /** 短い説明（右上 ? から表示） */
  subtitle?: string;
  children: ReactNode;
  /** 本文ラッパークラス（ブラケットは幅を広げる） */
  contentClassName?: string;
};

/**
 * 試合サイドメニュー「ブラケット / アワード / 順位予想」用ページシェル。
 * 戻る + ページ名（中央）+ 説明は右上はてな。
 */
export default function GamesNbaSubpageShell({
  eyebrow = "NBA · 2026-27",
  title,
  subtitle,
  children,
  contentClassName,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isMobile = pathname.startsWith("/mobile") || pathname.startsWith("/m/");
  const gamesHref = isMobile ? "/mobile/games" : "/web/games";
  /** Web /dev はブラケット同様に広げる（明示指定があれば優先） */
  const resolvedContentClassName =
    contentClassName ??
    (isMobile ? "max-w-lg" : "max-w-6xl px-4 py-5 md:px-6");

  return (
    <CyberSubpageShell
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      contentClassName={resolvedContentClassName}
      onBack={() => router.push(`${gamesHref}?menu=1`)}
    >
      {children}
    </CyberSubpageShell>
  );
}
