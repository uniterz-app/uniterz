"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Clipboard } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { jp } from "@/lib/fonts";
import { toast } from "@/app/component/ui/toast";
import CreateGroupModal from "@/app/component/communities/CreateGroupModal";
import GroupCreatedSuccessModal from "@/app/component/communities/GroupCreatedSuccessModal";
import JoinGroupConfirmModal, {
  type JoinGroupPreview,
} from "@/app/component/communities/JoinGroupConfirmModal";
import CommunityGroupOverlay from "@/app/component/communities/CommunityGroupOverlay";
import type {
  CommunityLeague,
  CommunityMetric,
  CommunityPeriodType,
} from "@/lib/communities/types";
import { formatCommunityCompetitionLine } from "@/lib/communities/competitionDisplay";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { preserveScrollOnInputFocus } from "@/lib/dom/preserveScrollOnInputFocus";
import type { GroupMemberPreview } from "@/lib/communities/memberPreviews";
import CommunityMemberAvatarStack from "@/app/component/communities/CommunityMemberAvatarStack";
import { CyberPanelFrame } from "@/app/component/ui/CyberPanelFrame";
import {
  MAX_MEMBERS_PER_GROUP,
} from "@/lib/communities/limitValues";
import {
  prefetchCommunityGroupDetail,
  prefetchCommunityGroupDetails,
  type CommunityGroupListPreview,
} from "@/app/component/communities/communityGroupDetailCache";

async function authHeader(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  const token = await u.getIdToken();
  return `Bearer ${token}`;
}

type ListGroup = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  headerImageUrl: string | null;
  rankingMetric: CommunityMetric;
  periodType: CommunityPeriodType;
  rankingLeague: CommunityLeague;
  rankingTeamIds?: string[];
  role: string;
  memberPreviews?: GroupMemberPreview[];
};

export type CreatedCommunityGroup = ListGroup;

type Props = {
  language: Language;
  variant: "web" | "mobile";
  /** Group タブ表示中に一覧を再取得 */
  active?: boolean;
  /** 作成完了後などに Group タブへ切り替え */
  onNavigateToGroupsTab?: () => void;
};

