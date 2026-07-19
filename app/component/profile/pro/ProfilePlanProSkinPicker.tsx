"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import ProfilePlanProBackgroundFx from "@/app/component/profile/ui/ProfilePlanProBackgroundFx";
import { PROFILE_EDIT_KINETIK_MOCK } from "@/app/component/profile/edit/profileEditKinetikTypes";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import { saveMeProSkin } from "@/lib/api/saveMeProSkin";
import {
  PROFILE_PLAN_PRO_ADOPTED_BG,
  profilePlanProAdoptedCategoryLabel,
  type ProfilePlanProAdoptedCategory,
  type ProfilePlanProAdoptedEntry,
} from "@/lib/profile/profilePlanProAdoptedBgVariants";
import { profilePlanProAdoptedSkinSwatch } from "@/lib/profile/profilePlanProAdoptedSkinSwatch";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_CLASS } from "@/lib/profile/profilePlanVisual";
import { PRO_SUBSCRIBE_PATH } from "@/lib/pro/proSkinRoutes";
import "@/app/component/profile/pro/profilePlanProBgPickerPreview.css";

const CARD_LAYOUT_WIDTH = 400;

export type ProfilePlanProSkinPickerMode = "preview" | "production";

type Props = {
  mode?: ProfilePlanProSkinPickerMode;
  initialSelectedId?: ProfilePlanProBgVariant | null;
};

function formatSkinNo(index: number): string {
  return `No.${index + 1}`;
}

function categoryBadgeClass(category: ProfilePlanProAdoptedCategory): string {
  switch (category) {
    case "cyber":
      return "bg-cyan-400/15 text-cyan-200/90";
    case "reptile":
      return "bg-orange-400/15 text-orange-200/90";
    case "beast":
      return "bg-fuchsia-400/15 text-fuchsia-200/90";
    case "material":
      return "bg-slate-400/15 text-slate-200/90";
    case "geometry":
      return "bg-emerald-400/15 text-emerald-200/90";
  }
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

function SkinThumbnail({ entry }: { entry: ProfilePlanProAdoptedEntry }) {
  const swatch = profilePlanProAdoptedSkinSwatch(entry);

  return (
    <div className="profile-plan-pro-bg-picker-skin-thumb">
      <div
        className={[
          "profile-plan-pro-bg-picker-skin-thumb__frame",
          PROFILE_PLAN_PRO_CLASS,
          "profile-kinetik-panel",
        ].join(" ")}
        style={{ background: swatch }}
      >
        <ProfilePlanProBackgroundFx
          variant={entry.id}
          animate={false}
          mobileBoost
        />
        <span
          className="profile-kinetik-frame-corner profile-kinetik-frame-corner--tl"
          aria-hidden
        />
        <span
          className="profile-kinetik-frame-corner profile-kinetik-frame-corner--tr"
          aria-hidden
        />
        <span
          className="profile-kinetik-frame-corner profile-kinetik-frame-corner--bl"
          aria-hidden
        />
        <span
          className="profile-kinetik-frame-corner profile-kinetik-frame-corner--br"
          aria-hidden
        />
      </div>
    </div>
  );
}

function ScaledCatalogCard({
  scale,
  variantId,
  replaySeed = 0,
}: {
  scale: number;
  variantId: ProfilePlanProBgVariant;
  replaySeed?: number;
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
  }, [variantId, replaySeed]);

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
          key={`${variantId}:${replaySeed}`}
          layout="mobile"
          {...panelProps()}
          isPro
          planProBgVariant={variantId}
        />
      </div>
    </div>
  );
}

function CatalogTile({
  entry,
  selected,
  onSelect,
}: {
  entry: ProfilePlanProAdoptedEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      aria-pressed={selected}
      aria-label={`${entry.label} ${entry.tag ? entry.tag : ""}`}
      className={[
        "profile-plan-pro-bg-picker-catalog-tile",
        selected ? "profile-plan-pro-bg-picker-catalog-tile--on" : "",
      ].join(" ")}
    >
      <div className="profile-plan-pro-bg-picker-catalog-tile__head">
        <div className="profile-plan-pro-bg-picker-catalog-tile__titles-row min-w-0">
          <span
            className={[
              nameRajdhani.className,
              "profile-plan-pro-bg-picker-catalog-tile__label",
              selected ? "profile-plan-pro-bg-picker-catalog-tile__label--on" : "",
            ].join(" ")}
          >
            {entry.label}
          </span>
          {entry.tag ? (
            <span className="rounded border border-white/15 bg-black/30 px-1.5 py-0.5 text-[10px] text-white/45">
              {entry.tag}
            </span>
          ) : null}
        </div>
        <div className="profile-plan-pro-bg-picker-catalog-tile__group-row">
          <span
            className={[
              nameOxanium.className,
              "rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.1em]",
              categoryBadgeClass(entry.category),
            ].join(" ")}
          >
            {profilePlanProAdoptedCategoryLabel(entry.category, "en")}
          </span>
        </div>
      </div>
      <div className="profile-plan-pro-bg-picker-catalog-tile__card">
        <SkinThumbnail entry={entry} />
      </div>
    </div>
  );
}

