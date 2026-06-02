"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Language } from "@/lib/i18n/language";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import { jp } from "@/lib/fonts";
import { toast } from "@/app/component/ui/toast";
import {
  COMMUNITY_LEAGUES,
  COMMUNITY_METRICS,
  type CommunityLeague,
  type CommunityMetric,
} from "@/lib/communities/types";
import { leagueLabel, metricLabel } from "@/lib/communities/labels";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";

async function authHeader(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  const token = await u.getIdToken();
  return `Bearer ${token}`;
}

export type CreatedGroupPayload = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  headerImageUrl: string | null;
  rankingMetric: CommunityMetric;
  periodType: "from_now";
  rankingLeague: CommunityLeague;
  role: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  language: Language;
  onCreated: (
    group?: CreatedGroupPayload | null,
    inviteCode?: string
  ) => void;
};

export default function CreateGroupModal({
  open,
  onClose,
  language,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [metric, setMetric] = useState<CommunityMetric>("totalPoints");
  const [league, setLeague] = useState<CommunityLeague>("all");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) return;
    submitLockRef.current = false;
    setBusy(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const prevPaddingRight = document.body.style.paddingRight;

    const scrollbarGap =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      document.body.style.paddingRight = prevPaddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const focusFieldWithoutPageJump = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      requestAnimationFrame(() => {
        e.target.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
    },
    []
  );

  const t = useMemo(
    () =>
      language === "en"
        ? {
            title: "Create a group",
            name: "Group name",
            description: "Description (optional)",
            descriptionPh:
              "e.g. Weekend picks with friends — share the invite code to join",
            header: "Header image",
            metric: "Compete on",
            league: "League",
            scoringNote:
              "Scores count from the day this group is created (JST). Past results are not included.",
            cancel: "Cancel",
            submit: "Create",
            streakNote:
              "Win streak uses your account-wide streak, not only from group start.",
          }
        : {
            title: "グループを作成",
            name: "グループ名",
            description: "説明（任意）",
            descriptionPh:
              "例：仲間とのNBA予想ランキング。招待コードで参加できます",
            header: "ヘッダー画像",
            metric: "競う項目",
            league: "リーグ",
            scoringNote:
              "グループ作成日（JST）以降の予想だけが集計されます。過去の成績は含みません。",
            cancel: "キャンセル",
            submit: "作成",
            streakNote:
              "連勝はアカウント全体の累計です（グループ開始日以降だけにはなりません）。",
          },
    [language]
  );

  const onPickFile = useCallback((f: File | null) => {
    setHeaderFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }, []);

  const closeReset = useCallback(() => {
    if (submitLockRef.current) return;
    setName("");
    setDescription("");
    setHeaderFile(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMetric("totalPoints");
    setLeague("all");
    onClose();
  }, [onClose]);

  const releaseSubmitLock = useCallback(() => {
    submitLockRef.current = false;
    setBusy(false);
  }, []);

  const onSubmit = useCallback(async () => {
    if (submitLockRef.current) return;

    const n = name.trim();
    if (n.length < 1) return;

    submitLockRef.current = true;
    setBusy(true);

    const h = await authHeader();
    if (!h) {
      releaseSubmitLock();
      return;
    }

    let headerImageUrl: string | null = null;
    const u = auth.currentUser;
    if (headerFile && u) {
      try {
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const ext = headerFile.name.split(".").pop() || "jpg";
        const fileRef = ref(
          storage,
          `community_headers/${u.uid}/${id}.${ext}`
        );
        await uploadBytes(fileRef, headerFile, {
          contentType: headerFile.type || "image/jpeg",
        });
        headerImageUrl = await getDownloadURL(fileRef);
      } catch {
        toast.error(
          language === "en"
            ? "Image upload failed."
            : "画像のアップロードに失敗しました。"
        );
        releaseSubmitLock();
        return;
      }
    }

    try {
      const res = await fetch("/api/communities/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: h },
        body: JSON.stringify({
          name: n,
          description: description.trim() || null,
          headerImageUrl,
          rankingMetric: metric,
          periodType: "from_now",
          rankingLeague: league,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        if (json?.error === "owned_group_limit") {
          const max = Number(json?.maxOwned ?? 0);
          const cur = Number(json?.owned ?? max);
          toast.error(
            language === "en"
              ? max > 0
                ? `You’ve reached the group ownership limit (${cur}/${max} active). End an existing group or upgrade to Pro.`
                : "You’ve reached the group ownership limit."
              : max > 0
                ? `作成できるグループ数の上限です（運用中 ${cur}/${max}）。終了したグループは枠に含まれません。`
                : "作成できるグループ数の上限に達しています。"
          );
        } else {
          toast.error(String(json?.error ?? "error"));
        }
        releaseSubmitLock();
        return;
      }
      const inv = String(json.inviteCode ?? "");
      const created = json.group as CreatedGroupPayload | undefined;
      const payload: CreatedGroupPayload = created?.id
        ? {
            ...created,
            periodType: "from_now",
            role: created.role ?? "owner",
          }
        : {
            id: String(json.groupId ?? ""),
            name: n,
            description: description.trim() || null,
            memberCount: 1,
            headerImageUrl,
            rankingMetric: metric,
            periodType: "from_now",
            rankingLeague: league,
            role: "owner",
          };
      onCreated(payload, inv || undefined);
      setName("");
      setDescription("");
      setHeaderFile(null);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setMetric("totalPoints");
      setLeague("all");
      onClose();
    } catch {
      releaseSubmitLock();
      toast.error(language === "en" ? "Create failed." : "作成に失敗しました。");
    }
  }, [
    name,
    description,
    headerFile,
    metric,
    league,
    language,
    onCreated,
    onClose,
    releaseSubmitLock,
  ]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000020] overflow-hidden overscroll-none"
      role="dialog"
      aria-modal
    >
      <button
        type="button"
        aria-label={language === "en" ? "Close" : "閉じる"}
        onClick={closeReset}
        disabled={busy}
        className="absolute inset-0 bg-transparent backdrop-blur-md disabled:pointer-events-none"
      />
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-3 pb-[max(0.75rem,var(--bottom-nav-clearance))] sm:p-4">
        <div
          className={`pointer-events-auto relative isolate flex h-[min(34rem,calc(100svh-var(--bottom-nav-clearance)-1.5rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0c1419]/95 shadow-[0_18px_44px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:h-[min(34rem,calc(100svh-2rem))] lg:max-w-5xl ${jp.className}`}
          style={{ touchAction: "manipulation" }}
          onClick={(e) => e.stopPropagation()}
        >
          <ShellGridOverlay />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-white/10 px-4 py-3">
            <h2 className="text-lg font-bold text-white">{t.title}</h2>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] px-4 py-3">
            <div className="space-y-3">
          <label className="block text-xs text-white/55">{t.name}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={focusFieldWithoutPageJump}
            maxLength={60}
            autoComplete="off"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-base text-white"
          />

          <label className="block text-xs text-white/55">{t.description}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={focusFieldWithoutPageJump}
            maxLength={280}
            rows={3}
            placeholder={t.descriptionPh}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-base leading-relaxed text-white placeholder:text-sm placeholder:leading-snug placeholder:text-white/30"
          />

          <label className="block text-xs text-white/55">{t.header}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            className="text-xs text-white/70 file:mr-2 file:rounded-lg file:border-0 file:bg-white/10 file:px-2 file:py-1"
          />
          {preview && (
            <div className="aspect-square w-full max-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-cyan-200/75">
            {t.scoringNote}
          </p>

          <label className="block text-xs text-white/55">{t.league}</label>
          <select
            value={league}
            onChange={(e) => setLeague(e.target.value as CommunityLeague)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            {COMMUNITY_LEAGUES.map((k) => (
              <option key={k} value={k}>
                {leagueLabel(k, language)}
              </option>
            ))}
          </select>

          <label className="block text-xs text-white/55">{t.metric}</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as CommunityMetric)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            {COMMUNITY_METRICS.map((k) => (
              <option key={k} value={k}>
                {metricLabel(k, language)}
              </option>
            ))}
          </select>

          {metric === "activeWinStreak" && (
            <p className="text-[11px] text-amber-200/80">{t.streakNote}</p>
          )}
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-white/10 px-4 py-3">
            <button
              type="button"
              onClick={closeReset}
              disabled={busy}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              disabled={busy || name.trim().length < 1}
              onClick={onSubmit}
              aria-busy={busy}
              className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? language === "en"
                  ? "Creating…"
                  : "作成中…"
                : t.submit}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
