import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import { StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Language } from "../../../../../lib/i18n/language";
import { t } from "../../../../../lib/i18n/t";
import { MAX_MEMBERS_PER_GROUP } from "../../../../../lib/communities/limitValues";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import CommunitySlotBoardNative from "./CommunitySlotBoardNative";
import CreateGroupModalNative from "./CreateGroupModalNative";
import GroupCreatedSuccessModalNative from "./GroupCreatedSuccessModalNative";
import JoinGroupConfirmModalNative from "./JoinGroupConfirmModalNative";
import {
  communityApiUrl,
  communityAuthHeader,
  DEFAULT_COMMUNITY_LIMITS,
  type CommunityListGroup,
  type CommunityListLimits,
  type CreatedCommunityGroup,
  type JoinGroupPreview,
} from "./communityApiNative";
import { pasteTextNative } from "./copyTextNative";
import {
  prefetchCommunityGroupDetail,
  prefetchCommunityGroupDetails,
} from "./communityGroupDetailCacheNative";
import {
  prefetchCommunityHeaderImageNative,
  prefetchCommunityHeaderImagesNative,
} from "./prefetchCommunityHeaderImageNative";
import {
  stashLeaderboardsGroupReturn,
} from "../../../../../lib/navigation/leaderboardsGroupReturn";
import type { LeaderboardsStackParamList } from "../../navigation/types";
import type { OpenPublicProfileWarm } from "../../navigation/navigateToPublicProfileNative";

type Props = {
  language: Language;
  bottomReserveY?: number;
  /** @deprecated 詳細はスタック遷移。互換のため残す */
  onOpenProfile?: (
    handle: string,
    groupId?: string,
    warm?: OpenPublicProfileWarm
  ) => void;
  /** プロフィール戻りなどで詳細へスタック遷移する */
  reopenGroupId?: string | null;
  onReopenGroupConsumed?: () => void;
  onOpenSquadBattle?: () => void;
};

