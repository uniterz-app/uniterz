"use client";

import { useState } from "react";
import { pickBadgeParticipantCount } from "@/lib/badges/badgeGrant";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserBadges } from "@/app/component/badges/useUserBadges";
import { useMasterBadges } from "@/app/component/badges/useMasterBadges";
import type { MasterBadge } from "@/app/component/badges/useMasterBadges";
import BadgeDetailModal from "./BadgeDetailModal";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";
import BadgePalette from "@/app/component/badges/BadgePalette";
import VelvetTuftField from "@/app/component/badges/VelvetTuftField";

type ResolvedBadge = MasterBadge & {
  grantedAt: Date | null;
};

export default function WebBadgesPage() {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const { language } = useUserLanguage(uid);
  const m = t(language);

  // 🔹 user_badges（badgeId + grantedAt）
  const { badges: userBadges } = useUserBadges(uid);

  // 🔹 master_badges（title / icon / description）
  const { badges: masterBadges } = useMasterBadges();

  const [selected, setSelected] = useState<ResolvedBadge | null>(null);

  if (status !== "ready") {
    return (
      <div className="flex justify-center p-6 text-white">
        <CandleChartLoader label={m.common.loading} />
      </div>
    );
  }

  // ★ JOIN（ここが重要）
  const resolvedBadges: ResolvedBadge[] = userBadges
    .map((ub) => {
      const master = masterBadges.find((m) => m.id === ub.badgeId);
      if (!master) return null;

      const participantCount = pickBadgeParticipantCount(
        ub.participantCount,
        master.participantCount,
      );
      return {
        ...master,
        grantedAt: ub.grantedAt,
        ...(participantCount != null ? { participantCount } : {}),
      };
    })
    .filter((b): b is ResolvedBadge => b !== null);

  return (
    <div className="relative min-h-screen text-white bg-[#070707]">
      <div className="badge-page-quilt" aria-hidden>
        <VelvetTuftField />
      </div>
      <FloatingCloseButton />
      {/* お知らせなどと同様：右上フローティング戻るのみ */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-black/70 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-6">
          <h1 className="py-4 text-left text-xl font-bold tracking-wide md:text-2xl md:font-extrabold">
            {m.badges.badgePalette}
          </h1>
        </div>
      </div>

      <div className="relative z-[1] mx-auto max-w-[1200px] px-6 py-8">
        <BadgePalette
          badges={resolvedBadges}
          variant="web"
          onSelect={setSelected}
          emptyLabel={m.badges.noBadges}
        />

        {selected && (
          <BadgeDetailModal
            badge={selected}
            onClose={() => setSelected(null)}
            language={language}
          />
        )}
      </div>
    </div>
  );
}
