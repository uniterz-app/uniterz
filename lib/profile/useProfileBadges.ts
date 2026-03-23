// app/lib/profile/useProfileBadges.ts
"use client";

import { useMemo } from "react";
import { useUserBadges } from "@/app/component/badges/useUserBadges";
import {
  useMasterBadges,
  type MasterBadge,
} from "@/app/component/badges/useMasterBadges";

export type ResolvedBadge = MasterBadge & {
  grantedAt: Date | null;
};

export function useProfileBadges(targetUid: string | null) {
  const { badges: userBadges, loading: userLoading } =
    useUserBadges(targetUid);

  const { badges: masterBadges, loading: masterLoading } =
    useMasterBadges();

  const resolvedBadges: ResolvedBadge[] = useMemo(() => {
    if (!userBadges || !masterBadges) return [];

    return userBadges
      .map((ub) => {
        const master = masterBadges.find((m) => m.id === ub.badgeId);
        if (!master) return null;

        return {
          ...master,
          grantedAt: ub.grantedAt ?? null,
        };
      })
      .filter((b): b is ResolvedBadge => b !== null);
  }, [userBadges, masterBadges]);

  return {
    resolvedBadges,
    loading: userLoading || masterLoading,
  };
}