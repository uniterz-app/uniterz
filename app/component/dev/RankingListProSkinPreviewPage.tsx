"use client";

/**
 * 採用 Pro Skin × ランキング行デザイン一覧プレビュー
 */

import CyberSubpageShell from "@/app/component/common/CyberSubpageShell";
import { CyberRankingListRow } from "@/app/component/rankings/CyberRankingListParts";
import { nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import {
  PROFILE_PLAN_PRO_ADOPTED_BG,
  profilePlanProAdoptedCategoryLabel,
} from "@/lib/profile/profilePlanProAdoptedBgVariants";
import {
  formatProSkinUnlockCondition,
  PRO_SKIN_UNLOCK_CATALOG,
} from "@/lib/profile/proSkinUnlock";

type Props = {
  variant: "web" | "mobile";
};

export default function RankingListProSkinPreviewPage({ variant }: Props) {
  return (
    <CyberSubpageShell
      bare
      eyebrow="PRO SKIN"
      title="RANKING ROW"
      subtitle="採用スキンのランキング行一覧。本番と同じ CyberRankingListRow。"
      onBack={() => {
        if (typeof window !== "undefined") window.history.back();
      }}
      contentClassName={
        variant === "web"
          ? "max-w-3xl px-4 py-5 pb-28 md:px-6"
          : "max-w-lg px-4 py-5 pb-28"
      }
    >
      <p
        className={[
          jp.className,
          "mb-4 text-[12px] leading-relaxed text-white/55",
        ].join(" ")}
      >
        Futuristic（Eclipse / Data Stream）や Atmos 系は採用から外し、ランキング行でも
        識別できる柄（チタン・回路レース・パンサー・クロコなど）を使っています。
      </p>

      <div className="flex flex-col gap-5">
        {PRO_SKIN_UNLOCK_CATALOG.map((entry, index) => {
          const adopted = PROFILE_PLAN_PRO_ADOPTED_BG.find(
            (e) => e.id === entry.id
          );
          const category = adopted?.category ?? "cyber";
          return (
            <section key={entry.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2 px-0.5">
                <div className="min-w-0">
                  <p
                    className={[
                      nameRajdhani.className,
                      "truncate text-[15px] font-semibold text-white",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        nameOxanium.className,
                        "mr-2 text-[11px] text-white/40",
                      ].join(" ")}
                    >
                      No.{index + 1}
                    </span>
                    {entry.label}
                  </p>
                  <p className="truncate text-[11px] text-white/40">
                    {profilePlanProAdoptedCategoryLabel(category, "ja")} ·{" "}
                    {formatProSkinUnlockCondition(entry.unlock, "ja")}
                  </p>
                </div>
                <span
                  className={[
                    nameOxanium.className,
                    "shrink-0 text-[10px] uppercase tracking-wider text-cyan-300/70",
                  ].join(" ")}
                >
                  {entry.id}
                </span>
              </div>
              <CyberRankingListRow
                rank={index === 0 ? 1 : Math.min(99, index + 3)}
                displayName="MPJ"
                photoURL={null}
                metric="totalScore"
                metricTag="TOTAL"
                scoreSlot={
                  <span
                    className={[
                      nameOxanium.className,
                      "text-[15px] font-extrabold text-white/90",
                    ].join(" ")}
                  >
                    350
                  </span>
                }
                posts={71}
                countryCode="JP"
                compact
                proSkinVariant={entry.id}
                proSkinIntensity="medium"
              />
            </section>
          );
        })}
      </div>
    </CyberSubpageShell>
  );
}
