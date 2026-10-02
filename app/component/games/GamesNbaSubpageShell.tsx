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
  /** 右上はてな押下（指定時は既定の説明オーバーレイの代わり） */
  onHelpPress?: () => void;
  children: ReactNode;
  /** 本文ラッパークラス（ブラケットは幅を広げる） */
  contentClassName?: string;
  /**
   * UNITERZ 棚を隠す。試合からのアワード / 順位予想は Games と同じ棚を残す。
   */
  hideBrandShelf?: boolean;
};

/**
 * 試合サイドメニュー「ブラケット / アワード / 順位予想」用ページシェル。
 * 戻る + ページ名（中央）+ 説明は右上はてな。
 */
export default function GamesNbaSubpageShell({
  eyebrow = "NBA · 2026-27",
  title,
  subtitle,
  onHelpPress,
  children,
  contentClassName,
  hideBrandShelf = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isMobile = pathname.startsWith("/mobile") || pathname.startsWith("/m/");
  const gamesHref = isMobile ? "/mobile/games" : "/web/games";
  /** Web /dev はブラケット同様に広げる（明示指定があれば優先） */
  const resolvedContentClassName =
    contentClassName ??
    (isMobile ? "max-w-lg" : "max-w-6xl px-4 py-5 md:px-6");
  const titleInBrandShelf = title === "AWARDS" || title === "STANDINGS";

  return (
    <CyberSubpageShell
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      onHelpPress={onHelpPress}
      contentClassName={resolvedContentClassName}
      hideBrandShelf={hideBrandShelf}
      titleInBrandShelf={titleInBrandShelf}
      onBack={() => router.push(gamesHref)}
    >
      {children}
    </CyberSubpageShell>
  );
}
