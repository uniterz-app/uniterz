"use client";

/**
 * ダークファンタジー（赤×黒）Pro Skin 候補プレビュー
 * 採用カタログ未搭載 — /dev/pro-skin-dark-fantasy-preview
 */

import { useLayoutEffect, useRef, useState } from "react";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import { PROFILE_EDIT_KINETIK_MOCK } from "@/app/component/profile/edit/profileEditKinetikTypes";
import ProfilePlanProBackgroundFx from "@/app/component/profile/ui/ProfilePlanProBackgroundFx";
import RankingListProSkinFx from "@/app/component/rankings/RankingListProSkinFx";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import {
  PROFILE_PLAN_PRO_BEAST_BG_ROUND6,
  PROFILE_PLAN_PRO_BEAST_BG_VARIANTS,
  type ProfilePlanProBeastBgVariant,
} from "@/lib/profile/profilePlanProBeastBgVariants";
import { PROFILE_PLAN_PRO_CLASS } from "@/lib/profile/profilePlanVisual";
import "@/app/component/profile/pro/profilePlanProBgPickerPreview.css";

const CARD_LAYOUT_WIDTH = 400;

const CANDIDATES = PROFILE_PLAN_PRO_BEAST_BG_ROUND6;

function metaFor(id: ProfilePlanProBeastBgVariant) {
  return PROFILE_PLAN_PRO_BEAST_BG_VARIANTS.find((v) => v.id === id)!;
}

function panelProps() {
  return {
    language: "ja" as const,
    identity: {
      ...PROFILE_EDIT_KINETIK_MOCK.identity,
      displayName: "MPJ",
      systemId: "3PJVG4Y9",
      handle: "mpj",
    },
    stats: {
      ...PROFILE_EDIT_KINETIK_MOCK.stats,
      winRate: 63.4,
      posts: 71,
      hits: 45,
      totalPoints: 350,
      exactHits: 0,
      upset: 9,
    },
    editable: false,
    winStreak: 0,
    totalPointsRank: 14,
    totalPointsRankDenominator: 800,
    rankDeltaPlaces: 0,
    bio: "Win now",
    metricsTitle: "WORLD CUP // STATS",
    countryCode: "JP",
    memberSinceMs: new Date("2025-12-01T00:00:00+09:00").getTime(),
    shareHandle: "mpj",
    rankingLeague: "worldcup" as const,
    visualEffects: "lite" as const,
  };
}

function usePreviewScale(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(0.92);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      setScale(Math.min(1, w / CARD_LAYOUT_WIDTH));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  return scale;
}

