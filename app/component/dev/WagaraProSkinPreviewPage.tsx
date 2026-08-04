"use client";

/**
 * 和柄×サイバー Pro Skin 案プレビュー（10 案）。
 * 本番採用リストには未追加 — 比較・選定用。
 */

import { useLayoutEffect, useRef, useState } from "react";
import CyberSubpageShell from "@/app/component/common/CyberSubpageShell";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import { PROFILE_EDIT_KINETIK_MOCK } from "@/app/component/profile/edit/profileEditKinetikTypes";
import ProfilePlanProBackgroundFx from "@/app/component/profile/ui/ProfilePlanProBackgroundFx";
import { nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import {
  PROFILE_PLAN_PRO_WAGARA_BG_VARIANTS,
  type ProfilePlanProWagaraBgVariant,
} from "@/lib/profile/profilePlanProWagaraBgVariants";
import { PROFILE_PLAN_PRO_CLASS } from "@/lib/profile/profilePlanVisual";
import "@/app/component/profile/pro/profilePlanProBgPickerPreview.css";

type Props = {
  variant: "web" | "mobile";
};

const CARD_LAYOUT_WIDTH = 400;

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
      scorePrecision: 8,
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
    profileViewCount: 1284,
    unitBalance: 2450,
  };
}

function useOpenPreviewScale(gridRef: React.RefObject<HTMLDivElement | null>) {
  const [openedScale, setOpenedScale] = useState(0.95);

  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => {
      const gridW = el.clientWidth;
      if (gridW <= 0) return;
      setOpenedScale(Math.min(1, gridW / CARD_LAYOUT_WIDTH));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [gridRef]);

  return openedScale;
}

function ScaledCard({
  scale,
  skinId,
}: {
  scale: number;
  skinId: ProfilePlanProWagaraBgVariant;
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
  }, [skinId]);

  const safeScale = scale > 0 ? scale : 0.44;
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
          key={skinId}
          layout="mobile"
          {...panelProps()}
          isPro
          planProBgVariant={skinId}
        />
      </div>
    </div>
  );
}

export default function WagaraProSkinPreviewPage({ variant }: Props) {
  const entries = PROFILE_PLAN_PRO_WAGARA_BG_VARIANTS;
  const [selectedId, setSelectedId] = useState<ProfilePlanProWagaraBgVariant>(
    entries[0]!.id
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const openedScale = useOpenPreviewScale(gridRef);
  const selected = entries.find((e) => e.id === selectedId) ?? entries[0]!;

  return (
    <div className="relative min-h-screen text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ background: selected.swatch }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-black/55"
      />

      <CyberSubpageShell
        bare
        eyebrow="PRO SKIN"
        title="WAGARA"
        subtitle="和柄×サイバー 10 案。タイルで切替。本番採用リストには未追加。"
        onBack={() => {
          if (typeof window !== "undefined") window.history.back();
        }}
        contentClassName={
          variant === "web"
            ? "max-w-2xl px-4 py-5 pb-36 md:px-6"
            : "max-w-lg px-4 py-5 pb-36"
        }
      >
        <p
          className={[
            nameOxanium.className,
            "mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70",
          ].join(" ")}
        >
          Preview only · Wagara Round 1
        </p>
        <p
          className={[
            jp.className,
            "mb-5 text-xs leading-relaxed text-white/45",
          ].join(" ")}
        >
          青海波・麻の葉・亀甲など日本の伝統文様をサイバー配色で再構成した 10
          案。下のタイルで比較できます。
        </p>

        <div ref={gridRef} className="mb-6">
          <ScaledCard scale={openedScale} skinId={selectedId} />
        </div>

        <div className="mb-3">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200/70",
            ].join(" ")}
          >
            {selected.tag}
          </p>
          <p
            className={[
              nameRajdhani.className,
              "text-base font-semibold text-white/90",
            ].join(" ")}
          >
            {selected.label}
          </p>
          <p
            className={[
              jp.className,
              "mt-1 text-xs leading-relaxed text-white/50",
            ].join(" ")}
          >
            {selected.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {entries.map((entry) => {
            const on = entry.id === selectedId;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedId(entry.id)}
                className={[
                  "overflow-hidden border text-left transition",
                  on
                    ? "border-cyan-400/70 ring-1 ring-cyan-400/40"
                    : "border-white/12 hover:border-white/28",
                ].join(" ")}
              >
                <div
                  className={[
                    "relative h-[72px]",
                    PROFILE_PLAN_PRO_CLASS,
                    "profile-kinetik-panel",
                  ].join(" ")}
                  style={{ background: entry.swatch }}
                >
                  <ProfilePlanProBackgroundFx
                    variant={entry.id}
                    animate={false}
                    web
                  />
                </div>
                <div className="space-y-0.5 bg-black/50 px-2 py-2">
                  <p
                    className={[
                      nameOxanium.className,
                      "text-[8px] font-extrabold uppercase tracking-[0.12em]",
                      on ? "text-cyan-300" : "text-white/40",
                    ].join(" ")}
                  >
                    {entry.tag}
                  </p>
                  <p
                    className={[
                      nameRajdhani.className,
                      "text-[11px] font-semibold leading-tight",
                      on ? "text-white" : "text-white/70",
                    ].join(" ")}
                  >
                    {entry.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </CyberSubpageShell>
    </div>
  );
}
