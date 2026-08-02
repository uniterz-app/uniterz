"use client";

/**
 * デザインラボ Pro Skin プレビュー（旧 cosmos ページを転用）。
 * 1 枚表示 + 前へ / 次へ。本番採用リストには未追加。
 */

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import CyberSubpageShell from "@/app/component/common/CyberSubpageShell";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import { PROFILE_EDIT_KINETIK_MOCK } from "@/app/component/profile/edit/profileEditKinetikTypes";
import { nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import {
  PROFILE_PLAN_PRO_LAB_BG_VARIANTS,
  type ProfilePlanProLabBgVariant,
} from "@/lib/profile/profilePlanProLabBgVariants";
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
  skinId: ProfilePlanProLabBgVariant;
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
    naturalHeight > 0
      ? Math.ceil(naturalHeight * safeScale + 10)
      : undefined;

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

export default function CosmosProSkinPreviewPage({ variant }: Props) {
  const entries = PROFILE_PLAN_PRO_LAB_BG_VARIANTS;
  const [index, setIndex] = useState(16); // メタリック先頭（Brushed Steel）
  const gridRef = useRef<HTMLDivElement>(null);
  const openedScale = useOpenPreviewScale(gridRef);

  const selected = useMemo(
    () => entries[index] ?? entries[0]!,
    [entries, index]
  );
  const total = entries.length;
  const selectedId = selected.id;

  const goPrev = () => {
    setIndex((i) => (i - 1 + total) % total);
  };
  const goNext = () => {
    setIndex((i) => (i + 1) % total);
  };

  return (
    <div className="relative min-h-screen text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ background: selected.swatch }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-black/60"
      />

      <CyberSubpageShell
        bare
        eyebrow="PRO SKIN"
        title="DESIGN LAB"
        subtitle="線画 + メタリック追加。前へ／次へで切替。"
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
            nameOxanium.className,
            "mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70",
          ].join(" ")}
        >
          Preview only · {String(index + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </p>

        <div ref={gridRef} className="mb-4">
          <ScaledCard scale={openedScale} skinId={selectedId} />
        </div>

        <div className="mb-4">
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
              "text-lg font-semibold text-white/95",
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

        <div className="sticky bottom-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className={[
              nameOxanium.className,
              "flex-1 border border-white/20 bg-black/70 px-3 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/85 backdrop-blur-md transition hover:border-cyan-400/50 hover:text-cyan-200",
            ].join(" ")}
          >
            ← 前へ
          </button>
          <div
            className={[
              nameOxanium.className,
              "shrink-0 border border-white/12 bg-black/60 px-3 py-3 text-[10px] font-bold tracking-[0.12em] text-white/45 backdrop-blur-md",
            ].join(" ")}
          >
            {index + 1}/{total}
          </div>
          <button
            type="button"
            onClick={goNext}
            className={[
              nameOxanium.className,
              "flex-1 border border-cyan-400/45 bg-cyan-500/15 px-3 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-cyan-100 backdrop-blur-md transition hover:border-cyan-300/70 hover:bg-cyan-500/25",
            ].join(" ")}
          >
            次へ →
          </button>
        </div>
      </CyberSubpageShell>
    </div>
  );
}
