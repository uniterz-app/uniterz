"use client";

/**
 * /dev/season-picks-view-preview
 * 提出後の出力 UI — スクショ拡散向け（リスト単一カード）
 */

import { useState } from "react";
import Link from "next/link";
import NbaSeasonStandingsViewPanel from "@/app/component/predict/season/NbaSeasonStandingsViewPanel";
import NbaSeasonAwardsViewPanel from "@/app/component/predict/season/NbaSeasonAwardsViewPanel";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import {
  MOCK_SUBMITTED_AWARDS,
  MOCK_SUBMITTED_STANDINGS,
} from "@/lib/predict/nbaSeasonPicksViewMocks";
import { jp, nameOxanium } from "@/lib/fonts";

type ViewTab = "standings" | "awards";

export default function SeasonPicksViewPreviewPage() {
  const [tab, setTab] = useState<ViewTab>("standings");

  return (
    <main className="min-h-screen bg-[#050b14] px-2 py-6 text-white sm:px-3">
      <div className="mx-auto max-w-xl space-y-4">
        <header className="space-y-2">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70",
            ].join(" ")}
          >
            Dev preview · share card
          </p>
          <h1 className={[jp.className, "text-xl font-bold text-white"].join(" ")}>
            提出後プレビュー
          </h1>
          <p className="text-xs leading-relaxed text-white/50">
            YOUR STANDING。1–6 シアン / 7–10 グリーンのサイドライン。帯ラベルなし・密着リスト。
          </p>
          <p className="text-[11px] text-white/40">
            <Link
              href="/mobile/season-picks-view-preview"
              className="text-cyan-300/80 underline-offset-2 hover:underline"
            >
              /mobile/season-picks-view-preview
            </Link>
            {" · "}
            <Link
              href="/mobile/season-preview"
              className="text-white/45 underline-offset-2 hover:underline"
            >
              一覧
            </Link>
          </p>
        </header>

        <CyberSlantedTabBar fill aria-label="Submitted picks">
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

        {/* カード本体だけがスクショ対象になる想定 */}
        {tab === "standings" ? (
          <NbaSeasonStandingsViewPanel prediction={MOCK_SUBMITTED_STANDINGS} />
        ) : (
          <NbaSeasonAwardsViewPanel prediction={MOCK_SUBMITTED_AWARDS} />
        )}
      </div>
    </main>
  );
}
