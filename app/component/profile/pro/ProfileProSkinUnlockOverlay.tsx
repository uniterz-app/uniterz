"use client";

/**
 * プロフィール復帰時の Pro Skin マイルストーン解放オーバーレイ。
 * 実際のスキン模様を1枚ヒーロー表示する。
 */
import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import {
  formatProSkinOwnerCount,
  formatProSkinUnlockCondition,
  getProSkinUnlockEntry,
} from "@/lib/profile/proSkinUnlock";
import { resolveProSkinUnlockNoticeEntries } from "@/lib/profile/proSkinUnlockNotice";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_CLASS } from "@/lib/profile/profilePlanVisual";
import ProfilePlanProBackgroundFx from "@/app/component/profile/ui/ProfilePlanProBackgroundFx";
import { saveMeProSkin } from "@/lib/api/saveMeProSkin";
import "@/app/component/profile/pro/profilePlanProBgPickerPreview.css";

type Props = {
  unlockedIds: readonly ProfilePlanProBgVariant[];
  language?: "ja" | "en";
  preview?: boolean;
  platform?: "mobile" | "web";
  ownerCounts?: Record<string, number>;
  onDismiss: () => void;
  /** 適用成功後（プロフィールの見た目更新など） */
  onApplied?: (id: ProfilePlanProBgVariant) => void;
  inline?: boolean;
};

export default function ProfileProSkinUnlockOverlay({
  unlockedIds,
  language = "ja",
  preview = false,
  platform = "mobile",
  ownerCounts = {},
  onDismiss,
  onApplied,
  inline = false,
}: Props) {
  const isJa = language === "ja";
  const router = useRouter();
  const entries = resolveProSkinUnlockNoticeEntries(unlockedIds);
  const featured = entries[0] ?? null;
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!featured) return null;

  const moreCount = Math.max(0, entries.length - 1);
  const owners = ownerCounts[featured.id] ?? 0;
  const profileHref = platform === "web" ? "/web/mypage" : "/mobile/mypage";

  async function handleApply() {
    if (applying) return;
    setError(null);

    if (preview) {
      onDismiss();
      return;
    }

    setApplying(true);
    try {
      await saveMeProSkin(featured!.id);
      onApplied?.(featured!.id);
      onDismiss();
      router.push(profileHref);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : isJa
            ? "適用に失敗しました"
            : "Failed to apply"
      );
    } finally {
      setApplying(false);
    }
  }

  const panel = (
    <div
      className={
        inline
          ? "relative flex min-h-[78vh] items-center justify-center bg-[#03080d] px-3 py-8"
          : "fixed inset-0 z-[130] flex items-center justify-center px-3"
      }
      role="dialog"
      aria-modal="true"
      aria-label={isJa ? "スキン解放" : "Skin unlocked"}
    >
      {!inline ? (
        <button
          type="button"
          className="absolute inset-0 bg-black/78 backdrop-blur-[2px]"
          aria-label={isJa ? "閉じる" : "Close"}
          onClick={onDismiss}
          disabled={applying}
        />
      ) : null}

      <div className="relative z-[1] w-full max-w-[340px] overflow-hidden border border-cyan-400/40 bg-[#050b14] shadow-[0_0_48px_rgba(0,245,255,0.2)]">
        <div
          className={[
            "relative aspect-[3/4] w-full overflow-hidden",
            PROFILE_PLAN_PRO_CLASS,
            "profile-kinetik-panel",
          ].join(" ")}
        >
          <ProfilePlanProBackgroundFx
            variant={featured.id}
            animate
            mobileBoost
            accentReady
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#050b14] via-[#050b14]/85 to-transparent"
            aria-hidden
          />

          <div className="absolute inset-x-0 top-6 flex justify-center px-3">
            <div className="rounded border border-cyan-300/35 bg-black/45 px-2.5 py-1 backdrop-blur-sm">
              <p
                className={[
                  nameOxanium.className,
                  "text-[9px] font-extrabold uppercase tracking-[0.2em] text-cyan-200",
                ].join(" ")}
              >
                SKIN UNLOCKED
              </p>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-8">
            <p
              className={[
                nameRajdhani.className,
                "text-[22px] font-bold leading-tight text-white",
              ].join(" ")}
            >
              {featured.label}
              {featured.tag ? (
                <span className="ml-2 text-[14px] font-semibold text-white/50">
                  {featured.tag}
                </span>
              ) : null}
            </p>
            <p
              className={[
                nameOxanium.className,
                "mt-1.5 text-[12px] font-bold tracking-[0.05em] text-cyan-100/85",
              ].join(" ")}
            >
              {formatProSkinUnlockCondition(featured.unlock, language)}
              <span className="mx-1.5 text-white/25">·</span>
              {formatProSkinOwnerCount(owners, language)}
            </p>
            {moreCount > 0 ? (
              <p className="mt-1.5 text-[11px] text-white/45">
                {isJa
                  ? `ほか ${moreCount} 件も解放`
                  : `+${moreCount} more unlocked`}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2 px-4 py-4">
          {error ? (
            <p className="text-center text-[11px] text-red-300/90">{error}</p>
          ) : null}
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={applying}
            className={[
              nameOxanium.className,
              "flex w-full items-center justify-center border-2 border-[#00F5FF] bg-[#00F5FF] py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#050508] disabled:opacity-60",
            ].join(" ")}
          >
            {applying
              ? isJa
                ? "適用中…"
                : "Applying…"
              : isJa
                ? "適用する"
                : "Apply"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={applying}
            className={[
              nameOxanium.className,
              "w-full border border-white/15 bg-white/5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/75 transition hover:bg-white/10 disabled:opacity-60",
            ].join(" ")}
          >
            {isJa ? "とじる" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );

  if (inline) return panel;
  if (typeof document === "undefined") return null;
  return createPortal(panel, document.body);
}

export function featuredProSkinUnlockId(
  unlockedIds: readonly ProfilePlanProBgVariant[]
): ProfilePlanProBgVariant | null {
  const entry = getProSkinUnlockEntry(unlockedIds[0] ?? "");
  return entry && entry.unlock.kind !== "pro" ? entry.id : null;
}
