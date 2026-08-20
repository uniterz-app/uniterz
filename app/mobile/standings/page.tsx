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
      subtitle="イースト / ウエスト。成績・勝率・連勝敗・L10・HOME / AWAY。"
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
