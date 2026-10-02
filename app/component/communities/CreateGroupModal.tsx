"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import type { Language } from "@/lib/i18n/language";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import { jp, nameOxanium } from "@/lib/fonts";
import { toast } from "@/app/component/ui/toast";
import {
  COMMUNITY_CREATE_LEAGUES,
  COMMUNITY_CREATE_METRICS,
  COMMUNITY_CREATE_PERIODS,
  type CommunityLeague,
  type CommunityMetric,
  type CommunityPeriodType,
} from "@/lib/communities/types";
import {
  gamesScopeLabel,
  leagueLabel,
  metricLabel,
  periodLabel,
} from "@/lib/communities/labels";
import {
  COMMUNITY_GAMES_SCOPES,
  type CommunityGamesScope,
} from "@/lib/communities/communityGamesScope";
import {
  communityCreateMonthKeysJST,
  upcomingMonthEndDateKeysJST,
} from "@/lib/communities/resolveCommunityDateKeys";
import {
  FREE_MAX_MEMBERSHIPS,
  FREE_MAX_OWNED_GROUPS,
  PRO_MAX_MEMBERSHIPS,
  PRO_MAX_OWNED_GROUPS,
} from "@/lib/communities/limitValues";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { useScheduleTeams } from "@/lib/games/useScheduleTeams";
import CommunityTeamPicker from "@/app/component/communities/CommunityTeamPicker";
import {
  communityCrtMono,
} from "@/app/component/communities/CommunityCrtTheme";

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
  periodType: CommunityPeriodType;
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

