// app/web/badges/page.tsx
"use client";

import { useState } from "react";
import { useUserBadges } from "@/app/component/profile/useUserBadges";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import BadgeDetailModal from "./BadgeDetailModal";

export default function WebBadgesPage() {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? null;

  const { badges } = useUserBadges(uid);
  const [selected, setSelected] = useState<any | null>(null);

  if (status !== "ready") {
    return <div className="p-6 text-white">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen px-6 py-10 text-white bg-[#08111A]">
      {/* Header */}
      <h1 className="text-3xl font-extrabold mb-6 tracking-wide">
        バッジパレット
      </h1>

      {/* velvet / velour風 */}
      <div
        className="
          rounded-3xl p-10 shadow-2xl border border-white/10
          bg-[radial-gradient(circle_at_30%_30%,#0f1b2a_0%,#05080c_80%)]
        "
      >
        {badges.length === 0 ? (
          <p className="text-white/60 text-sm">まだ獲得バッジがありません。</p>
        ) : (
          <div className="grid grid-cols-8 gap-5">
            {badges.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="
                  group relative w-full aspect-square rounded-2xl
                  bg-white/5 overflow-hidden border border-white/10
                  hover:bg-white/10 transition-all
                "
              >
                <img
                  src={b.icon}
                  alt={b.id}
                  className="w-full h-full object-cover p-1 group-hover:scale-105 transition-transform"
                />
                <div
                  className="
                    absolute inset-0 pointer-events-none
                    bg-gradient-to-br from-white/10 to-transparent
                    opacity-0 group-hover:opacity-20 transition-opacity
                  "
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <BadgeDetailModal badge={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
