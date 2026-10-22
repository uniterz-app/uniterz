"use client";

/**
 * Native `MobilePageShell` 相当 — 中央サイバー題名 + 右端 BACK タブ。
 */
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import CyberSubpageShell from "@/app/component/common/CyberSubpageShell";

type Props = {
  title: string;
  onClose?: () => void;
  onBack?: () => void;
  subtitle?: string;
  eyebrow?: string;
  contentClassName?: string;
  backAriaLabel?: string;
  /** 見出しの黒を外し、背景を上まで見せる */
  headerTransparent?: boolean;
  /** 見出しの後ろに敷く全面 */
  underlay?: ReactNode;
  children: ReactNode;
};

export default function MobilePageShell({
  title,
  onClose,
  onBack,
  subtitle,
  eyebrow = "PROFILE",
  contentClassName,
  backAriaLabel,
  headerTransparent,
  underlay,
  children,
}: Props) {
  const router = useRouter();
  const handleBack = onBack ?? onClose ?? (() => router.back());

  return (
    <CyberSubpageShell
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      onBack={handleBack}
      backAriaLabel={backAriaLabel}
      contentClassName={contentClassName ?? "max-w-lg"}
      edgeBack
      hideBack
      headerTransparent={headerTransparent}
      underlay={underlay}
    >
      {children}
    </CyberSubpageShell>
  );
}