export default function RankingsCommunityPanel({
  language,
  variant,
  active = true,
  onNavigateToGroupsTab,
}: Props) {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [groups, setGroups] = useState<ListGroup[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState<{
    inviteCode: string;
    groupName: string;
  } | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinPreviewOpen, setJoinPreviewOpen] = useState(false);
  const [joinPreview, setJoinPreview] = useState<JoinGroupPreview | null>(null);
  const [joinPreviewCode, setJoinPreviewCode] = useState("");
  const [joinAlreadyMember, setJoinAlreadyMember] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [overlayGroup, setOverlayGroup] = useState<{
    id: string;
    preview: CommunityGroupListPreview;
  } | null>(null);

  const basePath = variant === "web" ? "/web" : "/mobile";
  const isWeb = variant === "web";
  const reduceMotion = useReducedMotion();
  const m = t(language);
  /** Web は親（max-w-5xl）いっぱい、Mobile は中央の固定幅 */
  const communityPanelShellClass = isWeb
    ? "mx-auto w-full px-1"
    : "mx-auto w-full max-w-md px-1";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  const fetchList = useCallback(async () => {
    const h = await authHeader();
    if (!h) {
      setGroups([]);
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    try {
      const res = await fetch("/api/communities/list", {
        headers: { Authorization: h },
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setGroups([]);
        const code = json?.error ?? (res.status === 401 ? "unauthorized" : "error");
        if (code === "unauthorized") {
          setErr(
            language === "en"
              ? "Sign in to view your groups."
              : "グループを表示するにはログインしてください。"
          );
        } else {
          setErr(String(code));
        }
        return;
      }
      setErr(null);
      setGroups(json.groups ?? []);
    } finally {
      setLoadingList(false);
    }
  }, [language]);

  useEffect(() => {
    if (!uid) {
      setGroups([]);
      setLoadingList(false);
      return;
    }
    if (active) {
      void fetchList();
    }
  }, [active, uid, fetchList]);

  useEffect(() => {
    if (!groups.length) return;
    prefetchCommunityGroupDetails(
      groups.map((g) => g.id),
      6
    );
  }, [groups]);

  const openGroupOverlay = useCallback((g: ListGroup) => {
    prefetchCommunityGroupDetail(g.id);
    setOverlayGroup({
      id: g.id,
      preview: {
        name: g.name,
        description: g.description,
        headerImageUrl: g.headerImageUrl,
        memberCount: g.memberCount,
        rankingMetric: g.rankingMetric,
        rankingLeague: g.rankingLeague,
        rankingTeamIds: g.rankingTeamIds,
        isOwner: g.role === "owner",
      },
    });
  }, []);

  const onGroupCreated = useCallback(
    (
      created: CreatedCommunityGroup | null | undefined,
      inviteCode?: string
    ) => {
      setCreateOpen(false);
      onNavigateToGroupsTab?.();

      if (created?.id) {
        setGroups((prev) => {
          if (prev.some((g) => g.id === created.id)) return prev;
          return [...prev, created].sort((a, b) =>
            a.name.localeCompare(b.name, "ja")
          );
        });
        setErr(null);
      }
      void fetchList();

      if (inviteCode) {
        setCreatedSuccess({
          inviteCode,
          groupName: created?.name ?? "",
        });
      }
    },
    [fetchList, onNavigateToGroupsTab]
  );

  const mapJoinError = useCallback(
    (code: string, json: Record<string, unknown>) => {
      if (code === "group_not_found") {
        return m.rankings.invalidInviteCode;
      }
      if (code === "group_archived") {
        return language === "en"
          ? "This group is no longer available."
          : "このグループは利用できません。";
      }
      if (code === "membership_limit") {
        const current = Number(json?.currentMemberships ?? groups.length);
        const max = Number(json?.maxMemberships ?? 0);
        return language === "en"
          ? max > 0
            ? `${m.rankings.maxGroupsReached} (${current}/${max})`
            : m.rankings.maxGroupsReached
          : max > 0
            ? `${m.rankings.maxGroupsReached}（${current}/${max}）`
            : m.rankings.maxGroupsReached;
      }
      if (code === "group_full") {
        const current = Number(json?.memberCount ?? 0);
        const max = Number(json?.maxMembersPerGroup ?? MAX_MEMBERS_PER_GROUP);
        return language === "en"
          ? `${m.rankings.groupFull} (${current}/${max})`
          : `${m.rankings.groupFull}（${current}/${max}）`;
      }
      return code;
    },
    [groups.length, language, m]
  );

  const closeJoinPreview = useCallback(() => {
    setJoinPreviewOpen(false);
    setJoinPreview(null);
    setJoinPreviewCode("");
    setJoinAlreadyMember(false);
  }, []);

  const onPreviewJoin = useCallback(async () => {
    setErr(null);
    const h = await authHeader();
    if (!h) return;
    const code = joinCode.trim();
    if (code.length < 4) return;

    setJoinBusy(true);
    try {
      const res = await fetch("/api/communities/preview-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: h },
        body: JSON.stringify({ inviteCode: code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        const codeErr = String(json?.error ?? "error");
        setErr(mapJoinError(codeErr, json));
        return;
      }

      setJoinPreview(json.group as JoinGroupPreview);
      setJoinPreviewCode(String(json.inviteCode ?? code));
      setJoinAlreadyMember(Boolean(json.alreadyMember));
      setJoinPreviewOpen(true);
    } finally {
      setJoinBusy(false);
    }
  }, [joinCode, mapJoinError]);

  const onJoin = useCallback(async () => {
    setErr(null);
    const h = await authHeader();
    if (!h) return;
    const code = joinPreviewCode || joinCode;
    if (!code.trim()) return;

    setJoinBusy(true);
    try {
      const res = await fetch("/api/communities/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: h },
        body: JSON.stringify({ inviteCode: code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        const codeErr = String(json?.error ?? "error");
        setErr(mapJoinError(codeErr, json));
        return;
      }
      setJoinCode("");
      closeJoinPreview();
      toast.success(m.community.joinedGroup);
      void fetchList();
    } finally {
      setJoinBusy(false);
    }
  }, [
    joinPreviewCode,
    joinCode,
    mapJoinError,
    m,
    fetchList,
    closeJoinPreview,
  ]);

  const pasteInviteCode = useCallback(async () => {
    if (!navigator?.clipboard?.readText) {
      toast.error(
        language === "en"
          ? "Paste is not supported on this device."
          : "この端末では貼り付けに対応していません。"
      );
      return;
    }
    try {
      const pasted = (await navigator.clipboard.readText())
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
      if (!pasted) return;
      setJoinCode(pasted);
    } catch {
      toast.error(
        language === "en"
          ? "Could not read clipboard."
          : "クリップボードを読み取れませんでした。"
      );
    }
  }, [language]);

  return (
    <div
      className={[
        "mx-auto space-y-5 pb-bottom-nav pt-2",
        isWeb ? "max-w-5xl px-2" : "max-w-[860px] px-1",
        jp.className,
      ].join(" ")}
    >
      <CommunityGroupOverlay
        open={overlayGroup != null}
        groupId={overlayGroup?.id ?? null}
        listPreview={overlayGroup?.preview ?? null}
        language={language}
        variant={variant}
        onClose={() => setOverlayGroup(null)}
        onRefreshList={() => void fetchList()}
      />

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        language={language}
        variant={variant}
        onCreated={onGroupCreated}
      />

      <GroupCreatedSuccessModal
        open={createdSuccess != null}
        inviteCode={createdSuccess?.inviteCode ?? ""}
        groupName={createdSuccess?.groupName}
        language={language}
        onClose={() => setCreatedSuccess(null)}
      />

      <JoinGroupConfirmModal
        open={joinPreviewOpen}
        preview={joinPreview}
        alreadyMember={joinAlreadyMember}
        language={language}
        busy={joinBusy}
        onBack={closeJoinPreview}
        onJoin={() => void onJoin()}
      />

      {err && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {err}
        </p>
      )}

      <div className={communityPanelShellClass}>
        <motion.button
          type="button"
          onClick={() => setCreateOpen(true)}
          whileTap={reduceMotion ? undefined : { scale: 0.972 }}
          transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="group/create w-full bg-transparent p-0"
        >
          <CyberPanelFrame
            compact
            pressGroup="create"
            className={[
              "w-full transition-[border-color,box-shadow,filter] duration-150",
              "hover:border-cyan-300/85 hover:shadow-[0_0_40px_-4px_rgba(34,211,238,0.45),inset_0_1px_0_0_rgba(34,211,238,0.3)]",
              "group-active/create:border-fuchsia-400/75 group-active/create:shadow-[0_0_52px_-2px_rgba(217,70,239,0.42),0_0_28px_-6px_rgba(34,211,238,0.55),inset_0_1px_0_0_rgba(244,114,182,0.35)]",
              "group-active/create:brightness-110",
            ].join(" ")}
          >
            <span
              className={[
                "block w-full text-center font-mono font-bold tracking-wide text-cyan-50",
                "[text-shadow:0_0_20px_rgba(34,211,238,0.55),0_0_40px_rgba(34,211,238,0.2)]",
                "transition-[color,text-shadow,transform] duration-150",
                "group-hover/create:text-white group-active/create:scale-[0.985] group-active/create:text-white",
                "group-active/create:[text-shadow:0_0_24px_rgba(244,114,182,0.65),0_0_36px_rgba(34,211,238,0.45)]",
                isWeb ? "py-1 text-lg" : "py-0.5 text-base",
              ].join(" ")}
            >
              {m.community.createGroup}
            </span>
          </CyberPanelFrame>
        </motion.button>
      </div>

      <div className={communityPanelShellClass}>
        <CyberPanelFrame compact className="w-full">
          <h2
            className={[
              "text-center font-mono font-bold tracking-wide text-cyan-50",
              "[text-shadow:0_0_16px_rgba(34,211,238,0.45),0_0_32px_rgba(34,211,238,0.15)]",
              isWeb ? "text-base" : "text-sm",
            ].join(" ")}
          >
            {m.community.joinWithCode}
          </h2>
          <form
            className={[
              "flex gap-2",
              isWeb
                ? "mt-4 w-full flex-row items-stretch gap-3"
                : "mt-3 flex-col",
            ].join(" ")}
            data-scroll-stable
            onSubmit={(e) => {
              e.preventDefault();
              if (!joinBusy && joinCode.trim().length >= 4) void onPreviewJoin();
            }}
          >
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onFocus={preserveScrollOnInputFocus}
              placeholder={m.community.inviteCode}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              enterKeyHint="go"
              className={[
                "min-w-0 rounded-lg border border-cyan-400/30 bg-black/50 px-3 font-mono tracking-[0.12em] text-white placeholder:tracking-normal placeholder:text-white/35 scroll-mb-[var(--bottom-nav-clearance)]",
                "shadow-[inset_0_0_12px_rgba(34,211,238,0.06)] focus:border-cyan-300/55 focus:outline-none focus:ring-1 focus:ring-cyan-400/35",
                isWeb
                  ? "min-w-[14rem] flex-[1.6] py-2.5 text-base"
                  : "w-full py-2.5 text-base",
              ].join(" ")}
              style={{ touchAction: "manipulation" }}
            />
            {isWeb ? (
              <>
                <button
                  type="button"
                  disabled={joinBusy}
                  onClick={() => void pasteInviteCode()}
                  className={[
                    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-100/90 transition-colors",
                    "hover:border-cyan-300/40 hover:bg-cyan-500/15 active:scale-[0.98] disabled:opacity-40",
                    isWeb ? "min-w-[6.5rem]" : "",
                  ].join(" ")}
                >
                  <Clipboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {language === "en" ? "Paste" : "貼り付け"}
                </button>
                <motion.button
                  type="submit"
                  disabled={joinBusy || joinCode.trim().length < 4}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  transition={{ duration: 0.1 }}
                  className={[
                    "inline-flex shrink-0 items-center justify-center rounded-lg border py-2.5 text-sm font-semibold transition-[background-color,box-shadow,border-color,filter] duration-150",
                    "border-blue-400/45 bg-blue-500/30 text-blue-50",
                    "shadow-[0_0_18px_rgba(59,130,246,0.28),inset_0_1px_0_rgba(147,197,253,0.2)]",
                    "hover:border-blue-300/55 hover:bg-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.38),inset_0_1px_0_rgba(147,197,253,0.28)]",
                    "active:brightness-110 active:border-blue-300/70 active:bg-blue-500/50",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                    isWeb ? "min-w-[6.5rem] px-4" : "px-5",
                  ].join(" ")}
                >
                  {joinBusy ? "\u2026" : m.community.checkInviteCode}
                </motion.button>
              </>
            ) : (
              <div className="flex w-full gap-2">
                <button
                  type="button"
                  disabled={joinBusy}
                  onClick={() => void pasteInviteCode()}
                  className={[
                    "inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-1.5 text-sm font-semibold text-cyan-100/90 transition-colors",
                    "hover:border-cyan-300/40 hover:bg-cyan-500/15 active:scale-[0.98] disabled:opacity-40",
                  ].join(" ")}
                >
                  <Clipboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {language === "en" ? "Paste" : "貼り付け"}
                </button>
                <motion.button
                  type="submit"
                  disabled={joinBusy || joinCode.trim().length < 4}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  transition={{ duration: 0.1 }}
                  className={[
                    "inline-flex min-w-0 flex-1 items-center justify-center rounded-lg border px-4 py-1.5 text-sm font-semibold transition-[background-color,box-shadow,border-color,filter] duration-150",
                    "border-blue-400/45 bg-blue-500/30 text-blue-50",
                    "shadow-[0_0_18px_rgba(59,130,246,0.28),inset_0_1px_0_rgba(147,197,253,0.2)]",
                    "hover:border-blue-300/55 hover:bg-blue-500/40 hover:shadow-[0_0_24px_rgba(59,130,246,0.38),inset_0_1px_0_rgba(147,197,253,0.28)]",
                    "active:brightness-110 active:border-blue-300/70 active:bg-blue-500/50",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  ].join(" ")}
                >
                  {joinBusy ? "\u2026" : m.community.checkInviteCode}
                </motion.button>
              </div>
            )}
          </form>
        </CyberPanelFrame>
      </div>

      <section className={["space-y-3", communityPanelShellClass].join(" ")}>
        <h2
          className={[
            "text-center font-mono font-bold tracking-wide text-cyan-50/90",
            "[text-shadow:0_0_12px_rgba(34,211,238,0.35)]",
            isWeb ? "text-lg" : "text-sm",
          ].join(" ")}
        >
          {m.rankings.myCommunity}
        </h2>
        {loadingList ? (
          <p className="text-center text-sm text-white/45">{m.common.loading}</p>
        ) : groups.length === 0 ? (
          <p className="text-center text-sm text-white/45">{m.rankings.noGroupsYet}</p>
        ) : (
          <ul className="flex w-full flex-col gap-2">
            {groups.map((g) => {
              const isOwner = g.role === "owner";
              return (
              <li key={g.id}>
                <motion.button
                  type="button"
                  aria-label={`${g.name} \u2014 ${m.rankings.openRanking}`}
                  onPointerDown={() => prefetchCommunityGroupDetail(g.id)}
                  onClick={() => openGroupOverlay(g)}
                  whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                  transition={{ duration: 0.1 }}
                  className="group/card w-full bg-transparent p-0 text-left"
                >
                  <CyberPanelFrame
                    compact
                    className={[
                      "w-full transition-[border-color,box-shadow,filter] duration-150",
                      isWeb ? "!px-5 !py-4" : "",
                      "hover:border-cyan-300/85 hover:shadow-[0_0_40px_-4px_rgba(34,211,238,0.42),inset_0_1px_0_0_rgba(34,211,238,0.28)]",
                      "group-active/card:brightness-105",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex w-full items-center",
                        isWeb ? "gap-5" : "gap-3",
                      ].join(" ")}
                    >
                  <div
                    className={[
                      "flex shrink-0 flex-col items-center",
                      isWeb ? "w-[6.5rem] gap-2.5" : "w-[4.25rem] gap-1.5 sm:w-[4.5rem]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-flex w-full max-w-full items-center justify-center rounded-full border font-semibold tracking-wide",
                        isWeb ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[9px] sm:text-[10px]",
                        isOwner
                          ? "border-blue-400/45 bg-blue-500/20 text-blue-100"
                          : "border-emerald-400/40 bg-emerald-500/15 text-emerald-100/95",
                      ].join(" ")}
                    >
                      {isOwner ? m.rankings.owner : m.rankings.member}
                    </span>
                    <div
                      className={[
                        "w-full overflow-hidden rounded-lg border bg-black/50",
                        isWeb ? "size-[6.5rem]" : "size-[4.25rem] sm:size-[4.5rem]",
                        isOwner
                          ? "border-blue-400/35"
                          : "border-emerald-400/30",
                      ].join(" ")}
                    >
                      {g.headerImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={g.headerImageUrl}
                          alt=""
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div
                          className={[
                            "flex h-full w-full items-center justify-center",
                            isWeb ? "text-2xl" : "text-lg",
                            isOwner ? "text-blue-300/30" : "text-emerald-300/30",
                          ].join(" ")}
                        >
                          —
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={["flex min-w-0 flex-1 flex-col justify-center", isWeb ? "gap-2" : "gap-1"].join(" ")}>
                    <p
                      className={[
                        "line-clamp-1 font-bold leading-snug text-cyan-50",
                        "[text-shadow:0_0_10px_rgba(34,211,238,0.25)]",
                        isWeb ? "text-[22px]" : "text-[15px]",
                      ].join(" ")}
                    >
                      {g.name}
                    </p>
                    {g.description ? (
                      <p
                        className={[
                          "line-clamp-2 leading-snug text-white/60",
                          isWeb ? "text-[15px]" : "text-[12px]",
                        ].join(" ")}
                      >
                        {g.description}
                      </p>
                    ) : null}
                    <p
                      className={[
                        "line-clamp-2 leading-relaxed text-white/50",
                        isWeb ? "text-sm" : "text-[11px]",
                      ].join(" ")}
                    >
                      <span className="text-cyan-200/45">{m.rankings.competingOn}: </span>
                      {formatCommunityCompetitionLine(
                        {
                          rankingLeague: g.rankingLeague ?? "all",
                          rankingMetric: g.rankingMetric,
                          rankingTeamIds: g.rankingTeamIds,
                        },
                        language
                      )}
                    </p>
                    <div className={["mt-0.5 flex flex-wrap items-center", isWeb ? "gap-3" : "gap-2"].join(" ")}>
                      <p
                        className={[
                          "font-bold tabular-nums",
                          isWeb ? "text-lg" : "text-sm",
                          isOwner ? "text-blue-100/95" : "text-emerald-100/90",
                        ].join(" ")}
                      >
                        {m.rankings.nMembers.replace("{n}", String(g.memberCount))}
                      </p>
                      {(g.memberPreviews?.length ?? 0) > 0 ? (
                        <CommunityMemberAvatarStack
                          previews={g.memberPreviews ?? []}
                          sizeClassName={isWeb ? "size-8" : "size-6"}
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center self-center pr-0.5 text-cyan-200/40 transition-colors group-hover/card:text-cyan-100/70">
                    <ChevronRight
                      className={isWeb ? "h-6 w-6" : "h-5 w-5"}
                      aria-hidden
                    />
                  </div>
                    </div>
                  </CyberPanelFrame>
                </motion.button>
              </li>
            );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