export default function ProfilePlanProSkinPicker({
  mode = "preview",
  initialSelectedId = null,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isWeb = pathname.startsWith("/web");
  const isProduction = mode === "production";
  const gridRef = useRef<HTMLDivElement>(null);
  const openPreviewRef = useRef<HTMLDivElement>(null);
  const openedScale = useOpenPreviewScale(gridRef);

  const [selectedId, setSelectedId] = useState<ProfilePlanProBgVariant | null>(
    initialSelectedId
  );
  const [savedId, setSavedId] = useState<ProfilePlanProBgVariant | null>(
    initialSelectedId
  );
  const [replayByVariant, setReplayByVariant] = useState<
    Partial<Record<ProfilePlanProBgVariant, number>>
  >({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(initialSelectedId);
    setSavedId(initialSelectedId);
  }, [initialSelectedId]);

  const selected = useMemo(
    () =>
      selectedId
        ? PROFILE_PLAN_PRO_ADOPTED_BG.find((e) => e.id === selectedId) ?? null
        : null,
    [selectedId]
  );

  const selectedIndex = selected
    ? PROFILE_PLAN_PRO_ADOPTED_BG.findIndex((e) => e.id === selected.id)
    : -1;

  const hasUnsavedChange =
    isProduction && selectedId != null && selectedId !== savedId;

  useLayoutEffect(() => {
    if (!selectedId) return;
    openPreviewRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [selectedId]);

  async function handleApplySkin() {
    if (!selectedId || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveMeProSkin(selectedId);
      setSavedId(selectedId);
      router.push(isWeb ? "/web/mypage" : "/mobile/mypage");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className={[
        "profile-plan-pro-bg-picker-preview-page min-h-screen bg-[#03080d] px-3 py-6 text-white sm:px-4 md:px-8",
        isProduction ? "pb-36" : "pb-28",
      ].join(" ")}
    >
      <header className="mx-auto mb-5 max-w-[420px]">
        <p
          className={[
            nameRajdhani.className,
            "text-[11px] font-semibold tracking-[0.28em] text-white/40 uppercase",
          ].join(" ")}
        >
          {isProduction ? "Pro Skin" : "Dev · Pro Skin"}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
          Choose Pro Skin
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-white/50">
          {isProduction
            ? "Pick a skin for your profile card. Tap a thumbnail to preview, then apply."
            : `Browse ${PROFILE_PLAN_PRO_ADOPTED_BG.length} skin thumbnails in a 2×9 catalog. Tap a thumbnail to open the full profile card preview.`}
        </p>
        {!isProduction ? (
          <div className="mt-2.5 flex flex-wrap gap-3 text-[11px]">
            <Link
              href={PRO_SUBSCRIBE_PATH.mobile}
              className="text-cyan-300/80 underline-offset-2 hover:underline"
            >
              ← Subscribe
            </Link>
          </div>
        ) : null}
      </header>

      <div className="mx-auto w-full max-w-[420px]">
        <div className="sticky top-0 z-20 mb-3 -mx-1 flex items-center justify-between gap-2 border-b border-white/8 bg-[#03080d]/94 px-1 py-2.5 backdrop-blur-md">
          <div className="min-w-0">
            <p
              className={[
                nameOxanium.className,
                "text-[8px] font-extrabold uppercase tracking-[0.16em] text-white/35",
              ].join(" ")}
            >
              Selected
            </p>
            <p
              className={[
                nameRajdhani.className,
                "truncate text-sm font-semibold tracking-[0.08em] uppercase text-cyan-200/90",
              ].join(" ")}
            >
              {selected && selectedIndex >= 0
                ? `${formatSkinNo(selectedIndex)} · ${selected.label}${selected.tag ? ` · ${selected.tag}` : ""}`
                : "None"}
            </p>
          </div>
          <p className="shrink-0 text-[10px] text-white/35">Tap to open</p>
        </div>

        {selected ? (
          <div
            ref={openPreviewRef}
            className="profile-plan-pro-bg-picker-open-preview mb-3 scroll-mt-24"
          >
            <ScaledCatalogCard
              scale={openedScale}
              variantId={selected.id}
              replaySeed={replayByVariant[selected.id] ?? 0}
            />
          </div>
        ) : null}

        <div
          ref={gridRef}
          className="profile-plan-pro-bg-picker-catalog-grid"
        >
          {PROFILE_PLAN_PRO_ADOPTED_BG.map((entry) => (
            <CatalogTile
              key={entry.id}
              entry={entry}
              selected={selectedId === entry.id}
              onSelect={() => {
                setSelectedId(entry.id);
                setReplayByVariant((prev) => ({
                  ...prev,
                  [entry.id]: (prev[entry.id] ?? 0) + 1,
                }));
              }}
            />
          ))}
        </div>
      </div>

      {isProduction ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#03080d]/96 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-[420px] flex-col gap-2">
            {saveError ? (
              <p className="text-center text-xs text-red-300/90">{saveError}</p>
            ) : null}
            <button
              type="button"
              disabled={!selectedId || saving || !hasUnsavedChange}
              onClick={() => void handleApplySkin()}
              className={[
                nameOxanium.className,
                "w-full border-2 border-[#00F5FF] py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.14em]",
                "transition",
                !selectedId || saving || !hasUnsavedChange
                  ? "cursor-not-allowed border-white/15 text-white/30"
                  : "text-[#00F5FF] hover:bg-[#00F5FF] hover:text-[#050508]",
              ].join(" ")}
            >
              {saving ? "Saving…" : "Apply Pro Skin"}
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
