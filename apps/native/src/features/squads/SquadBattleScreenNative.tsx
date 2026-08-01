/**
 * Web `SquadBattlePage` 相当 — SQUAD BATTLE プレビュー（モック専用）
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";
import CyberSubpageShellNative from "../../ui/CyberSubpageShellNative";
import { colors, fonts, radius, spacing, typography } from "../../theme/tokens";
import {
  SQUAD_BATTLE_HELP_TEXT,
  SQUAD_BATTLE_MAX_MEMBERS,
  SQUAD_BATTLE_MAX_PENDING_APPLICATIONS,
  SQUAD_BATTLE_MOCK_INVITE_CODE,
  SQUAD_BATTLE_NAME_MAX_LEN,
  SQUAD_BATTLE_OPEN_PAGE_SIZE,
  SQUAD_BATTLE_PREVIEW_STATES,
  countActiveMembers,
  getSquadBattleMock,
  squadMemberToProfile,
  squadRankDelta,
  type OpenSquadListing,
  type Squad,
  type SquadApplicantProfile,
  type SquadBattlePreviewState,
  type SquadJoinRequest,
  type SquadMember,
  type PastSquadHistoryMock,
  type SquadIncomingInviteMock,
} from "../../../../../lib/squads/squadBattleMock";
import type { GroupBattlePastSquadItem } from "../../../../../lib/groupBattles/types";
import {
  SQUAD_FIRST_AVATAR_FADE_MS,
  SQUAD_FIRST_FOOTER_FADE_MS,
  squadFirstAvatarDelayMs,
  squadFirstFooterDelayMs,
} from "../../../../../lib/squads/squadFirstPlaceMotion";
import { squadFirstFadeInEntering } from "./squadFirstPlaceMotionNative";
import { CyberSlantedSegBarNative } from "../rankings/CyberSlantedSegBarNative";
import { cyberRankPalette } from "../../../../../lib/rankings/cyberRankVisual";
import { formatListMetricDayDelta } from "../../../../../lib/rankings/listRowMetricMeta";
import CyberNumberNative from "../../ui/CyberNumberNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../rankings/CyberSlantedTabNative";
import { RANK_DISPLAY_FONT, RANKING_SCORE_FONT } from "../rankings/rankingsUiTheme";
import { copyTextNative } from "../leaderboards/copyTextNative";
import {
  RankingsCyberPanelNative,
  RankingsCyberSectionLabelNative,
} from "../rankings/RankingsCyberPanelNative";
import SquadBattleIntroOverlayNative from "./SquadBattleIntroOverlayNative";
import {
  clearSquadBattleIntroSeenNative,
  hasSeenSquadBattleIntroNative,
} from "./squadBattleIntroSeenNative";
import {
  fetchCurrentGroupBattleNative,
  fetchGroupBattleRankingsNative,
  fetchPastGroupBattleSquadsNative,
  reformGroupBattleSquadNative,
  inviteToGroupBattleSquadNative,
  fetchGroupBattleIncomingInvitesNative,
  acceptGroupBattleInviteNative,
  declineGroupBattleInviteNative,
  joinGroupBattleByInviteCodeNative,
} from "./groupBattleApiNative";
import { auth } from "../../lib/firebase";

const ACCENT = "#00F5FF";
/** JOIN CTA — シアン UI から差別化するアンバー/ゴールド */
const JOIN_BATTLE_AMBER = "#FBBF24";
/** 行入場スタッガー（ms）— Web の 40ms に合わせる */
const LB_ROW_STAGGER_MS = 40;

