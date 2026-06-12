"use client";

import { useState } from "react";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserBadges } from "@/app/component/badges/useUserBadges";
import { useMasterBadges } from "@/app/component/badges/useMasterBadges";
import type { MasterBadge } from "@/app/component/badges/useMasterBadges";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import FloatingCloseButton from "@/app/component/common/FloatingCloseButton";
import BadgePalette from "@/app/component/badges/BadgePalette";

import BadgeDetailModal from "./BadgeDetailModal";

type ResolvedBadge = MasterBadge & {
  grantedAt: Date | null;
};

export default function MobileBadgesPage() {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const { language } = useUserLanguage(uid);
  const m = t(language);

  // user_badges
  const { badges: userBadges } = useUserBadges(uid);

  // master_badges
  const { badges: masterBadges } = useMasterBadges();

  const [selected, setSelected] = useState<ResolvedBadge | null>(null);

  if (status !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <CandleChartLoader label={m.common.loading} />
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
          {m.badges.badgePalette}
        </h1>
      </div>

      <div className="p-4">
        <BadgePalette
          badges={resolvedBadges}
          variant="mobile"
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
