// app/mobile/badges/page.tsx
"use client";

import { useState } from "react";
import { useUserBadges } from "@/app/component/profile/useUserBadges";
import BadgeDetailModal from "./BadgeDetailModal";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

export default function MobileBadgesPage() {
  const router = useRouter();
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? null;

  const { badges } = useUserBadges(uid);
  const [selected, setSelected] = useState<any | null>(null);

  if (status !== "ready") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 text-white bg-[#0A1118]">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="mr-3 p-2 rounded-full bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold tracking-wide">バッジパレット</h1>
      </div>

      {/* ベロア風背景 */}
      <div
        className="
          rounded-3xl p-6 border border-white/10 shadow-xl
          bg-[radial-gradient(circle_at_30%_30%,#0f1b2a_0%,#05080c_90%)]
        "
      >
        {badges.length === 0 ? (
          <p className="text-white/60 text-sm">まだ獲得バッジがありません。</p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {badges.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="
                  group relative w-full aspect-square rounded-xl
                  bg-white/5 overflow-hidden border border-white/10
                  hover:bg-white/10 transition-all
                "
              >
                <img
                  src={b.icon}
                  alt={b.id}
                  className="
                    w-full h-full object-cover p-1
                    group-hover:scale-105 transition-transform
                  "
                />

                {/* 光沢 */}
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

      {/* 詳細モーダル */}
      {selected && (
        <BadgeDetailModal badge={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