export default function RankingsCommunityPanelNative({
  language,
  bottomReserveY = 0,
  reopenGroupId = null,
  onReopenGroupConsumed,
  onOpenSquadBattle,
}: Props) {
  const navigation =
    useNavigation<NativeStackNavigationProp<LeaderboardsStackParamList>>();
  const { fUser } = useFirebaseUser();
  const m = t(language);
  const [groups, setGroups] = useState<CommunityListGroup[]>([]);
  const [limits, setLimits] = useState<CommunityListLimits>(DEFAULT_COMMUNITY_LIMITS);
  const [loadingList, setLoadingList] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState<{ inviteCode: string; groupName: string } | null>(null);
  const [joinBusy, setJoinBusy] = useState(false);
  const [joinPreviewOpen, setJoinPreviewOpen] = useState(false);
  const [joinPreview, setJoinPreview] = useState<JoinGroupPreview | null>(null);
  const [joinPreviewCode, setJoinPreviewCode] = useState("");
  const [joinAlreadyMember, setJoinAlreadyMember] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const getIdToken = useCallback(() => {
    if (!fUser) return Promise.reject(new Error("no user"));
    return fUser.getIdToken();
  }, [fUser]);

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

  const fetchList = useCallback(async () => {
    const h = await communityAuthHeader(getIdToken);
    if (!h) {
      setGroups([]);
      setLimits(DEFAULT_COMMUNITY_LIMITS);
      setLoadingList(false);
      return;
    }
    setLoadingList(true);
    try {
      const res = await fetch(communityApiUrl("/api/communities/list"), {
        headers: { Authorization: h },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setGroups([]);
        setLimits(DEFAULT_COMMUNITY_LIMITS);
        const code = json?.error ?? (res.status === 401 ? "unauthorized" : "error");
        if (code === "unauthorized") {
          setErr(language === "en" ? "Sign in to view your groups." : "グループを表示するにはログインしてください。");
        } else {
          setErr(String(code));
        }
        return;
      }
      setErr(null);
      setGroups(json.groups ?? []);
      if (json.limits) setLimits(json.limits as CommunityListLimits);
    } catch {
      setGroups([]);
      setLimits(DEFAULT_COMMUNITY_LIMITS);
      setErr(
        language === "en"
          ? "Could not reach the server. Check Wi‑Fi and that the API is running."
          : "サーバーに接続できません。Wi‑Fi と API 起動を確認してください。"
      );
    } finally {
      setLoadingList(false);
    }
  }, [getIdToken, language]);

  useEffect(() => {
    if (!fUser) {
      setGroups([]);
      setLimits(DEFAULT_COMMUNITY_LIMITS);
      setLoadingList(false);
      return;
    }
    void fetchList();
  }, [fUser, fetchList]);

  useEffect(() => {
    if (!groups.length || !fUser) return;
    prefetchCommunityGroupDetails(
      groups.map((g) => g.id),
      getIdToken,
      2
    );
    prefetchCommunityHeaderImagesNative(groups.map((g) => g.headerImageUrl));
  }, [groups, fUser, getIdToken]);

  const mapJoinError = useCallback(
    (code: string, json: Record<string, unknown>) => {
      if (code === "group_not_found") return m.rankings.invalidInviteCode;
      if (code === "group_archived") {
        return language === "en" ? "This group is no longer available." : "このグループは利用できません。";
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

  /** モーダル重ねではなくスタック遷移（一覧の上に載る感をなくす） */
  const openGroup = useCallback(
    (g: CommunityListGroup) => {
      stashLeaderboardsGroupReturn(g.id, {
        name: g.name,
        description: g.description,
        headerImageUrl: g.headerImageUrl,
        headerImagePositionY: g.headerImagePositionY,
        memberCount: g.memberCount,
        rankingMetric: g.rankingMetric,
        rankingLeague: g.rankingLeague,
        rankingTeamIds: g.rankingTeamIds,
        isOwner: g.role === "owner",
      });
      prefetchCommunityGroupDetail(g.id, getIdToken);
      prefetchCommunityHeaderImageNative(g.headerImageUrl);
      navigation.navigate("CommunityDetail", { groupId: g.id });
    },
    [getIdToken, navigation]
  );

  useLayoutEffect(() => {
    const id = reopenGroupId?.trim();
    if (!id) return;
    prefetchCommunityGroupDetail(id, getIdToken);
    navigation.navigate("CommunityDetail", { groupId: id });
    onReopenGroupConsumed?.();
  }, [getIdToken, navigation, onReopenGroupConsumed, reopenGroupId]);

  const onGroupCreated = useCallback(
    (created: CreatedCommunityGroup | null | undefined, inviteCode?: string) => {
      setCreateOpen(false);
      if (created?.id) {
        setGroups((prev) => {
          if (prev.some((g) => g.id === created.id)) return prev;
          return [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "ja"));
        });
        setErr(null);
      }
      void fetchList();
      if (inviteCode) {
        setCreatedSuccess({ inviteCode, groupName: created?.name ?? "" });
      }
    },
    [fetchList]
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
      const h = await communityAuthHeader(getIdToken);
      if (!h) return;
      const code = codeRaw.trim();
      if (code.length < 4) return;
      setJoinBusy(true);
      try {
        const res = await fetch(communityApiUrl("/api/communities/preview-invite"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: h },
          body: JSON.stringify({ inviteCode: code }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) {
          setErr(mapJoinError(String(json?.error ?? "error"), json));
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
    [getIdToken, mapJoinError]
  );

  const onJoin = useCallback(async () => {
    setErr(null);
    const h = await communityAuthHeader(getIdToken);
    if (!h) return;
    const code = joinPreviewCode;
    if (!code.trim()) return;
    setJoinBusy(true);
    try {
      const res = await fetch(communityApiUrl("/api/communities/join"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: h },
        body: JSON.stringify({ inviteCode: code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setErr(mapJoinError(String(json?.error ?? "error"), json));
        return;
      }
      closeJoinPreview();
      cyberAlert("", m.community.joinedGroup);
      void fetchList();
    } finally {
      setJoinBusy(false);
    }
  }, [joinPreviewCode, mapJoinError, m, fetchList, closeJoinPreview, getIdToken]);

  const onPasteJoin = useCallback(async (): Promise<string | null> => {
    const pasted = await pasteTextNative();
    if (!pasted) {
      cyberAlert("", language === "en" ? "Could not read clipboard." : "クリップボードを読み取れませんでした。");
    }
    return pasted;
  }, [language]);

  return (
    <View style={[styles.root, { paddingBottom: bottomReserveY }]}>
      <CreateGroupModalNative
        visible={createOpen}
        language={language}
        onClose={() => setCreateOpen(false)}
        onCreated={onGroupCreated}
      />

      <GroupCreatedSuccessModalNative
        visible={createdSuccess != null}
        inviteCode={createdSuccess?.inviteCode ?? ""}
        groupName={createdSuccess?.groupName}
        language={language}
        onClose={() => setCreatedSuccess(null)}
      />

      <JoinGroupConfirmModalNative
        visible={joinPreviewOpen}
        preview={joinPreview}
        alreadyMember={joinAlreadyMember}
        language={language}
        busy={joinBusy}
        onBack={closeJoinPreview}
        onJoin={() => void onJoin()}
      />

      {err ? (
        <View style={styles.errBox}>
          <Text style={styles.errText}>{err}</Text>
        </View>
      ) : null}

      {!fUser ? (
        <View style={styles.signInBox}>
          <Text style={styles.signInText}>
            {language === "en" ? "Sign in to view your community slots." : "ログインするとスロットが表示されます。"}
          </Text>
        </View>
      ) : (
        <CommunitySlotBoardNative
          language={language}
          groups={groups}
          limits={limits}
          loading={loadingList}
          joinBusy={joinBusy}
          onOpenGroup={openGroup}
          onCreate={() => setCreateOpen(true)}
          onPreviewJoin={onPreviewJoin}
          onPasteJoin={onPasteJoin}
          onOpenSquadBattle={onOpenSquadBattle}
          labels={slotLabels}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  errBox: {
    marginHorizontal: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.35)",
    backgroundColor: "rgba(69,10,10,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errText: {
    fontSize: 13,
    color: "rgba(254,202,202,0.95)",
  },
  signInBox: {
    padding: 20,
    alignItems: "center",
  },
  signInText: {
    fontSize: 16,
    color: "rgba(165,243,252,0.55)",
    textAlign: "center",
  },
});
