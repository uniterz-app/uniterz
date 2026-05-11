"use client";

import { useCallback, useMemo, useState } from "react";
import type { Language } from "@/lib/i18n/language";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import { jp } from "@/lib/fonts";
import { toast } from "@/app/component/ui/toast";
import {
  COMMUNITY_METRICS,
  COMMUNITY_PERIODS,
  type CommunityMetric,
  type CommunityPeriodType,
  normalizeRankingForPeriod,
} from "@/lib/communities/types";
import { metricLabel, periodLabel } from "@/lib/communities/labels";

async function authHeader(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  const token = await u.getIdToken();
  return `Bearer ${token}`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  language: Language;
  onCreated: () => void;
};

export default function CreateGroupModal({
  open,
  onClose,
  language,
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [metric, setMetric] = useState<CommunityMetric>("totalPoints");
  const [period, setPeriod] = useState<CommunityPeriodType>("all_time");
  const [busy, setBusy] = useState(false);

  const t = useMemo(
    () =>
      language === "en"
        ? {
            title: "Create a group",
            name: "Group name",
            header: "Header image",
            metric: "Compete on",
            period: "Period",
            cancel: "Cancel",
            submit: "Create",
            streakNote:
              "Win streak uses all-time data even if you pick another period.",
          }
        : {
            title: "グループを作成",
            name: "グループ名",
            header: "ヘッダー画像",
            metric: "競う項目",
            period: "期間",
            cancel: "キャンセル",
            submit: "作成",
            streakNote:
              "連勝は累計の値を使います（期間設定と組み合わせない場合があります）。",
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
    setName("");
    setHeaderFile(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMetric("totalPoints");
    setPeriod("all_time");
    onClose();
  }, [onClose]);

  const onSubmit = useCallback(async () => {
    const n = name.trim();
    if (n.length < 1) return;
    const h = await authHeader();
    if (!h) return;

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
        return;
      }
    }

    let m = metric;
    let p = period;
    ({ metric: m, period: p } = normalizeRankingForPeriod(m, p));

    setBusy(true);
    try {
      const res = await fetch("/api/communities/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: h },
        body: JSON.stringify({
          name: n,
          headerImageUrl,
          rankingMetric: m,
          periodType: p,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        if (json?.error === "owned_group_limit") {
          toast.error(
            language === "en"
              ? "You’ve reached the group ownership limit."
              : "作成できるグループ数の上限に達しています。"
          );
        } else {
          toast.error(String(json?.error ?? "error"));
        }
        return;
      }
      const inv = String(json.inviteCode ?? "");
      toast.success(
        language === "en"
          ? `Created. Invite code: ${inv}`
          : `作成しました。招待コード: ${inv}`
      );
      try {
        await navigator.clipboard.writeText(inv);
        toast.info(
          language === "en" ? "Code copied." : "招待コードをコピーしました。"
        );
      } catch {
        /* ignore */
      }
      onCreated();
      closeReset();
    } finally {
      setBusy(false);
    }
  }, [
    name,
    headerFile,
    metric,
    period,
    language,
    onCreated,
    closeReset,
  ]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-black/70 p-3 sm:items-center"
      role="dialog"
      aria-modal
      onClick={(e) => {
        if (e.target === e.currentTarget) closeReset();
      }}
    >
      <div
        className={`max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/15 bg-[#0c1419] p-4 shadow-xl ${jp.className}`}
      >
        <h2 className="mb-3 text-lg font-bold text-white">{t.title}</h2>

        <div className="space-y-3">
          <label className="block text-xs text-white/55">{t.name}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
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

          <label className="block text-xs text-white/55">{t.period}</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as CommunityPeriodType)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            {COMMUNITY_PERIODS.map((k) => (
              <option key={k} value={k}>
                {periodLabel(k, language)}
              </option>
            ))}
          </select>
          {metric === "activeWinStreak" && (
            <p className="text-[11px] text-amber-200/80">{t.streakNote}</p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={closeReset}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={busy || name.trim().length < 1}
            onClick={onSubmit}
            className="rounded-xl border border-cyan-300/30 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-40"
          >
            {busy ? "…" : t.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
