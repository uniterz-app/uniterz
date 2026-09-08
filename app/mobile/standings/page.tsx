"use client";

import { useRouter } from "next/navigation";
import MobilePageShell from "@/app/component/common/MobilePageShell";
import NbaLeagueStandingsPanel from "@/app/component/standings/NbaLeagueStandingsPanel";

export default function MobileStandingsPage() {
  const router = useRouter();

  return (
    <MobilePageShell
      eyebrow="GAMES"
      title="STANDINGS"
      onClose={() => router.back()}
    >
      <NbaLeagueStandingsPanel
        onSelectTeam={(teamId) =>
          router.push(
            `/mobile/team-detail-preview?teamId=${encodeURIComponent(teamId)}`
          )
        }
      />
    </MobilePageShell>
  );
}
