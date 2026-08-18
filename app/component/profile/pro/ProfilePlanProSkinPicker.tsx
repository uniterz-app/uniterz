"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import ProfileEditKinetikPanel from "@/app/component/profile/edit/ProfileEditKinetikPanel";
import { PROFILE_EDIT_KINETIK_MOCK } from "@/app/component/profile/edit/profileEditKinetikTypes";
import ProfilePlanProBackgroundFx from "@/app/component/profile/ui/ProfilePlanProBackgroundFx";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import { saveMeProSkin } from "@/lib/api/saveMeProSkin";
import { fetchProSkinStatus } from "@/lib/api/fetchProSkinStatus";
import {
  profilePlanProAdoptedCategoryLabel,
  type ProfilePlanProAdoptedCategory,
  type ProfilePlanProAdoptedEntry,
} from "@/lib/profile/profilePlanProAdoptedBgVariants";
import {
  formatProSkinOwnerCount,
  formatProSkinUnlockCondition,
  listProImmediateSkinIds,
  PRO_SKIN_UNLOCK_CATALOG,
  userDataIsPro,
  type ProSkinUnlockCatalogEntry,
  type ProSkinUnlockProgress,
} from "@/lib/profile/proSkinUnlock";
import { proSkinMilestoneProgressBar } from "@/lib/profile/proSkinProgress";
import { profilePlanProAdoptedSkinSwatch } from "@/lib/profile/profilePlanProAdoptedSkinSwatch";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_CLASS } from "@/lib/profile/profilePlanVisual";
import { PRO_SUBSCRIBE_PATH } from "@/lib/pro/proSkinRoutes";
import { getUserDocDataCached } from "@/lib/user/userDocCache";
import { auth } from "@/lib/firebase";
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
      displayName: "UNITERZ",
      systemId: "",
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
    bio: "PREVIEW",
    metricsTitle: "NBA // SEASON STATS",
    countryCode: "JP",
    memberSinceMs: new Date("2025-12-01T00:00:00+09:00").getTime(),
    shareHandle: "mpj",
    rankingLeague: "nba" as const,
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
        {/* 一覧で模様が見えるよう、全スキンで本番 FX をサムネ描画（アニメなし） */}
        <ProfilePlanProBackgroundFx
          variant={entry.id}
          animate={false}
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
  unlocked,
  isNew,
  owners,
  progress,
  onSelect,
}: {
  entry: ProSkinUnlockCatalogEntry;
  selected: boolean;
  unlocked: boolean;
  isNew: boolean;
  owners: number;
  progress: Pick<
    ProSkinUnlockProgress,
    | "posts"
    | "exactHits"
    | "maxWinStreak"
    | "referralCompletedCount"
    | "periodWins"
  >;
  onSelect: () => void;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  };
  const condition = formatProSkinUnlockCondition(entry.unlock, "ja");
  const bar =
    !unlocked && entry.unlock.kind !== "pro"
      ? proSkinMilestoneProgressBar(entry.unlock, progress, "ja")
      : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      aria-pressed={selected}
      aria-label={`${entry.label} ${unlocked ? "" : "locked"}`}
      className={[
        "profile-plan-pro-bg-picker-catalog-tile",
        selected ? "profile-plan-pro-bg-picker-catalog-tile--on" : "",
        unlocked ? "" : "opacity-95",
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
        <div className="profile-plan-pro-bg-picker-catalog-tile__group-row flex flex-wrap items-center gap-1.5">
          <span
            className={[
              nameOxanium.className,
              "rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.1em]",
              categoryBadgeClass(entry.category),
            ].join(" ")}
          >
            {profilePlanProAdoptedCategoryLabel(entry.category, "en")}
          </span>
          {!unlocked ? (
            <span
              className={[
                nameOxanium.className,
                "inline-flex items-center gap-0.5 rounded border border-amber-300/35 bg-amber-300/10 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-amber-100/85",
              ].join(" ")}
            >
              <Lock size={9} strokeWidth={2.4} aria-hidden />
              LOCKED
            </span>
          ) : isNew ? (
            <span
              className={[
                nameOxanium.className,
                "rounded border border-cyan-300/45 bg-cyan-300/15 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-cyan-100",
              ].join(" ")}
            >
              NEW
            </span>
          ) : entry.unlock.kind === "pro" ? (
            <span
              className={[
                nameOxanium.className,
                "rounded border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-cyan-100/80",
              ].join(" ")}
            >
              PRO
            </span>
          ) : (
            <span
              className={[
                nameOxanium.className,
                "rounded border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.08em] text-emerald-100/85",
              ].join(" ")}
            >
              UNLOCKED
            </span>
          )}
        </div>
        <p
          className={[
            nameOxanium.className,
            "mt-1 text-[9px] font-bold tracking-[0.04em] text-white/45",
          ].join(" ")}
        >
          {condition}
          <span className="mx-1.5 text-white/20">·</span>
          {formatProSkinOwnerCount(owners, "ja")}
        </p>
      </div>
      <div className="profile-plan-pro-bg-picker-catalog-tile__card relative">
        <SkinThumbnail entry={entry} />
        {!unlocked ? (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]"
            aria-hidden
          >
            <div className="flex w-full max-w-[88%] flex-col items-center gap-1.5 px-2 text-center">
              <Lock size={16} className="text-amber-200/90" strokeWidth={2.2} />
              <span
                className={[
                  nameOxanium.className,
                  "text-[9px] font-extrabold uppercase tracking-[0.12em] text-amber-50/90",
                ].join(" ")}
              >
                {entry.unlock.kind === "pro" ? "PRO" : "MILESTONE"}
              </span>
              {bar ? (
                <div className="mt-0.5 w-full">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300/90 to-cyan-300/90"
                      style={{ width: `${Math.round(bar.ratio * 100)}%` }}
                    />
                  </div>
                  <p
                    className={[
                      nameOxanium.className,
                      "mt-1 text-[8px] font-bold tracking-[0.06em] text-white/70",
                    ].join(" ")}
                  >
                    {bar.label}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
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
  const [overlayMounted, setOverlayMounted] = useState(false);
  const [replayByVariant, setReplayByVariant] = useState<
    Partial<Record<ProfilePlanProBgVariant, number>>
  >({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(() =>
    new Set(PRO_SKIN_UNLOCK_CATALOG.map((e) => e.id))
  );
  const [milestoneProgress, setMilestoneProgress] = useState<
    Pick<
      ProSkinUnlockProgress,
      | "posts"
      | "exactHits"
      | "maxWinStreak"
      | "referralCompletedCount"
      | "periodWins"
    >
  >({
    posts: 0,
    exactHits: 0,
    maxWinStreak: 0,
    referralCompletedCount: 0,
    periodWins: {},
  });
  const [ownerCounts, setOwnerCounts] = useState<Record<string, number>>({});
  const [viewerIsPro, setViewerIsPro] = useState(!isProduction);
  const [statusReady, setStatusReady] = useState(!isProduction);
  /** ライブ達成キュー（プロフィール復帰モーダルと同一。Picker では NEW のみ） */
  const [noticeIds, setNoticeIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setSavedId(initialSelectedId);
  }, [initialSelectedId]);

  useEffect(() => {
    if (!isProduction) {
      setUnlockedIds(new Set(PRO_SKIN_UNLOCK_CATALOG.map((e) => e.id)));
      setViewerIsPro(true);
      setStatusReady(true);
      return;
    }
    let alive = true;

    async function resolveViewerIsPro(apiSaysPro: boolean): Promise<boolean> {
      if (apiSaysPro) return true;
      const uid = auth.currentUser?.uid;
      if (!uid) return false;
      try {
        const data = await getUserDocDataCached(uid);
        return userDataIsPro(data ?? undefined);
      } catch {
        return false;
      }
    }

    async function resolveUnlockedIds(
      fromApi: readonly string[],
      apiSaysPro: boolean
    ): Promise<string[]> {
      const next = new Set(fromApi);
      const isPro = await resolveViewerIsPro(apiSaysPro);
      if (isPro) {
        for (const id of listProImmediateSkinIds()) next.add(id);
      }
      return [...next];
    }

    void fetchProSkinStatus()
      .then(async (status) => {
        if (!alive) return;
        const apiSaysPro = status.progress?.isPro === true;
        const isPro = await resolveViewerIsPro(apiSaysPro);
        const fromApi = status.unlockedIds ?? [];
        const ids = await resolveUnlockedIds(fromApi, apiSaysPro);
        if (!alive) return;
        setViewerIsPro(isPro);
        setUnlockedIds(new Set(ids));
        setOwnerCounts(status.ownerCounts ?? {});
        setMilestoneProgress({
          posts: status.progress?.posts ?? 0,
          exactHits: status.progress?.exactHits ?? 0,
          maxWinStreak: status.progress?.maxWinStreak ?? 0,
          referralCompletedCount:
            status.progress?.referralCompletedCount ?? 0,
          periodWins: status.progress?.periodWins ?? {},
        });
        if (status.savedId) setSavedId(status.savedId);
        setNoticeIds(new Set(status.noticeIds ?? []));
        setStatusReady(true);
      })
      .catch(async () => {
        if (!alive) return;
        const isPro = await resolveViewerIsPro(false);
        const ids = await resolveUnlockedIds([], false);
        if (!alive) return;
        setViewerIsPro(isPro);
        setUnlockedIds(new Set(ids));
        setStatusReady(true);
      });
    return () => {
      alive = false;
    };
  }, [isProduction]);

  useEffect(() => {
    setOverlayMounted(true);
  }, []);

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
        ? PRO_SKIN_UNLOCK_CATALOG.find((e) => e.id === overlayId) ?? null
        : null,
    [overlayId]
  );

  const overlayIndex = overlayEntry
    ? PRO_SKIN_UNLOCK_CATALOG.findIndex((e) => e.id === overlayEntry.id)
    : -1;

  const overlayUnlocked =
    !isProduction || (overlayId != null && unlockedIds.has(overlayId));

  const hasUnsavedChange =
    isProduction &&
    overlayId != null &&
    overlayId !== savedId &&
    overlayUnlocked;
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
    : !viewerIsPro
      ? "GET PRO"
      : !overlayUnlocked
        ? "未解放"
        : hasUnsavedChange
          ? "このスキンを適用"
          : "適用済み";

  const subscribeHref = isWeb ? PRO_SUBSCRIBE_PATH.web : PRO_SUBSCRIBE_PATH.mobile;

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
          ? viewerIsPro
            ? "上段は Pro ですぐ使えるスキン。下段はマイルストーン達成で解放されます。"
            : "プレビューは無料で見られます。適用するには Pro プランが必要です。"
          : `Browse ${PRO_SKIN_UNLOCK_CATALOG.length} skin thumbnails. Tap a thumbnail to open the preview overlay.`}
      </p>
      {!isProduction ? (
        <div className="mt-2.5 flex flex-wrap gap-3 text-[11px]">
          <Link
            href={subscribeHref}
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
      {PRO_SKIN_UNLOCK_CATALOG.map((entry) => (
        <CatalogTile
          key={entry.id}
          entry={entry}
          selected={savedId === entry.id}
          unlocked={!isProduction || unlockedIds.has(entry.id)}
          isNew={noticeIds.has(entry.id)}
          owners={ownerCounts[entry.id] ?? 0}
          progress={milestoneProgress}
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
                {viewerIsPro && !overlayUnlocked ? (
                  <p
                    className={[
                      nameOxanium.className,
                      "w-full text-center text-[11px] font-bold tracking-[0.06em] text-amber-100/85",
                    ].join(" ")}
                  >
                    {overlayEntry
                      ? formatProSkinUnlockCondition(overlayEntry.unlock, "ja")
                      : "未解放"}
                  </p>
                ) : null}
                {!viewerIsPro ? (
                  <p
                    className={[
                      nameOxanium.className,
                      "w-full text-center text-[11px] font-bold tracking-[0.06em] text-cyan-100/80",
                    ].join(" ")}
                  >
                    プレビューのみ · 適用には Pro が必要です
                  </p>
                ) : null}
                {!viewerIsPro ? (
                  <Link
                    href={subscribeHref}
                    className={[
                      nameOxanium.className,
                      "flex flex-1 items-center justify-center border-2 border-[#00F5FF] bg-[#00F5FF] px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#050508] transition hover:brightness-110 active:brightness-95",
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <Sparkles size={14} strokeWidth={2.2} aria-hidden />
                      GET PRO
                    </span>
                  </Link>
                ) : (
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
                )}
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
          {overlayEntry ? (
            <p
              className={[
                nameOxanium.className,
                "mt-2 text-center text-[10px] font-bold tracking-[0.06em] text-white/40",
              ].join(" ")}
            >
              {formatProSkinOwnerCount(ownerCounts[overlayEntry.id] ?? 0, "ja")}
            </p>
          ) : null}
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
        {isProduction && !statusReady ? (
          <p className="py-10 text-center text-sm text-white/45">読み込み中…</p>
        ) : (
          catalogGrid
        )}
      </div>

      {overlayMounted && confirmOverlay
        ? createPortal(confirmOverlay, document.body)
        : null}
    </Root>
  );
}
