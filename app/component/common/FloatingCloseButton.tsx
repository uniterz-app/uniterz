"use client";

import { ChevronLeft } from "lucide-react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { useFloatingBackNavigation } from "@/lib/hooks/useFloatingBackNavigation";

/**
 * 丸い戻る。サイドメニューから来た遷移ではプロフィールを開きドロワーを表示する。
 */
export default function FloatingCloseButton() {
  const { goBack, prefersSideMenuAria } = useFloatingBackNavigation();
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const isEn = language === "en";

  const ariaLabel =
    prefersSideMenuAria && fUser
      ? isEn
        ? "Back to side menu"
        : "サイドメニューに戻る"
      : isEn
        ? "Back"
        : "戻る";

  return (
    <button
      type="button"
      onClick={goBack}
      className="fixed top-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-zinc-900/85 text-white shadow-[0_8px_18px_rgba(0,0,0,0.4)] backdrop-blur-sm transition hover:bg-zinc-800/90 active:scale-95"
      aria-label={ariaLabel}
    >
      <ChevronLeft className="h-6 w-6" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
