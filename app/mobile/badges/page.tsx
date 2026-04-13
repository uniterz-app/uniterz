"use client";

import { useState } from "react";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserBadges } from "@/app/component/badges/useUserBadges";
import { useMasterBadges } from "@/app/component/badges/useMasterBadges";
import type { MasterBadge } from "@/app/component/badges/useMasterBadges";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import type { Language } from "@/lib/i18n/language";
import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";

import BadgeDetailModal from "./BadgeDetailModal";

type ResolvedBadge = MasterBadge & {
  grantedAt: Date | null;
};

export default function MobileBadgesPage() {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const { language } = useUserLanguage(uid);

  // user_badges
  const { badges: userBadges } = useUserBadges(uid);

  // master_badges
  const { badges: masterBadges } = useMasterBadges();

  const [selected, setSelected] = useState<ResolvedBadge | null>(null);

  if (status !== "ready") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        {language === "en" ? "Loading..." : "読み込み中…"}
      </div>
    );
  }

  // ★ JOIN
  const resolvedBadges: ResolvedBadge[] = userBadges
    .map((ub) => {
      const master = masterBadges.find((m) => m.id === ub.badgeId);
      if (!master) return null;

      return {
        ...master,
        grantedAt: ub.grantedAt,
      };
    })
    .filter((b): b is ResolvedBadge => b !== null);

  return (
    <div className="relative min-h-screen text-white bg-[#0A1118]">
      <FloatingCloseButton />
      {/* お知らせ一覧と同様：右上フローティング戻る＋中央タイトル */}
      <div className="sticky top-0 z-10 border-b border-white/5 backdrop-blur supports-backdrop-filter:bg-[#0A1118]/70">
        <h1 className="py-3 text-center text-lg font-bold">
          {language === "en" ? "Badge Palette" : "バッジパレット"}
        </h1>
      </div>

      <div className="p-4">
      {/* ベロア風背景 */}
      <div
        className="
          rounded-3xl p-6 border border-white/10 shadow-xl
          bg-[radial-gradient(circle_at_30%_30%,#0f1b2a_0%,#05080c_90%)]
        "
      >
        {resolvedBadges.length === 0 ? (
          <p className="text-white/60 text-sm">
            {language === "en" ? "No badges yet." : "まだ獲得バッジがありません。"}
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {resolvedBadges.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="
                  group relative w-full aspect-square rounded-xl
                  bg-white/5 overflow-hidden border border-white/10
                  hover:bg-white/10 transition-all
                "
              >
                {b.icon ? (
                  <img
                    src={b.icon}
                    alt={b.title}
                    className="
                      w-full h-full object-cover p-1
                      group-hover:scale-105 transition-transform
                    "
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-white/60">
                    {b.title}
                  </div>
                )}

                {/* 光沢 */}
                <div
                  className="
                    absolute inset-0 pointer-events-none
                    bg-linear-to-br from-white/10 to-transparent
                    opacity-0 group-hover:opacity-20 transition-opacity
                  "
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 詳細モーダル */}
      {selected && (
        <BadgeDetailModal
          badge={selected}
          onClose={() => setSelected(null)}
          language={language as Language}
        />
      )}
      </div>
    </div>
  );
}
