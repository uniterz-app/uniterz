"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
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
  /** Web ルートでは横並びプレビュー。未指定時は pathname から判定 */
  platform?: "mobile" | "web";
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
          /** サムネは横長 — Web キャンバス / cover で引き伸ばしを避ける */
          web
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
  platform,
  initialSelectedId = null,
}: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const isWeb =
    platform === "web" || (platform == null && pathname.startsWith("/web"));
  const isProduction = mode === "production";
  const gridRef = useRef<HTMLDivElement>(null);
  const openedScale = useOpenPreviewScale(gridRef);

  /** カタログでハイライトする適用済みスキン */
  const [savedId, setSavedId] = useState<ProfilePlanProBgVariant | null>(
    initialSelectedId
  );
  /** オーバーレイで確認中のスキン */
  const [overlayId, setOverlayId] = useState<ProfilePlanProBgVariant | null>(
    null
  );
  const [replayByVariant, setReplayByVariant] = useState<
    Partial<Record<ProfilePlanProBgVariant, number>>
  >({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setSavedId(initialSelectedId);
  }, [initialSelectedId]);

  useEffect(() => {
    if (!overlayId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [overlayId]);

  const overlayEntry = useMemo(
    () =>
      overlayId
        ? PROFILE_PLAN_PRO_ADOPTED_BG.find((e) => e.id === overlayId) ?? null
        : null,
    [overlayId]
  );

  const overlayIndex = overlayEntry
    ? PROFILE_PLAN_PRO_ADOPTED_BG.findIndex((e) => e.id === overlayEntry.id)
    : -1;

  const hasUnsavedChange =
    isProduction && overlayId != null && overlayId !== savedId;
  const canConfirm = Boolean(overlayId) && !saving && hasUnsavedChange;

  function openOverlay(id: ProfilePlanProBgVariant) {
    setSaveError(null);
    setOverlayId(id);
    setReplayByVariant((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  }

  function closeOverlay() {
    if (saving) return;
    setOverlayId(null);
    setSaveError(null);
  }

  async function handleApplySkin() {
    if (!overlayId || saving || !hasUnsavedChange) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveMeProSkin(overlayId);
      setSavedId(overlayId);
      setOverlayId(null);
      router.push(isWeb ? "/web/mypage" : "/mobile/mypage");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const confirmLabel = saving
    ? "保存中…"
    : hasUnsavedChange
      ? "このスキンを適用"
      : "適用済み";

  const headerBlock = (
    <header className={isWeb ? "mb-5 md:mb-6" : "mx-auto mb-5 max-w-[420px]"}>
      <p
        className={[
          nameRajdhani.className,
          "text-[11px] font-semibold tracking-[0.28em] text-white/40 uppercase",
        ].join(" ")}
      >
        {isProduction ? "Pro Skin" : "Dev · Pro Skin"}
      </p>
      <h1
        className={[
          "mt-1 font-semibold text-white",
          isWeb ? "text-2xl md:text-3xl" : "text-xl sm:text-2xl",
        ].join(" ")}
      >
        Choose Pro Skin
      </h1>
      <p
        className={[
          "mt-1.5 leading-relaxed text-white/50",
          isWeb ? "max-w-2xl text-sm md:text-base" : "text-sm",
        ].join(" ")}
      >
        {isProduction
          ? "模様をタップするとプレビューが開き、そこで適用を確定できます。"
          : `Browse ${PROFILE_PLAN_PRO_ADOPTED_BG.length} skin thumbnails. Tap a thumbnail to open the preview overlay.`}
      </p>
      {!isProduction ? (
        <div className="mt-2.5 flex flex-wrap gap-3 text-[11px]">
          <Link
            href={isWeb ? PRO_SUBSCRIBE_PATH.web : PRO_SUBSCRIBE_PATH.mobile}
            className="text-cyan-300/80 underline-offset-2 hover:underline"
          >
            ← Subscribe
          </Link>
        </div>
      ) : null}
    </header>
  );

  const catalogGrid = (
    <div
      ref={gridRef}
      className={[
        "profile-plan-pro-bg-picker-catalog-grid",
        isWeb ? "profile-plan-pro-bg-picker-catalog-grid--web" : "",
      ].join(" ")}
    >
      {PROFILE_PLAN_PRO_ADOPTED_BG.map((entry) => (
        <CatalogTile
          key={entry.id}
          entry={entry}
          selected={savedId === entry.id}
          onSelect={() => openOverlay(entry.id)}
        />
      ))}
    </div>
  );

  const confirmOverlay =
    overlayEntry != null ? (
      <div
        className="profile-plan-pro-bg-picker-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`${overlayEntry.label} preview`}
      >
        <button
          type="button"
          className="profile-plan-pro-bg-picker-overlay__backdrop"
          aria-label="閉じる"
          onClick={closeOverlay}
        />
        <div className="profile-plan-pro-bg-picker-overlay__panel">
          <div className="profile-plan-pro-bg-picker-overlay__head">
            <div className="min-w-0 flex-1">
              <p
                className={[
                  nameOxanium.className,
                  "text-[10px] font-extrabold uppercase tracking-[0.22em] text-cyan-300/80",
                ].join(" ")}
              >
                PREVIEW
              </p>
              <p
                className={[
                  nameRajdhani.className,
                  "mt-0.5 truncate text-base font-bold text-white",
                ].join(" ")}
              >
                {overlayIndex >= 0 ? `${formatSkinNo(overlayIndex)} · ` : ""}
                {overlayEntry.label}
                {overlayEntry.tag ? ` · ${overlayEntry.tag}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={closeOverlay}
              className={[
                nameOxanium.className,
                "shrink-0 border border-white/20 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/70 hover:border-cyan-400/50 hover:text-cyan-200",
              ].join(" ")}
            >
              閉じる
            </button>
          </div>

          <div className="profile-plan-pro-bg-picker-overlay__preview">
            {isWeb ? (
              <div className="profile-plan-pro-bg-picker-web-preview">
                <ProfileEditKinetikPanel
                  key={`${overlayEntry.id}:${replayByVariant[overlayEntry.id] ?? 0}`}
                  layout="web"
                  {...panelProps()}
                  isPro
                  planProBgVariant={overlayEntry.id}
                />
              </div>
            ) : (
              <ScaledCatalogCard
                scale={openedScale}
                variantId={overlayEntry.id}
                replaySeed={replayByVariant[overlayEntry.id] ?? 0}
              />
            )}
          </div>

          <div className="profile-plan-pro-bg-picker-overlay__actions">
            {isProduction ? (
              <>
                <button
                  type="button"
                  disabled={!canConfirm}
                  onClick={() => void handleApplySkin()}
                  className={[
                    nameOxanium.className,
                    "flex-1 border-2 px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] transition",
                    canConfirm
                      ? "border-[#00F5FF] bg-[#00F5FF] text-[#050508] hover:brightness-110 active:brightness-95"
                      : "cursor-not-allowed border-white/15 text-white/30",
                  ].join(" ")}
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Sparkles size={14} strokeWidth={2.2} aria-hidden />
                    {confirmLabel}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeOverlay}
                  className={[
                    nameOxanium.className,
                    "shrink-0 border border-white/20 px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70 hover:border-white/40",
                  ].join(" ")}
                >
                  キャンセル
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={closeOverlay}
                className={[
                  nameOxanium.className,
                  "w-full border border-cyan-400/40 px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-cyan-200",
                ].join(" ")}
              >
                閉じる
              </button>
            )}
          </div>
          {saveError && isProduction ? (
            <p className="mt-2 text-center text-xs text-red-300/90">{saveError}</p>
          ) : null}
        </div>
      </div>
    ) : null;

  const Root = isProduction ? "div" : "main";

  return (
    <Root
      className={[
        "profile-plan-pro-bg-picker-preview-page text-white",
        isWeb
          ? isProduction
            ? "pb-10"
            : "min-h-screen bg-[#03080d] px-4 py-6 md:px-8 md:py-8 pb-16"
          : [
              "min-h-screen bg-[#03080d] px-3 py-6 sm:px-4 md:px-8",
              isProduction ? "pb-16" : "pb-28",
            ].join(" "),
      ].join(" ")}
    >
      {headerBlock}

      <div
        className={
          isWeb ? "mx-auto w-full max-w-5xl" : "mx-auto w-full max-w-[420px]"
        }
      >
        {catalogGrid}
      </div>

      {confirmOverlay}
    </Root>
  );
}
