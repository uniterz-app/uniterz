"use client";

import { useRouter } from "next/navigation";
import MobilePageShell from "@/app/component/common/MobilePageShell";
import NbaDailyLeadersPanel from "@/app/component/stats/NbaDailyLeadersPanel";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

/** Games 右端 TODAY — 今日の試合のスタッツリーダー */
export default function MobileTodayLeadersPage() {
  const router = useRouter();
  const { fUser } = useFirebaseUser();
  const { language, timeZone } = useUserLanguage(fUser?.uid ?? null);

  return (
    <MobilePageShell
      eyebrow="GAMES"
      title="TODAY'S LEADERS"
      onClose={() => router.back()}
    >
      <NbaDailyLeadersPanel
        language={language}
        timeZone={timeZone}
        onSelectPlayer={(playerId) =>
          router.push(
            `/mobile/player-detail-preview?playerId=${encodeURIComponent(playerId)}`
          )
        }
      />
    </MobilePageShell>
  );
}
