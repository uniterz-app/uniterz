"use client";

import { useEffect, useState } from "react";
import type { Language } from "@/lib/i18n/language";
import { PROFILE_SCORING_RULES_NOTICE_STORAGE_KEY } from "@/lib/profile/scoringRulesChangeNotice";

type Props = {
  language: Language;
  /** ゲストプロフィールなどでは false */
  enabled: boolean;
};

export default function ScoringRulesChangeNoticeModal({
  language,
  enabled,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    try {
      const dismissed = window.localStorage.getItem(
        PROFILE_SCORING_RULES_NOTICE_STORAGE_KEY
      );
      if (!dismissed) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, [enabled]);

  const dismiss = () => {
    try {
      window.localStorage.setItem(PROFILE_SCORING_RULES_NOTICE_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!enabled || !open) return null;

  const title =
    language === "en" ? "Scoring update" : "得点・集計ルールの変更について";

  const body =
    language === "en" ? (
      <p className="text-sm leading-relaxed text-white/75">
        We&apos;ve updated how points and stats are calculated. Values shown on
        this profile that come from predictions made{" "}
        <span className="font-semibold text-white/90">before the change</span>{" "}
        were computed using the{" "}
        <span className="font-semibold text-white/90">previous rules</span>. Your
        posts and final game results are unchanged.
      </p>
    ) : (
      <p className="text-sm leading-relaxed text-white/75">
        <span className="font-semibold text-white/90">得点および集計の計算方法を変更</span>
        しました。このプロフィールに表示される得点・統計のうち、
        <span className="font-semibold text-white/90">変更前に投稿された予想</span>
        に基づく値は、
        <span className="font-semibold text-white/90">変更前のルールで計算されたもの</span>
        です。投稿や試合の確定結果そのものは消えず、そのまま残ります。
      </p>
    );

  return (
    <div
      className="fixed inset-0 z-100040 flex min-h-dvh items-center justify-center bg-black/75 p-4"
      role="presentation"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scoring-rules-notice-title"
        className="max-h-[min(90dvh,520px)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/12 bg-[#0a1220] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="scoring-rules-notice-title"
          className="text-lg font-bold text-white"
        >
          {title}
        </h2>
        <div className="mt-4">{body}</div>
        <button
          type="button"
          className="mt-6 w-full rounded-xl bg-cyan-500/90 py-3 text-sm font-semibold text-[#041018] hover:bg-cyan-400"
          onClick={dismiss}
        >
          {language === "en" ? "OK" : "了解"}
        </button>
      </div>
    </div>
  );
}