/** HUD 風セクション見出し */
function SquadSectionHeaderNative({
  kicker,
  title,
  trailing,
  accent = "cyan",
}: {
  kicker: string;
  title?: string;
  trailing?: ReactNode;
  accent?: "cyan" | "amber";
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderMain}>
        <RankingsCyberSectionLabelNative subtle={accent === "cyan"}>
          {kicker}
        </RankingsCyberSectionLabelNative>
        {title ? <Text style={styles.boardTitle}>{title}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

/** 一覧行用の控えめサイバー枠 */
function SquadListItemShellNative({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <RankingsCyberPanelNative
      subtle
      compact
      decorated
      style={[styles.listItemShell, style]}
      innerStyle={styles.listItemInner}
    >
      {children}
    </RankingsCyberPanelNative>
  );
}

/** ページネーションバー（‹ 1 2 3 ›） */
function SquadPageBarNative({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i);
  return (
    <View style={styles.pageBar} accessibilityRole="adjustable">
      <Pressable
        disabled={page <= 0}
        onPress={() => onChange(page - 1)}
        accessibilityLabel="前のページ"
        style={({ pressed }) => [
          styles.pageNavBtn,
          page <= 0 && styles.pageNavBtnDisabled,
          pressed && page > 0 && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={18}
          color={page <= 0 ? "rgba(255,255,255,0.2)" : "#ecfeff"}
        />
      </Pressable>
      {pages.map((p) => {
        const active = p === page;
        return (
          <Pressable
            key={p}
            onPress={() => onChange(p)}
            accessibilityLabel={`${p + 1}ページ目`}
            style={({ pressed }) => [
              styles.pageNumBtn,
              active && styles.pageNumBtnActive,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[styles.pageNumText, active && styles.pageNumTextActive]}
            >
              {p + 1}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        disabled={page >= pageCount - 1}
        onPress={() => onChange(page + 1)}
        accessibilityLabel="次のページ"
        style={({ pressed }) => [
          styles.pageNavBtn,
          page >= pageCount - 1 && styles.pageNavBtnDisabled,
          pressed && page < pageCount - 1 && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={
            page >= pageCount - 1 ? "rgba(255,255,255,0.2)" : "#ecfeff"
          }
        />
      </Pressable>
    </View>
  );
}

/** 得点・順位数字: 1〜3位はパレット、4位以下は白 */
function scoreColorForRank(rank: number): string {
  if (rank <= 3) return cyberRankPalette(rank).accent;
  return "rgba(255,255,255,0.92)";
}

/**
 * Native の textShadow は矩形に切れやすいので、弱い半透明＋小さめ半径だけ使う。
 * Android は矩形化が目立つためオフ。
 */
function softRankTextGlow(rank: number): {
  textShadowColor: string;
  textShadowOffset: { width: number; height: number };
  textShadowRadius: number;
} | Record<string, never> {
  if (rank > 3 || Platform.OS === "android") return {};
  const accent = cyberRankPalette(rank).accent;
  return {
    textShadowColor:
      accent.length === 7
        ? `${accent}55`
        : "rgba(255,214,90,0.32)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2.5,
  };
}

/** セグメント色も得点文字と同じ（1〜3位パレット / 4位以下は白） */
function segAccentForRank(rank: number) {
  const color = scoreColorForRank(rank);
  if (rank <= 3) {
    const p = cyberRankPalette(rank);
    return {
      border: p.accent,
      glow: p.accentGlow,
      bg: p.stroke,
    };
  }
  return {
    border: color,
    glow: "rgba(255,255,255,0.35)",
    bg: "rgba(255,255,255,0.55)",
  };
}

function pointsBarPct(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

/** 順位変動バッジ */
function RankTrendBadgeNative({
  squad,
}: {
  squad: Pick<Squad, "rank" | "prevRank">;
}) {
  const delta = squadRankDelta(squad);
  if (delta > 0) {
    return <Text style={styles.trendUp}>▲{delta}</Text>;
  }
  if (delta < 0) {
    return <Text style={styles.trendDown}>▼{Math.abs(delta)}</Text>;
  }
  return <Text style={styles.trendFlat}>−</Text>;
}

/** Web `SquadAvgDayDelta` 相当 — ランキング一覧の当日増減 */
function SquadAvgDayDeltaNative({ delta }: { delta?: number | null }) {
  const text = formatListMetricDayDelta("totalScore", delta);
  if (!text) return null;
  return <Text style={styles.dayDelta}>{text}</Text>;
}

/** Web `SquadPtsWithDayDelta` 相当 — 数字の右に +N / pts を縦積み */
function SquadPtsWithDayDeltaNative({
  value,
  delta,
  size = "sm",
  tone = "accent",
  color,
}: {
  value: number;
  delta?: number | null;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "accent" | "muted";
  color?: string;
}) {
  return (
    <View style={styles.ptsWithDeltaRow}>
      <SquadPointsTextNative value={value} size={size} tone={tone} color={color} />
      <View style={styles.ptsWithDeltaStack}>
        <SquadAvgDayDeltaNative delta={delta} />
        <Text style={styles.ptsWithDeltaSuffix}>pts</Text>
      </View>
    </View>
  );
}


function SquadPointsTextNative({
  value,
  size = "sm",
  tone = "default",
  prefixHash = false,
  suffix = "",
  color,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "accent" | "muted";
  prefixHash?: boolean;
  suffix?: string;
  /** 順位パレット色など */
  color?: string;
}) {
  const glow =
    tone === "muted" ? 0.35 : tone === "accent" ? 0.85 : 0.72;
  return (
    <CyberNumberNative
      value={value}
      size={size}
      glowIntensity={glow}
      prefix={prefixHash ? "#" : ""}
      suffix={suffix}
      format={!prefixHash}
      color={color}
    />
  );
}

function MemberAvatarNative({
  member,
  size = "md",
}: {
  member: SquadMember;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? 28 : 36;
  if (member.empty) {
    return (
      <View
        style={[
          styles.avatar,
          styles.avatarEmpty,
          { width: dim, height: dim, borderRadius: dim / 2 },
        ]}
      >
        <MaterialCommunityIcons
          name="plus"
          size={size === "sm" ? 12 : 14}
          color="rgba(255,255,255,0.35)"
        />
      </View>
    );
  }
  const initial = (member.displayName || member.handle || "?")
    .slice(0, 1)
    .toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        styles.avatarFilled,
        { width: dim, height: dim, borderRadius: dim / 2 },
      ]}
    >
      <Text style={[styles.avatarInitial, size === "sm" && styles.avatarInitialSm]}>
        {initial}
      </Text>
    </View>
  );
}

function ProfileAvatarNative({
  profile,
  size = "md",
}: {
  profile: Pick<SquadApplicantProfile, "displayName" | "handle">;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? 64 : 40;
  const initial = (profile.displayName || profile.handle || "?")
    .slice(0, 1)
    .toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        styles.avatarFilled,
        { width: dim, height: dim, borderRadius: dim / 2 },
      ]}
    >
      <Text style={[styles.avatarInitial, size === "lg" && styles.avatarInitialLg]}>
        {initial}
      </Text>
    </View>
  );
}

function MemberRowNative({
  member,
  onOpenProfile,
  elevated = false,
}: {
  member: SquadMember;
  onOpenProfile?: (profile: SquadApplicantProfile) => void;
  elevated?: boolean;
}) {
  if (member.empty) {
    return (
      <View
        style={[
          styles.memberRow,
          styles.memberRowEmpty,
          elevated && styles.memberRowElevated,
        ]}
      >
        <MemberAvatarNative member={member} />
        <View style={styles.memberMeta}>
          <Text style={styles.memberEmptyTitle}>空き枠 · 募集中</Text>
          <Text style={styles.memberEmptySub}>OPEN SLOT</Text>
        </View>
      </View>
    );
  }
  const posts = squadMemberToProfile(member).totalPosts;
  const content = (
    <>
      <MemberAvatarNative member={member} />
      <View style={styles.memberMeta}>
        <Text style={styles.memberName} numberOfLines={1}>
          {member.displayName}
        </Text>
      </View>
      <View style={styles.memberStats}>
        <SquadPointsTextNative
          value={posts}
          size="sm"
          suffix="posts"
          color="#CBD5E1"
        />
        <SquadPointsTextNative value={member.points} size="sm" suffix="pts" />
      </View>
    </>
  );
  if (onOpenProfile) {
    return (
      <Pressable
        onPress={() => onOpenProfile(squadMemberToProfile(member))}
        style={({ pressed }) => [
          styles.memberRow,
          elevated && styles.memberRowElevated,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View style={[styles.memberRow, elevated && styles.memberRowElevated]}>
      {content}
    </View>
  );
}

function MySquadCardNative({
  squad,
  maxAvg,
  onOpenMemberProfile,
  onCopyInviteCode,
  onRenameSquad,
}: {
  squad: Squad;
  maxAvg: number;
  onOpenMemberProfile?: (profile: SquadApplicantProfile) => void;
  onCopyInviteCode?: (code: string) => void;
  onRenameSquad?: (name: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(squad.name);

  useEffect(() => {
    if (!editingName) setDraftName(squad.name);
  }, [squad.name, editingName]);

  const trimmedDraft = draftName.trim();
  const canSaveRename =
    trimmedDraft.length > 0 &&
    trimmedDraft.length <= SQUAD_BATTLE_NAME_MAX_LEN &&
    trimmedDraft !== squad.name;

  function commitRename() {
    if (!canSaveRename || !onRenameSquad) return;
    onRenameSquad(trimmedDraft);
    setEditingName(false);
  }

  function cancelRename() {
    setDraftName(squad.name);
    setEditingName(false);
  }

  const active = countActiveMembers(squad);
  const recruiting = active < SQUAD_BATTLE_MAX_MEMBERS;
  const inviteCode = recruiting ? squad.inviteCode ?? null : null;
  const first = squad.rank === 1;
  const segAccent =
    squad.rank <= 3
      ? segAccentForRank(squad.rank)
      : {
          border: "#00F5FF",
          glow: "rgba(0,245,255,0.65)",
          bg: "rgba(0,245,255,0.85)",
        };

  return (
    <View style={styles.mySquadOuter}>
      <View style={styles.mySquadTab}>
        <View style={styles.mySquadTabDot} />
        <Text style={styles.mySquadTabText}>My squad</Text>
      </View>

      <View
        style={[
          styles.mySquadShell,
          first && styles.lbRowFirst,
          squad.rank === 2 && styles.lbRowSecond,
          squad.rank === 3 && styles.lbRowThird,
        ]}
      >
        <View style={styles.mySquadHero}>
          {editingName ? (
            <View style={styles.mySquadRenameBox}>
              <View style={styles.mySquadRenameHead}>
                <Text style={styles.mySquadRenameLabel}>Rename squad</Text>
                <Text style={styles.mySquadRenameCount}>
                  {draftName.length}/{SQUAD_BATTLE_NAME_MAX_LEN}
                </Text>
              </View>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                maxLength={SQUAD_BATTLE_NAME_MAX_LEN}
                autoFocus
                autoCapitalize="characters"
                placeholder="NEON CIRCUIT"
                placeholderTextColor="rgba(255,255,255,0.2)"
                style={styles.mySquadRenameInput}
                onSubmitEditing={commitRename}
              />
              <View style={styles.mySquadRenameActions}>
                <Pressable
                  onPress={cancelRename}
                  style={({ pressed }) => [
                    styles.mySquadRenameCancel,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.mySquadRenameCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={commitRename}
                  disabled={!canSaveRename}
                  style={({ pressed }) => [
                    styles.mySquadRenameSave,
                    !canSaveRename && styles.mySquadRenameSaveDisabled,
                    pressed && canSaveRename && { opacity: 0.9 },
                  ]}
                >
                  <MaterialCommunityIcons name="check" size={14} color="#ECFEFF" />
                  <Text style={styles.mySquadRenameSaveText}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.mySquadTitleRow}>
              <Text style={styles.mySquadTitle} numberOfLines={1}>
                {squad.name}
              </Text>
              {onRenameSquad ? (
                <Pressable
                  onPress={() => {
                    setDraftName(squad.name);
                    setEditingName(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="スクワッド名を変更"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.mySquadRenameBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={14}
                    color="rgba(165,243,252,0.9)"
                  />
                </Pressable>
              ) : null}
            </View>
          )}

          <View style={styles.mySquadHudRow}>
            <View style={styles.mySquadHudCell}>
              <Text style={styles.mySquadHudLabel}>Rank</Text>
              <View style={styles.mySquadHudValueRow}>
                <Text
                  style={[
                    styles.mySquadHudMetric,
                    {
                      color: scoreColorForRank(squad.rank),
                      ...(squad.rank <= 3
                        ? {
                            textShadowColor: cyberRankPalette(squad.rank).accentGlow,
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 5,
                          }
                        : {
                            textShadowColor: "rgba(255,255,255,0.22)",
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 4,
                          }),
                    },
                  ]}
                >
                  {String(squad.rank).padStart(2, "0")}
                </Text>
                <View style={styles.mySquadHudTrendAbs} pointerEvents="none">
                  <RankTrendBadgeNative squad={squad} />
                </View>
              </View>
            </View>

            <View style={styles.mySquadHudCell}>
              <Text style={styles.mySquadHudLabel}>Avg</Text>
              <View style={styles.mySquadHudValueRow}>
                <SquadPtsWithDayDeltaNative
                  value={squad.avgPoints}
                  delta={squad.avgPointsDayDelta}
                  size="sm"
                  tone="accent"
                />
              </View>
            </View>

            {inviteCode ? (
              <Pressable
                onPress={() => onCopyInviteCode?.(inviteCode)}
                accessibilityRole="button"
                accessibilityLabel={`招待コード ${inviteCode} をコピー`}
                style={({ pressed }) => [
                  styles.mySquadHudCell,
                  pressed && styles.mySquadHudCodePressed,
                ]}
              >
                <Text style={styles.mySquadHudLabel}>Code</Text>
                <View style={styles.mySquadHudValueRow}>
                  <Text
                    style={[
                      styles.mySquadHudCode,
                      { color: scoreColorForRank(squad.rank) },
                    ]}
                    numberOfLines={1}
                  >
                    {inviteCode}
                  </Text>
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={12}
                    color="rgba(255,255,255,0.45)"
                  />
                </View>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.mySquadBar}>
            <CyberSlantedSegBarNative
              pct={pointsBarPct(squad.avgPoints, maxAvg)}
              segments={10}
              compact
              forceStatic
              accent={segAccent}
            />
          </View>
        </View>

        <View style={styles.mySquadMembersSection}>
          <RankingsCyberSectionLabelNative>Members</RankingsCyberSectionLabelNative>
          <View style={styles.mySquadMemberList}>
            {squad.members.map((m) => (
              <MemberRowNative
                key={m.uid}
                member={m}
                elevated
                onOpenProfile={onOpenMemberProfile}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

/** Web `CreateSquadNameSheet` 相当 — コールサイン登録 HUD */
function CreateSquadNameModalNative({
  visible,
  onClose,
  onCreate,
  initialName = "",
  eyebrow = "New squad · callsign",
  submitLabel = "Deploy",
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  initialName?: string;
  eyebrow?: string;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const canSubmit =
    trimmed.length > 0 && trimmed.length <= SQUAD_BATTLE_NAME_MAX_LEN;
  const preview = trimmed.length > 0 ? trimmed : "————";

  useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  function dismiss() {
    setName("");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable style={styles.createModalBackdrop} onPress={dismiss}>
        <Pressable
          style={styles.createModalCard}
          onPress={(e) => e.stopPropagation()}
        >
          {/* 角ブラケット */}
          <View style={[styles.createBracket, styles.createBracketTL]} pointerEvents="none" />
          <View style={[styles.createBracket, styles.createBracketTR]} pointerEvents="none" />
          <View style={[styles.createBracket, styles.createBracketBL]} pointerEvents="none" />
          <View style={[styles.createBracket, styles.createBracketBR]} pointerEvents="none" />

          <View style={styles.createModalInner}>
            <View style={styles.createModalHeader}>
              <View style={styles.createModalEyebrowRow}>
                <View style={styles.createModalDot} />
                <Text style={styles.createModalEyebrow}>{eyebrow}</Text>
              </View>
              <Pressable
                onPress={dismiss}
                style={styles.createModalCloseBtn}
                accessibilityLabel="閉じる"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={15}
                  color="rgba(254,243,199,0.85)"
                />
              </Pressable>
            </View>

            <View style={styles.createPreviewBox}>
              <Text style={styles.createPreviewLabel}>Preview</Text>
              <Text
                style={[
                  styles.createPreviewName,
                  trimmed.length > 0
                    ? styles.createPreviewNameActive
                    : styles.createPreviewNameEmpty,
                ]}
                numberOfLines={1}
              >
                {preview}
              </Text>
              <Text style={styles.createPreviewHint}>
                対戦相手に表示される名前 · あとから変更可
              </Text>
            </View>

            <View style={styles.createFieldHeader}>
              <Text style={styles.createModalFieldLabel}>Squad name</Text>
              <Text style={styles.createModalCounter}>
                {name.length}/{SQUAD_BATTLE_NAME_MAX_LEN}
              </Text>
            </View>
            <TextInput
              value={name}
              onChangeText={(t) =>
                setName(t.slice(0, SQUAD_BATTLE_NAME_MAX_LEN))
              }
              placeholder="NEON CIRCUIT"
              placeholderTextColor="rgba(255,255,255,0.2)"
              autoFocus
              autoCapitalize="characters"
              maxLength={SQUAD_BATTLE_NAME_MAX_LEN}
              onSubmitEditing={() => {
                if (canSubmit) {
                  setName("");
                  onCreate(trimmed);
                }
              }}
              style={styles.createModalInput}
            />

            <Pressable
              onPress={() => {
                if (!canSubmit) return;
                setName("");
                onCreate(trimmed);
              }}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.createModalSubmit,
                !canSubmit && styles.createModalSubmitDisabled,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons name="plus" size={15} color="#FEF3C7" />
              <Text style={styles.createModalSubmitText}>{submitLabel}</Text>
            </Pressable>
            <Pressable
              onPress={dismiss}
              style={({ pressed }) => [
                styles.createModalCancelLink,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.createModalCancelLinkText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function normalizeUiInviteCodeNative(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "");
}

/** Web `JoinByInviteCodeSheet` 相当 */
function JoinByInviteCodeModalNative({
  visible,
  onClose,
  onJoin,
  busy,
}: {
  visible: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
  busy?: boolean;
}) {
  const [code, setCode] = useState("");
  const trimmed = normalizeUiInviteCodeNative(code);
  const canSubmit = trimmed.length >= 4 && !busy;

  useEffect(() => {
    if (visible) setCode("");
  }, [visible]);

  function dismiss() {
    if (busy) return;
    setCode("");
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable style={styles.createModalBackdrop} onPress={dismiss}>
        <Pressable
          style={styles.createModalCard}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.createBracket, styles.createBracketTL]} pointerEvents="none" />
          <View style={[styles.createBracket, styles.createBracketTR]} pointerEvents="none" />
          <View style={[styles.createBracket, styles.createBracketBL]} pointerEvents="none" />
          <View style={[styles.createBracket, styles.createBracketBR]} pointerEvents="none" />

          <View style={styles.createModalInner}>
            <View style={styles.createModalHeader}>
              <View style={styles.createModalEyebrowRow}>
                <View style={styles.createModalDot} />
                <Text style={styles.createModalEyebrow}>Invite code</Text>
              </View>
              <Pressable
                onPress={dismiss}
                style={styles.createModalCloseBtn}
                accessibilityLabel="閉じる"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={15}
                  color="rgba(254,243,199,0.85)"
                />
              </Pressable>
            </View>

            <Text style={styles.joinCodeHint}>
              代表者から共有されたコードを入力
            </Text>

            <View style={styles.createFieldHeader}>
              <Text style={styles.createModalFieldLabel}>Code</Text>
            </View>
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.slice(0, 24))}
              placeholder={SQUAD_BATTLE_MOCK_INVITE_CODE}
              placeholderTextColor="rgba(255,255,255,0.2)"
              autoFocus
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={24}
              onSubmitEditing={() => {
                if (canSubmit) onJoin(trimmed);
              }}
              style={styles.createModalInput}
            />

            <Pressable
              onPress={() => {
                if (!canSubmit) return;
                onJoin(trimmed);
              }}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.createModalSubmit,
                !canSubmit && styles.createModalSubmitDisabled,
                pressed && canSubmit && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                name="ticket-outline"
                size={15}
                color="#FEF3C7"
              />
              <Text style={styles.createModalSubmitText}>
                {busy ? "参加中…" : "参加する"}
              </Text>
            </Pressable>
            <Pressable
              onPress={dismiss}
              style={({ pressed }) => [
                styles.createModalCancelLink,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.createModalCancelLinkText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ApplicantProfileModalNative({
  visible,
  profile,
  metaLabel,
  onClose,
  onApprove,
  onReject,
}: {
  visible: boolean;
  profile: SquadApplicantProfile | null;
  metaLabel?: string;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  if (!profile) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalEyebrow}>Applicant profile</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="閉じる">
              <MaterialCommunityIcons name="close" size={18} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.profileHeader}>
              <ProfileAvatarNative profile={profile} size="lg" />
              <View style={styles.profileMeta}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {profile.displayName}
                </Text>
                <Text style={styles.profileHandle}>@{profile.handle}</Text>
                {metaLabel ? <Text style={styles.profileMetaLabel}>{metaLabel}</Text> : null}
              </View>
            </View>

            {profile.bio ? (
              <Text style={styles.profileBio}>{profile.bio}</Text>
            ) : null}

            <View style={styles.statGrid}>
              {(
                [
                  {
                    k: "POINTS",
                    node: <SquadPointsTextNative value={profile.points} size="md" />,
                  },
                  {
                    k: "WIN RATE",
                    node: (
                      <CyberNumberNative
                        value={profile.winRate.toFixed(1)}
                        size="md"
                        format={false}
                        suffix="%"
                      />
                    ),
                  },
                  {
                    k: "STREAK",
                    node: (
                      <SquadPointsTextNative
                        value={profile.activeWinStreak}
                        size="md"
                      />
                    ),
                  },
                  {
                    k: "POSTS",
                    node: (
                      <SquadPointsTextNative
                        value={profile.totalPosts}
                        size="md"
                      />
                    ),
                  },
                ] as const
              ).map((stat) => (
                <View key={stat.k} style={styles.statCard}>
                  <Text style={styles.statKey}>{stat.k}</Text>
                  <View style={styles.statSegWrap}>{stat.node}</View>
                </View>
              ))}
            </View>
          </View>

          {onApprove || onReject ? (
            <View style={styles.modalActions}>
              {onReject ? (
                <Pressable
                  onPress={onReject}
                  style={({ pressed }) => [styles.rejectBtn, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name="close" size={14} color="#fecdd3" />
                  <Text style={styles.rejectBtnText}>拒否</Text>
                </Pressable>
              ) : null}
              {onApprove ? (
                <Pressable
                  onPress={onApprove}
                  style={({ pressed }) => [styles.approveBtn, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name="check" size={14} color="#ecfeff" />
                  <Text style={styles.approveBtnText}>承認</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function OpenSquadRowNative({
  squad,
  applied,
  applyDisabled,
  onApply,
  onOpenMemberProfile,
}: {
  squad: OpenSquadListing;
  applied: boolean;
  applyDisabled: boolean;
  onApply: () => void;
  onOpenMemberProfile: (profile: SquadApplicantProfile) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const canApply = !applied && !applyDisabled;
  const palette = cyberRankPalette(squad.rank);

  return (
    <SquadListItemShellNative>
      <View style={styles.openRow}>
        {/* 列: 順位 | 名前 | 人数 | pts | 操作 */}
        <Text
          style={[
            styles.openRank,
            {
              color: scoreColorForRank(squad.rank),
              ...(squad.rank <= 3
                ? {
                    textShadowColor: palette.accentGlow,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 4,
                  }
                : {}),
            },
          ]}
        >
          {String(squad.rank).padStart(2, "0")}
        </Text>

        <Text style={styles.openName} numberOfLines={1}>
          {squad.name}
        </Text>

        <Text style={styles.openMetaChip}>
          {squad.memberCount}/{SQUAD_BATTLE_MAX_MEMBERS}
        </Text>

        <View style={styles.openPts}>
          <SquadPointsTextNative
            value={squad.avgPoints}
            size="sm"
            tone="default"
            suffix="pts"
            color={scoreColorForRank(squad.rank)}
          />
        </View>

        <View style={styles.openActions}>
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={expanded ? "メンバーを閉じる" : "メンバーを見る"}
            accessibilityState={{ expanded }}
            style={({ pressed }) => [
              styles.viewMembersBtn,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#ecfeff"
            />
          </Pressable>
          <Pressable
            disabled={!canApply && !applied}
            onPress={onApply}
            style={[
              styles.applyBtn,
              applied && styles.applyBtnPending,
              applyDisabled && !applied && styles.applyBtnDisabled,
            ]}
          >
            <Text
              style={[
                styles.applyBtnText,
                applied && styles.applyBtnTextPending,
                applyDisabled && !applied && styles.applyBtnTextDisabled,
              ]}
            >
              {applied ? "申請中" : "申請"}
            </Text>
          </Pressable>
        </View>
      </View>
      {expanded ? (
        <View style={styles.openMembers}>
          {squad.members.map((m) => (
            <Pressable
              key={m.uid}
              onPress={() => onOpenMemberProfile(m)}
              style={({ pressed }) => [styles.openMemberRow, pressed && styles.pressed]}
            >
              <ProfileAvatarNative profile={m} />
              <View style={styles.openMeta}>
                <Text style={styles.memberName} numberOfLines={1}>
                  {m.displayName}
                </Text>
                <Text style={styles.memberHandle} numberOfLines={1}>
                  @{m.handle}
                </Text>
              </View>
              <SquadPointsTextNative value={m.points} size="sm" />
            </Pressable>
          ))}
        </View>
      ) : null}
    </SquadListItemShellNative>
  );
}

function PastSquadsPanelNative({
  pastSquads,
  selfUid,
  canReform,
  canInvite,
  busyId,
  onReform,
  onInvite,
}: {
  pastSquads: Array<PastSquadHistoryMock | GroupBattlePastSquadItem>;
  selfUid: string;
  /** 未所属時のみ一括再招集可 */
  canReform: boolean;
  /** 自スクワッド owner 時のみ個別招待可 */
  canInvite: boolean;
  busyId: string | null;
  onReform: (item: PastSquadHistoryMock | GroupBattlePastSquadItem) => void;
  onInvite: (
    item: PastSquadHistoryMock | GroupBattlePastSquadItem,
    memberUid: string
  ) => void;
}) {
  if (pastSquads.length === 0) return null;

  return (
    <View style={styles.sectionBlock}>
      <SquadSectionHeaderNative
        kicker="Past squads"
        title="過去のスクワッド"
        trailing={
          <Text style={styles.boardCount}>直近 {pastSquads.length} 大会</Text>
        }
      />
      <View style={styles.listGap}>
        {pastSquads.map((item) => {
          const key = `${item.battleId}:${item.squadId}`;
          const others = item.members.filter((m) => m.uid !== selfUid);
          return (
            <View key={key} style={styles.pastSquadCard}>
              <View style={styles.pastSquadHead}>
                <MaterialCommunityIcons
                  name="history"
                  size={14}
                  color="rgba(103,232,249,0.85)"
                  style={styles.pastSquadIcon}
                />
                <View style={styles.openMeta}>
                  <Text style={styles.pastSquadName} numberOfLines={1}>
                    {item.squadName}
                  </Text>
                  <Text style={styles.openSub}>
                    {item.battleName}
                    {item.role === "owner" ? " · 代表" : " · メンバー"}
                  </Text>
                  <Text style={styles.pastSquadMembers} numberOfLines={1}>
                    {item.members.map((m) => m.displayName).join(" · ")}
                  </Text>
                </View>
              </View>

              {canReform && item.role === "owner" ? (
                <Pressable
                  disabled={busyId === key}
                  onPress={() => onReform(item)}
                  style={({ pressed }) => [
                    styles.pastSquadReformBtn,
                    busyId === key && styles.pastSquadBtnDisabled,
                    pressed && busyId !== key && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={14}
                    color="#ecfeff"
                  />
                  <Text style={styles.pastSquadReformBtnText}>
                    同じメンバーで募集
                  </Text>
                </Pressable>
              ) : null}

              {canInvite ? (
                <View style={styles.pastInviteList}>
                  {others.map((m) => (
                    <View key={m.uid} style={styles.pastInviteRow}>
                      <Text style={styles.pastInviteName} numberOfLines={1}>
                        {m.displayName}
                        {m.handle ? (
                          <Text style={styles.pastInviteHandle}> @{m.handle}</Text>
                        ) : null}
                      </Text>
                      <Pressable
                        disabled={busyId === `${key}:${m.uid}`}
                        onPress={() => onInvite(item, m.uid)}
                        style={({ pressed }) => [
                          styles.pastInviteBtn,
                          busyId === `${key}:${m.uid}` && styles.pastSquadBtnDisabled,
                          pressed &&
                            busyId !== `${key}:${m.uid}` &&
                            styles.pressed,
                        ]}
                      >
                        <Text style={styles.pastInviteBtnText}>誘う</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              {!canReform && !canInvite && item.role === "owner" ? (
                <Text style={styles.pastSquadHint}>
                  未所属時に「同じメンバーで募集」できます
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function IncomingInvitesPanelNative({
  invites,
  onAccept,
  onDecline,
}: {
  invites: SquadIncomingInviteMock[];
  onAccept: (invite: SquadIncomingInviteMock) => void;
  onDecline: (invite: SquadIncomingInviteMock) => void;
}) {
  if (invites.length === 0) return null;

  return (
    <View style={styles.sectionBlock}>
      <SquadSectionHeaderNative
        kicker="Invites"
        title="再招集の招待"
        accent="amber"
        trailing={
          <Text style={styles.boardCount}>{invites.length} pending</Text>
        }
      />
      <View style={styles.listGap}>
        {invites.map((inv) => (
          <View key={inv.id} style={styles.incomingInviteCard}>
            <View style={styles.incomingInviteHead}>
              <MaterialCommunityIcons
                name="email-outline"
                size={14}
                color="rgba(253,230,138,0.85)"
              />
              <View style={styles.openMeta}>
                <Text style={styles.outgoingName} numberOfLines={1}>
                  {inv.squadName}
                </Text>
                <Text style={styles.openSub}>
                  {inv.fromDisplayName} からの招待
                </Text>
              </View>
            </View>
            <View style={styles.incomingInviteActions}>
              <Pressable
                onPress={() => onAccept(inv)}
                style={({ pressed }) => [
                  styles.incomingInviteAcceptBtn,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons name="check" size={13} color="#ecfeff" />
                <Text style={styles.approveBtnText}>参加する</Text>
              </Pressable>
              <Pressable
                onPress={() => onDecline(inv)}
                style={({ pressed }) => [
                  styles.incomingInviteDeclineBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.incomingInviteDeclineText}>今回はパス</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function NoneStateNative({
  openSquads,
  outgoingRequests,
  appliedSquadIds,
  pendingCount,
  pastSquads,
  incomingInvites,
  reformBusyId,
  selfUid,
  onCreate,
  onJoinByCode,
  onApply,
  onOpenMemberProfile,
  onReform,
  onAcceptInvite,
  onDeclineInvite,
}: {
  openSquads: OpenSquadListing[];
  outgoingRequests: SquadJoinRequest[];
  appliedSquadIds: Set<string>;
  pendingCount: number;
  pastSquads: Array<PastSquadHistoryMock | GroupBattlePastSquadItem>;
  incomingInvites: SquadIncomingInviteMock[];
  reformBusyId: string | null;
  selfUid: string;
  onCreate: () => void;
  onJoinByCode: () => void;
  onApply: (squadId: string, squadName: string) => void;
  onOpenMemberProfile: (profile: SquadApplicantProfile) => void;
  onReform: (item: PastSquadHistoryMock | GroupBattlePastSquadItem) => void;
  onAcceptInvite: (invite: SquadIncomingInviteMock) => void;
  onDeclineInvite: (invite: SquadIncomingInviteMock) => void;
}) {
  const atLimit = pendingCount >= SQUAD_BATTLE_MAX_PENDING_APPLICATIONS;
  const [page, setPage] = useState(0);
  const pageCount = Math.max(
    1,
    Math.ceil(openSquads.length / SQUAD_BATTLE_OPEN_PAGE_SIZE)
  );
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = openSquads.slice(
    safePage * SQUAD_BATTLE_OPEN_PAGE_SIZE,
    safePage * SQUAD_BATTLE_OPEN_PAGE_SIZE + SQUAD_BATTLE_OPEN_PAGE_SIZE
  );

  return (
    <View style={styles.noneWrap}>
      <View style={styles.noneCardWrap}>
        <View style={styles.noneCardInner}>
        <View style={styles.noneIcon}>
          <MaterialCommunityIcons name="account-group-outline" size={28} color={JOIN_BATTLE_AMBER} />
        </View>
        <Text style={styles.noneTitle}>Join the battle</Text>
        <View style={styles.noneCtaStack}>
        <Pressable
          onPress={onCreate}
          style={({ pressed }) => [styles.ctaPrimary, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="plus" size={16} color="#FEF3C7" />
          <Text style={styles.ctaPrimaryText}>グループを作成</Text>
        </Pressable>
        <Pressable
          onPress={onJoinByCode}
          style={({ pressed }) => [styles.ctaSecondary, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="ticket-outline" size={16} color="rgba(254,243,199,0.85)" />
          <Text style={styles.ctaSecondaryText}>招待コードで参加</Text>
        </Pressable>
        </View>
        </View>
      </View>

      <IncomingInvitesPanelNative
        invites={incomingInvites}
        onAccept={onAcceptInvite}
        onDecline={onDeclineInvite}
      />

      <PastSquadsPanelNative
        pastSquads={pastSquads}
        selfUid={selfUid}
        canReform
        canInvite={false}
        busyId={reformBusyId}
        onReform={onReform}
        onInvite={() => {}}
      />

      {outgoingRequests.length > 0 ? (
        <View style={styles.sectionBlock}>
          <SquadSectionHeaderNative
            kicker="My applications"
            accent="amber"
            trailing={
              <Text
                style={[
                  styles.applyCounterChip,
                  atLimit && styles.applyCounterChipLimit,
                ]}
              >
                {pendingCount}/{SQUAD_BATTLE_MAX_PENDING_APPLICATIONS}
              </Text>
            }
          />
          {atLimit ? (
            <Text style={styles.limitHint}>
              申請は最大 {SQUAD_BATTLE_MAX_PENDING_APPLICATIONS}{" "}
              件までです。承認または取り下げ後に追加できます。
            </Text>
          ) : null}
          <View style={styles.listGap}>
            {outgoingRequests.map((req) => (
              <View key={req.id} style={styles.outgoingRow}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="rgba(253,230,138,0.8)" />
                <View style={styles.openMeta}>
                  <Text style={styles.outgoingName} numberOfLines={1}>
                    {req.squadName}
                  </Text>
                  <Text style={styles.openSub}>承認待ち · {req.createdAtLabel}</Text>
                </View>
                <Text style={styles.pendingBadge}>Pending</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.sectionBlock}>
        <SquadSectionHeaderNative
          kicker="Open squads"
          title="空き枠あり"
          trailing={
            <View style={styles.applyCounterBlock}>
              <Text
                style={[
                  styles.applyCounterChip,
                  atLimit && styles.applyCounterChipLimit,
                ]}
              >
                Applications {pendingCount}/{SQUAD_BATTLE_MAX_PENDING_APPLICATIONS}
              </Text>
              <Text style={styles.boardCount}>{openSquads.length} groups</Text>
            </View>
          }
        />
        {atLimit && outgoingRequests.length === 0 ? (
          <Text style={styles.limitHint}>
            申請は最大 {SQUAD_BATTLE_MAX_PENDING_APPLICATIONS}{" "}
            件までです。承認または取り下げ後に追加できます。
          </Text>
        ) : null}
        <View style={styles.listGap}>
          {pageItems.map((squad) => (
            <OpenSquadRowNative
              key={squad.id}
              squad={squad}
              applied={appliedSquadIds.has(squad.id)}
              applyDisabled={atLimit}
              onApply={() => onApply(squad.id, squad.name)}
              onOpenMemberProfile={onOpenMemberProfile}
            />
          ))}
        </View>
        <SquadPageBarNative
          page={safePage}
          pageCount={pageCount}
          onChange={setPage}
        />
      </View>
    </View>
  );
}

function IncomingRequestsNative({
  requests,
  onOpenProfile,
  onApprove,
  onReject,
}: {
  requests: SquadJoinRequest[];
  onOpenProfile: (req: SquadJoinRequest) => void;
  onApprove: (req: SquadJoinRequest) => void;
  onReject: (req: SquadJoinRequest) => void;
}) {
  if (requests.length === 0) return null;
  return (
    <View style={styles.sectionBlock}>
      <SquadSectionHeaderNative
        kicker="Join requests"
        title="参加申請"
        trailing={
          <Text style={styles.boardCount}>{requests.length} pending</Text>
        }
      />
      <View style={styles.listGap}>
        {requests.map((req) => (
          <SquadListItemShellNative key={req.id} style={styles.requestCardShell}>
            <View style={styles.requestCard}>
            <Pressable
              onPress={() => onOpenProfile(req)}
              style={({ pressed }) => [styles.requestMain, pressed && styles.pressed]}
            >
              <ProfileAvatarNative profile={req.applicant} />
              <View style={styles.openMeta}>
                <View style={styles.requestNameRow}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {req.applicant.displayName}
                  </Text>
                  <Text style={styles.requestTimeLabel} numberOfLines={1}>
                    {req.createdAtLabel}
                  </Text>
                </View>
                <View style={styles.requestStatsRow}>
                  <SquadPointsTextNative
                    value={req.applicant.points}
                    size="sm"
                    suffix="pts"
                  />
                  <Text style={styles.requestStatsDot} aria-hidden>
                    ·
                  </Text>
                  <Text style={styles.requestStatsWrLabel}>WR</Text>
                  <CyberNumberNative
                    value={req.applicant.winRate.toFixed(1)}
                    size="sm"
                    format={false}
                    suffix="%"
                  />
                </View>
              </View>
              <View style={styles.profileChip} accessibilityLabel="プロフィール">
                <MaterialCommunityIcons name="account-outline" size={16} color="#ecfeff" />
              </View>
            </Pressable>
            <View style={styles.requestActions}>
              <Pressable
                onPress={() => onReject(req)}
                style={({ pressed }) => [styles.rejectBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="close" size={13} color="#fecdd3" />
                <Text style={styles.rejectBtnText}>拒否</Text>
              </Pressable>
              <Pressable
                onPress={() => onApprove(req)}
                style={({ pressed }) => [styles.approveBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="check" size={13} color="#ecfeff" />
                <Text style={styles.approveBtnText}>承認</Text>
              </Pressable>
            </View>
            </View>
          </SquadListItemShellNative>
        ))}
      </View>
    </View>
  );
}

/** 上部固定 YOUR SQUAD — 左:順位 / 右:名前・メンバー・バー */
function PinnedYourSquadCardNative({
  squad,
  maxAvg,
}: {
  squad: Squad;
  maxAvg: number;
}) {
  const segAccent = {
    border: "#00F5FF",
    glow: "rgba(0,245,255,0.65)",
    bg: "rgba(0,245,255,0.85)",
  };

  return (
    <View style={styles.pinnedOuter}>
      <View style={styles.pinnedTab}>
        <View style={styles.pinnedTabDot} />
        <Text style={styles.pinnedTabText}>Your squad</Text>
      </View>

      <View style={styles.pinnedCard}>
        <View style={styles.pinnedBody}>
          <View style={styles.pinnedRankPane}>
            <Text style={styles.pinnedRankLabel}>Rank</Text>
            <Text
              style={[
                styles.pinnedRankValue,
                {
                  textShadowColor: "rgba(0,245,255,0.55)",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 5,
                },
              ]}
            >
              {String(squad.rank).padStart(2, "0")}
            </Text>
            <RankTrendBadgeNative squad={squad} />
          </View>

          <View style={styles.pinnedMetaPane}>
            <View style={styles.pinnedTopRow}>
              <View style={styles.pinnedNameBlock}>
                <Text style={styles.pinnedSquadName} numberOfLines={1}>
                  {squad.name}
                </Text>
                <View style={styles.avatarStack}>
                  {squad.members.map((m) => (
                    <View key={m.uid} style={styles.avatarStackItem}>
                      <MemberAvatarNative member={m} size="sm" />
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.pinnedPtsCol}>
                <SquadPtsWithDayDeltaNative
                  value={squad.avgPoints}
                  delta={squad.avgPointsDayDelta}
                  size="sm"
                  tone="accent"
                  color="#00F5FF"
                />
              </View>
            </View>
            <View style={styles.pinnedBar}>
              <CyberSlantedSegBarNative
                pct={pointsBarPct(squad.avgPoints, maxAvg)}
                segments={10}
                compact
                forceStatic
                accent={segAccent}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/** Web `FirstPlaceStatsFooter` 相当 — ACE→LEAD→DEFENDING を順にフェードイン */
function FirstPlaceStatsFooterNative({
  squad,
  runnerUpAvg,
  animate = true,
  replayKey,
}: {
  squad: Squad;
  runnerUpAvg: number;
  animate?: boolean;
  replayKey?: string | number;
}) {
  const activeMembers = squad.members.filter((m) => !m.empty);
  const reduceMotion = useReducedMotion() ?? false;
  const motionOk = animate && !reduceMotion;

  const ace = activeMembers[0]
    ? activeMembers.reduce(
        (top, m) => (m.points > top.points ? m : top),
        activeMembers[0]
      )
    : null;
  const lead = Math.max(0, Math.round(squad.avgPoints - runnerUpAvg));
  const weeksAtTop = squad.weeksAtTop ?? 1;
  const gold = scoreColorForRank(1);

  if (!ace) return null;

  const cells = [
    {
      key: "ace",
      node: (
        <>
          <View style={styles.lbFirstLabelRow}>
            <Text style={styles.lbFirstStatLabel}>ACE</Text>
          </View>
          <View style={styles.lbFirstValueRow}>
            <View style={styles.lbFirstAceInline}>
              <View style={styles.lbFirstAceAvatar}>
                <MemberAvatarNative member={ace} size="sm" />
              </View>
              <SquadPointsTextNative
                value={ace.points}
                size="md"
                suffix="pts"
                color={gold}
              />
            </View>
          </View>
        </>
      ),
    },
    {
      key: "lead",
      node: (
        <>
          <View style={styles.lbFirstLabelRow}>
            <Text style={styles.lbFirstStatLabel}>LEAD</Text>
          </View>
          <View style={styles.lbFirstValueRow}>
            <CyberNumberNative
              value={lead}
              size="md"
              suffix="pts"
              color={gold}
            />
          </View>
        </>
      ),
    },
    {
      key: "def",
      node: (
        <>
          <View style={styles.lbFirstLabelRow}>
            <Text style={styles.lbFirstStatLabel}>DEFENDING</Text>
          </View>
          <View style={styles.lbFirstValueRow}>
            <CyberNumberNative
              value={weeksAtTop}
              size="md"
              suffix="day"
              color={gold}
            />
          </View>
        </>
      ),
    },
  ] as const;

  return (
    <View style={styles.lbFirstFooter}>
      <View style={styles.lbFirstFooterRow}>
        {cells.map((it, i) => {
          const Cell = motionOk ? Animated.View : View;
          return (
            <Cell
              key={`${it.key}-${replayKey ?? "x"}`}
              style={styles.lbFirstFlatCell}
              {...(motionOk
                ? {
                    entering: FadeIn.duration(SQUAD_FIRST_FOOTER_FADE_MS).delay(
                      squadFirstFooterDelayMs(i as 0 | 1 | 2)
                    ),
                  }
                : {})}
            >
              {it.node}
            </Cell>
          );
        })}
      </View>
    </View>
  );
}

function LeaderboardRowNative({
  squad,
  maxAvg,
  runnerUpAvg = 0,
  index = 0,
  animate = true,
  replayKey,
}: {
  squad: Squad;
  maxAvg: number;
  /** 2位の平均点（1位カードの LEAD 表示用） */
  runnerUpAvg?: number;
  index?: number;
  animate?: boolean;
  replayKey?: string | number;
}) {
  const first = squad.rank === 1;
  const segAccent = segAccentForRank(squad.rank);
  const reduceMotion = useReducedMotion() ?? false;
  const motionOff = reduceMotion || !animate;

  const row = (
    <View
      style={[
        styles.lbRow,
        first && styles.lbRowFirst,
        squad.rank === 2 && styles.lbRowSecond,
        squad.rank === 3 && styles.lbRowThird,
      ]}
    >
      <View style={styles.lbRowContent}>
        <View style={styles.lbRankCol}>
          <Text
            style={[
              styles.lbRank,
              { color: scoreColorForRank(squad.rank) },
              softRankTextGlow(squad.rank),
            ]}
          >
            {String(squad.rank).padStart(2, "0")}
          </Text>
          <RankTrendBadgeNative squad={squad} />
        </View>
        <View style={styles.lbBody}>
          <View style={styles.lbTop}>
            <View style={styles.lbMeta}>
              <View style={styles.lbNameRow}>
                {first ? (
                  <MaterialCommunityIcons
                    name="crown"
                    size={14}
                    color="#FFD65A"
                    style={styles.lbCrown}
                  />
                ) : null}
                <Text
                  style={[styles.lbName, first && styles.lbNameFirst]}
                  numberOfLines={1}
                >
                  {squad.name}
                </Text>
              </View>
              <View style={styles.avatarStack}>
                {squad.members.map((m, i) => {
                  if (!first || motionOff) {
                    return (
                      <View key={m.uid} style={styles.avatarStackItem}>
                        <MemberAvatarNative member={m} size="sm" />
                      </View>
                    );
                  }
                  return (
                    <Animated.View
                      key={`${m.uid}-${replayKey ?? "x"}`}
                      style={styles.avatarStackItem}
                      entering={FadeIn.duration(SQUAD_FIRST_AVATAR_FADE_MS).delay(
                        squadFirstAvatarDelayMs(i)
                      )}
                    >
                      <MemberAvatarNative member={m} size="sm" />
                    </Animated.View>
                  );
                })}
              </View>
            </View>
            <View style={styles.lbAvg}>
              <SquadPtsWithDayDeltaNative
                value={squad.avgPoints}
                delta={squad.avgPointsDayDelta}
                size="md"
                tone={first ? "accent" : "default"}
                color={scoreColorForRank(squad.rank)}
              />
            </View>
          </View>
          <View style={styles.lbBar}>
            <CyberSlantedSegBarNative
              pct={pointsBarPct(squad.avgPoints, maxAvg)}
              segments={14}
              compact
              forceStatic={motionOff || first}
              enterDelay={motionOff || first ? 0 : (index * LB_ROW_STAGGER_MS) / 1000}
              replayKey={replayKey}
              accent={segAccent}
            />
          </View>
        </View>
      </View>

      {first ? (
        <FirstPlaceStatsFooterNative
          squad={squad}
          runnerUpAvg={runnerUpAvg}
          animate={!motionOff}
          replayKey={replayKey}
        />
      ) : null}
    </View>
  );

  if (motionOff) return row;

  /** 1位 — フェードインのみ（溜めなし） */
  if (first) {
    return (
      <Animated.View
        key={`fade-${replayKey ?? "x"}-${squad.id}`}
        entering={squadFirstFadeInEntering}
      >
        {row}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(index * LB_ROW_STAGGER_MS)}
    >
      {row}
    </Animated.View>
  );
}

export default function SquadBattleScreenNative() {
  const navigation = useNavigation();
  const [previewState, setPreviewState] =
    useState<SquadBattlePreviewState>("full");
  const [previewToolsOpen, setPreviewToolsOpen] = useState(false);
  const [mainTab, setMainTab] = useState<"join" | "rank">("rank");
  const [toast, setToast] = useState<string | null>(null);
  const [extraAppliedIds, setExtraAppliedIds] = useState<string[]>([]);
  const [dismissedRequestIds, setDismissedRequestIds] = useState<string[]>([]);
  const [profileRequest, setProfileRequest] = useState<SquadJoinRequest | null>(null);
  const [viewedProfile, setViewedProfile] = useState<{
    profile: SquadApplicantProfile;
    metaLabel?: string;
  } | null>(null);
  const [createSquadOpen, setCreateSquadOpen] = useState(false);
  const [joinByCodeOpen, setJoinByCodeOpen] = useState(false);
  const [joinByCodeBusy, setJoinByCodeBusy] = useState(false);
  const [createdSquadName, setCreatedSquadName] = useState<string | null>(null);
  /** 初回イントロ — マウント後に AsyncStorage を確認して開く */
  const [introOpen, setIntroOpen] = useState(false);
  const [rankPeriod, setRankPeriod] = useState<"weekly" | "monthly">("weekly");
  const [boardStatus, setBoardStatus] = useState<"live" | "final">("live");
  const [liveBattleId, setLiveBattleId] = useState<string | null>(null);
  const [livePastSquads, setLivePastSquads] = useState<
    GroupBattlePastSquadItem[] | null
  >(null);
  const [liveIncomingInvites, setLiveIncomingInvites] = useState<
    SquadIncomingInviteMock[] | null
  >(null);
  const [liveSelfUid, setLiveSelfUid] = useState<string | null>(null);
  const [liveMySquadId, setLiveMySquadId] = useState<string | null>(null);
  const [liveIsOwner, setLiveIsOwner] = useState(false);
  const [reformBusyId, setReformBusyId] = useState<string | null>(null);
  const [reformTarget, setReformTarget] = useState<
    PastSquadHistoryMock | GroupBattlePastSquadItem | null
  >(null);
  const [dismissedInviteIds, setDismissedInviteIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const seen = await hasSeenSquadBattleIntroNative();
      if (!cancelled && !seen) setIntroOpen(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const user = auth.currentUser;
        const token = await user?.getIdToken();
        const current = await fetchCurrentGroupBattleNative({ idToken: token });
        if (cancelled || !current?.battle) return;
        setLiveBattleId(current.battle.id);
        if (user?.uid) setLiveSelfUid(user.uid);
        setLiveMySquadId(current.mySquad?.id ?? null);
        setLiveIsOwner(current.membership?.role === "owner");
        const label =
          rankPeriod === "weekly"
            ? current.battle.weeklyLabels?.[
                current.battle.weeklyLabels.length - 1
              ]
            : current.battle.monthlyRange?.label;
        const rankings = await fetchGroupBattleRankingsNative(
          current.battle.id,
          rankPeriod,
          label,
          { idToken: token }
        );
        if (!cancelled && rankings?.snapshot) {
          setBoardStatus(rankings.snapshot.status);
        }
        if (token) {
          const past = await fetchPastGroupBattleSquadsNative({ idToken: token });
          if (!cancelled && past?.pastSquads) {
            setLivePastSquads(past.pastSquads);
          }
          const invites = await fetchGroupBattleIncomingInvitesNative(
            current.battle.id,
            { idToken: token }
          );
          if (!cancelled && invites?.invites) {
            setLiveIncomingInvites(
              invites.invites.map((i) => ({
                id: i.id,
                squadId: i.squadId,
                squadName: i.squadName,
                fromDisplayName: i.fromDisplayName,
              }))
            );
          }
        }
      } catch {
        // モック継続
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rankPeriod]);

  const mock = useMemo(() => getSquadBattleMock(previewState), [previewState]);

  const mySquad = useMemo(() => {
    if (!mock.mySquad) return null;
    if (!createdSquadName) return mock.mySquad;
    return { ...mock.mySquad, name: createdSquadName };
  }, [mock.mySquad, createdSquadName]);

  const boardMaxAvg = useMemo(
    () => Math.max(1, ...mock.leaderboard.map((s) => s.avgPoints)),
    [mock.leaderboard]
  );

  const boardOthers = useMemo(
    () => mock.leaderboard.filter((s) => !s.isMine),
    [mock.leaderboard]
  );

  const boardRunnerUpAvg = useMemo(
    () => mock.leaderboard.find((s) => s.rank === 2)?.avgPoints ?? 0,
    [mock.leaderboard]
  );

  const appliedSquadIds = useMemo(() => {
    const ids = new Set(mock.myOutgoingRequests.map((r) => r.squadId));
    for (const id of extraAppliedIds) ids.add(id);
    return ids;
  }, [mock.myOutgoingRequests, extraAppliedIds]);

  const visibleIncoming = useMemo(
    () =>
      mock.incomingRequests.filter((r) => !dismissedRequestIds.includes(r.id)),
    [mock.incomingRequests, dismissedRequestIds]
  );

  const outgoingForDisplay = useMemo(() => {
    const base = [...mock.myOutgoingRequests];
    for (const id of extraAppliedIds) {
      if (base.some((r) => r.squadId === id)) continue;
      const squad = mock.openSquads.find((s) => s.id === id);
      if (!squad) continue;
      base.push({
        id: `local-${id}`,
        squadId: id,
        squadName: squad.name,
        status: "pending",
        createdAtLabel: "たった今",
        applicant: {
          uid: "me",
          handle: "kamiya",
          displayName: "Kamiya",
          points: 1284,
          winRate: 57.1,
          activeWinStreak: 3,
          totalPosts: 140,
          bio: "",
        },
      });
    }
    return base;
  }, [mock.myOutgoingRequests, mock.openSquads, extraAppliedIds]);

  const pendingCount = outgoingForDisplay.length;

  const pastSquadsForUi = livePastSquads ?? mock.pastSquads;
  const incomingInvitesForUi = useMemo(() => {
    const base = liveIncomingInvites ?? mock.incomingInvites;
    return base.filter((i) => !dismissedInviteIds.includes(i.id));
  }, [liveIncomingInvites, mock.incomingInvites, dismissedInviteIds]);
  const selfUidForUi = liveSelfUid ?? "me";

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  async function withAuthToken() {
    return auth.currentUser?.getIdToken() ?? null;
  }

  async function handleReformConfirm(name: string) {
    const target = reformTarget;
    setReformTarget(null);
    if (!target) return;
    const busyKey = `${target.battleId}:${target.squadId}`;
    setReformBusyId(busyKey);

    if (liveBattleId) {
      try {
        const token = await withAuthToken();
        const res = await reformGroupBattleSquadNative(
          liveBattleId,
          {
            sourceBattleId: target.battleId,
            sourceSquadId: target.squadId,
            name,
          },
          { idToken: token }
        );
        if (!res.ok) {
          flash(`再招集失敗: ${res.error}`);
          setReformBusyId(null);
          return;
        }
        setCreatedSquadName(name);
        setPreviewState("recruiting");
        setLiveMySquadId(res.squadId);
        setLiveIsOwner(true);
        flash(
          `再招集: ${name}（招待 ${res.invited.length} / スキップ ${res.skipped.length}）`
        );
      } catch {
        flash("再招集に失敗しました");
      }
      setReformBusyId(null);
      return;
    }

    setCreatedSquadName(name);
    setPreviewState("recruiting");
    setExtraAppliedIds([]);
    setDismissedRequestIds([]);
    setProfileRequest(null);
    setViewedProfile(null);
    setMainTab("join");
    flash(`同じメンバーで募集: ${name}`);
    setReformBusyId(null);
  }

  async function handleInvitePastMember(
    item: PastSquadHistoryMock | GroupBattlePastSquadItem,
    memberUid: string
  ) {
    const busyKey = `${item.battleId}:${item.squadId}:${memberUid}`;
    setReformBusyId(busyKey);
    const squadId = liveMySquadId ?? mySquad?.id;
    if (liveBattleId && squadId) {
      try {
        const token = await withAuthToken();
        const res = await inviteToGroupBattleSquadNative(
          liveBattleId,
          squadId,
          {
            targetUid: memberUid,
            sourceBattleId: item.battleId,
            sourceSquadId: item.squadId,
          },
          { idToken: token }
        );
        flash(res.ok ? "招待を送りました" : `招待失敗: ${res.error}`);
      } catch {
        flash("招待に失敗しました");
      }
      setReformBusyId(null);
      return;
    }
    const member = item.members.find((m) => m.uid === memberUid);
    flash(`誘う: ${member?.displayName ?? memberUid}`);
    setReformBusyId(null);
  }

  async function handleAcceptInvite(invite: SquadIncomingInviteMock) {
    if (liveBattleId) {
      try {
        const token = await withAuthToken();
        const res = await acceptGroupBattleInviteNative(liveBattleId, invite.id, {
          idToken: token,
        });
        if (!res.ok) {
          flash(`参加失敗: ${res.error}`);
          return;
        }
        setDismissedInviteIds((prev) => [...prev, invite.id]);
        setPreviewState("recruiting");
        setCreatedSquadName(invite.squadName);
        flash(`参加: ${invite.squadName}`);
        return;
      } catch {
        flash("参加に失敗しました");
        return;
      }
    }
    setDismissedInviteIds((prev) => [...prev, invite.id]);
    setPreviewState("recruiting");
    setCreatedSquadName(invite.squadName);
    flash(`参加: ${invite.squadName}`);
  }

  async function handleDeclineInvite(invite: SquadIncomingInviteMock) {
    if (liveBattleId) {
      try {
        const token = await withAuthToken();
        const res = await declineGroupBattleInviteNative(
          liveBattleId,
          invite.id,
          { idToken: token }
        );
        if (!res.ok) {
          flash(`パス失敗: ${res.error}`);
          return;
        }
      } catch {
        flash("パスに失敗しました");
        return;
      }
    }
    setDismissedInviteIds((prev) => [...prev, invite.id]);
    flash(`パス: ${invite.squadName}`);
  }

  function handlePreviewStateChange(next: SquadBattlePreviewState) {
    setPreviewState(next);
    setExtraAppliedIds([]);
    setDismissedRequestIds([]);
    setProfileRequest(null);
    setViewedProfile(null);
    setCreateSquadOpen(false);
    setJoinByCodeOpen(false);
    setCreatedSquadName(null);
    setReformTarget(null);
    setDismissedInviteIds([]);
    setMainTab(next === "none" ? "join" : "rank");
  }

  async function handleJoinByCode(code: string) {
    const normalized = normalizeUiInviteCodeNative(code);
    if (normalized.length < 4) return;
    setJoinByCodeBusy(true);

    if (liveBattleId) {
      try {
        const token = await withAuthToken();
        const res = await joinGroupBattleByInviteCodeNative(
          liveBattleId,
          code,
          { idToken: token }
        );
        if (!res.ok) {
          flash(
            res.error === "invalid_invite"
              ? "コードが無効です"
              : `参加失敗: ${res.error}`
          );
          setJoinByCodeBusy(false);
          return;
        }
        setJoinByCodeOpen(false);
        setPreviewState("recruiting");
        setLiveMySquadId(res.squadId);
        setLiveIsOwner(false);
        flash("スクワッドに参加しました");
      } catch {
        flash("参加に失敗しました");
      }
      setJoinByCodeBusy(false);
      return;
    }

    const mockNorm = normalizeUiInviteCodeNative(SQUAD_BATTLE_MOCK_INVITE_CODE);
    if (normalized !== mockNorm) {
      flash("コードが無効です（プレビューは NC-7K2M）");
      setJoinByCodeBusy(false);
      return;
    }
    setJoinByCodeOpen(false);
    setPreviewState("recruiting");
    setExtraAppliedIds([]);
    setDismissedRequestIds([]);
    setMainTab("join");
    flash("招待コードで参加しました");
    setJoinByCodeBusy(false);
  }

  function handleCreateSquad(name: string) {
    setCreateSquadOpen(false);
    setCreatedSquadName(name);
    setPreviewState("recruiting");
    setExtraAppliedIds([]);
    setDismissedRequestIds([]);
    setProfileRequest(null);
    setViewedProfile(null);
    setMainTab("join");
    flash(`グループを作成: ${name}`);
  }

  function handleRenameSquad(name: string) {
    setCreatedSquadName(name);
    flash(`名前を変更: ${name}`);
  }

  function openMemberProfile(profile: SquadApplicantProfile, metaLabel?: string) {
    setProfileRequest(null);
    setViewedProfile({ profile, metaLabel });
  }

  return (
    <View style={styles.root}>
      <CyberSubpageShellNative
        eyebrow="RANKINGS"
        title="SQUAD BATTLE"
        subtitle={SQUAD_BATTLE_HELP_TEXT}
        headerTrailing={
          <Pressable
            onPress={() => setPreviewToolsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="プレビュー状態"
            accessibilityState={{ expanded: previewToolsOpen }}
            style={({ pressed }) => [
              styles.previewMenuBtn,
              pressed && styles.previewMenuBtnPressed,
            ]}
          >
            <MaterialCommunityIcons
              name="menu"
              size={22}
              color="rgba(236,254,255,0.92)"
            />
          </Pressable>
        }
        onBack={() => navigation.goBack()}
        contentStyle={styles.content}
      >
        <View style={styles.mainTabs}>
          <CyberSlantedTabBarNative fill>
            <CyberSlantedTabNative
              label="JOIN"
              active={mainTab === "join"}
              fill
              compact
              fontWeight="700"
              onPress={() => setMainTab("join")}
            />
            <CyberSlantedTabNative
              label="RANK"
              active={mainTab === "rank"}
              fill
              compact
              fontWeight="700"
              onPress={() => setMainTab("rank")}
            />
          </CyberSlantedTabBarNative>
        </View>

        {mainTab === "join" ? (
          mySquad == null ? (
            <NoneStateNative
              openSquads={mock.openSquads}
              outgoingRequests={outgoingForDisplay}
              appliedSquadIds={appliedSquadIds}
              pendingCount={pendingCount}
              pastSquads={pastSquadsForUi}
              incomingInvites={incomingInvitesForUi}
              reformBusyId={reformBusyId}
              selfUid={selfUidForUi}
              onCreate={() => setCreateSquadOpen(true)}
              onJoinByCode={() => setJoinByCodeOpen(true)}
              onApply={(squadId, squadName) => {
                if (appliedSquadIds.has(squadId)) return;
                if (pendingCount >= SQUAD_BATTLE_MAX_PENDING_APPLICATIONS) {
                  flash(`申請は最大${SQUAD_BATTLE_MAX_PENDING_APPLICATIONS}件まで`);
                  return;
                }
                setExtraAppliedIds((prev) =>
                  prev.includes(squadId) ? prev : [...prev, squadId]
                );
                flash(`申請を送信: ${squadName}`);
              }}
              onOpenMemberProfile={(profile) =>
                openMemberProfile(profile, "募集中スクワッドのメンバー")
              }
              onReform={(item) => setReformTarget(item)}
              onAcceptInvite={(invite) => {
                void handleAcceptInvite(invite);
              }}
              onDeclineInvite={(invite) => {
                void handleDeclineInvite(invite);
              }}
            />
          ) : (
            <>
              <MySquadCardNative
                squad={mySquad}
                maxAvg={boardMaxAvg}
                onRenameSquad={handleRenameSquad}
                onOpenMemberProfile={(profile) =>
                  openMemberProfile(profile, "スクワッドメンバー")
                }
                onCopyInviteCode={(code) => {
                  void copyTextNative(code).then((ok) => {
                    flash(ok ? `コピーしました: ${code}` : `招待コード: ${code}`);
                  });
                }}
              />
              {(liveIsOwner || previewState === "recruiting") &&
              pastSquadsForUi.length > 0 ? (
                <PastSquadsPanelNative
                  pastSquads={pastSquadsForUi}
                  selfUid={selfUidForUi}
                  canReform={false}
                  canInvite={liveIsOwner || previewState === "recruiting"}
                  busyId={reformBusyId}
                  onReform={() => {}}
                  onInvite={(item, uid) => {
                    void handleInvitePastMember(item, uid);
                  }}
                />
              ) : null}
              <IncomingRequestsNative
                requests={visibleIncoming}
                onOpenProfile={(req) => {
                  setViewedProfile(null);
                  setProfileRequest(req);
                }}
                onApprove={(req) => {
                  setDismissedRequestIds((prev) => [...prev, req.id]);
                  setProfileRequest(null);
                  flash(`承認: ${req.applicant.displayName}`);
                }}
                onReject={(req) => {
                  setDismissedRequestIds((prev) => [...prev, req.id]);
                  setProfileRequest(null);
                  flash(`拒否: ${req.applicant.displayName}`);
                }}
              />
            </>
          )
        ) : (
          <>
            <View style={styles.rankPeriodRow}>
              <View style={styles.rankPeriodTabs}>
                <CyberSlantedTabBarNative>
                  <CyberSlantedTabNative
                    label="WEEK"
                    active={rankPeriod === "weekly"}
                    onPress={() => setRankPeriod("weekly")}
                    fill
                    compact
                    fontWeight="700"
                  />
                  <CyberSlantedTabNative
                    label="MONTH"
                    active={rankPeriod === "monthly"}
                    onPress={() => setRankPeriod("monthly")}
                    fill
                    compact
                    fontWeight="700"
                  />
                </CyberSlantedTabBarNative>
              </View>
              <View
                style={[
                  styles.boardStatusPill,
                  boardStatus === "final"
                    ? styles.boardStatusFinal
                    : styles.boardStatusLive,
                ]}
                accessibilityLabel={
                  liveBattleId
                    ? `大会 ${liveBattleId} ${boardStatus}`
                    : `プレビュー ${boardStatus}`
                }
              >
                <Text
                  style={[
                    styles.boardStatusText,
                    boardStatus === "final"
                      ? styles.boardStatusTextFinal
                      : styles.boardStatusTextLive,
                  ]}
                >
                  {boardStatus === "final" ? "FINAL" : "LIVE"}
                </Text>
              </View>
            </View>

            {mySquad ? (
              <View style={styles.stickyYouTop}>
                <PinnedYourSquadCardNative
                  squad={mySquad}
                  maxAvg={boardMaxAvg}
                />
              </View>
            ) : null}

            <View key={`${mainTab}-${rankPeriod}`} style={styles.boardList}>
              {boardOthers.map((squad, i) => (
                <LeaderboardRowNative
                  key={squad.id}
                  squad={squad}
                  maxAvg={boardMaxAvg}
                  runnerUpAvg={boardRunnerUpAvg}
                  index={i}
                  replayKey={`${mainTab}-${rankPeriod}`}
                />
              ))}
            </View>
          </>
        )}
      </CyberSubpageShellNative>

      <CreateSquadNameModalNative
        visible={createSquadOpen}
        onClose={() => setCreateSquadOpen(false)}
        onCreate={handleCreateSquad}
      />

      <JoinByInviteCodeModalNative
        visible={joinByCodeOpen}
        busy={joinByCodeBusy}
        onClose={() => {
          if (joinByCodeBusy) return;
          setJoinByCodeOpen(false);
        }}
        onJoin={(code) => {
          void handleJoinByCode(code);
        }}
      />

      <CreateSquadNameModalNative
        visible={reformTarget != null}
        initialName={reformTarget?.squadName ?? ""}
        eyebrow="Reform squad · callsign"
        submitLabel="招待を送る"
        onClose={() => setReformTarget(null)}
        onCreate={(name) => {
          void handleReformConfirm(name);
        }}
      />

      <ApplicantProfileModalNative
        visible={profileRequest != null}
        profile={profileRequest?.applicant ?? null}
        metaLabel={
          profileRequest
            ? `申請 · ${profileRequest.createdAtLabel}`
            : undefined
        }
        onClose={() => setProfileRequest(null)}
        onApprove={
          profileRequest
            ? () => {
                setDismissedRequestIds((prev) => [...prev, profileRequest.id]);
                setProfileRequest(null);
                flash(`承認: ${profileRequest.applicant.displayName}`);
              }
            : undefined
        }
        onReject={
          profileRequest
            ? () => {
                setDismissedRequestIds((prev) => [...prev, profileRequest.id]);
                setProfileRequest(null);
                flash(`拒否: ${profileRequest.applicant.displayName}`);
              }
            : undefined
        }
      />

      <ApplicantProfileModalNative
        visible={viewedProfile != null}
        profile={viewedProfile?.profile ?? null}
        metaLabel={viewedProfile?.metaLabel}
        onClose={() => setViewedProfile(null)}
      />

      {toast ? (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      <Modal
        visible={previewToolsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewToolsOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.previewOverlayRoot}>
          <Pressable
            style={styles.previewOverlayBackdrop}
            onPress={() => setPreviewToolsOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="閉じる"
          />
          <View style={styles.previewOverlayCard} accessibilityRole="summary">
            <View style={styles.previewOverlayHeader}>
              <Text style={styles.stateSwitcherLabel}>Preview state</Text>
              <Pressable
                onPress={() => setPreviewToolsOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="閉じる"
                style={({ pressed }) => [
                  styles.previewOverlayClose,
                  pressed && styles.previewOverlayClosePressed,
                ]}
                hitSlop={8}
              >
                <MaterialCommunityIcons name="close" size={16} color="#fef3c7" />
              </Pressable>
            </View>
            <View style={styles.stateChips}>
              {SQUAD_BATTLE_PREVIEW_STATES.map((s) => {
                const active = previewState === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      handlePreviewStateChange(s.id);
                      setPreviewToolsOpen(false);
                    }}
                    style={[styles.stateChip, active && styles.stateChipActive]}
                  >
                    <Text
                      style={[
                        styles.stateChipText,
                        active && styles.stateChipTextActive,
                      ]}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => {
                  void (async () => {
                    await clearSquadBattleIntroSeenNative();
                    setPreviewToolsOpen(false);
                    setIntroOpen(true);
                  })();
                }}
                style={styles.introReplayChip}
                accessibilityRole="button"
                accessibilityLabel="イントロ再生"
              >
                <MaterialCommunityIcons
                  name="restart"
                  size={12}
                  color="rgba(254,226,226,0.9)"
                />
                <Text style={styles.introReplayChipText}>イントロ再生</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <SquadBattleIntroOverlayNative
        open={introOpen}
        onClose={() => setIntroOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050b14",
  },
  pageBar: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  pageNavBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(0,245,255,0.1)",
  },
  pageNavBtnDisabled: {
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "transparent",
  },
  pageNumBtn: {
    minWidth: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 8,
  },
  pageNumBtnActive: {
    borderColor: "rgba(103,232,249,0.6)",
    backgroundColor: "rgba(0,245,255,0.25)",
  },
  pageNumText: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    fontVariant: ["tabular-nums"],
  },
  pageNumTextActive: {
    color: "#ecfeff",
  },
  content: {
    paddingBottom: 48,
  },
  stickyYouTop: {
    marginBottom: spacing.md,
    backgroundColor: "#050b14",
    paddingTop: 4,
    paddingBottom: 10,
  },
  pinnedOuter: {
    position: "relative",
    overflow: "visible",
  },
  pinnedCard: {
    position: "relative",
    marginTop: -10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.55)",
    backgroundColor: "#070d16",
    overflow: "visible",
  },
  pinnedTab: {
    zIndex: 2,
    alignSelf: "flex-start",
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.55)",
    backgroundColor: "#070d16",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pinnedTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#67e8f9",
  },
  pinnedTabText: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#ecfeff",
  },
  pinnedBody: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingTop: 8,
    gap: 12,
  },
  pinnedRankPane: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  pinnedRankLabel: {
    fontFamily: fonts.metric,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(103,232,249,0.65)",
  },
  pinnedRankValue: {
    marginTop: 2,
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 0.8,
    color: "#00F5FF",
    ...Platform.select({
      ios: { fontWeight: "400" },
      android: { fontWeight: "400" },
      default: {},
    }),
  },
  pinnedDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,245,255,0.3)",
    marginVertical: 10,
  },
  pinnedMetaPane: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 8,
    paddingLeft: 8,
    paddingRight: 14,
    paddingVertical: 12,
  },
  pinnedTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  pinnedNameBlock: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  pinnedNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pinnedPtsCol: {
    flexShrink: 0,
    overflow: "visible",
  },
  ptsWithDeltaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ptsWithDeltaStack: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 1,
  },
  ptsWithDeltaSuffix: {
    fontFamily: RANKING_SCORE_FONT,
    fontSize: 9,
    lineHeight: 11,
    color: "#22D3EE",
    includeFontPadding: false,
    transform: [{ skewX: "-10deg" }, { scaleX: 0.96 }],
  },
  pinnedSquadName: {
    minWidth: 0,
    fontFamily: fonts.metric,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#ffffff",
  },
  pinnedBar: {
    width: "100%",
  },
  previewMenuBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  previewMenuBtnPressed: {
    opacity: 0.85,
  },
  previewOverlayRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  previewOverlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 9, 0.78)",
  },
  previewOverlayCard: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "#0a0c10",
    padding: 12,
  },
  previewOverlayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  previewOverlayClose: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
    backgroundColor: "rgba(245,158,11,0.1)",
    borderTopLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  previewOverlayClosePressed: {
    borderColor: "rgba(252,211,77,0.5)",
    backgroundColor: "rgba(245,158,11,0.16)",
  },
  stateSwitcherLabel: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.7)",
    marginBottom: 0,
  },
  stateChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stateChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stateChipActive: {
    borderColor: "rgba(252,211,77,0.55)",
    backgroundColor: "rgba(251,191,36,0.2)",
  },
  stateChipText: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
  },
  stateChipTextActive: {
    color: "#fffbeb",
  },
  introReplayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.35)",
    backgroundColor: "rgba(244,63,94,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  introReplayChipText: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(254,226,226,0.9)",
  },
  mainTabs: {
    marginBottom: spacing.md,
  },
  rankPeriodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.sm,
  },
  rankPeriodTabs: {
    flex: 1,
    minWidth: 0,
  },
  boardStatusPill: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  boardStatusLive: {
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.1)",
  },
  boardStatusFinal: {
    borderColor: "rgba(252,211,77,0.5)",
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  boardStatusText: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  boardStatusTextLive: {
    color: "#a5f3fc",
  },
  boardStatusTextFinal: {
    color: "#fde68a",
  },
  rulesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.md,
  },
  ruleCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(10,14,20,0.8)",
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  ruleKey: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
  },
  ruleValue: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  noneWrap: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionBlock: {
    marginBottom: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: 8,
  },
  sectionHeaderMain: {
    flex: 1,
    minWidth: 0,
  },
  listItemShell: {
    marginBottom: 0,
  },
  listItemInner: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  requestCardShell: {
    marginBottom: 8,
  },
  leftAccentRail: {
    width: 3,
    alignSelf: "stretch",
    shadowOpacity: 0.85,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  applyCounterChip: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
    backgroundColor: "rgba(34,211,238,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
    fontVariant: ["tabular-nums"],
    overflow: "hidden",
    borderRadius: 2,
  },
  applyCounterChipLimit: {
    borderColor: "rgba(251,113,133,0.4)",
    backgroundColor: "rgba(244,63,94,0.1)",
    color: "rgba(254,202,202,0.9)",
  },
  decorCorner: {
    position: "absolute",
    width: 14,
    height: 14,
    zIndex: 3,
  },
  decorCornerTL: {
    left: 0,
    top: 0,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: "rgba(140,240,255,0.92)",
  },
  pinnedTopBeam: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1.5,
    backgroundColor: "rgba(140,240,255,0.92)",
    shadowColor: "#22d3ee",
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 4,
  },
  myCardWrap: {
    marginBottom: spacing.md,
    borderColor: "rgba(0,245,255,0.3)",
    backgroundColor: "rgba(0,245,255,0.04)",
  },
  myCardInner: {
    padding: spacing.md,
  },
  mySquadOuter: {
    position: "relative",
    overflow: "visible",
    marginBottom: spacing.md,
  },
  mySquadShell: {
    marginTop: -10,
    borderWidth: 2,
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(8,22,28,0.98)",
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#00F5FF",
        shadowOpacity: 0.28,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  mySquadTab: {
    zIndex: 12,
    alignSelf: "flex-start",
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.55)",
    backgroundColor: "#070d16",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mySquadTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#67e8f9",
  },
  mySquadTabText: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#ecfeff",
  },
  mySquadHero: {
    paddingHorizontal: spacing.md,
    paddingTop: 14,
    paddingBottom: spacing.sm,
    zIndex: 10,
  },
  mySquadTitleRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    gap: 8,
  },
  mySquadTitle: {
    fontFamily: fonts.metricExtra,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    textAlign: "center",
    color: colors.textPrimary,
    flexShrink: 1,
  },
  mySquadRenameBtn: {
    position: "absolute",
    right: 0,
    top: "50%",
    marginTop: -16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(34,211,238,0.1)",
  },
  mySquadRenameBox: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
  },
  mySquadRenameHead: {
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  mySquadRenameLabel: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(103,232,249,0.55)",
  },
  mySquadRenameCount: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontVariant: ["tabular-nums"],
    color: "rgba(255,255,255,0.3)",
  },
  mySquadRenameInput: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.45)",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.metricExtra,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
    color: colors.textPrimary,
  },
  mySquadRenameActions: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mySquadRenameCancel: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mySquadRenameCancelText: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
  },
  mySquadRenameSave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.5)",
    backgroundColor: "rgba(34,211,238,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mySquadRenameSaveDisabled: {
    opacity: 0.35,
  },
  mySquadRenameSaveText: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#ECFEFF",
  },
  mySquadHudRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  mySquadHudCell: {
    flex: 1,
    minWidth: 0,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  mySquadHudLabel: {
    fontFamily: fonts.metric,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  mySquadHudMetric: {
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: 0.8,
    textAlign: "center",
    ...Platform.select({
      ios: { fontWeight: "400" },
      android: { fontWeight: "400" },
      default: {},
    }),
  },
  mySquadHudValueRow: {
    height: 32,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    position: "relative",
  },
  mySquadHudAvgCol: {
    width: "100%",
    alignItems: "center",
  },
  mySquadHudAvgWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  mySquadHudPtsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mySquadHudTrendAbs: {
    position: "absolute",
    left: "50%",
    marginLeft: 22,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  mySquadHudCodeBtn: {
    maxWidth: "100%",
  },
  mySquadHudCodePressed: {
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(0,245,255,0.05)",
  },
  mySquadHudCode: {
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    textAlign: "center",
    flexShrink: 1,
  },
  mySquadHudCodeEmpty: {
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255,255,255,0.3)",
  },
  mySquadBar: {
    marginTop: 10,
    width: "100%",
  },
  mySquadMeta: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  mySquadAvgBox: {
    borderWidth: 2,
    borderColor: "rgba(0,245,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  mySquadAvgTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  mySquadMembersSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    zIndex: 10,
  },
  mySquadMemberList: {
    gap: 8,
  },
  noneCardWrap: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
    backgroundColor: "rgba(28,22,8,0.98)",
    borderRadius: 2,
    overflow: "hidden",
  },
  noneCardInner: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  noneCtaStack: {
    marginTop: spacing.md,
    alignSelf: "stretch",
    gap: 10,
  },
  boardPanel: {
    marginBottom: 0,
  },
  boardPanelInner: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  sectionEyebrowAmber: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.7)",
    marginBottom: 8,
  },
  listGap: {
    gap: 8,
  },
  myCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  myCardTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(103,232,249,0.7)",
  },
  squadName: {
    marginTop: 4,
    fontFamily: fonts.metricExtra,
    fontSize: typography.subtitle,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textPrimary,
  },
  squadMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  inviteCodeChip: {
    marginTop: 8,
    alignSelf: "center",
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(0,245,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inviteCodeChipLabel: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
  },
  inviteCodeChipValue: {
    flexShrink: 1,
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#ecfeff",
  },
  rankBlock: {
    alignItems: "flex-end",
  },
  rankLabel: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)",
  },
  rankValue: {
    fontFamily: fonts.metricExtra,
    fontSize: 24,
    fontWeight: "800",
    color: "#67e8f9",
  },
  avgRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  avgLabel: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)",
  },
  avgValueWrap: {
    marginTop: 2,
  },
  openSubRow: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
  },
  statSegWrap: {
    marginTop: 4,
  },
  avatarStack: {
    flexDirection: "row",
    gap: 4,
  },
  avatarStackItem: {},
  memberList: {
    marginTop: spacing.sm,
    gap: 8,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(10,14,20,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  memberRowElevated: {
    borderWidth: 2,
    borderColor: "rgba(0,245,255,0.22)",
    backgroundColor: "rgba(10,14,20,0.9)",
  },
  memberRowEmpty: {
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  memberMeta: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  memberStats: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    flexShrink: 0,
  },
  memberName: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  memberPosts: {
    marginTop: 1,
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.45)",
    fontVariant: ["tabular-nums"],
  },
  memberHandle: {
    marginTop: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  memberEmptyTitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
  },
  memberEmptySub: {
    marginTop: 2,
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.25)",
  },
  memberPoints: {
    fontFamily: fonts.metric,
    fontSize: 14,
    fontWeight: "700",
    color: "#a5f3fc",
  },
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmpty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  avatarFilled: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    backgroundColor: "rgba(6,182,212,0.1)",
  },
  avatarInitial: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    color: "#cffafe",
  },
  avatarInitialSm: {
    fontSize: 9,
  },
  avatarInitialLg: {
    fontSize: 20,
  },
  noneCard: {
    alignItems: "center",
  },
  noneIcon: {
    width: 56,
    height: 56,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.4)",
    backgroundColor: "rgba(251,191,36,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: "#FBBF24",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      },
      default: {},
    }),
  },
  noneTitle: {
    fontFamily: fonts.metricExtra,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#FFFBEB",
    textAlign: "center",
    ...Platform.select({
      ios: {
        textShadowColor: "rgba(251,191,36,0.35)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
      android: {
        textShadowColor: "rgba(251,191,36,0.35)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
      },
      default: {},
    }),
  },
  ctaPrimary: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.55)",
    backgroundColor: "rgba(251,191,36,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ctaPrimaryText: {
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#FEF3C7",
  },
  ctaSecondary: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.28)",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ctaSecondaryText: {
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(254,243,199,0.9)",
  },
  pressed: {
    opacity: 0.88,
  },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    overflow: "visible",
  },
  openRank: {
    width: 36,
    textAlign: "center",
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.8,
    ...Platform.select({
      ios: { fontWeight: "400" },
      android: { fontWeight: "400" },
      default: {},
    }),
  },
  openPts: {
    width: 76,
    alignItems: "flex-end",
    justifyContent: "center",
    overflow: "visible",
  },
  openActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  openCard: {
    overflow: "visible",
  },
  openMembers: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    overflow: "hidden",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  openMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  openMemberPts: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(165,243,252,0.9)",
  },
  viewMembersHint: {
    marginTop: 6,
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(103,232,249,0.55)",
  },
  viewMembersBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(0,245,255,0.1)",
  },
  viewMembersBtnText: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#ecfeff",
  },
  limitHint: {
    marginBottom: 8,
    fontSize: 12,
    color: "rgba(253,230,138,0.7)",
  },
  limitCount: {
    color: "rgba(253,230,138,0.9)",
  },
  applyCounter: {
    marginBottom: 8,
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
  },
  applyCounterBlock: {
    alignItems: "flex-end",
    gap: 2,
  },
  applyCounterHeader: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
    fontVariant: ["tabular-nums"],
  },
  trendUp: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "800",
    color: "#67e8f9",
    fontVariant: ["tabular-nums"],
  },
  trendDown: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "800",
    color: "#fda4af",
    fontVariant: ["tabular-nums"],
  },
  trendFlat: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
  },
  dayDelta: {
    color: "#FFD65A",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 15,
    letterSpacing: 0.6,
    fontFamily: fonts.metric,
    fontVariant: ["tabular-nums"],
    ...Platform.select({
      ios: {
        textShadowColor: "rgba(255,214,90,0.45)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
      default: {},
    }),
  },
  applyBtnDisabled: {
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  applyBtnTextDisabled: {
    color: "rgba(255,255,255,0.3)",
  },
  openMeta: {
    flex: 1,
    minWidth: 0,
  },
  openTitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  openName: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#ffffff",
  },
  openMetaChip: {
    width: 32,
    textAlign: "center",
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    fontVariant: ["tabular-nums"],
  },
  openSub: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  applyBtn: {
    width: 54,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    backgroundColor: "rgba(0,245,255,0.12)",
    paddingHorizontal: 4,
  },
  applyBtnPending: {
    borderColor: "rgba(251,191,36,0.3)",
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  applyBtnText: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#ecfeff",
    textAlign: "center",
  },
  applyBtnTextPending: {
    color: "rgba(254,243,199,0.85)",
  },
  outgoingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(245,158,11,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  outgoingName: {
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#fffbeb",
  },
  pendingBadge: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(254,243,199,0.85)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
  },
  pastSquadCard: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
    backgroundColor: "rgba(34,211,238,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pastSquadHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  pastSquadIcon: {
    marginTop: 2,
  },
  pastSquadName: {
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#ecfeff",
  },
  pastSquadMembers: {
    marginTop: 6,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
  },
  pastSquadReformBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    backgroundColor: "rgba(0,245,255,0.12)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pastSquadReformBtnText: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#ecfeff",
  },
  pastSquadBtnDisabled: {
    opacity: 0.4,
  },
  pastInviteList: {
    marginTop: 12,
    gap: 6,
  },
  pastInviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pastInviteName: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  pastInviteHandle: {
    color: "rgba(255,255,255,0.35)",
  },
  pastInviteBtn: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.4)",
    backgroundColor: "rgba(34,211,238,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pastInviteBtnText: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#ecfeff",
  },
  pastSquadHint: {
    marginTop: 8,
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },
  incomingInviteCard: {
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(245,158,11,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  incomingInviteHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  incomingInviteActions: {
    flexDirection: "row",
    gap: 8,
  },
  incomingInviteAcceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    backgroundColor: "rgba(0,245,255,0.12)",
    paddingVertical: 10,
  },
  incomingInviteDeclineBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingVertical: 10,
  },
  incomingInviteDeclineText: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
  },
  requestCard: {
    padding: 12,
  },
  requestMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  requestNameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  requestTimeLabel: {
    flexShrink: 0,
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)",
  },
  requestStatsRow: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 6,
  },
  requestStatsDot: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
  },
  requestStatsWrLabel: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.45)",
  },
  requestStatsInline: {
    marginTop: 4,
    fontFamily: fonts.metric,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "#ecfeff",
    fontVariant: ["tabular-nums"],
  },
  requestStats: {
    marginTop: 4,
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(165,243,252,0.9)",
  },
  profileChip: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.25)",
    backgroundColor: "rgba(0,245,255,0.1)",
  },
  requestActions: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.3)",
    backgroundColor: "rgba(244,63,94,0.08)",
    paddingVertical: 10,
  },
  rejectBtnText: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#fecdd3",
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.4)",
    backgroundColor: "rgba(0,245,255,0.12)",
    paddingVertical: 10,
  },
  approveBtnText: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#ecfeff",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
    padding: 12,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.3)",
    backgroundColor: "#070d16",
    overflow: "hidden",
  },
  createModalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "rgba(5,2,8,0.78)",
  },
  createModalCard: {
    position: "relative",
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.4)",
    backgroundColor: "#140e06",
    overflow: "hidden",
    shadowColor: "#FBBF24",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  createBracket: {
    position: "absolute",
    width: 12,
    height: 12,
    zIndex: 2,
  },
  createBracketTL: {
    top: 8,
    left: 8,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "rgba(252,211,77,0.7)",
  },
  createBracketTR: {
    top: 8,
    right: 8,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(252,211,77,0.7)",
  },
  createBracketBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderColor: "rgba(252,211,77,0.7)",
  },
  createBracketBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(252,211,77,0.7)",
  },
  createModalInner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  createModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  createModalEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  createModalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FBBF24",
    shadowColor: "#FBBF24",
    shadowOpacity: 0.85,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  createModalEyebrow: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.8,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.7)",
  },
  createModalCloseBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  createPreviewBox: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 20,
  },
  createPreviewLabel: {
    marginBottom: 8,
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.45)",
  },
  createPreviewName: {
    maxWidth: "100%",
    fontFamily: fonts.metricExtra,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    textAlign: "center",
  },
  createPreviewNameActive: {
    color: "#FFF7E6",
    textShadowColor: "rgba(251,191,36,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  createPreviewNameEmpty: {
    color: "rgba(255,255,255,0.22)",
  },
  createPreviewHint: {
    marginTop: 8,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  createFieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  createModalFieldLabel: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.55)",
  },
  createModalInput: {
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.4)",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontFamily: fonts.metricExtra,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#FFFBEB",
  },
  createModalCounter: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.3)",
    fontVariant: ["tabular-nums"],
  },
  createModalSubmit: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.55)",
    backgroundColor: "rgba(251,191,36,0.2)",
    paddingVertical: 14,
    shadowColor: "#FBBF24",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  createModalSubmitDisabled: {
    opacity: 0.35,
    shadowOpacity: 0,
  },
  createModalSubmitText: {
    fontFamily: fonts.metricExtra,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#FEF3C7",
  },
  createModalCancelLink: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  createModalCancelLinkText: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)",
  },
  modalCloseBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    padding: 6,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalEyebrow: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(103,232,249,0.7)",
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileMeta: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  profileHandle: {
    marginTop: 2,
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
  },
  profileMetaLabel: {
    marginTop: 4,
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
  },
  profileBio: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.6)",
  },
  statGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    width: "48%",
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0a0e14",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statKey: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
  },
  statValue: {
    marginTop: 4,
    fontFamily: fonts.metricExtra,
    fontSize: 16,
    fontWeight: "800",
    color: "#cffafe",
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  boardHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  boardTitle: {
    marginTop: 2,
    fontFamily: fonts.metricExtra,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.textPrimary,
  },
  boardCount: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },
  boardList: {
    gap: 8,
  },
  lbRow: {
    flexDirection: "column",
    borderWidth: 2,
    borderColor: "rgba(34,211,238,0.18)",
    backgroundColor: "rgba(14,20,32,0.98)",
    overflow: "hidden",
    position: "relative",
  },
  lbRowContent: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    overflow: "visible",
  },
  lbFirstFooter: {
    zIndex: 10,
    position: "relative",
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,214,90,0.25)",
    minHeight: 52,
  },
  lbFirstFooterRow: {
    zIndex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  lbFirstFlatCell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 4,
  },
  lbFirstDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "center",
    height: 32,
    backgroundColor: "rgba(253,230,138,0.2)",
  },
  lbFirstLabelRow: {
    height: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  lbFirstValueRow: {
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  lbFirstAcePts: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textAlign: "center",
  },
  lbFirstAceInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    transform: [{ scale: 0.9 }],
  },
  lbFirstAceAvatar: {
    transform: [{ translateY: -2 }],
  },
  lbFirstStatLabel: {
    fontFamily: fonts.metric,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.5)",
  },
  lbFirstStatBox: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.2)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  lbFirstStatName: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
  },
  lbFirstStatValue: {
    marginTop: 6,
    height: 28,
    justifyContent: "center",
  },
  lbFirstStatSubRow: {
    marginTop: 6,
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lbFirstStatSub: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },
  lbBody: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  lbTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  lbBar: {
    width: "100%",
  },
  lbRowMine: {
    borderColor: "rgba(0,245,255,0.45)",
    backgroundColor: "rgba(0,245,255,0.09)",
  },
  lbRowFirst: {
    borderColor: "rgba(255,214,90,0.65)",
    backgroundColor: "rgba(255,214,90,0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#FFD65A",
        shadowOpacity: 0.5,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  lbRowSecond: {
    borderColor: "rgba(233,237,246,0.42)",
    backgroundColor: "rgba(230,235,245,0.05)",
    ...Platform.select({
      ios: {
        shadowColor: "#E9EDF6",
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  lbRowThird: {
    borderColor: "rgba(213,154,90,0.45)",
    backgroundColor: "rgba(205,127,50,0.06)",
    ...Platform.select({
      ios: {
        shadowColor: "#D59A5A",
        shadowOpacity: 0.3,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  },
  lbRankCol: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    overflow: "visible",
    paddingHorizontal: 2,
    transform: [{ translateY: 6 }],
  },
  lbRank: {
    textAlign: "center",
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 0.8,
    paddingHorizontal: 2,
    ...Platform.select({
      ios: { fontWeight: "400" },
      android: { fontWeight: "400", includeFontPadding: false },
      default: {},
    }),
  },
  lbMeta: {
    flex: 1,
    minWidth: 0,
  },
  lbNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  lbCrown: {
    marginTop: 1,
  },
  lbName: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.9)",
  },
  lbNameMine: {
    color: "#ecfeff",
  },
  lbNameFirst: {
    color: "#FFFBEB",
  },
  lbAvg: {
    alignItems: "flex-end",
    justifyContent: "center",
    alignSelf: "center",
    flexShrink: 0,
    maxWidth: "42%",
    overflow: "visible",
  },
  lbAvgValue: {
    fontFamily: fonts.metricExtra,
    fontSize: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
  },
  lbAvgValueMine: {
    color: "#a5f3fc",
  },
  toast: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 96,
    zIndex: 100,
    elevation: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.35)",
    backgroundColor: "rgba(5,11,20,0.95)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  toastText: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#ecfeff",
    textAlign: "center",
  },
  joinCodeHint: {
    fontFamily: fonts.metric,
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 14,
  },
});
