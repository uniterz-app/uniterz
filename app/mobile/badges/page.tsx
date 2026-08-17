"use client";

import { useState } from "react";

import { pickBadgeParticipantCount } from "@/lib/badges/badgeGrant";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserBadges } from "@/app/component/badges/useUserBadges";
import { useMasterBadges } from "@/app/component/badges/useMasterBadges";
import type { MasterBadge } from "@/app/component/badges/useMasterBadges";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import BadgePalette from "@/app/component/badges/BadgePalette";
import VelvetTuftField from "@/app/component/badges/VelvetTuftField";

import BadgeDetailModal from "./BadgeDetailModal";

type ResolvedBadge = MasterBadge & {
  grantedAt: Date | null;
};

export default function MobileBadgesPage() {
  const { fUser, status } = useFirebaseUser();
  const uid = fUser?.uid ?? null;
  const { language } = useUserLanguage(uid);
  const m = t(language);

  const { badges: userBadges } = useUserBadges(uid);
  const { badges: masterBadges } = useMasterBadges();

  const [selected, setSelected] = useState<ResolvedBadge | null>(null);

  if (status !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        <CandleChartLoader label={m.common.loading} />
      </div>
    );
  }

  const resolvedBadges: ResolvedBadge[] = userBadges
    .map((ub) => {
      const master = masterBadges.find((mb) => mb.id === ub.badgeId);
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
    <ProfileCyberPage
      title="BADGES"
      subtitle={
        language === "en"
          ? "Browse badges you’ve earned. Tap one for details."
          : "獲得したバッジを一覧できます。タップで詳細を表示します。"
      }
      contentClassName="max-w-lg px-3 py-4"
      backdrop={<VelvetTuftField />}
    >
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
    </ProfileCyberPage>
  );
}
