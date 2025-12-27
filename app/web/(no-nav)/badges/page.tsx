"use client";

import { useState } from "react";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserBadges } from "@/app/component/badges/useUserBadges";
import { useMasterBadges } from "@/app/component/badges/useMasterBadges";
import type { MasterBadge } from "@/app/component/badges/useMasterBadges";
import BadgeDetailModal from "./BadgeDetailModal";

type ResolvedBadge = MasterBadge & {
  grantedAt: Date | null;
};

export default function WebBadgesPage() {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? null;

  // 🔹 user_badges（badgeId + grantedAt）
  const { badges: userBadges } = useUserBadges(uid);

  // 🔹 master_badges（title / icon / description）
  const { badges: masterBadges } = useMasterBadges();

  const [selected, setSelected] = useState<ResolvedBadge | null>(null);

  if (status !== "ready") {
    return <div className="p-6 text-white">読み込み中...</div>;
  }

  // ★ JOIN（ここが重要）
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
        {resolvedBadges.length === 0 ? (
          <p className="text-white/60 text-sm">
            まだ獲得バッジがありません。
          </p>
        ) : (
          <div className="grid grid-cols-8 gap-5">
            {resolvedBadges.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="
                  group relative w-full aspect-square rounded-2xl
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
        <BadgeDetailModal
          badge={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
