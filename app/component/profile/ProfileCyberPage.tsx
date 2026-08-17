"use client";

import type { ReactNode } from "react";
import CyberSubpageShell from "@/app/component/common/CyberSubpageShell";
import { useFloatingBackNavigation } from "@/lib/hooks/useFloatingBackNavigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";

type Props = {
  /** 中央サイバー題名（英語短語推奨。例: BADGES / NEWS） */
  title: string;
  /** 右上 ? の説明 */
  subtitle?: string;
  eyebrow?: string;
  contentClassName?: string;
  /** ページ全面の背景 */
  backdrop?: ReactNode;
  children: ReactNode;
};

/**
 * プロフィールサイドメニューからの各ページ用シェル。
 * 左戻る · 中央題名 · 右はてな（説明あり時）。
 */
export default function ProfileCyberPage({
  title,
  subtitle,
  eyebrow = "PROFILE",
  contentClassName,
  backdrop,
  children,
}: Props) {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const { goBack, prefersSideMenuAria } = useFloatingBackNavigation();
  const backAria =
    prefersSideMenuAria && user ? m.common.backToSideMenu : m.common.back;

  return (
    <CyberSubpageShell
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      onBack={goBack}
      backAriaLabel={backAria}
      contentClassName={contentClassName}
      backdrop={backdrop}
    >
      {children}
    </CyberSubpageShell>
  );
}
