"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, ImagePlus, Menu, MoveVertical, Trash2 } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import type { Language } from "@/lib/i18n/language";
import { prefetchCommunityHeaderImage } from "@/lib/communities/prefetchCommunityHeaderImage";
import { patchCommunityGroup } from "@/lib/communities/patchCommunityGroup";
import {
  DEFAULT_HEADER_IMAGE_POSITION_Y,
  headerImageObjectPosition,
  sanitizeHeaderImagePositionY,
} from "@/lib/communities/headerImagePosition";
import { toast } from "@/app/component/ui/toast";

export type CommunityGroupHeaderImagePatch = {
  headerImageUrl?: string | null;
  headerImagePositionY?: number;
};

type Props = {
  groupId: string;
  language: Language;
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  headerImagePositionY: number;
  editable: boolean;
  layout?: "card" | "hero";
  onEditingChange?: (editing: boolean) => void;
  onUpdated: (patch: CommunityGroupHeaderImagePatch) => void;
};

type PendingUpload = {
  file: File | null;
  previewUrl: string;
  positionY: number;
  repositionOnly: boolean;
};

async function authHeader(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  return `Bearer ${await u.getIdToken()}`;
}

/** Native `CommunityGroupHeaderImageNative` 相当 */
export default function CommunityGroupHeaderImage({
  groupId,
  language,
  name,
  description,
  headerImageUrl,
  headerImagePositionY,
  editable,
  layout = "card",
  onEditingChange,
  onUpdated,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ y: number; startPos: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState<PendingUpload | null>(null);

  const savedPositionY = sanitizeHeaderImagePositionY(headerImagePositionY);
  const isHero = layout === "hero";

  useEffect(() => {
    if (headerImageUrl) prefetchCommunityHeaderImage(headerImageUrl);
  }, [headerImageUrl]);

  useEffect(() => {
    onEditingChange?.(Boolean(pending));
  }, [pending, onEditingChange]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      if (pending?.previewUrl && pending.file) {
        URL.revokeObjectURL(pending.previewUrl);
      }
    };
  }, [pending?.previewUrl, pending?.file]);

  const t = useMemo(
    () =>
      language === "en"
        ? {
            add: "Add image",
            change: "Change image",
            remove: "Remove image",
            reposition: "Drag to reposition",
            repositionMenu: "Adjust position",
            apply: "Apply",
            cancel: "Cancel",
            saved: "Image updated.",
            removed: "Image removed.",
            failed: "Update failed.",
            uploadFailed: "Image upload failed.",
            confirmRemove: "Remove header image?",
          }
        : {
            add: "画像を追加",
            change: "画像を変更",
            remove: "画像を削除",
            reposition: "ドラッグして位置を調整",
            repositionMenu: "位置を調整",
            apply: "適用",
            cancel: "キャンセル",
            saved: "画像を更新しました。",
            removed: "画像を削除しました。",
            failed: "更新に失敗しました。",
            uploadFailed: "画像のアップロードに失敗しました。",
            confirmRemove: "ヘッダー画像を削除しますか？",
          },
    [language]
  );

  const commitPatch = useCallback(
    async (patch: CommunityGroupHeaderImagePatch, toastKey?: "image" | "remove") => {
      const h = await authHeader();
      if (!h) return false;
      const result = await patchCommunityGroup(groupId, h, {
        name,
        description,
        ...patch,
      });
      if (!result.ok) {
        toast.error(result.error || t.failed);
        return false;
      }
      onUpdated({
        headerImageUrl: result.group.headerImageUrl,
        headerImagePositionY: result.group.headerImagePositionY,
      });
      if (toastKey === "remove") toast.info(t.removed);
      else if (toastKey === "image") toast.info(t.saved);
      return true;
    },
    [groupId, name, description, onUpdated, t]
  );

  const applyPatch = useCallback(
    async (patch: CommunityGroupHeaderImagePatch, toastKey?: "image" | "remove") => {
      if (busy) return false;
      setBusy(true);
      try {
        return await commitPatch(patch, toastKey);
      } finally {
        setBusy(false);
      }
    },
    [busy, commitPatch]
  );

  const clearPending = useCallback(() => {
    setPending((prev) => {
      if (prev?.previewUrl && prev.file) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  const startPending = useCallback((file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setPending({
      file,
      previewUrl,
      positionY: DEFAULT_HEADER_IMAGE_POSITION_Y,
      repositionOnly: false,
    });
    setMenuOpen(false);
  }, []);

  const startReposition = useCallback(() => {
    if (!headerImageUrl || !editable) return;
    setPending({
      file: null,
      previewUrl: headerImageUrl,
      positionY: savedPositionY,
      repositionOnly: true,
    });
    setMenuOpen(false);
  }, [editable, headerImageUrl, savedPositionY]);

  const onFileChange = useCallback(
    (file: File | null) => {
      if (!file || !editable || busy) return;
      startPending(file);
    },
    [editable, busy, startPending]
  );

  const applyPending = useCallback(async () => {
    if (!pending || busy) return;
    if (pending.repositionOnly) {
      setBusy(true);
      try {
        const positionY = sanitizeHeaderImagePositionY(pending.positionY);
        const ok = await commitPatch({ headerImagePositionY: positionY }, "image");
        if (ok) clearPending();
      } finally {
        setBusy(false);
      }
      return;
    }
    const u = auth.currentUser;
    if (!u || !pending.file) return;
    setBusy(true);
    try {
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const ext = pending.file.name.split(".").pop() || "jpg";
      const fileRef = ref(storage, `community_headers/${u.uid}/${id}.${ext}`);
      await uploadBytes(fileRef, pending.file, {
        contentType: pending.file.type || "image/jpeg",
      });
      const url = await getDownloadURL(fileRef);
      const positionY = sanitizeHeaderImagePositionY(pending.positionY);
      const ok = await commitPatch({ headerImageUrl: url, headerImagePositionY: positionY }, "image");
      if (ok) clearPending();
    } catch {
      toast.error(t.uploadFailed);
    } finally {
      setBusy(false);
    }
  }, [pending, busy, commitPatch, clearPending, t]);

  const onRemove = useCallback(() => {
    if (!editable || busy || !headerImageUrl) return;
    if (!window.confirm(t.confirmRemove)) return;
    void applyPatch(
      { headerImageUrl: null, headerImagePositionY: DEFAULT_HEADER_IMAGE_POSITION_Y },
      "remove"
    );
  }, [editable, busy, headerImageUrl, t, applyPatch]);

  const setPendingPosition = useCallback((nextY: number) => {
    const y = sanitizeHeaderImagePositionY(nextY);
    setPending((prev) => (prev ? { ...prev, positionY: y } : prev));
  }, []);

  const onBannerPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pending || busy) return;
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;
      dragRef.current = { y: e.clientY, startPos: pending.positionY };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [pending, busy]
  );

  const onBannerPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current || !bannerRef.current) return;
      const h = bannerRef.current.clientHeight || 1;
      const deltaY = e.clientY - dragRef.current.y;
      setPendingPosition(dragRef.current.startPos - (deltaY / h) * 100);
    },
    [setPendingPosition]
  );

  const onBannerPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  if (!editable && !headerImageUrl) return null;

  const bannerClass = isHero
    ? "relative h-full w-full cursor-grab overflow-hidden active:cursor-grabbing"
    : "relative h-36 w-full cursor-grab overflow-hidden rounded-lg active:cursor-grabbing sm:h-44";

  const renderEditor = (previewUrl: string, positionY: number) => (
    <div
      className={[
        isHero ? "absolute inset-0 z-[8] flex flex-col" : "mb-3 flex flex-col",
      ].join(" ")}
    >
      <div
        ref={bannerRef}
        className={[
          bannerClass,
          isHero ? "min-h-0 flex-1" : "",
          "touch-none",
        ].join(" ")}
        style={{ touchAction: "none" }}
        onPointerDown={onBannerPointerDown}
        onPointerMove={onBannerPointerMove}
        onPointerUp={onBannerPointerUp}
        onPointerCancel={onBannerPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt=""
          className="pointer-events-none h-full w-full select-none object-cover"
          style={{ objectPosition: headerImageObjectPosition(positionY) }}
          draggable={false}
        />
        <div
          className={
            isHero
              ? "pointer-events-none absolute inset-0 bg-linear-to-t from-black/35 via-transparent to-transparent"
              : "pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/12 to-black/18"
          }
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-2">
          <span className="rounded-full border border-white/16 bg-black/45 px-2.5 py-1 text-[10px] font-medium text-white/82">
            {t.reposition}
          </span>
        </div>
      </div>
      <div
        className="relative z-20 flex shrink-0 gap-2 border-t border-white/10 bg-black/62 p-2 backdrop-blur-md"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={busy}
          onClick={clearPending}
          className="flex-1 border border-white/16 px-3 py-2 text-[11px] font-semibold text-white/78 disabled:opacity-60"
        >
          {t.cancel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void applyPending()}
          className="flex-1 border border-cyan-300/45 bg-cyan-400/18 px-3 py-2 text-[11px] font-semibold text-cyan-50/95 disabled:opacity-60"
        >
          {busy ? "…" : t.apply}
        </button>
      </div>
    </div>
  );

  const renderBanner = (url: string, positionY: number, showMenu: boolean) => (
    <div className={isHero ? "absolute inset-0" : "mb-3"}>
      <div
        className={
          isHero
            ? "relative h-full w-full overflow-hidden"
            : "relative h-36 w-full overflow-hidden rounded-lg sm:h-44"
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: headerImageObjectPosition(positionY) }}
          loading={isHero ? "eager" : "lazy"}
          fetchPriority={isHero ? "high" : "auto"}
          decoding="async"
        />
        {!isHero ? (
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/45 via-black/10 to-transparent" />
        ) : null}
        {showMenu ? (
          <div ref={menuRef} className={isHero ? "absolute right-3 top-3" : "absolute bottom-2 right-2"}>
            <button
              type="button"
              disabled={busy}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center border border-white/18 bg-black/55 text-cyan-50/95 disabled:opacity-60"
              aria-label={language === "en" ? "Image menu" : "画像メニュー"}
              aria-expanded={menuOpen}
            >
              {busy ? (
                <span className="text-[10px]">…</span>
              ) : (
                <Menu className="h-4 w-4" aria-hidden />
              )}
            </button>
            {menuOpen ? (
              <div
                className={[
                  "absolute right-0 z-20 min-w-[132px] overflow-hidden border border-white/14 bg-[rgba(8,12,24,0.94)] shadow-[0_10px_28px_rgba(0,0,0,0.45)]",
                  isHero ? "top-full mt-1.5" : "bottom-full mb-1.5",
                ].join(" ")}
              >
                <button
                  type="button"
                  disabled={busy}
                  onClick={startReposition}
                  className="flex w-full items-center gap-2 border-b border-white/8 px-3 py-2.5 text-left text-[11px] font-semibold text-cyan-50/95 hover:bg-white/5 disabled:opacity-60"
                >
                  <MoveVertical className="h-3.5 w-3.5" aria-hidden />
                  {t.repositionMenu}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                  className="flex w-full items-center gap-2 border-b border-white/8 px-3 py-2.5 text-left text-[11px] font-semibold text-cyan-50/95 hover:bg-white/5 disabled:opacity-60"
                >
                  <Camera className="h-3.5 w-3.5" aria-hidden />
                  {t.change}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setMenuOpen(false);
                    onRemove();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[11px] font-semibold text-red-200/90 hover:bg-red-950/35 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  {t.remove}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          e.target.value = "";
          onFileChange(file);
        }}
      />

      {pending
        ? renderEditor(pending.previewUrl, pending.positionY)
        : !headerImageUrl
          ? (
            <button
              type="button"
              disabled={!editable || busy}
              onClick={() => inputRef.current?.click()}
              className={[
                "flex w-full flex-col items-center justify-center gap-1.5 text-cyan-200/62 disabled:opacity-60",
                isHero
                  ? "absolute inset-0 h-full border-0 bg-[rgba(8,14,28,0.55)]"
                  : "mb-3 h-[120px] rounded-lg border border-dashed border-cyan-400/28 bg-cyan-500/[0.04]",
              ].join(" ")}
            >
              <ImagePlus className="h-5 w-5" aria-hidden />
              <span className="text-xs font-semibold">{busy ? "…" : t.add}</span>
            </button>
          )
          : renderBanner(headerImageUrl, savedPositionY, editable)}
    </>
  );
}
