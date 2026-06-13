"use client";

/**
 * /dev/profile-edit-kinetik-streak-preview
 * アバター周りの連勝演出 — 4案比較
 */

import { useMemo, useState } from "react";
import { ProfileEditKinetikAvatarWithStreak } from "@/app/component/profile/edit/ProfileEditKinetikStreakFx";
import {
  getKinetikStreakTier,
  getKinetikStreakColorLabel,
  KINETIK_STREAK_VARIANTS,
} from "@/app/component/profile/edit/kinetikStreakFx";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";

const STREAK_PRESETS = [0, 3, 4, 6, 8, 10] as const;

export default function ProfileEditKinetikStreakPreviewPage() {
  const [streak, setStreak] = useState<number>(5);

  const tier = useMemo(() => getKinetikStreakTier(streak), [streak]);
  const tierLabel =
    tier === 0
      ? "OFF"
      : `${tier === 1 ? "T1 (4–5)" : tier === 2 ? "T2 (6–7)" : tier === 3 ? "T3 (8–9)" : "T4 (10+)"} · ${getKinetikStreakColorLabel(tier, "ja")}`;

  return (
    <main className="min-h-screen bg-[#03080d] px-4 py-8 text-white md:px-8">
      <header className="mx-auto mb-8 max-w-[1100px]">
        <p
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.28em] text-cyan-300/60 uppercase",
          ].join(" ")}
        >
          Dev Preview
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          Kinetik Avatar — Win Streak FX
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          アバター周りの連勝演出 4 案。連勝数に応じてティアが上がり、演出が少しずつ強くなります（派手すぎない範囲）。
        </p>
        <p className="mt-3 text-xs text-white/40">
          ティア: 0–3=なし / 4–5=緑 / 6–7=緑 / 8–9=シアン / 10+=赤
        </p>
      </header>

      <div className="mx-auto mb-8 max-w-[1100px] rounded-xl border border-white/10 bg-[#060809] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p
              className={[
                nameOxanium.className,
                "text-[10px] tracking-[0.16em] text-white/45 uppercase",
              ].join(" ")}
            >
              連勝数
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[#ccff00]">
              {streak}
              <span className="ml-2 text-sm text-white/50">{tierLabel}</span>
            </p>
          </div>
          <div className="flex min-w-[220px] flex-1 flex-col gap-2 sm:max-w-md">
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={streak}
              onChange={(e) => setStreak(Number(e.target.value))}
              className="w-full accent-[#ccff00]"
            />
            <div className="flex flex-wrap gap-1.5">
              {STREAK_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStreak(n)}
                  className={[
                    "border px-2 py-1 text-[11px] transition",
                    streak === n
                      ? "border-[#ccff00]/45 bg-[#ccff00]/10 text-[#d4ff7a]"
                      : "border-white/12 text-white/55 hover:border-white/22",
                  ].join(" ")}
                >
                  {n === 0 ? "0" : `${n}連勝`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1100px] gap-4 sm:grid-cols-2">
        {KINETIK_STREAK_VARIANTS.map((variant) => (
          <section
            key={variant.id}
            className="rounded-xl border border-white/10 bg-[#060809] p-4 sm:p-5"
          >
            <div className="mb-4">
              <h2
                className={[
                  nameRajdhani.className,
                  "text-sm font-bold tracking-[0.12em] text-cyan-200 uppercase",
                ].join(" ")}
              >
                {variant.titleJa}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                {variant.descJa}
              </p>
            </div>
            <div className="flex min-h-[130px] items-center justify-center rounded-lg border border-white/6 bg-black/30 py-6">
              <ProfileEditKinetikAvatarWithStreak
                variant={variant.id}
                streak={streak}
                displayName="KINETIK_VOID"
              />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
