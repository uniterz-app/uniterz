"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
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
import {
  FREE_MAX_MEMBERSHIPS,
  FREE_MAX_OWNED_GROUPS,
  PRO_MAX_MEMBERSHIPS,
  PRO_MAX_OWNED_GROUPS,
} from "@/lib/communities/limitValues";
import CommunityTeamPicker from "@/app/component/communities/CommunityTeamPicker";
import {
  communityCrtMono,
  communityCrtPanelStyle,
} from "@/app/component/communities/CommunityCrtTheme";
import { useScheduleTeams } from "@/lib/games/useScheduleTeams";
import { LEAGUES, type League } from "@/lib/leagues";

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
  rankingTeamIds: string[];
  role: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  language: Language;
  variant?: "web" | "mobile";
  onCreated: (
    group?: CreatedGroupPayload | null,
    inviteCode?: string
  ) => void;
};

export default function CreateGroupModal({
  open,
  onClose,
  language,
  variant = "mobile",
  onCreated,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [metric, setMetric] = useState<CommunityMetric>("totalPoints");
  const [league, setLeague] = useState<CommunityLeague>("all");
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const submitLockRef = useRef(false);
  const isWeb = variant === "web";
  const reduceMotion = useReducedMotion();
  const scheduleLeague: League =
    league === "all" ? LEAGUES.NBA : (league as League);
  const { teams } = useScheduleTeams(scheduleLeague);
  const showTeamPicker = league !== "all";

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
            teams: "Target teams",
            scoringNote:
              "Scores count from the day this group is created (JST). Past results are not included.",
            cancel: "Cancel",
            submit: "Create",
            streakNote:
              "Win streak uses your account-wide streak, not only from group start.",
            planLimits: `Plan limits: Free users can create up to ${FREE_MAX_OWNED_GROUPS} groups and join up to ${FREE_MAX_MEMBERSHIPS} groups. Pro users can create up to ${PRO_MAX_OWNED_GROUPS} groups and join up to ${PRO_MAX_MEMBERSHIPS} groups.`,
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
            teams: "対象チーム",
            scoringNote:
              "グループ作成日（JST）以降の予想だけが集計されます。過去の成績は含みません。",
            cancel: "キャンセル",
            submit: "作成",
            streakNote:
              "連勝はアカウント全体の累計です（グループ開始日以降だけにはなりません）。",
            planLimits: `プラン上限: Free はグループを最大 ${FREE_MAX_OWNED_GROUPS} 件まで作成でき、最大 ${FREE_MAX_MEMBERSHIPS} 件まで参加できます。Pro はグループを最大 ${PRO_MAX_OWNED_GROUPS} 件まで作成でき、最大 ${PRO_MAX_MEMBERSHIPS} 件まで参加できます。`,
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
    setTeamIds([]);
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
          rankingTeamIds: teamIds,
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
            rankingTeamIds: teamIds,
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
      setTeamIds([]);
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
    teamIds,
    language,
    onCreated,
    onClose,
    releaseSubmitLock,
  ]);

  if (!open || !mounted) return null;

  const fieldClass = [
    "w-full rounded-none border border-white/12 bg-black/40 text-cyan-50/90",
    "focus:border-cyan-400/25 focus:outline-none focus:ring-1 focus:ring-cyan-400/12",
    isWeb ? "px-3 py-2.5 text-base" : "px-2.5 py-2 text-sm",
  ].join(" ");

  const labelClass = [
    "block font-medium uppercase tracking-[0.14em] text-white/50",
    isWeb ? "text-xs" : "text-[10px]",
  ].join(" ");

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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm disabled:pointer-events-none"
      />
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-3 pb-[max(0.75rem,var(--bottom-nav-clearance))] sm:p-4">
        <div
          className={[
            "pointer-events-auto relative isolate flex w-full flex-col overflow-hidden border",
            "h-[min(34rem,calc(100svh-var(--bottom-nav-clearance)-1.5rem))] sm:h-[min(34rem,calc(100svh-2rem))]",
            isWeb ? "max-w-2xl" : "max-w-md",
            communityCrtMono.className,
            jp.className,
          ].join(" ")}
          style={{
            ...communityCrtPanelStyle("subtle"),
            boxShadow: "0 14px 36px rgba(0,0,0,0.48)",
            touchAction: "manipulation",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div
            className={[
              "shrink-0 border-b border-white/10",
              isWeb ? "px-6 py-4" : "px-4 py-3",
            ].join(" ")}
          >
            <h2
              className={[
                "font-bold tracking-[0.04em] text-cyan-50/95",
                isWeb ? "text-xl" : "text-base",
              ].join(" ")}
            >
              {t.title}
            </h2>
            <p
              className={[
                "mt-2 leading-relaxed text-white/40",
                isWeb ? "text-xs" : "text-[10px]",
              ].join(" ")}
            >
              {t.planLimits}
            </p>
          </div>

          <div
            className={[
              "min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]",
              isWeb ? "px-6 py-4" : "px-4 py-3",
            ].join(" ")}
          >
            <div className={isWeb ? "space-y-4" : "space-y-2.5"}>
          <label className={labelClass}>{t.name}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={focusFieldWithoutPageJump}
            maxLength={60}
            autoComplete="off"
            className={fieldClass}
          />

          <label className={labelClass}>{t.description}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={focusFieldWithoutPageJump}
            maxLength={280}
            rows={isWeb ? 4 : 3}
            placeholder={t.descriptionPh}
            className={[
              fieldClass,
              "resize-none leading-relaxed placeholder:text-white/30",
              isWeb ? "placeholder:text-sm" : "placeholder:text-xs",
            ].join(" ")}
          />

          <label className={labelClass}>{t.header}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            className={[
              "text-cyan-100/60 file:mr-2 file:rounded-none file:border file:border-white/12 file:bg-white/5 file:px-2 file:py-1 file:text-cyan-100/80",
              isWeb ? "text-sm file:text-sm" : "text-xs",
            ].join(" ")}
          />
          {preview && (
            <div
              className={[
                "aspect-square w-full overflow-hidden border border-white/10 bg-black/35",
                isWeb ? "max-w-[200px]" : "max-w-[120px]",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <p
            className={[
              "leading-relaxed text-white/45",
              isWeb ? "text-xs" : "text-[10px]",
            ].join(" ")}
          >
            {t.scoringNote}
          </p>

          <label className={labelClass}>{t.league}</label>
          <select
            value={league}
            onChange={(e) => {
              setLeague(e.target.value as CommunityLeague);
              setTeamIds([]);
            }}
            className={fieldClass}
          >
            {COMMUNITY_LEAGUES.map((k) => (
              <option key={k} value={k}>
                {leagueLabel(k, language)}
              </option>
            ))}
          </select>

          {showTeamPicker && (
            <>
              <label className={labelClass}>{t.teams}</label>
              <CommunityTeamPicker
                teams={teams}
                selectedIds={teamIds}
                onChange={setTeamIds}
                language={language}
                isWeb={isWeb}
              />
            </>
          )}

          <label className={labelClass}>{t.metric}</label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as CommunityMetric)}
            className={fieldClass}
          >
            {COMMUNITY_METRICS.map((k) => (
              <option key={k} value={k}>
                {metricLabel(k, language)}
              </option>
            ))}
          </select>

          {metric === "activeWinStreak" && (
            <p
              className={[
                "text-white/55",
                isWeb ? "text-xs" : "text-[10px]",
              ].join(" ")}
            >
              {t.streakNote}
            </p>
          )}
            </div>
          </div>

          <div
            className={[
              "flex shrink-0 justify-end gap-2 border-t border-white/10",
              isWeb ? "px-6 py-4" : "px-4 py-3",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={closeReset}
              disabled={busy}
              className={[
                "rounded-none border border-white/12 text-white/65 disabled:cursor-not-allowed disabled:opacity-40",
                isWeb ? "px-5 py-2.5 text-sm" : "px-4 py-2 text-xs",
              ].join(" ")}
            >
              {t.cancel}
            </button>
            <motion.button
              type="button"
              disabled={busy || name.trim().length < 1}
              onClick={onSubmit}
              aria-busy={busy}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={{ duration: 0.1 }}
              className={[
                "rounded-none border border-cyan-400/28 bg-cyan-500/14 font-semibold text-cyan-50/95",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isWeb ? "px-5 py-2.5 text-sm" : "px-4 py-2 text-xs",
              ].join(" ")}
            >
              {busy
                ? language === "en"
                  ? "Creating…"
                  : "作成中…"
                : t.submit}
            </motion.button>
          </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
