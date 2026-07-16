"use client";

/**
 * /dev/profile-plan-pro-rank-apex-showcase
 * PRO 総合 1 位バッジ — 8 案比較
 */

import Link from "next/link";
import { useState } from "react";
import ProfilePlanProApexRankBadge from "@/app/component/profile/dev/ProfilePlanProApexRankBadge";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import {
  PROFILE_PLAN_PRO_APEX_RANK_VARIANTS,
  type ProfilePlanProApexRankVariant,
} from "@/lib/profile/profilePlanProApexRankVariants";
import "./profilePlanProApexRankShowcase.css";

function MetricContextPreview({
  variant,
  language,
}: {
  variant: ProfilePlanProApexRankVariant;
  language: "ja" | "en";
}) {
  const rankLabel = language === "ja" ? "1位" : "#1";
  const label = language === "ja" ? "総合得点" : "TOTAL PTS";

  return (
    <div className="profile-plan-pro-rank-apex-showcase-card profile-plan-pro-rank-apex-showcase-card--champion p-3.5">
      <span
        className="profile-plan-pro-rank-apex-showcase-card__bar"
        aria-hidden
      />
      <span
        className="profile-plan-pro-rank-apex-showcase-card__sheen"
        aria-hidden
      />
      <p
        className={[
          nameOxanium.className,
          "pl-2.5 text-[9px] font-semibold tracking-[0.14em] text-white/45 uppercase",
        ].join(" ")}
      >
        {label}
      </p>
      <p
        className={[
          nameOxanium.className,
          "mt-1 pl-2.5 text-[22px] font-extrabold text-white/92",
        ].join(" ")}
      >
        350
        <span className="ml-1 text-[11px] font-bold text-white/42">pts</span>
      </p>
      <div className="profile-plan-pro-rank-apex-showcase-seg" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < 5 ? "is-on" : undefined} />
        ))}
      </div>
      <div className="profile-plan-pro-rank-apex-showcase-rank">
        <ProfilePlanProApexRankBadge
          variant={variant}
          rankLabel={rankLabel}
          language={language}
        />
      </div>
    </div>
  );
}

export default function ProfilePlanProRankApexShowcasePage() {
  const [language, setLanguage] = useState<"ja" | "en">("ja");
  const rankLabel = language === "ja" ? "1位" : "#1";

  return (
    <div className="min-h-screen bg-[#030508] px-4 py-10 text-white md:px-8">
      <header className="mx-auto mb-10 max-w-[1200px]">
        <p
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.22em] text-cyan-300/55 uppercase",
          ].join(" ")}
        >
          Dev / Profile Plan PRO
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          総合 1 位バッジ — {PROFILE_PLAN_PRO_APEX_RANK_VARIANTS.length} 案
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          総合得点カード内での見え方を比較。シアン＋紫、ゴールドなし。
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setLanguage("ja")}
            className={[
              "border px-3 py-1.5 text-xs font-medium transition",
              language === "ja"
                ? "border-cyan-400/45 bg-cyan-400/12 text-cyan-100"
                : "border-white/15 text-white/55 hover:border-white/25",
            ].join(" ")}
          >
            日本語
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={[
              "border px-3 py-1.5 text-xs font-medium transition",
              language === "en"
                ? "border-cyan-400/45 bg-cyan-400/12 text-cyan-100"
                : "border-white/15 text-white/55 hover:border-white/25",
            ].join(" ")}
          >
            English
          </button>
          <Link
            href="/dev/profile-plan-pro-preview"
            className="border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/25 hover:text-white/80"
          >
            ← Free vs PRO 比較へ
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PROFILE_PLAN_PRO_APEX_RANK_VARIANTS.map((item) => (
          <section
            key={item.id}
            id={`apex-${item.id}`}
            className="profile-plan-pro-rank-apex-showcase-frame rounded-xl border border-white/10 p-3"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p
                  className={[
                    nameRajdhani.className,
                    "text-[10px] font-semibold tracking-[0.18em] text-cyan-300/60 uppercase",
                  ].join(" ")}
                >
                  {item.tag}
                </p>
                <h2 className="text-sm font-semibold text-white/92">
                  {item.label}
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-white/48">
                  {item.description}
                </p>
              </div>
              {item.id === "readout" ? (
                <span className="shrink-0 border border-cyan-400/35 px-1.5 py-0.5 text-[9px] text-cyan-200/80">
                  本番
                </span>
              ) : null}
            </div>

            <div className="profile-plan-pro-rank-apex-showcase-isolate mb-3 rounded-lg px-3 py-4">
              <ProfilePlanProApexRankBadge
                variant={item.id}
                rankLabel={rankLabel}
                language={language}
              />
            </div>

            <MetricContextPreview variant={item.id} language={language} />
          </section>
        ))}
      </div>
    </div>
  );
}
