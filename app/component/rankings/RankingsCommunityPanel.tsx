"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Clipboard } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { jp } from "@/lib/fonts";
import { toast } from "@/app/component/ui/toast";
import CreateGroupModal from "@/app/component/communities/CreateGroupModal";
import GroupCreatedSuccessModal from "@/app/component/communities/GroupCreatedSuccessModal";
import CommunityGroupOverlay from "@/app/component/communities/CommunityGroupOverlay";
import type {
  CommunityLeague,
  CommunityMetric,
  CommunityPeriodType,
} from "@/lib/communities/types";
import { leagueLabel, metricLabel } from "@/lib/communities/labels";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { preserveScrollOnInputFocus } from "@/lib/dom/preserveScrollOnInputFocus";
import type { GroupMemberPreview } from "@/lib/communities/memberPreviews";
import CommunityMemberAvatarStack from "@/app/component/communities/CommunityMemberAvatarStack";
import {
  FREE_MAX_MEMBERSHIPS,
  FREE_MAX_OWNED_GROUPS,
  MAX_MEMBERS_PER_GROUP,
  PRO_MAX_MEMBERSHIPS,
  PRO_MAX_OWNED_GROUPS,
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
  const [err, setErr] = useState<string | null>(null);
  const [overlayGroup, setOverlayGroup] = useState<{
    id: string;
    preview: CommunityGroupListPreview;
  } | null>(null);

  const basePath = variant === "web" ? "/web" : "/mobile";
  const isWeb = variant === "web";
  const m = t(language);

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

  const onJoin = useCallback(async () => {
    setErr(null);
    const h = await authHeader();
    if (!h) return;
    setJoinBusy(true);
    try {
      const res = await fetch("/api/communities/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: h },
        body: JSON.stringify({ inviteCode: joinCode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        const code = json?.error ?? "error";
        if (code === "group_not_found") {
          setErr(m.rankings.invalidInviteCode);
        } else if (code === "membership_limit") {
          const current = Number(json?.currentMemberships ?? groups.length);
          const max = Number(json?.maxMemberships ?? 0);
          setErr(
            language === "en"
              ? max > 0
                ? `${m.rankings.maxGroupsReached} (${current}/${max})`
                : m.rankings.maxGroupsReached
              : max > 0
                ? `${m.rankings.maxGroupsReached}（${current}/${max}）`
                : m.rankings.maxGroupsReached
          );
        } else if (code === "group_full") {
          const current = Number(json?.memberCount ?? 0);
          const max = Number(json?.maxMembersPerGroup ?? MAX_MEMBERS_PER_GROUP);
          setErr(
            language === "en"
              ? `${m.rankings.groupFull} (${current}/${max})`
              : `${m.rankings.groupFull}（${current}/${max}）`
          );
        } else {
          setErr(code);
        }
        return;
      }
      setJoinCode("");
      toast.success(m.community.joinedGroup);
      void fetchList();
    } finally {
      setJoinBusy(false);
    }
  }, [joinCode, m, fetchList, groups.length, language]);

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
        onCreated={onGroupCreated}
      />

      <GroupCreatedSuccessModal
        open={createdSuccess != null}
        inviteCode={createdSuccess?.inviteCode ?? ""}
        groupName={createdSuccess?.groupName}
        language={language}
        onClose={() => setCreatedSuccess(null)}
      />

      {err && (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {err}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-xl border border-cyan-300/30 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100"
        >
          {m.community.createGroup}
        </button>
      </div>
      <p
        className={[
          "leading-relaxed text-white/55",
          isWeb ? "text-sm" : "text-xs",
        ].join(" ")}
      >
        {language === "en"
          ? `Plan limits: Free users can create up to ${FREE_MAX_OWNED_GROUPS} groups and join up to ${FREE_MAX_MEMBERSHIPS} groups. Pro users can create up to ${PRO_MAX_OWNED_GROUPS} groups and join up to ${PRO_MAX_MEMBERSHIPS} groups.`
          : `プラン上限: Free はグループを最大 ${FREE_MAX_OWNED_GROUPS} 件まで作成でき、最大 ${FREE_MAX_MEMBERSHIPS} 件まで参加できます。Pro はグループを最大 ${PRO_MAX_OWNED_GROUPS} 件まで作成でき、最大 ${PRO_MAX_MEMBERSHIPS} 件まで参加できます。`}
      </p>

      <section
        className="space-y-2 rounded-2xl border border-white/10 bg-white/4 p-4"
        data-scroll-stable
      >
        <h2 className="text-sm font-bold text-white/90">{m.community.joinWithCode}</h2>
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (!joinBusy && joinCode.trim().length >= 4) void onJoin();
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
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-base text-white placeholder:text-sm placeholder:text-white/35 scroll-mb-[var(--bottom-nav-clearance)]"
            style={{ touchAction: "manipulation" }}
          />
          <button
            type="button"
            disabled={joinBusy}
            onClick={() => {
              void (async () => {
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
              })();
            }}
            className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white/85 disabled:opacity-40"
          >
            <span className="inline-flex items-center gap-1">
              <Clipboard className="h-3.5 w-3.5" aria-hidden />
              {language === "en" ? "Paste" : "貼り付け"}
            </span>
          </button>
          <button
            type="submit"
            disabled={joinBusy || joinCode.trim().length < 4}
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 disabled:opacity-40"
          >
            {joinBusy ? "\u2026" : m.community.joinGroup}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white/80">{m.rankings.myCommunity}</h2>
        {loadingList ? (
          <p className="text-sm text-white/45">{m.common.loading}</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-white/45">{m.rankings.noGroupsYet}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {groups.map((g) => {
              const isOwner = g.role === "owner";
              return (
              <li key={g.id}>
                <button
                  type="button"
                  aria-label={`${g.name} \u2014 ${m.rankings.openRanking}`}
                  onPointerDown={() => prefetchCommunityGroupDetail(g.id)}
                  onClick={() => openGroupOverlay(g)}
                  className={[
                    "flex w-full items-center rounded-2xl border bg-white/5 text-left shadow-[0_2px_14px_rgba(0,0,0,0.28)] transition-colors",
                    isWeb ? "gap-4 p-4" : "gap-3 p-3",
                    isOwner
                      ? "border-blue-400/25 hover:border-blue-400/40 hover:bg-blue-500/[0.06]"
                      : "border-emerald-400/20 hover:border-emerald-400/35 hover:bg-emerald-500/[0.05]",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex shrink-0 flex-col items-center",
                      isWeb ? "w-[5.25rem] gap-2" : "w-[4.25rem] gap-1.5 sm:w-[4.5rem]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "inline-flex w-full max-w-full items-center justify-center rounded-full border font-semibold tracking-wide",
                        isWeb ? "px-2 py-0.5 text-[10px] sm:text-[11px]" : "px-1.5 py-0.5 text-[9px] sm:text-[10px]",
                        isOwner
                          ? "border-blue-400/40 bg-blue-500/15 text-blue-100"
                          : "border-emerald-400/35 bg-emerald-500/12 text-emerald-100/95",
                      ].join(" ")}
                    >
                      {isOwner ? m.rankings.owner : m.rankings.member}
                    </span>
                    <div
                      className={[
                        "w-full overflow-hidden rounded-xl bg-black/45",
                        isWeb ? "size-[5.25rem]" : "size-[4.25rem] sm:size-[4.5rem]",
                        isOwner
                          ? "ring-1 ring-blue-400/30"
                          : "ring-1 ring-emerald-400/25",
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
                            "flex h-full w-full items-center justify-center text-lg",
                            isOwner ? "text-blue-300/25" : "text-emerald-300/25",
                          ].join(" ")}
                        >
                          —
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={["flex min-w-0 flex-1 flex-col justify-center", isWeb ? "gap-1.5" : "gap-1"].join(" ")}>
                    <p
                      className={[
                        "line-clamp-1 font-bold leading-snug text-white",
                        isWeb ? "text-[18px]" : "text-[15px]",
                      ].join(" ")}
                    >
                      {g.name}
                    </p>
                    {g.description ? (
                      <p
                        className={[
                          "line-clamp-2 leading-snug text-white/55",
                          isWeb ? "text-[13px]" : "text-[12px]",
                        ].join(" ")}
                      >
                        {g.description}
                      </p>
                    ) : null}
                    <p
                      className={[
                        "line-clamp-2 leading-relaxed text-white/48",
                        isWeb ? "text-[12px]" : "text-[11px]",
                      ].join(" ")}
                    >
                      <span className="text-white/40">{m.rankings.competingOn}: </span>
                      {leagueLabel(g.rankingLeague ?? "all", language)}
                      <span className="text-white/30"> · </span>
                      {metricLabel(g.rankingMetric, language)}
                    </p>
                    <div className={["mt-0.5 flex flex-wrap items-center", isWeb ? "gap-2.5" : "gap-2"].join(" ")}>
                      <p
                        className={[
                          "font-bold tabular-nums",
                          isWeb ? "text-[15px]" : "text-sm",
                          isOwner ? "text-blue-100/95" : "text-emerald-100/90",
                        ].join(" ")}
                      >
                        {m.rankings.nMembers.replace("{n}", String(g.memberCount))}
                      </p>
                      {(g.memberPreviews?.length ?? 0) > 0 ? (
                        <CommunityMemberAvatarStack previews={g.memberPreviews ?? []} />
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center self-center pr-0.5 text-white/35">
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </div>
                </button>
              </li>
            );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