const DEFAULT_MONTH_KEY = communityCreateMonthKeysJST()[0] ?? "";

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
  const [league, setLeague] = useState<CommunityLeague>("nba");
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [periodType, setPeriodType] =
    useState<CommunityPeriodType>("from_now");
  const [gamesScope, setGamesScope] = useState<CommunityGamesScope>("all");
  const [periodMonthKey, setPeriodMonthKey] = useState(DEFAULT_MONTH_KEY);
  const [endDateKey, setEndDateKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const submitLockRef = useRef(false);
  const isWeb = variant === "web";
  const reduceMotion = useReducedMotion();

  const { teams } = useScheduleTeams(league === "nba" ? "nba" : "nba");
  const monthKeys = useMemo(() => communityCreateMonthKeysJST(), []);
  const endDateOptions = useMemo(() => upcomingMonthEndDateKeysJST(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) return;
    submitLockRef.current = false;
    setBusy(false);
  }, [open]);

  useEffect(() => {
    setTeamIds([]);
  }, [league]);

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
            period: "Period",
            periodMonth: "Month",
            periodEnd: "End date (optional)",
            noEnd: "No end",
            untilMonth: (mk: string) => `Until ${mk}`,
            gamesScope: "Games",
            teams: "Teams (optional)",
            scoringNote:
              "Ranking options (period, games, teams) are locked when the group is created. For “From group start”, scores count from the create day (JST); past results are not included.",
            cancel: "Cancel",
            submit: "Create",
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
            period: "期間",
            periodMonth: "対象月",
            periodEnd: "終了日（任意）",
            noEnd: "終了なし",
            untilMonth: (mk: string) => `〜${mk}まで`,
            gamesScope: "試合対象",
            teams: "チーム（任意）",
            scoringNote:
              "期間・試合対象・チームなどの集計設定は作成時に確定し、あとから変更できません。「グループ開始以降」の場合、作成日（JST）以降の予想だけが集計され、過去の成績は含みません。",
            cancel: "キャンセル",
            submit: "作成",
            planLimits: `プラン上限: Free はグループを最大 ${FREE_MAX_OWNED_GROUPS} 件まで作成でき、最大 ${FREE_MAX_MEMBERSHIPS} 件まで参加できます。Pro はグループを最大 ${PRO_MAX_OWNED_GROUPS} 件まで作成でき、最大 ${PRO_MAX_MEMBERSHIPS} 件まで参加できます。`,
          },
    [language]
  );

  const chipClass = (active: boolean) =>
    [
      "rounded-none border px-2.5 py-1.5 text-xs font-semibold",
      jp.className,
      active
        ? "border-white bg-white text-black"
        : "border-white/22 bg-black text-white/62",
    ].join(" ");

  const onPickFile = useCallback((f: File | null) => {
    setHeaderFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }, []);

  const resetFormFields = useCallback(() => {
    setName("");
    setDescription("");
    setHeaderFile(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMetric("totalPoints");
    setLeague("nba");
    setTeamIds([]);
    setPeriodType("from_now");
    setGamesScope("all");
    setPeriodMonthKey(communityCreateMonthKeysJST()[0] ?? "");
    setEndDateKey(null);
  }, []);

  const closeReset = useCallback(() => {
    if (submitLockRef.current) return;
    resetFormFields();
    onClose();
  }, [onClose, resetFormFields]);

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
      const body: Record<string, unknown> = {
        name: n,
        description: description.trim() || null,
        headerImageUrl,
        rankingMetric: metric,
        periodType,
        rankingLeague: "nba",
        rankingTeamIds: teamIds,
        rankingGamesScope: gamesScope,
      };
      if (periodType === "calendar_month") {
        body.rankingPeriodMonthKey = periodMonthKey;
      }
      if (periodType === "from_now" && endDateKey) {
        body.rankingEndDateKey = endDateKey;
      }
      if (periodType === "nba_season" || periodType === "nba_playoffs") {
        body.rankingSeasonKey = CURRENT_NBA_SEASON_KEY;
      }

      const res = await fetch("/api/communities/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: h },
        body: JSON.stringify(body),
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
            periodType: created.periodType ?? periodType,
            role: created.role ?? "owner",
          }
        : {
            id: String(json.groupId ?? ""),
            name: n,
            description: description.trim() || null,
            memberCount: 1,
            headerImageUrl,
            rankingMetric: metric,
            periodType,
            rankingLeague: "nba",
            rankingTeamIds: teamIds,
            role: "owner",
          };
      onCreated(payload, inv || undefined);
      resetFormFields();
      onClose();
    } catch {
      releaseSubmitLock();
      toast.error(language === "en" ? "Create failed." : "作成に失敗しました。");
    }
  }, [
    name,
    description,
    headerFile,
    language,
    metric,
    periodType,
    teamIds,
    gamesScope,
    periodMonthKey,
    endDateKey,
    onCreated,
    onClose,
    releaseSubmitLock,
    resetFormFields,
  ]);

  if (!open || !mounted) return null;

  const fieldClass = [
    "w-full rounded-none border border-white/22 bg-black text-white",
    "focus:border-white/70 focus:outline-none focus:ring-1 focus:ring-white/25",
    jp.className,
    isWeb ? "px-3 py-2.5 text-base" : "px-2.5 py-2 text-sm",
  ].join(" ");

  const labelClass = [
    "block font-semibold uppercase tracking-[0.16em] text-white/55",
    communityCrtMono.className,
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
        className="absolute inset-0 bg-black/80 disabled:pointer-events-none"
      />
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-3 pb-[max(0.75rem,var(--bottom-nav-clearance))] sm:p-4">
        <div
          className={[
            "pointer-events-auto relative isolate flex w-full flex-col overflow-hidden border border-white/22 bg-black",
            "h-[min(34rem,calc(100svh-var(--bottom-nav-clearance)-1.5rem))] sm:h-[min(34rem,calc(100svh-2rem))]",
            isWeb ? "max-w-2xl" : "max-w-md",
            jp.className,
          ].join(" ")}
          style={{
            boxShadow: "0 14px 36px rgba(0,0,0,0.72)",
            touchAction: "manipulation",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div
            className={[
              "shrink-0 border-b border-white/14",
              isWeb ? "px-6 py-4" : "px-4 py-3",
            ].join(" ")}
          >
            <h2
              className={[
                nameOxanium.className,
                "font-bold tracking-[0.06em] text-white",
                isWeb ? "text-xl" : "text-base",
              ].join(" ")}
            >
              {t.title}
            </h2>
            <p
              className={[
                "mt-2 leading-relaxed text-white/58",
                isWeb ? "text-xs" : "text-[11px]",
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
              "resize-none leading-relaxed placeholder:text-white/55",
              isWeb ? "placeholder:text-sm" : "placeholder:text-xs",
            ].join(" ")}
          />

          <label className={labelClass}>{t.header}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            className={[
              "text-white/70 file:mr-2 file:rounded-none file:border file:border-white/28 file:bg-black file:px-2 file:py-1 file:font-semibold file:text-white",
              nameOxanium.className,
              isWeb ? "text-sm file:text-sm" : "text-xs",
            ].join(" ")}
          />
          {preview && (
            <div
              className={[
                "aspect-square w-full overflow-hidden border border-white/18 bg-black",
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
              "leading-relaxed text-white/58",
              isWeb ? "text-xs" : "text-[11px]",
            ].join(" ")}
          >
            {t.scoringNote}
          </p>

          <label className={labelClass}>{t.league}</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMUNITY_CREATE_LEAGUES.map((k) => {
              const active = k === league;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setLeague(k)}
                  className={chipClass(active)}
                >
                  {leagueLabel(k, language)}
                </button>
              );
            })}
          </div>

          <label className={labelClass}>{t.metric}</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMUNITY_CREATE_METRICS.map((k) => {
              const active = k === metric;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMetric(k)}
                  className={chipClass(active)}
                >
                  {metricLabel(k, language)}
                </button>
              );
            })}
          </div>

          <label className={labelClass}>{t.period}</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMUNITY_CREATE_PERIODS.map((k) => {
              const active = k === periodType;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setPeriodType(k)}
                  className={chipClass(active)}
                >
                  {periodLabel(k, language)}
                </button>
              );
            })}
          </div>

          {periodType === "calendar_month" && (
            <>
              <label className={labelClass}>{t.periodMonth}</label>
              <div className="flex flex-wrap gap-1.5">
                {monthKeys.map((mk) => {
                  const active = mk === periodMonthKey;
                  return (
                    <button
                      key={mk}
                      type="button"
                      onClick={() => setPeriodMonthKey(mk)}
                      className={chipClass(active)}
                    >
                      {mk}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {periodType === "from_now" && (
            <>
              <label className={labelClass}>{t.periodEnd}</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setEndDateKey(null)}
                  className={chipClass(endDateKey === null)}
                >
                  {t.noEnd}
                </button>
                {endDateOptions.map(({ monthKey, endDateKey: edk }) => {
                  const active = endDateKey === edk;
                  return (
                    <button
                      key={edk}
                      type="button"
                      onClick={() => setEndDateKey(edk)}
                      className={chipClass(active)}
                    >
                      {t.untilMonth(monthKey)}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <label className={labelClass}>{t.gamesScope}</label>
          <div className="flex flex-wrap gap-1.5">
            {COMMUNITY_GAMES_SCOPES.map((k) => {
              const active = k === gamesScope;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setGamesScope(k)}
                  className={chipClass(active)}
                >
                  {gamesScopeLabel(k, language)}
                </button>
              );
            })}
          </div>

          <label className={labelClass}>{t.teams}</label>
          <CommunityTeamPicker
            teams={teams}
            selectedIds={teamIds}
            onChange={setTeamIds}
            language={language}
            isWeb={isWeb}
          />
            </div>
          </div>

          <div
            className={[
              "flex shrink-0 justify-end gap-2 border-t border-white/14",
              isWeb ? "px-6 py-4" : "px-4 py-3",
            ].join(" ")}
          >
            <button
              type="button"
              onClick={closeReset}
              disabled={busy}
              className={[
                "rounded-none border border-white/28 bg-black font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40",
                nameOxanium.className,
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
                "rounded-none border border-white bg-white font-semibold text-black",
                "disabled:cursor-not-allowed disabled:opacity-40",
                nameOxanium.className,
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
