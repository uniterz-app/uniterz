"use client";

/**
 * /dev/season-market-preview · /mobile/season-market-preview
 * 締切後マーケット（順位・アワード）— モック集計で本番相当 UI
 */
import { useMemo, useState } from "react";
import GamesNbaSubpageShell from "@/app/component/games/GamesNbaSubpageShell";
import NbaSeasonStandingsMarketPanel from "@/app/component/predict/season/NbaSeasonStandingsMarketPanel";
import NbaSeasonAwardsMarketPanel from "@/app/component/predict/season/NbaSeasonAwardsMarketPanel";
import SeasonPredictRulesModal from "@/app/component/predict/season/SeasonPredictRulesModal";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import { nameOxanium } from "@/lib/fonts";
import {
  SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA,
} from "@/lib/predict/seasonPredictDeadline";
import {
  buildSeasonAwardsMarketPreviewMock,
  buildSeasonStandingsMarketPreviewMock,
} from "@/lib/predict/seasonPredictMarketMocks";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

type Tab = "standings" | "awards";

export default function SeasonMarketPreviewPage() {
  const season = CURRENT_NBA_SEASON_KEY;
  const [tab, setTab] = useState<Tab>("standings");
  const [rulesOpen, setRulesOpen] = useState(false);

  const standingsMarket = useMemo(
    () => buildSeasonStandingsMarketPreviewMock(season),
    [season]
  );
  const awardsMarket = useMemo(
    () => buildSeasonAwardsMarketPreviewMock(season),
    [season]
  );

  return (
    <GamesNbaSubpageShell
      eyebrow="NBA · SEASON"
      title="MARKET"
      subtitle="締切後に公開される提出集計（プレビュー・モックデータ）。"
      onHelpPress={() => setRulesOpen(true)}
    >
      <div className="mb-3 space-y-2">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200/70",
          ].join(" ")}
        >
          Preview · mock data · deadline passed
        </p>
        <p className="text-[11px] leading-relaxed text-white/45">
          提出期限（{SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA}
          ）を過ぎたあと、順位・アワード予想ページはこちらのマーケット表示になります。数値はプレビュー用の仮集計です。
        </p>
        <CyberSlantedTabBar fill aria-label="Market kind">
          <CyberSlantedTab
            role="tab"
            label="STANDINGS"
            active={tab === "standings"}
            onClick={() => setTab("standings")}
            compact
            fontWeight={900}
          />
          <CyberSlantedTab
            role="tab"
            label="AWARDS"
            active={tab === "awards"}
            onClick={() => setTab("awards")}
            compact
            fontWeight={900}
          />
        </CyberSlantedTabBar>
      </div>

      {tab === "standings" ? (
        <NbaSeasonStandingsMarketPanel market={standingsMarket} />
      ) : (
        <NbaSeasonAwardsMarketPanel market={awardsMarket} />
      )}

      <SeasonPredictRulesModal
        open={rulesOpen}
        kind={tab === "standings" ? "standings" : "awards"}
        onClose={() => setRulesOpen(false)}
      />
    </GamesNbaSubpageShell>
  );
}