function ScaledProfileCard({
  variantId,
  scale,
}: {
  variantId: ProfilePlanProBeastBgVariant;
  scale: number;
}) {
  const islandRef = useRef<HTMLDivElement>(null);
  const [naturalHeight, setNaturalHeight] = useState(0);

  useLayoutEffect(() => {
    const el = islandRef.current;
    if (!el) return;
    const measure = () => {
      setNaturalHeight(Math.max(el.scrollHeight, el.offsetHeight));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [variantId]);

  const safeScale = scale > 0 ? scale : 0.9;
  const viewportHeight =
    naturalHeight > 0 ? Math.ceil(naturalHeight * safeScale + 10) : undefined;

  return (
    <div
      className="profile-plan-pro-bg-picker-scaled-viewport"
      style={{ height: viewportHeight }}
    >
      <div
        ref={islandRef}
        className="profile-plan-pro-bg-picker-scaled-island"
        style={{
          width: CARD_LAYOUT_WIDTH,
          transform: `scale(${safeScale})`,
          transformOrigin: "top left",
        }}
      >
        <ProfileEditKinetikPanel
          key={variantId}
          layout="mobile"
          {...panelProps()}
          isPro
          planProBgVariant={variantId}
        />
      </div>
    </div>
  );
}

function RankingRowMock({ variantId }: { variantId: ProfilePlanProBeastBgVariant }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#07070a]">
      <div className="pointer-events-none absolute inset-0">
        <RankingListProSkinFx variant={variantId} intensity="medium" />
      </div>
      <div className="relative z-[1] flex items-center gap-3 px-3.5 py-3">
        <span
          className={[
            nameOxanium.className,
            "w-7 shrink-0 text-center text-[13px] font-extrabold text-white/70",
          ].join(" ")}
        >
          14
        </span>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white/80">
          MP
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={[
              nameRajdhani.className,
              "truncate text-[14px] font-semibold text-white",
            ].join(" ")}
          >
            MPJ
          </p>
          <p className="truncate text-[10px] text-white/40">@mpj · PRO</p>
        </div>
        <span
          className={[
            nameOxanium.className,
            "shrink-0 text-[13px] font-extrabold text-white/85",
          ].join(" ")}
        >
          350
        </span>
      </div>
    </div>
  );
}

export default function ProfilePlanProDarkFantasySkinPreview() {
  const [selectedId, setSelectedId] = useState<ProfilePlanProBeastBgVariant>(
    CANDIDATES[0]!
  );
  const previewRef = useRef<HTMLDivElement>(null);
  const scale = usePreviewScale(previewRef);
  const selected = metaFor(selectedId);

  return (
    <div className="profile-plan-pro-bg-picker-preview min-h-dvh bg-[#050508] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-lg">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-extrabold uppercase tracking-[0.18em] text-red-300/70",
          ].join(" ")}
        >
          Dev · Pro Skin candidates
        </p>
        <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
          Dark Fantasy · Red × Black
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-white/50">
          ベルセルク風の赤×黒候補（採用ピッカー未搭載）。Eclipse / Blood Rift
          を残しつつ、鎖・ハッチ・牙・渦・装甲などの模様を追加。プロフィールとランキング行で比較する。
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {CANDIDATES.map((id) => {
            const meta = metaFor(id);
            const on = id === selectedId;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedId(id)}
                aria-pressed={on}
                className={[
                  "rounded-xl border p-2 text-left transition",
                  on
                    ? "border-red-400/50 bg-red-500/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20",
                ].join(" ")}
              >
                <div
                  className={[
                    "profile-plan-pro-bg-picker-skin-thumb",
                    PROFILE_PLAN_PRO_CLASS,
                    "profile-kinetik-panel relative overflow-hidden rounded-lg",
                  ].join(" ")}
                  style={{ background: meta.swatch, aspectRatio: "3 / 4" }}
                >
                  <ProfilePlanProBackgroundFx
                    variant={id}
                    animate={false}
                    mobileBoost
                  />
                </div>
                <p
                  className={[
                    nameRajdhani.className,
                    "mt-1.5 truncate text-[12px] font-semibold",
                    on ? "text-red-100" : "text-white/80",
                  ].join(" ")}
                >
                  {meta.label}
                </p>
                <p className="truncate text-[10px] text-white/40">{meta.tag}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4">
          <div className="mb-3 flex flex-wrap items-baseline gap-2">
            <h2 className={[nameRajdhani.className, "text-lg font-semibold"].join(" ")}>
              {selected.label}
            </h2>
            <span className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-white/45">
              {selected.tag}
            </span>
            <code className="text-[10px] text-white/30">{selected.id}</code>
          </div>
          <p className="mb-4 text-[12px] leading-relaxed text-white/45">
            {selected.description}
          </p>

          <p
            className={[
              nameOxanium.className,
              "mb-2 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white/35",
            ].join(" ")}
          >
            Profile card
          </p>
          <div ref={previewRef}>
            <ScaledProfileCard variantId={selectedId} scale={scale} />
          </div>

          <p
            className={[
              nameOxanium.className,
              "mb-2 mt-5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-white/35",
            ].join(" ")}
          >
            Ranking row
          </p>
          <RankingRowMock variantId={selectedId} />
        </div>
      </div>
    </div>
  );
}
