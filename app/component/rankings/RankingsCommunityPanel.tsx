"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import CommunitySlotBoard, {
  type CommunityListGroup,
  type CommunityListLimits,
} from "@/app/component/communities/CommunitySlotBoard";
import {
  communityCrtPanelClass,
} from "@/app/component/communities/CommunityCrtTheme";
import {
  FREE_MAX_MEMBERSHIPS,
  FREE_MAX_OWNED_GROUPS,
  MAX_MEMBERS_PER_GROUP,
} from "@/lib/communities/limitValues";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
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

const DEFAULT_LIMITS: CommunityListLimits = {
  plan: "free",
  maxOwned: FREE_MAX_OWNED_GROUPS,
  maxMemberships: FREE_MAX_MEMBERSHIPS,
  ownedCount: 0,
  membershipCount: 0,
};

export type CreatedCommunityGroup = CommunityListGroup;

type Props = {
  language: Language;
  variant: "web" | "mobile";
  active?: boolean;
  onNavigateToGroupsTab?: () => void;
};

export default function RankingsCommunityPanel({
  language,
  variant,
  active = true,
  onNavigateToGroupsTab,
}: Props) {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [groups, setGroups] = useState<CommunityListGroup[]>([]);
  const [limits, setLimits] = useState<CommunityListLimits>(DEFAULT_LIMITS);
  const [loadingList, setLoadingList] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState<{
    inviteCode: string;
    groupName: string;
  } | null>(null);
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

  const isWeb = variant === "web";
  const m = t(language);

  const slotLabels = useMemo(
    () =>
      language === "en"
        ? {
            hostSection: ">> HOST / CREATE",
            memberSection: ">> MEMBER / JOIN",
            createSlot: "CREATE GROUP",
            joinSlot: "JOIN WITH CODE",
            inviteCode: m.community.inviteCode,
            paste: "Paste",
            checkCode: m.community.checkInviteCode,
            owner: m.rankings.owner.toUpperCase(),
            member: m.rankings.member.toUpperCase(),
            nMembers: m.rankings.nMembers,
            competingOn: m.rankings.competingOn,
            openRanking: m.rankings.openRanking,
            slotCount: (used: number, max: number) => `${used}/${max}`,
          }
        : {
            hostSection: ">> 作成スロット",
            memberSection: ">> 参加スロット",
            createSlot: "グループを作成",
            joinSlot: "コードで参加",
            inviteCode: m.community.inviteCode,
            paste: "貼り付け",
            checkCode: m.community.checkInviteCode,
            owner: m.rankings.owner.toUpperCase(),
            member: m.rankings.member.toUpperCase(),
            nMembers: m.rankings.nMembers,
            competingOn: m.rankings.competingOn,
            openRanking: m.rankings.openRanking,
            slotCount: (used: number, max: number) => `${used}/${max}`,
          },
    [language, m]
  );

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
      setLimits(DEFAULT_LIMITS);
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
        setLimits(DEFAULT_LIMITS);
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
      if (json.limits) {
        setLimits(json.limits as CommunityListLimits);
      }
    } finally {
      setLoadingList(false);
    }
  }, [language]);

  useEffect(() => {
    if (!uid) {
      setGroups([]);
      setLimits(DEFAULT_LIMITS);
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

  const openGroupOverlay = useCallback((g: CommunityListGroup) => {
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
        const max = Number(json?.maxMemberships ?? limits.maxMemberships);
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
    [groups.length, language, limits.maxMemberships, m]
  );

  const closeJoinPreview = useCallback(() => {
    setJoinPreviewOpen(false);
    setJoinPreview(null);
    setJoinPreviewCode("");
    setJoinAlreadyMember(false);
  }, []);

  const onPreviewJoin = useCallback(
    async (codeRaw: string) => {
      setErr(null);
      const h = await authHeader();
      if (!h) return;
      const code = codeRaw.trim();
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
    },
    [mapJoinError]
  );

  const onJoin = useCallback(async () => {
    setErr(null);
    const h = await authHeader();
    if (!h) return;
    const code = joinPreviewCode;
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
      closeJoinPreview();
      toast.success(m.community.joinedGroup);
      void fetchList();
    } finally {
      setJoinBusy(false);
    }
  }, [joinPreviewCode, mapJoinError, m, fetchList, closeJoinPreview]);

  const onPasteJoin = useCallback(async (): Promise<string | null> => {
    if (!navigator?.clipboard?.readText) {
      toast.error(
        language === "en"
          ? "Paste is not supported on this device."
          : "この端末では貼り付けに対応していません。"
      );
      return null;
    }
    try {
      const pasted = (await navigator.clipboard.readText())
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
      return pasted || null;
    } catch {
      toast.error(
        language === "en"
          ? "Could not read clipboard."
          : "クリップボードを読み取れませんでした。"
      );
      return null;
    }
  }, [language]);

  return (
    <div
      className={[
        "mx-auto w-full pb-bottom-nav",
        isWeb ? "w-full px-0 pt-2" : "max-w-md px-3 pt-2",
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

      {err ? (
        <p className="mb-3 rounded-xl border border-red-400/35 bg-red-950/35 px-3 py-2 text-sm text-red-200 shadow-[inset_0_0_16px_rgba(239,68,68,0.08)] backdrop-blur-md">
          {err}
        </p>
      ) : null}

      {!uid ? (
        <div className="flex min-h-[min(40dvh,320px)] items-center justify-center">
          <div
            className={[communityCrtPanelClass("subtle"), "px-6 py-8 text-center"].join(" ")}
          >
            <p className="text-base text-cyan-100/55 sm:text-lg">
              {language === "en"
                ? "Sign in to view your community slots."
                : "ログインするとスロットが表示されます。"}
            </p>
          </div>
        </div>
      ) : (
        <CommunitySlotBoard
          language={language}
          variant={variant}
          groups={groups}
          limits={limits}
          loading={loadingList}
          joinBusy={joinBusy}
          onOpenGroup={openGroupOverlay}
          onCreate={() => setCreateOpen(true)}
          onPreviewJoin={onPreviewJoin}
          onPasteJoin={onPasteJoin}
          labels={slotLabels}
        />
      )}
    </div>
  );
}
