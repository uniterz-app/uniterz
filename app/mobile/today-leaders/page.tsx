"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MobilePageShell from "@/app/component/common/MobilePageShell";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import NbaDailyLeadersPanel from "@/app/component/stats/NbaDailyLeadersPanel";
import UniterzDailyScoreLeadersPanel from "@/app/component/stats/UniterzDailyScoreLeadersPanel";
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import {
  dailyScoreLeadersCopy,
  type TodayLeadersTab,
} from "@/lib/rankings/dailyScoreLeaders/dailyScoreLeadersCopy";
import {
  PROFILE_FROM_PARAM,
  PROFILE_FROM_TODAY_VALUE,
} from "@/lib/navigation/rankingsProfileFrom";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

/** Games 右端 TODAY — NBA スタッツリーダー / UNITERZ スコアリーダー */
export default function MobileTodayLeadersPage() {
  const router = useRouter();
  const { fUser } = useFirebaseUser();
  const { language, timeZone } = useUserLanguage(fUser?.uid ?? null);
  const [tab, setTab] = useState<TodayLeadersTab>("nba");
  const copy = dailyScoreLeadersCopy(resolveLocalizedLang(language));

  return (
    <MobilePageShell
      eyebrow="GAMES"
      title="TODAY'S LEADERS"
      onClose={() => router.back()}
    >
      <div className="space-y-4">
        <CyberSlantedTabBar fill aria-label="Today leaders">
          <CyberSlantedTab
            label={copy.tabNba}
            active={tab === "nba"}
            onClick={() => setTab("nba")}
          />
          <CyberSlantedTab
            label={copy.tabUniterz}
            active={tab === "uniterz"}
            onClick={() => setTab("uniterz")}
          />
        </CyberSlantedTabBar>

        {tab === "nba" ? (
          <NbaDailyLeadersPanel
            language={language}
            timeZone={timeZone}
            onSelectPlayer={(playerId) =>
              router.push(
                `/mobile/player-detail-preview?playerId=${encodeURIComponent(playerId)}`
              )
            }
          />
        ) : (
          <UniterzDailyScoreLeadersPanel
            language={language}
            onSelectUser={(uid) =>
              router.push(
                `/mobile/u/${encodeURIComponent(uid)}?${PROFILE_FROM_PARAM}=${PROFILE_FROM_TODAY_VALUE}`
              )
            }
          />
        )}
      </div>
    </MobilePageShell>
  );
}
