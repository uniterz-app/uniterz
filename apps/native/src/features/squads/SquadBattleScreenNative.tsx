/**
 * Web `SquadBattlePage` 相当 — SQUAD BATTLE（スナップショット接続、未接続時はモック）
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type DimensionValue,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import Animated, {
  FadeIn,
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";
import CyberSubpageShellNative from "../../ui/CyberSubpageShellNative";
import { colors, fonts, radius, spacing, typography } from "../../theme/tokens";
import {
  SQUAD_BATTLE_MAX_MEMBERS,
  SQUAD_BATTLE_MIN_MEMBERS,
  SQUAD_BATTLE_MAX_PENDING_APPLICATIONS,
  SQUAD_BATTLE_MOCK_INVITE_CODE,
  SQUAD_BATTLE_NAME_MAX_LEN,
  SQUAD_BATTLE_OPEN_PAGE_SIZE,
  SQUAD_BATTLE_PREVIEW_STATES,
  SQUAD_BATTLE_SEASON_PHASES,
  countActiveMembers,
  getSquadBattleMock,
  squadFromIncomingInvite,
  squadIncomingInviteMemberProfiles,
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
  type SquadInviteMemberSummary,
} from "../../../../../lib/squads/squadBattleMock";
import type { GroupBattlePastSquadItem } from "../../../../../lib/groupBattles/types";
import { estimatedGroupBattleUnitsPerMember } from "../../../../../lib/groupBattles/unitLedger";
import {
  SQUAD_FIRST_AVATAR_FADE_MS,
  SQUAD_FIRST_FOOTER_FADE_MS,
  squadFirstAvatarDelayMs,
  squadFirstFooterDelayMs,
} from "../../../../../lib/squads/squadFirstPlaceMotion";
import { squadFirstFadeInEntering } from "./squadFirstPlaceMotionNative";
import { CyberRankNumberNative } from "../rankings/CyberRankNumberNative";
import { RankingsAvatarNative } from "../rankings/RankingsAvatarAndTabs";
import ProCyberBadgeNative from "../profile/kinetik/ProCyberBadgeNative";
import { RankFirstBorderEdgeScanNative } from "../rankings/RankFirstBorderEdgeScanNative";
import {
  cyberRankPalette,
  cyberRankQuietFrameColor,
} from "../../../../../lib/rankings/cyberRankVisual";
import { RANK_FIRST_EDGE_DIM_BORDER } from "../../../../../lib/rankings/rankFirstBorderEdgeScan";
import { formatListMetricDayDelta } from "../../../../../lib/rankings/listRowMetricMeta";
import CyberNumberNative from "../../ui/CyberNumberNative";
import {
  CyberSlantedTabBarNative,
  CyberSlantedTabNative,
} from "../rankings/CyberSlantedTabNative";
import { MATCH_CARD_METRIC_FONT } from "../games/matchCardTypography";
import { RANK_DISPLAY_FONT, RANKING_SCORE_FONT } from "../rankings/rankingsUiTheme";
import { copyTextNative } from "../leaderboards/copyTextNative";
import { RankingsCyberSectionLabelNative } from "../rankings/RankingsCyberPanelNative";
import SquadBattleIntroOverlayNative from "./SquadBattleIntroOverlayNative";
import SquadBattleLaunchOverlayNative from "./SquadBattleLaunchOverlayNative";
import {
  clearSquadBattleIntroSeenNative,
  hasSeenSquadBattleIntroNative,
} from "./squadBattleIntroSeenNative";
import { clearSquadBattleLaunchSeenNative, markSquadBattleLaunchSeenNative, readSquadBattleLaunchSeenBattleIdNative } from "./squadBattleLaunchSeenNative";
import {
  formatSquadBattleRecruitDeadlineLabel,
  shouldShowSquadBattleLaunch,
} from "../../../../../lib/squads/squadBattleLaunchGate";
import {
  readHeldInviteIdsNative,
  writeHeldInviteIdsNative,
} from "./squadBattleHeldInvitesNative";
import {
  fetchGroupBattleBootstrapNative,
  fetchGroupBattleRankingsNative,
  reformGroupBattleSquadNative,
  inviteToGroupBattleSquadNative,
  acceptGroupBattleInviteNative,
  declineGroupBattleInviteNative,
  joinGroupBattleByInviteCodeNative,
  createGroupBattleSquadNative,
  applyToGroupBattleSquadNative,
  resolveGroupBattleJoinRequestNative,
  fetchGroupBattleMyPayoutNative,
  renameGroupBattleSquadNative,
  cancelGroupBattleJoinRequestNative,
  leaveGroupBattleSquadNative,
  dissolveGroupBattleSquadNative,
} from "./groupBattleApiNative";
import { auth } from "../../lib/firebase";
import { SQUAD_GOLD_NATIVE } from "../../../../../lib/squads/squadBattleGoldTheme";
import { withHeldInviteId } from "../../../../../lib/squads/squadBattleInviteHold";
import { profilePathKeyFromRow } from "../../../../../lib/profile/profilePathKey";
import { navigateToPublicProfileNative } from "../../navigation/navigateToPublicProfileNative";
import {
  mapGroupBattleSnapshotRowsToSquads,
  mapCurrentMySquadToUiSquad,
  mapOpenSquadApiToListings,
  mapJoinRequestApiToUi,
} from "../../../../../lib/groupBattles/mapSnapshotRowsToSquads";
import {
  SQUAD_BATTLE_MOCK_DEADLINE_LABEL,
  SQUAD_BATTLE_IDLE_PANEL,
  SQUAD_BATTLE_RULES_SECTION,
  SQUAD_BATTLE_RANK_SPECTATOR_HINT,
  SQUAD_INVITE_DEADLINE_PREFIX,
  SQUAD_INVITE_HOLD_HINT,
  SQUAD_INVITE_LIST_EMPTY,
  SQUAD_INVITE_LIST_HINT,
  SQUAD_INVITE_LIST_TITLE,
  SQUAD_INVITE_JOIN_PROMPT,
  SQUAD_APPLICANT_OPEN_PROFILE,
  SQUAD_APPLICANT_SCORE_LABEL,
  SQUAD_APPLICANT_WINRATE_LABEL,
  SQUAD_APPLICANT_WR_LABEL,
  squadInviteIncomingTitle,
  squadInviteSendPrompt,
  squadApplicantApprovePrompt,
  SQUAD_BATTLE_PREVIEW_JUMPS,
  SQUAD_BATTLE_REWARD_RESULT_MOCK,
  squadBattlePayoutTotalUnits,
  type SquadBattleRewardResult,
  SQUAD_BATTLE_UI_PHASE_OPTIONS,
  SQUAD_BATTLE_WEEK_OPTIONS,
  SQUAD_OPEN_PERIOD_RANKS,
  SQUAD_OPEN_PERIOD_RANK_GROUP_LABEL,
  squadBattlePhaseBanner,
  SQUAD_RANKING_DETAIL_SPINE,
  squadMemberCountLabel,
  squadRankingList,
  squadScoreGaps,
  groupBattlePhaseToUiPhase,
  type SquadBattleUiPhase,
  type SquadBattleWeekIndex,
} from "../../../../../lib/squads/squadBattleUiCopy";

/** GOLD LEGION アクセント（CyberSubpageShell / タブは共有シアンのまま） */
const JOIN_BATTLE_AMBER = SQUAD_GOLD_NATIVE.acc;
/** 行入場スタッガー（ms）— Web の 40ms に合わせる */
const LB_ROW_STAGGER_MS = 40;

/** フェーズ帯の下 — 締切・LOCKED・休止などの状況 */
function SquadPhaseStatusBannerNative({
  phase,
  hasSquad,
  activeMemberCount,
  deadlineLabel,
}: {
  phase: SquadBattleUiPhase;
  hasSquad: boolean;
  activeMemberCount: number;
  deadlineLabel?: string | null;
}) {
  const banner = squadBattlePhaseBanner({
    phase,
    hasSquad,
    activeMemberCount,
    deadlineLabel,
  });
  const toneStyle =
    banner.tone === "warn"
      ? styles.phaseBannerWarn
      : banner.tone === "idle"
        ? styles.phaseBannerIdle
        : banner.tone === "reward"
          ? styles.phaseBannerReward
          : styles.phaseBannerDefault;
  const kickerStyle =
    banner.tone === "warn"
      ? styles.phaseBannerKickerWarn
      : banner.tone === "idle"
        ? styles.phaseBannerKickerIdle
        : styles.phaseBannerKicker;

  return (
    <View style={[styles.phaseBanner, toneStyle]}>
      <Text style={kickerStyle}>{banner.kicker}</Text>
      <Text style={styles.phaseBannerTitle}>{banner.title}</Text>
      <Text style={styles.phaseBannerDetail}>{banner.detail}</Text>
    </View>
  );
}

/** REWARD フェーズ — 獲得 Unit の見せ場 */
function SquadRewardResultPanelNative({
  hasSquad,
  result,
  loading,
}: {
  hasSquad: boolean;
  result: SquadBattleRewardResult;
  loading?: boolean;
}) {
  const r = result;
  const total = squadBattlePayoutTotalUnits(r);
  if (loading) {
    return (
      <View style={styles.rewardPanelEmpty}>
        <Text style={styles.rewardPanelKicker}>REWARD</Text>
        <Text style={styles.rewardPanelEmptyText}>
          獲得 Unit を読み込み中…
        </Text>
      </View>
    );
  }
  if (!hasSquad) {
    return (
      <View style={styles.rewardPanelEmpty}>
        <Text style={styles.rewardPanelKicker}>REWARD</Text>
        <Text style={styles.rewardPanelEmptyText}>
          {r.payoutNote ||
            "未参加のため配布対象外です。次回 ENTRY から参加できます。"}
        </Text>
      </View>
    );
  }
  const weekRows = r.weekly;
  return (
    <View style={styles.rewardPanel}>
      <Text style={styles.rewardPanelKicker}>Your payout</Text>
      <View style={styles.rewardLedger}>
        {weekRows.map((w, i) => (
          <View
            key={w.weekIndex}
            style={[styles.rewardLedgerRow, i > 0 && styles.rewardLedgerRowLine]}
          >
            <Text style={styles.rewardLedgerWeek}>W{w.weekIndex}</Text>
            <Text
              style={[
                styles.rewardLedgerRank,
                w.rank === 1 && styles.rewardLedgerRankFirst,
              ]}
            >
              {w.rank != null ? `#${w.rank}` : "—"}
            </Text>
            <Text style={styles.rewardLedgerUnits}>
              {w.status === "none" && w.units === 0 ? "—" : `+${w.units}`}
            </Text>
          </View>
        ))}
        <View style={[styles.rewardLedgerRow, styles.rewardLedgerMonthlyRow]}>
          <Text style={styles.rewardLedgerWeekHi}>MON</Text>
          <Text style={styles.rewardLedgerRankFirst}>
            {r.monthlyRank != null ? `#${r.monthlyRank}` : "—"}
          </Text>
          <Text style={styles.rewardLedgerUnitsHi}>
            {r.monthlyStatus === "none" && r.monthlyUnits === 0
              ? "—"
              : `+${r.monthlyUnits}`}
          </Text>
        </View>
      </View>
      <View style={styles.rewardTotalRow}>
        <Text style={styles.rewardTotalLabel}>Total</Text>
        <Text style={styles.rewardTotal}>+{total} Unit</Text>
      </View>
      <Text style={styles.rewardNote}>{r.payoutNote}</Text>
    </View>
  );
}

/** 休止期間の専用面（告知 + ルールを1枠） */
function SquadIdlePanelNative() {
  return (
    <View style={styles.idlePanel}>
      <Text style={styles.idleKicker}>{SQUAD_BATTLE_IDLE_PANEL.kicker}</Text>
      <Text style={styles.idleTitle}>{SQUAD_BATTLE_IDLE_PANEL.title}</Text>
      <Text style={styles.idleDetail}>{SQUAD_BATTLE_IDLE_PANEL.detail}</Text>
      <View style={styles.idleRulesDivider} />
      <Text style={styles.idleRulesTitle}>
        {SQUAD_BATTLE_RULES_SECTION.title}
      </Text>
      <View style={styles.idleRulesList}>
        {SQUAD_BATTLE_RULES_SECTION.items.map((item) => (
          <View key={item} style={styles.idleRulesRow}>
            <View style={styles.idleRulesDot} />
            <Text style={styles.idleRulesText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SquadEmptyHintNative({ children }: { children: ReactNode }) {
  return (
    <View style={styles.emptyHint}>
      <Text style={styles.emptyHintText}>{children}</Text>
    </View>
  );
}

/** 週間 W1〜W4 切替（CyberSlantedTab は使わない） */
function SquadWeekChipsNative({
  weekIndex,
  onChange,
}: {
  weekIndex: SquadBattleWeekIndex;
  onChange: (w: SquadBattleWeekIndex) => void;
}) {
  const active = SQUAD_BATTLE_WEEK_OPTIONS.find((w) => w.index === weekIndex);
  return (
    <View style={styles.weekChipsWrap}>
      <View style={styles.weekChipsRow}>
        {SQUAD_BATTLE_WEEK_OPTIONS.map((w) => {
          const on = w.index === weekIndex;
          return (
            <Pressable
              key={w.index}
              onPress={() => onChange(w.index)}
              style={[styles.weekChip, on && styles.weekChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.weekChipText, on && styles.weekChipTextActive]}>
                {w.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {active ? (
        <Text style={styles.weekPeriodLabel}>{active.periodLabel}</Text>
      ) : null}
    </View>
  );
}

/** GOLD LEGION — フェーズタイムライン（線は各ドット中心を結ぶ） */
function SquadGoldPhaseTrackNative({
  activeKey = "battle",
}: {
  /** null = オフシーズン（未点灯） */
  activeKey?: "entry" | "battle" | "reward" | null;
}) {
  const order = ["entry", "battle", "reward"] as const;
  const n = order.length;
  const activeIdx = activeKey == null ? -1 : order.indexOf(activeKey);
  const progressPct =
    activeIdx <= 0 ? 0 : (activeIdx / (n - 1)) * 100;
  /** 等幅カラム時、端ドット中心 = 半カラム */
  const edgeInsetPct = `${100 / (2 * n)}%` as DimensionValue;

  return (
    <View style={styles.phaseTrack}>
      <View
        style={[
          styles.phaseRailWrap,
          { left: edgeInsetPct, right: edgeInsetPct },
        ]}
        pointerEvents="none"
      >
        <View style={styles.phaseRail} />
        <View
          style={[styles.phaseRailFill, { width: `${progressPct}%` }]}
        />
      </View>
      {SQUAD_BATTLE_SEASON_PHASES.map((p) => {
        const idx = order.indexOf(p.key);
        const active = activeKey != null && p.key === activeKey;
        const done = activeIdx >= 0 && idx < activeIdx;
        const lit = active || done;
        return (
          <View key={p.key} style={styles.phaseNode}>
            <View
              style={[
                styles.phaseDot,
                lit ? styles.phaseDotLit : styles.phaseDotIdle,
              ]}
            />
            <Text
              style={[
                styles.phaseSegText,
                active && styles.phaseSegTextActive,
                !active && done && styles.phaseSegTextDone,
                !active && !done && styles.phaseSegTextIdle,
              ]}
            >
              {p.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/** HUD 風セクション見出し */
function SquadSectionHeaderNative({
  kicker,
  title,
  trailing,
  accent = "amber",
}: {
  kicker: string;
  title?: string;
  trailing?: ReactNode;
  accent?: "cyan" | "amber";
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionHeaderMain}>
        <RankingsCyberSectionLabelNative subtle={accent !== "amber"}>
          {kicker}
        </RankingsCyberSectionLabelNative>
        {title ? <Text style={styles.boardTitle}>{title}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

/** 一覧行用の控えめサイバー枠 */
/** GOLD LEGION — 一覧行の金配線フレーム */
function SquadGoldWireDecorNative() {
  return (
    <>
      <View style={styles.goldDecorTopBeam} pointerEvents="none" />
      <View style={styles.goldDecorLeftRail} pointerEvents="none" />
      <View style={styles.goldDecorCornerTL} pointerEvents="none" />
    </>
  );
}

function SquadListItemShellNative({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.goldListShell, style]}>
      <View style={styles.goldListInner}>
        <SquadGoldWireDecorNative />
        {children}
      </View>
    </View>
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
          color={page <= 0 ? "rgba(255,255,255,0.2)" : "#FFF7E0"}
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
            page >= pageCount - 1 ? "rgba(255,255,255,0.2)" : "#FFF7E0"
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
          { width: dim, height: dim, borderRadius: 2 },
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
  return (
    <RankingsAvatarNative
      photoURL={member.photoURL}
      label={member.displayName || member.handle || "member"}
      size={dim}
      square
    />
  );
}

function ProfileAvatarNative({
  profile,
  size = "md",
  square = false,
}: {
  profile: Pick<SquadApplicantProfile, "displayName" | "handle" | "photoURL">;
  size?: "md" | "lg";
  square?: boolean;
}) {
  const dim = size === "lg" ? 64 : 40;
  return (
    <RankingsAvatarNative
      photoURL={profile.photoURL}
      label={profile.displayName || profile.handle || "user"}
      size={dim}
      square={square}
    />
  );
}

/** Web `SquadUserNameLine` 相当 */
function SquadUserNameLineNative({
  name,
  plan,
  style,
  center = false,
}: {
  name: string;
  plan?: "free" | "pro" | null;
  style?: StyleProp<TextStyle>;
  center?: boolean;
}) {
  return (
    <View
      style={[
        styles.squadUserNameLine,
        center && styles.squadUserNameLineCenter,
      ]}
    >
      <Text
        style={[
          styles.memberName,
          styles.squadUserNameText,
          center && styles.squadUserNameTextCenter,
          style,
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {plan === "pro" ? (
        <View style={styles.squadUserProBadge}>
          <ProCyberBadgeNative compact />
        </View>
      ) : null}
    </View>
  );
}

function MemberRowNative({
  member,
  onOpenProfile,
  elevated = false,
  periodRanks = false,
  entryFrame = false,
}: {
  member: SquadMember;
  onOpenProfile?: (profile: SquadApplicantProfile) => void;
  elevated?: boolean;
  periodRanks?: boolean;
  entryFrame?: boolean;
}) {
  const useEntryFrame = periodRanks || entryFrame;
  if (member.empty) {
    return (
      <View
        style={[
          styles.memberRow,
          styles.memberRowEmpty,
          elevated && styles.memberRowElevated,
          useEntryFrame && styles.memberRowEmptyEntry,
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
  const profile = squadMemberToProfile(member);
  const content = (
    <>
      <MemberAvatarNative member={member} />
      <View style={styles.memberMeta}>
        <SquadUserNameLineNative name={member.displayName} plan={member.plan} />
      </View>
      {periodRanks ? (
        <OpenMemberPeriodRanksNative profile={profile} />
      ) : (
        <View style={styles.memberStats}>
          <SquadPointsTextNative
            value={profile.totalPosts}
            size="sm"
            suffix="posts"
            color="#CBD5E1"
          />
          <SquadPointsTextNative value={member.points} size="sm" suffix="pts" />
        </View>
      )}
    </>
  );
  if (onOpenProfile) {
    return (
      <Pressable
        onPress={() => onOpenProfile(profile)}
        style={({ pressed }) => [
          styles.memberRow,
          elevated && styles.memberRowElevated,
          useEntryFrame && styles.memberRowEntry,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View
      style={[
        styles.memberRow,
        elevated && styles.memberRowElevated,
        useEntryFrame && styles.memberRowEntry,
      ]}
    >
      {content}
    </View>
  );
}

function MySquadCardNative({
  squad,
  phase,
  onOpenMemberProfile,
  onCopyInviteCode,
  onRenameSquad,
  onLeaveSquad,
  onDissolveSquad,
  isOwner = false,
}: {
  squad: Squad;
  phase: SquadBattleUiPhase;
  onOpenMemberProfile?: (profile: SquadApplicantProfile) => void;
  onCopyInviteCode?: (code: string) => void;
  onRenameSquad?: (name: string) => void;
  onLeaveSquad?: () => void;
  onDissolveSquad?: () => void;
  isOwner?: boolean;
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
  const showBattleStats = phase !== "entry";
  const inviteCode =
    phase === "entry" && recruiting ? squad.inviteCode ?? null : null;
  const showHud = showBattleStats || inviteCode != null;
  const first = showBattleStats && squad.rank === 1;

  return (
    <View style={styles.mySquadOuter}>
      <View style={[styles.mySquadTab, !showBattleStats && styles.mySquadTabEntry]}>
        <View
          style={[styles.mySquadTabDot, !showBattleStats && styles.mySquadTabDotEntry]}
        />
        <Text
          style={[styles.mySquadTabText, !showBattleStats && styles.mySquadTabTextEntry]}
        >
          My squad
        </Text>
      </View>

          <View
            style={[
              styles.mySquadShell,
              !showBattleStats && styles.mySquadShellEntry,
              first && styles.lbRowFirst,
              showBattleStats && squad.rank === 2 && styles.lbRowSecond,
              showBattleStats && squad.rank === 3 && styles.lbRowThird,
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
                  <MaterialCommunityIcons name="check" size={14} color="#FFF7E0" />
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
                    !showBattleStats && styles.mySquadRenameBtnEntry,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={14}
                    color={
                      showBattleStats
                        ? "rgba(253,230,138,0.9)"
                        : "rgba(255,255,255,0.82)"
                    }
                  />
                </Pressable>
              ) : null}
            </View>
          )}

          {showHud ? (
          <View style={styles.mySquadHudRow}>
            {showBattleStats ? (
              <>
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
                            textShadowColor: "rgba(251,191,36,0.35)",
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
              </>
            ) : null}

            {inviteCode ? (
              <Pressable
                onPress={() => onCopyInviteCode?.(inviteCode)}
                accessibilityRole="button"
                accessibilityLabel={`招待コード ${inviteCode} をコピー`}
                style={({ pressed }) => [
                  styles.mySquadHudCell,
                  !showBattleStats && styles.mySquadHudCellEntry,
                  pressed && styles.mySquadHudCodePressed,
                ]}
              >
                <Text
                  style={[
                    styles.mySquadHudLabel,
                    !showBattleStats && styles.mySquadHudLabelEntry,
                  ]}
                >
                  Code
                </Text>
                <View style={styles.mySquadHudValueRow}>
                  <Text
                    style={[
                      styles.mySquadHudCode,
                      {
                        color: showBattleStats
                          ? scoreColorForRank(squad.rank)
                          : "rgba(255,255,255,0.92)",
                      },
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
          ) : null}
        </View>

        <View style={styles.mySquadMembersSection}>
          {showBattleStats ? (
            <RankingsCyberSectionLabelNative>Members</RankingsCyberSectionLabelNative>
          ) : (
            <View style={styles.mySquadMembersHeadEntry}>
              <View style={styles.mySquadMembersDotEntry} />
              <Text style={styles.mySquadMembersLabelEntry}>Members</Text>
            </View>
          )}
          <View style={styles.mySquadMemberList}>
            {showBattleStats ? null : (
              <View style={styles.mySquadPeriodHeaderRow}>
                <View style={styles.openMemberHeaderAvatarSpacer} />
                <View style={styles.memberMeta} />
                <OpenMemberPeriodRankHeaderNative />
              </View>
            )}
            {squad.members.map((m) => (
              <MemberRowNative
                key={m.uid}
                member={m}
                elevated={showBattleStats}
                periodRanks={!showBattleStats}
                onOpenProfile={onOpenMemberProfile}
              />
            ))}
          </View>
          {phase === "entry" && (onLeaveSquad || onDissolveSquad) ? (
            <View style={styles.mySquadLeaveRow}>
              {isOwner && onDissolveSquad ? (
                <Pressable
                  onPress={onDissolveSquad}
                  style={({ pressed }) => [
                    styles.mySquadDissolveBtn,
                    pressed && { opacity: 0.88 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="解散する"
                >
                  <Text style={styles.mySquadDissolveBtnText}>解散する</Text>
                </Pressable>
              ) : null}
              {!isOwner && onLeaveSquad ? (
                <Pressable
                  onPress={onLeaveSquad}
                  style={({ pressed }) => [
                    styles.mySquadLeaveBtn,
                    pressed && { opacity: 0.88 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="脱退する"
                >
                  <Text style={styles.mySquadLeaveBtnText}>脱退する</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
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
  eyebrow = "CREATE SQUAD",
  submitLabel = "作成する",
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  initialName?: string;
  eyebrow?: string;
  submitLabel?: string;
}) {
  const [name, setName] = useState(initialName);
  const [agreed, setAgreed] = useState(false);
  const trimmed = name.trim();
  const canSubmit =
    trimmed.length > 0 &&
    trimmed.length <= SQUAD_BATTLE_NAME_MAX_LEN &&
    agreed;
  const preview = trimmed.length > 0 ? trimmed : "————";

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setAgreed(false);
    }
  }, [visible, initialName]);

  function dismiss() {
    setName("");
    setAgreed(false);
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

            {/* 代表者同意チェック（Web と同文言） */}
            <Pressable
              onPress={() => setAgreed((v) => !v)}
              style={styles.createAgreeRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
            >
              <View
                style={[
                  styles.createAgreeBox,
                  agreed && styles.createAgreeBoxOn,
                ]}
              >
                {agreed ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={12}
                    color="#1A1002"
                  />
                ) : null}
              </View>
              <Text style={styles.createAgreeText}>
                {SQUAD_BATTLE_MIN_MEMBERS}〜{SQUAD_BATTLE_MAX_MEMBERS}
                人で確定し、開始後の入れ替え不可・同点は同順位同
                Unit・不正は失格に同意します。あなたが代表者になります。
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!canSubmit) return;
                setName("");
                setAgreed(false);
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

function squadRankingDetailSpineBorder(rank: number): string {
  if (cyberRankPalette(rank).firstPlaceFrame) return RANK_FIRST_EDGE_DIM_BORDER;
  return cyberRankQuietFrameColor(rank) ?? "rgba(148,163,184,0.35)";
}

function SquadRankingDetailSpineNative({
  rank,
  flush = false,
}: {
  rank: number;
  flush?: boolean;
}) {
  const spine = SQUAD_RANKING_DETAIL_SPINE;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.detailSpine,
        flush ? styles.detailSpineFlush : null,
        {
          top: flush ? 0 : spine.top,
          width: spine.width,
          height: flush ? undefined : spine.height,
          borderColor: squadRankingDetailSpineBorder(rank),
        },
      ]}
    />
  );
}

function SquadRankingDetailModalNative({
  visible,
  squad,
  onClose,
}: {
  visible: boolean;
  squad: Squad | null;
  onClose: () => void;
}) {
  if (!squad) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.createModalBackdrop} onPress={onClose}>
        <Pressable
          style={styles.applyConfirmCard}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView
            bounces={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.applyConfirmInner}>
            <View style={styles.applyConfirmHeader}>
              <Text style={styles.applyConfirmName}>Squad detail</Text>
              <Pressable
                onPress={onClose}
                style={styles.applyConfirmClose}
                accessibilityLabel="閉じる"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={15}
                  color="rgba(255,255,255,0.8)"
                />
              </Pressable>
            </View>
            <View style={styles.detailSquadHead}>
              <View style={styles.detailSquadRank}>
                <CyberRankNumberNative rank={squad.rank} compact />
              </View>
              <View style={styles.detailSquadMeta}>
                <Text style={styles.detailSquadName} numberOfLines={1}>
                  {squad.name}
                </Text>
                <Text style={styles.detailSquadCount}>
                  {squadMemberCountLabel(squad)}
                </Text>
              </View>
              <SquadPtsWithDayDeltaNative
                value={squad.avgPoints}
                delta={squad.avgPointsDayDelta}
                size="md"
                color={scoreColorForRank(squad.rank)}
              />
            </View>
            <View style={styles.detailMemberList}>
              {squad.members.map((member) => (
                <MemberRowNative key={member.uid} member={member} entryFrame />
              ))}
            </View>
          </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Web `ApplicantProfileSheet` 相当 */
function ApplicantProfileModalNative({
  visible,
  profile,
  metaLabel,
  onClose,
  onOpenPublicProfile,
  onApprove,
  onReject,
}: {
  visible: boolean;
  profile: SquadApplicantProfile | null;
  metaLabel?: string;
  onClose: () => void;
  onOpenPublicProfile?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  if (!profile) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.applicantModalBackdrop} onPress={onClose}>
        <Pressable
          style={styles.applyConfirmCard}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.applyConfirmInner}>
            <Pressable
              onPress={onClose}
              style={styles.applicantSheetCloseAbs}
              accessibilityLabel="閉じる"
            >
              <MaterialCommunityIcons
                name="close"
                size={15}
                color="rgba(255,255,255,0.8)"
              />
            </Pressable>

            <View style={styles.applicantSheetCenter}>
              <ProfileAvatarNative profile={profile} size="lg" square />
              <View style={styles.applicantSheetNameWrap}>
                <SquadUserNameLineNative
                  name={profile.displayName}
                  plan={profile.plan}
                  style={styles.applicantSheetName}
                  center
                />
              </View>
              {metaLabel ? (
                <Text style={styles.applicantSheetMeta}>{metaLabel}</Text>
              ) : null}
              {profile.bio ? (
                <Text style={styles.applicantSheetBio}>{profile.bio}</Text>
              ) : null}

              <View style={styles.applicantSheetRanks}>
                <OpenMemberPeriodRankHeaderNative />
                <OpenMemberPeriodRanksNative profile={profile} />
              </View>

              <View style={styles.applicantSheetStatsRow}>
                <View style={styles.applicantSheetStatCell}>
                  <Text style={styles.applicantSheetStatKey}>
                    {SQUAD_APPLICANT_SCORE_LABEL}
                  </Text>
                  <View style={styles.applicantSheetStatValue}>
                    <SquadPointsTextNative value={profile.points} size="md" />
                  </View>
                </View>
                <View style={styles.applicantSheetStatCell}>
                  <Text style={styles.applicantSheetStatKey}>
                    {SQUAD_APPLICANT_WINRATE_LABEL}
                  </Text>
                  <View style={styles.applicantSheetStatValue}>
                    <CyberNumberNative
                      value={profile.winRate.toFixed(1)}
                      size="md"
                      format={false}
                      suffix="%"
                    />
                  </View>
                </View>
              </View>
            </View>

            {onOpenPublicProfile ? (
              <Pressable
                onPress={onOpenPublicProfile}
                style={({ pressed }) => [
                  styles.applicantProfileBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.applicantProfileBtnText}>
                  {SQUAD_APPLICANT_OPEN_PROFILE}
                </Text>
              </Pressable>
            ) : null}

            {onApprove || onReject ? (
              <View style={styles.applicantSheetActions}>
                {onReject ? (
                  <Pressable
                    onPress={onReject}
                    style={({ pressed }) => [
                      styles.rejectBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialCommunityIcons name="close" size={14} color="#fecdd3" />
                    <Text style={styles.rejectBtnText}>拒否</Text>
                  </Pressable>
                ) : null}
                {onApprove ? (
                  <Pressable
                    onPress={onApprove}
                    style={({ pressed }) => [
                      styles.approveBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color={SQUAD_GOLD_NATIVE.accOn}
                    />
                    <Text style={styles.approveBtnText}>承認</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function OpenMemberPeriodRankHeaderNative() {
  return (
    <View style={styles.openPeriodRankHeader} accessibilityElementsHidden>
      <Text style={styles.openPeriodRankGroupLabel}>
        {SQUAD_OPEN_PERIOD_RANK_GROUP_LABEL}
      </Text>
      <View style={styles.openPeriodRanks}>
        {SQUAD_OPEN_PERIOD_RANKS.map((item) => (
          <Text key={item.key} style={styles.openPeriodRankHeaderLabel}>
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function OpenMemberPeriodRanksNative({
  profile,
}: {
  profile: SquadApplicantProfile;
}) {
  return (
    <View style={styles.openPeriodRanks}>
      {SQUAD_OPEN_PERIOD_RANKS.map((item) => {
        const rank = profile[item.key];
        const missing = rank == null || rank <= 0;
        return (
          <View key={item.key} style={styles.openPeriodRankCol}>
            <CyberRankNumberNative
              rank={missing ? 0 : rank}
              compact
              uniform
              muted={missing}
              displayValue={missing ? "—" : undefined}
            />
          </View>
        );
      })}
    </View>
  );
}

function OpenSquadMemberListNative({
  members,
  onOpenMemberProfile,
}: {
  members: SquadApplicantProfile[];
  onOpenMemberProfile: (profile: SquadApplicantProfile) => void;
}) {
  return (
    <View style={styles.openMemberList}>
      <View style={styles.openMemberHeaderRow}>
        <View style={styles.openMemberHeaderAvatarSpacer} />
        <View style={styles.openMeta} />
        <OpenMemberPeriodRankHeaderNative />
      </View>
      {members.map((m) => (
        <Pressable
          key={m.uid}
          onPress={() => onOpenMemberProfile(m)}
          style={({ pressed }) => [styles.openMemberRow, pressed && styles.pressed]}
        >
          <ProfileAvatarNative profile={m} square />
          <View style={styles.openMeta}>
            <SquadUserNameLineNative name={m.displayName} plan={m.plan} />
          </View>
          <OpenMemberPeriodRanksNative profile={m} />
        </Pressable>
      ))}
    </View>
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

  return (
    <View style={styles.openSquadShell}>
      <View style={styles.openRow}>
        {/* 列: 名前 | 人数 | 操作。募集中はバトル未開始のためスコアは出さない */}
        <Text style={styles.openName} numberOfLines={1}>
          {squad.name}
        </Text>

        <Text style={styles.openMetaChip}>
          {squad.memberCount}/{SQUAD_BATTLE_MAX_MEMBERS}
        </Text>

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
              color="rgba(255,255,255,0.8)"
            />
          </Pressable>
          <Pressable
            disabled={!canApply && !applied}
            onPress={() => {
              if (!canApply) return;
              onApply();
            }}
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
          <OpenSquadMemberListNative
            members={squad.members}
            onOpenMemberProfile={onOpenMemberProfile}
          />
        </View>
      ) : null}
    </View>
  );
}

/** Web `ApplyJoinConfirmSheet` 相当 */
function ApplyJoinConfirmModalNative({
  visible,
  squad,
  onClose,
  onConfirm,
  onOpenMemberProfile,
}: {
  visible: boolean;
  squad: OpenSquadListing | null;
  onClose: () => void;
  onConfirm: () => void;
  onOpenMemberProfile: (profile: SquadApplicantProfile) => void;
}) {
  if (!squad) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.createModalBackdrop} onPress={onClose}>
        <Pressable
          style={styles.applyConfirmCard}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.applyConfirmInner}>
            <View style={styles.applyConfirmHeader}>
              <View style={styles.openMeta}>
                <Text style={styles.applyConfirmName} numberOfLines={1}>
                  {squad.name}
                </Text>
                <Text style={styles.applyConfirmCopy}>
                  このグループへの参加を申請します
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                style={styles.applyConfirmClose}
                accessibilityLabel="閉じる"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={15}
                  color="rgba(255,255,255,0.8)"
                />
              </Pressable>
            </View>

            <ScrollView
              style={styles.applyConfirmList}
              contentContainerStyle={styles.applyConfirmListContent}
              bounces={false}
            >
              <OpenSquadMemberListNative
                members={squad.members}
                onOpenMemberProfile={onOpenMemberProfile}
              />
            </ScrollView>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.applyConfirmSubmit,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.applyConfirmSubmitText}>申請する</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
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

/** Web `IncomingJoinConfirmSheet` 相当 */
function IncomingJoinConfirmModalNative({
  visible,
  invite,
  openSquads,
  onClose,
  onConfirm,
  onDecline,
  onOpenMemberProfile,
}: {
  visible: boolean;
  invite: SquadIncomingInviteMock | null;
  openSquads: OpenSquadListing[];
  onClose: () => void;
  onConfirm: () => void;
  onDecline: () => void;
  onOpenMemberProfile: (profile: SquadApplicantProfile) => void;
}) {
  if (!invite) return null;
  const members = squadIncomingInviteMemberProfiles(invite, openSquads);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.createModalBackdrop} onPress={onClose}>
        <Pressable
          style={styles.applyConfirmCard}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.applyConfirmInner}>
            <View style={styles.applyConfirmHeader}>
              <View style={styles.openMeta}>
                <Text style={styles.applyConfirmName} numberOfLines={1}>
                  {invite.squadName}
                </Text>
                <Text style={styles.applyConfirmCopy}>
                  {SQUAD_INVITE_JOIN_PROMPT}
                </Text>
                <Text style={styles.openSub}>
                  {invite.fromDisplayName} からの招待
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                style={styles.applyConfirmClose}
                accessibilityLabel="閉じる"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={15}
                  color="rgba(255,255,255,0.8)"
                />
              </Pressable>
            </View>

            {members.length > 0 ? (
              <ScrollView
                style={styles.applyConfirmList}
                contentContainerStyle={styles.applyConfirmListContent}
                bounces={false}
              >
                <OpenSquadMemberListNative
                  members={members}
                  onOpenMemberProfile={onOpenMemberProfile}
                />
              </ScrollView>
            ) : null}

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.applyConfirmSubmit,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.applyConfirmSubmitText}>参加する</Text>
            </Pressable>
            <Pressable
              onPress={onDecline}
              style={({ pressed }) => [
                styles.incomingInviteHoldBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.incomingInviteHoldBtnText}>今回はパス</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type SquadInviteSendTarget = {
  source: PastSquadHistoryMock | GroupBattlePastSquadItem;
  member: SquadInviteMemberSummary;
};

function InviteSendConfirmModalNative({
  visible,
  target,
  squadName,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  target: SquadInviteSendTarget | null;
  squadName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!target) return null;
  const { member } = target;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.createModalBackdrop} onPress={onClose}>
        <Pressable
          style={styles.applyConfirmCard}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.applyConfirmInner}>
            <View style={styles.applyConfirmHeader}>
              <Text style={styles.applyConfirmName}>Invite</Text>
              <Pressable
                onPress={onClose}
                style={styles.applyConfirmClose}
                accessibilityLabel="閉じる"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={15}
                  color="rgba(255,255,255,0.8)"
                />
              </Pressable>
            </View>
            <View style={styles.inviteSendHero}>
              <ProfileAvatarNative
                profile={{
                  displayName: member.displayName,
                  handle: member.handle ?? "",
                  photoURL: member.photoURL,
                }}
                size="lg"
                square
              />
              <View style={styles.inviteSendNameWrap}>
                <SquadUserNameLineNative
                  name={member.displayName}
                  plan={member.plan}
                  style={styles.inviteSendName}
                  center
                />
              </View>
              {member.handle ? (
                <Text style={styles.inviteSendHandle}>@{member.handle}</Text>
              ) : null}
              <Text style={styles.applyConfirmCopy}>
                {squadInviteSendPrompt(member.displayName, squadName)}
              </Text>
            </View>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.applyConfirmSubmit,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.applyConfirmSubmitText}>誘う</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
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

/** Web `ApproveApplicantConfirmSheet` 相当 */
function ApproveApplicantConfirmModalNative({
  visible,
  request,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  request: SquadJoinRequest | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!request) return null;
  const { applicant } = request;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.createModalBackdrop} onPress={onClose}>
        <Pressable
          style={styles.applyConfirmCard}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.applyConfirmInner}>
            <View style={styles.applyConfirmHeader}>
              <Text style={styles.applyConfirmName}>Approve</Text>
              <Pressable
                onPress={onClose}
                style={styles.applyConfirmClose}
                accessibilityLabel="閉じる"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={15}
                  color="rgba(255,255,255,0.8)"
                />
              </Pressable>
            </View>
            <View style={styles.inviteSendHero}>
              <ProfileAvatarNative profile={applicant} size="lg" square />
              <View style={styles.inviteSendNameWrap}>
                <SquadUserNameLineNative
                  name={applicant.displayName}
                  plan={applicant.plan}
                  style={styles.inviteSendName}
                  center
                />
              </View>
              <Text style={styles.applyConfirmCopy}>
                {squadApplicantApprovePrompt(applicant.displayName)}
              </Text>
            </View>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.applyConfirmSubmit,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.applyConfirmSubmitText}>承認する</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
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

function IncomingInviteModalNative({
  visible,
  invite,
  onClose,
  onAccept,
  onHold,
}: {
  visible: boolean;
  invite: SquadIncomingInviteMock | null;
  onClose: () => void;
  onAccept: () => void;
  onHold: () => void;
}) {
  if (!invite) return null;
  const members = invite.members ?? [];
  const deadline = invite.deadlineLabel ?? SQUAD_BATTLE_MOCK_DEADLINE_LABEL;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onHold}>
      <Pressable style={styles.createModalBackdrop} onPress={onHold}>
        <Pressable
          style={styles.applyConfirmCard}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.applyConfirmInner}>
            <View style={styles.applyConfirmHeader}>
              <View style={styles.openMeta}>
                <Text style={styles.incomingInviteModalTitle}>
                  {squadInviteIncomingTitle(invite.fromDisplayName)}
                </Text>
                <Text style={styles.applyConfirmCopy}>
                  {SQUAD_INVITE_DEADLINE_PREFIX} {deadline}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                style={styles.applyConfirmClose}
                accessibilityLabel="閉じる"
              >
                <MaterialCommunityIcons
                  name="close"
                  size={15}
                  color="rgba(255,255,255,0.8)"
                />
              </Pressable>
            </View>
            <Text style={styles.incomingInviteSquadName} numberOfLines={1}>
              {invite.squadName}
            </Text>
            {members.length > 0 ? (
              <View style={styles.incomingInviteMemberList}>
                {members.map((m) => (
                  <View key={m.uid} style={styles.incomingInviteMemberRow}>
                    <ProfileAvatarNative
                      profile={{
                        displayName: m.displayName,
                        handle: m.handle ?? "",
                        photoURL: m.photoURL,
                      }}
                      square
                    />
                    <SquadUserNameLineNative name={m.displayName} plan={m.plan} />
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={styles.incomingInviteHoldHint}>
              {SQUAD_INVITE_HOLD_HINT}
            </Text>
            <Pressable
              onPress={onAccept}
              style={({ pressed }) => [
                styles.applyConfirmSubmit,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.applyConfirmSubmitText}>参加する</Text>
            </Pressable>
            <Pressable
              onPress={onHold}
              style={({ pressed }) => [
                styles.incomingInviteHoldBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.incomingInviteHoldBtnText}>保留する</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
                  color="rgba(251,191,36,0.85)"
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
                    color="#FFF7E0"
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
                    <View style={styles.pastInviteNameBlock}>
                      <SquadUserNameLineNative
                        name={m.displayName}
                        plan={m.plan}
                        style={styles.pastInviteName}
                      />
                      {m.handle ? (
                        <Text style={styles.pastInviteHandle}> @{m.handle}</Text>
                      ) : null}
                    </View>
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
  showEmpty = false,
}: {
  invites: SquadIncomingInviteMock[];
  onAccept: (invite: SquadIncomingInviteMock) => void;
  onDecline: (invite: SquadIncomingInviteMock) => void;
  showEmpty?: boolean;
}) {
  if (invites.length === 0 && !showEmpty) return null;

  return (
    <View style={styles.sectionBlock}>
      <SquadSectionHeaderNative
        kicker="Invites"
        title={SQUAD_INVITE_LIST_TITLE}
        accent="amber"
        trailing={
          <Text style={styles.boardCount}>{invites.length} pending</Text>
        }
      />
      <Text style={styles.incomingInviteHoldHint}>{SQUAD_INVITE_LIST_HINT}</Text>
      {invites.length === 0 ? (
        <Text style={styles.pastSquadHint}>{SQUAD_INVITE_LIST_EMPTY}</Text>
      ) : null}
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
                <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
                <Text style={styles.incomingInviteAcceptText}>参加する</Text>
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
  onWithdraw,
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
  onWithdraw: (req: SquadJoinRequest) => void;
  onOpenMemberProfile: (profile: SquadApplicantProfile) => void;
  onReform: (item: PastSquadHistoryMock | GroupBattlePastSquadItem) => void;
  onAcceptInvite: (invite: SquadIncomingInviteMock) => void;
  onDeclineInvite: (invite: SquadIncomingInviteMock) => void;
}) {
  const atLimit = pendingCount >= SQUAD_BATTLE_MAX_PENDING_APPLICATIONS;
  const [page, setPage] = useState(0);
  const [applyConfirmSquad, setApplyConfirmSquad] =
    useState<OpenSquadListing | null>(null);
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
          <Image
            source={require("../../../assets/squad-battle/icon.png")}
            style={styles.noneIconImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
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
        showEmpty
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
        {outgoingRequests.length === 0 ? (
          <SquadEmptyHintNative>
            送信中の参加申請はありません。
          </SquadEmptyHintNative>
        ) : (
          <View style={styles.listGap}>
            {outgoingRequests.map((req) => (
              <View key={req.id} style={styles.outgoingRow}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color="rgba(253,230,138,0.8)"
                />
                <View style={styles.openMeta}>
                  <Text style={styles.outgoingName} numberOfLines={1}>
                    {req.squadName}
                  </Text>
                  <Text style={styles.openSub}>
                    承認待ち · {req.createdAtLabel}
                  </Text>
                </View>
                <Pressable
                  onPress={() => onWithdraw(req)}
                  style={({ pressed }) => [
                    styles.withdrawBtn,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="取り下げ"
                >
                  <Text style={styles.withdrawBtnText}>取り下げ</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

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
              onApply={() => setApplyConfirmSquad(squad)}
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

      <ApplyJoinConfirmModalNative
        visible={applyConfirmSquad != null}
        squad={applyConfirmSquad}
        onClose={() => setApplyConfirmSquad(null)}
        onConfirm={() => {
          if (!applyConfirmSquad) return;
          onApply(applyConfirmSquad.id, applyConfirmSquad.name);
          setApplyConfirmSquad(null);
        }}
        onOpenMemberProfile={onOpenMemberProfile}
      />
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
        {requests.map((req) => {
          const weekRank = req.applicant.thisWeekRank;
          const weekMissing = weekRank == null || weekRank <= 0;
          return (
          <View key={req.id} style={styles.incomingRequestCard}>
            <Pressable
              onPress={() => onOpenProfile(req)}
              style={({ pressed }) => [styles.requestMain, pressed && styles.pressed]}
              accessibilityLabel={`${req.applicant.displayName}のプロフィール`}
            >
              <ProfileAvatarNative profile={req.applicant} square />
              <View style={styles.openMeta}>
                <View style={styles.requestNameRow}>
                  <SquadUserNameLineNative
                    name={req.applicant.displayName}
                    plan={req.applicant.plan}
                  />
                  <Text style={styles.requestTimeLabel} numberOfLines={1}>
                    {req.createdAtLabel}
                  </Text>
                </View>
                <View style={styles.requestStatsRow}>
                  <Text style={styles.requestThisWeekLabel}>今週</Text>
                  <CyberRankNumberNative
                    rank={weekMissing ? 0 : weekRank}
                    compact
                    uniform
                    muted={weekMissing}
                    displayValue={weekMissing ? "—" : undefined}
                  />
                  <Text style={styles.requestStatsDot} aria-hidden>
                    ·
                  </Text>
                  <Text style={styles.requestStatsWrLabel}>
                    {SQUAD_APPLICANT_WR_LABEL}
                  </Text>
                  <CyberNumberNative
                    value={req.applicant.winRate.toFixed(1)}
                    size="sm"
                    format={false}
                    suffix="%"
                  />
                </View>
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
                <MaterialCommunityIcons
                  name="check"
                  size={13}
                  color={SQUAD_GOLD_NATIVE.accOn}
                />
                <Text style={styles.approveBtnText}>承認</Text>
              </Pressable>
            </View>
          </View>
          );
        })}
      </View>
    </View>
  );
}

/** 上部固定 MY SQUAD — 左:順位 / 右:名前・メンバー */
function PinnedYourSquadCardNative({
  squad,
  onOpenDetail,
}: {
  squad: Squad;
  onOpenDetail?: () => void;
}) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <View style={styles.pinnedOuter}>
      <View style={styles.pinnedTab}>
        <View style={styles.pinnedTabDot} />
        <Text style={styles.pinnedTabText}>My squad</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${squad.name} detail`}
        onPress={onOpenDetail}
        style={({ pressed }) => [
          styles.lbRowWrap,
          pressed && (reduceMotion ? styles.lbRowPressedReduce : styles.lbRowPressed),
        ]}
      >
        <View style={styles.pinnedCard}>
          <View style={styles.lbRowContent}>
            <View style={styles.lbRankCol}>
              <CyberRankNumberNative rank={squad.rank} compact />
              <RankTrendBadgeNative squad={squad} />
            </View>
            <View style={styles.lbBody}>
              <View style={styles.lbTop}>
                <View style={styles.lbMeta}>
                  <Text style={styles.pinnedSquadName} numberOfLines={1}>
                    {squad.name}
                  </Text>
                  <View style={styles.avatarStackWithCount}>
                    <View style={styles.avatarStack}>
                      {squad.members.map((m) => (
                        <View key={m.uid} style={styles.avatarStackItem}>
                          <MemberAvatarNative member={m} size="sm" />
                        </View>
                      ))}
                    </View>
                    <Text style={styles.memberCountLabelMuted}>
                      {squadMemberCountLabel(squad)}
                    </Text>
                  </View>
                </View>
                <View style={styles.lbAvg}>
                  <SquadPtsWithDayDeltaNative
                    value={squad.avgPoints}
                    delta={squad.avgPointsDayDelta}
                    size="md"
                    tone="accent"
                    color={scoreColorForRank(squad.rank)}
                  />
                </View>
              </View>
            </View>
          </View>
          <SquadRankingDetailSpineNative rank={squad.rank} flush />
        </View>
      </Pressable>
    </View>
  );
}

/** Web `FirstPlaceStatsFooter` 相当 — ACE→LEAD→EST UNIT を順にフェードイン */
function FirstPlaceStatsFooterNative({
  squad,
  runnerUpAvg,
  period,
  animate = true,
  replayKey,
}: {
  squad: Squad;
  runnerUpAvg: number;
  period: "weekly" | "monthly";
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
  const estUnits = estimatedGroupBattleUnitsPerMember(period, squad.rank);
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
      key: "unit",
      node: (
        <>
          <View style={styles.lbFirstLabelRow}>
            <Text style={styles.lbFirstStatLabel}>EST UNIT</Text>
          </View>
          <View style={styles.lbFirstValueRow}>
            {estUnits != null ? (
              <CyberNumberNative value={estUnits} size="md" color={gold} />
            ) : (
              <Text style={styles.lbFirstStatMuted}>—</Text>
            )}
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

/** 2位以下 — 直前グループとのスコア差 */
function LeaderboardGapFooterNative({
  gapToAbove,
}: {
  gapToAbove: number | null;
}) {
  if (gapToAbove == null) return null;
  return (
    <View style={styles.lbGapFooter}>
      <Text style={styles.lbGapLabel}>GAP TO ABOVE</Text>
      <Text style={styles.lbGapValue}>−{gapToAbove} pts</Text>
    </View>
  );
}

function LeaderboardRowNative({
  squad,
  runnerUpAvg = 0,
  board = [],
  index = 0,
  animate = true,
  replayKey,
  period,
  onOpenDetail,
}: {
  squad: Squad;
  /** 2位の平均点（1位カードの LEAD 表示用） */
  runnerUpAvg?: number;
  /** 前後ギャップ計算用 */
  board?: Squad[];
  index?: number;
  animate?: boolean;
  replayKey?: string | number;
  period: "weekly" | "monthly";
  onOpenDetail?: () => void;
}) {
  const first = squad.rank === 1;
  const firstFrame = cyberRankPalette(squad.rank).firstPlaceFrame;
  const quietFrame = cyberRankQuietFrameColor(squad.rank);
  const reduceMotion = useReducedMotion() ?? false;
  const motionOff = reduceMotion || !animate;
  const { gapToAbove } = squadScoreGaps(squad, board);

  const row = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${squad.name} detail`}
      onPress={onOpenDetail}
      style={({ pressed }) => [
        styles.lbRowWrap,
        pressed && (reduceMotion ? styles.lbRowPressedReduce : styles.lbRowPressed),
      ]}
    >
    <View
      style={[
        styles.lbRow,
        first && styles.lbRowFirst,
        squad.rank === 2 && styles.lbRowSecond,
        squad.rank === 3 && styles.lbRowThird,
        first && { borderColor: RANK_FIRST_EDGE_DIM_BORDER },
        quietFrame ? { borderColor: quietFrame } : null,
      ]}
    >
      {firstFrame ? <RankFirstBorderEdgeScanNative /> : null}
      <View style={styles.lbRowContent}>
        <View style={styles.lbRankCol}>
          <CyberRankNumberNative rank={squad.rank} compact />
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
              <View style={styles.avatarStackWithCount}>
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
                <Text style={styles.memberCountLabelMuted}>
                  {squadMemberCountLabel(squad)}
                </Text>
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
        </View>
      </View>

      {first ? (
        <FirstPlaceStatsFooterNative
          squad={squad}
          runnerUpAvg={runnerUpAvg}
          period={period}
          animate={!motionOff}
          replayKey={replayKey}
        />
      ) : (
        <LeaderboardGapFooterNative gapToAbove={gapToAbove} />
      )}
    </View>
    <SquadRankingDetailSpineNative rank={squad.rank} />
    </Pressable>
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
  const route = useRoute();
  const isPreviewMode = route.name === "SquadBattlePreview";
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const [previewState, setPreviewState] =
    useState<SquadBattlePreviewState>(isPreviewMode ? "full" : "none");
  const [previewToolsOpen, setPreviewToolsOpen] = useState(false);
  /** 未開催・募集中は JOIN。バトル中は RANK（API 反映後に一度だけ切替） */
  const [mainTab, setMainTab] = useState<"join" | "rank">(
    isPreviewMode ? "rank" : "join"
  );
  const battleTabDefaultedRef = useRef(false);
  const bootstrapPeriodKeyRef = useRef<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [extraAppliedIds, setExtraAppliedIds] = useState<string[]>([]);
  const [dismissedRequestIds, setDismissedRequestIds] = useState<string[]>([]);
  const [profileRequest, setProfileRequest] = useState<SquadJoinRequest | null>(null);
  const [approveConfirmRequest, setApproveConfirmRequest] =
    useState<SquadJoinRequest | null>(null);
  const [createSquadOpen, setCreateSquadOpen] = useState(false);
  const [createSquadBusy, setCreateSquadBusy] = useState(false);
  const [joinByCodeOpen, setJoinByCodeOpen] = useState(false);
  const [joinByCodeBusy, setJoinByCodeBusy] = useState(false);
  const [createdSquadName, setCreatedSquadName] = useState<string | null>(null);
  /** 招待参加直後の MY SQUAD（招待メンバーを載せる） */
  const [joinedInviteSquad, setJoinedInviteSquad] = useState<Squad | null>(null);
  /** 初回イントロ — マウント後に AsyncStorage を確認して開く */
  const [introOpen, setIntroOpen] = useState(false);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [rankPeriod, setRankPeriod] = useState<"weekly" | "monthly">("weekly");
  /** 週間の週インデックス（プレビュー） */
  const [weekIndex, setWeekIndex] = useState<SquadBattleWeekIndex>(2);
  /** 開催フェーズ（本番は大会 phase、プレビューはツール切替） */
  const [uiPhase, setUiPhase] = useState<SquadBattleUiPhase>(
    isPreviewMode ? "battle" : "idle"
  );
  const [boardStatus, setBoardStatus] = useState<"live" | "final">("live");
  /** スナップショット rows。null ならモック leaderboard */
  const [liveLeaderboard, setLiveLeaderboard] = useState<Squad[] | null>(null);
  const [detailSquad, setDetailSquad] = useState<Squad | null>(null);
  /** 取り下げた申請 ID（プレビュー） */
  const [withdrawnRequestIds, setWithdrawnRequestIds] = useState<string[]>([]);
  const [liveBattleId, setLiveBattleId] = useState<string | null>(null);
  const [liveBattlePhase, setLiveBattlePhase] = useState<string | null>(null);
  const [liveWeeklyLabels, setLiveWeeklyLabels] = useState<string[]>([]);
  const [liveMonthlyLabel, setLiveMonthlyLabel] = useState<string | null>(null);
  const [liveRecruitEndAtMs, setLiveRecruitEndAtMs] = useState<number | null>(
    null
  );
  const launchAutoShownRef = useRef(false);
  const [livePastSquads, setLivePastSquads] = useState<
    GroupBattlePastSquadItem[] | null
  >(null);
  const [liveIncomingInvites, setLiveIncomingInvites] = useState<
    SquadIncomingInviteMock[] | null
  >(null);
  const [liveOpenSquads, setLiveOpenSquads] = useState<OpenSquadListing[] | null>(
    null
  );
  const [liveIncomingRequests, setLiveIncomingRequests] = useState<
    SquadJoinRequest[] | null
  >(null);
  const [liveOutgoingRequests, setLiveOutgoingRequests] = useState<
    SquadJoinRequest[] | null
  >(null);
  const [liveFormingSquad, setLiveFormingSquad] = useState<Squad | null>(null);
  const [liveSelfUid, setLiveSelfUid] = useState<string | null>(null);
  const [liveMySquadId, setLiveMySquadId] = useState<string | null>(null);
  const [liveIsOwner, setLiveIsOwner] = useState(false);
  const [reformBusyId, setReformBusyId] = useState<string | null>(null);
  const [reformTarget, setReformTarget] = useState<
    PastSquadHistoryMock | GroupBattlePastSquadItem | null
  >(null);
  const [inviteSendTarget, setInviteSendTarget] =
    useState<SquadInviteSendTarget | null>(null);
  const [incomingInviteModalId, setIncomingInviteModalId] = useState<
    string | null
  >(null);
  const [incomingJoinConfirmInvite, setIncomingJoinConfirmInvite] =
    useState<SquadIncomingInviteMock | null>(null);
  const [heldInviteIds, setHeldInviteIds] = useState<string[]>([]);
  const [heldInvitesReady, setHeldInvitesReady] = useState(false);
  const [inviteModalSessionDone, setInviteModalSessionDone] = useState(false);
  const [dismissedInviteIds, setDismissedInviteIds] = useState<string[]>([]);
  const [liveRewardResult, setLiveRewardResult] =
    useState<SquadBattleRewardResult | null>(null);
  const [liveRewardHasSquad, setLiveRewardHasSquad] = useState<boolean | null>(
    null
  );
  const [rewardPayoutLoading, setRewardPayoutLoading] = useState(false);

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
    if (isPreviewMode || battleTabDefaultedRef.current) return;
    if (uiPhase === "battle" || uiPhase === "reward") {
      setMainTab("rank");
      battleTabDefaultedRef.current = true;
    }
  }, [uiPhase, isPreviewMode]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ids = await readHeldInviteIdsNative();
      if (cancelled) return;
      setHeldInviteIds(ids);
      setHeldInvitesReady(true);
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
        const periodKey = `${rankPeriod}|${weekIndex}`;
        const boot = await fetchGroupBattleBootstrapNative({
          idToken: token,
          period: rankPeriod,
          weekIndex: rankPeriod === "weekly" ? weekIndex : null,
        });
        if (cancelled) return;
        bootstrapPeriodKeyRef.current = periodKey;
        if (!boot?.battle) {
          setLiveBattleId(null);
          setLiveBattlePhase(null);
          setLiveRecruitEndAtMs(null);
          setLiveLeaderboard(null);
          setLiveOpenSquads(null);
          setLiveIncomingRequests(null);
          setLiveOutgoingRequests(null);
          setLiveFormingSquad(null);
          if (!isPreviewMode) setUiPhase("idle");
          return;
        }
        setLiveBattleId(boot.battle.id);
        setLiveBattlePhase(boot.battle.phase);
        setLiveWeeklyLabels(boot.battle.weeklyLabels ?? []);
        setLiveMonthlyLabel(boot.battle.monthlyRange?.label ?? null);
        setLiveRecruitEndAtMs(
          Number(boot.battle.recruitEndAtMs) > 0
            ? Number(boot.battle.recruitEndAtMs)
            : null
        );
        if (!isPreviewMode) {
          setUiPhase(groupBattlePhaseToUiPhase(boot.battle.phase));
        }
        if (user?.uid) setLiveSelfUid(user.uid);
        const mySquadId = boot.mySquad?.id ?? null;
        setLiveMySquadId(mySquadId);
        setLiveIsOwner(boot.membership?.role === "owner");
        setLiveFormingSquad(
          boot.mySquad
            ? mapCurrentMySquadToUiSquad(boot.mySquad, user?.uid ?? null)
            : null
        );
        const rankings = boot.rankings;
        if (rankings?.snapshot?.rows?.length) {
          setBoardStatus(rankings.snapshot.status);
          setLiveLeaderboard(
            mapGroupBattleSnapshotRowsToSquads(
              rankings.snapshot.rows,
              mySquadId
            )
          );
        } else {
          setLiveLeaderboard(rankings?.snapshot ? [] : null);
          if (rankings?.snapshot) {
            setBoardStatus(rankings.snapshot.status);
          }
        }
        setLiveOpenSquads(
          boot.openSquads ? mapOpenSquadApiToListings(boot.openSquads) : []
        );
        if (boot.pastSquads) setLivePastSquads(boot.pastSquads);
        if (boot.invites) {
          setLiveIncomingInvites(
            boot.invites.map((i) => ({
              id: i.id,
              squadId: i.squadId,
              squadName: i.squadName,
              fromDisplayName: i.fromDisplayName,
            }))
          );
        }
        if (boot.joinRequests) {
          setLiveIncomingRequests(
            boot.joinRequests.incoming.map(mapJoinRequestApiToUi)
          );
          setLiveOutgoingRequests(
            boot.joinRequests.outgoing.map(mapJoinRequestApiToUi)
          );
        }
      } catch {
        // プレビュー時のみモック継続
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPreviewMode]);

  useEffect(() => {
    if (!liveBattleId) return;
    const periodKey = `${rankPeriod}|${weekIndex}`;
    if (bootstrapPeriodKeyRef.current === periodKey) return;
    let cancelled = false;
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const weeklyLabels = liveWeeklyLabels;
        const label =
          rankPeriod === "weekly"
            ? weeklyLabels[weekIndex - 1] ??
              weeklyLabels[weeklyLabels.length - 1]
            : liveMonthlyLabel ?? undefined;
        const rankings = await fetchGroupBattleRankingsNative(
          liveBattleId,
          rankPeriod,
          label,
          { idToken: token }
        );
        if (cancelled) return;
        bootstrapPeriodKeyRef.current = periodKey;
        if (rankings?.snapshot?.rows?.length) {
          setBoardStatus(rankings.snapshot.status);
          setLiveLeaderboard(
            mapGroupBattleSnapshotRowsToSquads(
              rankings.snapshot.rows,
              liveMySquadId
            )
          );
        } else {
          setLiveLeaderboard(rankings?.snapshot ? [] : null);
          if (rankings?.snapshot) setBoardStatus(rankings.snapshot.status);
        }
      } catch {
        /* keep previous board */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    liveBattleId,
    liveMySquadId,
    liveWeeklyLabels,
    liveMonthlyLabel,
    rankPeriod,
    weekIndex,
  ]);

  useEffect(() => {
    if (uiPhase !== "reward" || !liveBattleId) {
      if (!isPreviewMode) {
        setLiveRewardResult(null);
        setLiveRewardHasSquad(null);
      }
      return;
    }
    let cancelled = false;
    setRewardPayoutLoading(true);
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetchGroupBattleMyPayoutNative(liveBattleId, {
          idToken: token,
        });
        if (cancelled || !res?.payout) return;
        const p = res.payout;
        setLiveRewardHasSquad(p.hasSquad);
        setLiveRewardResult({
          weekly: p.weekly.map((w) => ({
            weekIndex: w.weekIndex,
            rank: w.rank,
            units: w.units,
            status: w.status,
          })),
          monthlyRank: p.monthlyRank,
          monthlyUnits: p.monthlyUnits,
          monthlyStatus: p.monthlyStatus,
          payoutNote: p.payoutNote,
        });
      } catch {
        // keep previous / mock
      } finally {
        if (!cancelled) setRewardPayoutLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uiPhase, liveBattleId, isPreviewMode]);

  useEffect(() => {
    if (isPreviewMode || launchAutoShownRef.current || !liveBattleId) return;
    let cancelled = false;
    void (async () => {
      const seen = await readSquadBattleLaunchSeenBattleIdNative();
      if (cancelled) return;
      if (
        !shouldShowSquadBattleLaunch({
          battleId: liveBattleId,
          phase: liveBattlePhase,
          seenBattleId: seen,
        })
      ) {
        return;
      }
      launchAutoShownRef.current = true;
      await markSquadBattleLaunchSeenNative(liveBattleId);
      if (!cancelled) setLaunchOpen(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isPreviewMode, liveBattleId, liveBattlePhase]);

  const mock = useMemo(
    () =>
      isPreviewMode
        ? getSquadBattleMock(previewState)
        : getSquadBattleMock("none"),
    [isPreviewMode, previewState]
  );
  const useLiveFallbacks = liveBattleId != null || !isPreviewMode;
  const leaderboard =
    liveLeaderboard ?? (useLiveFallbacks ? [] : mock.leaderboard);
  const openSquadsForUi =
    liveOpenSquads ?? (useLiveFallbacks ? [] : mock.openSquads);
  const rankingList = useMemo(
    () => squadRankingList(leaderboard),
    [leaderboard]
  );

  const mySquad = useMemo(() => {
    const liveMine = liveLeaderboard?.find((s) => s.isMine) ?? null;
    if (liveMine) {
      return createdSquadName ? { ...liveMine, name: createdSquadName } : liveMine;
    }
    if (liveFormingSquad) {
      return createdSquadName
        ? { ...liveFormingSquad, name: createdSquadName }
        : liveFormingSquad;
    }
    if (joinedInviteSquad) {
      return createdSquadName
        ? { ...joinedInviteSquad, name: createdSquadName }
        : joinedInviteSquad;
    }
    if (useLiveFallbacks) return null;
    if (!mock.mySquad) return null;
    if (!createdSquadName) return mock.mySquad;
    return { ...mock.mySquad, name: createdSquadName };
  }, [
    liveLeaderboard,
    liveFormingSquad,
    joinedInviteSquad,
    mock.mySquad,
    createdSquadName,
    useLiveFallbacks,
  ]);

  const boardRunnerUpAvg = useMemo(
    () => leaderboard.find((s) => s.rank === 2)?.avgPoints ?? 0,
    [leaderboard]
  );

  const appliedSquadIds = useMemo(() => {
    const base =
      liveOutgoingRequests ??
      (useLiveFallbacks ? [] : mock.myOutgoingRequests);
    const ids = new Set(base.map((r) => r.squadId));
    for (const id of extraAppliedIds) ids.add(id);
    return ids;
  }, [
    liveOutgoingRequests,
    mock.myOutgoingRequests,
    extraAppliedIds,
    useLiveFallbacks,
  ]);

  const visibleIncoming = useMemo(() => {
    const base =
      liveIncomingRequests ??
      (useLiveFallbacks ? [] : mock.incomingRequests);
    return base.filter((r) => !dismissedRequestIds.includes(r.id));
  }, [
    liveIncomingRequests,
    mock.incomingRequests,
    dismissedRequestIds,
    useLiveFallbacks,
  ]);

  const outgoingForDisplay = useMemo(() => {
    const base = [
      ...(liveOutgoingRequests ??
        (useLiveFallbacks ? [] : mock.myOutgoingRequests)),
    ];
    for (const id of extraAppliedIds) {
      if (base.some((r) => r.squadId === id)) continue;
      const squad = openSquadsForUi.find((s) => s.id === id);
      if (!squad) continue;
      base.push({
        id: `local-${id}`,
        squadId: id,
        squadName: squad.name,
        status: "pending",
        createdAtLabel: "たった今",
        applicant: {
          uid: liveSelfUid ?? "me",
          handle: "",
          displayName: "YOU",
          points: 0,
          winRate: 0,
          activeWinStreak: 0,
          totalPosts: 0,
          bio: "",
        },
      });
    }
    return base.filter((r) => !withdrawnRequestIds.includes(r.id));
  }, [
    liveOutgoingRequests,
    mock.myOutgoingRequests,
    openSquadsForUi,
    extraAppliedIds,
    withdrawnRequestIds,
    useLiveFallbacks,
    liveSelfUid,
  ]);

  const pendingCount = outgoingForDisplay.length;
  const myActiveCount = mySquad ? countActiveMembers(mySquad) : 0;
  const phaseTrackKey = uiPhase === "idle" ? null : uiPhase;

  const pastSquadsForUi =
    livePastSquads ?? (useLiveFallbacks ? [] : mock.pastSquads);
  const incomingInvitesForUi = useMemo(() => {
    const base =
      liveIncomingInvites ??
      (useLiveFallbacks ? [] : mock.incomingInvites);
    return base.filter((i) => !dismissedInviteIds.includes(i.id));
  }, [
    liveIncomingInvites,
    mock.incomingInvites,
    dismissedInviteIds,
    useLiveFallbacks,
  ]);
  const selfUidForUi = liveSelfUid ?? "me";
  const membersLocked =
    uiPhase === "battle" || (isPreviewMode && previewState === "full");
  const incomingInviteForModal = useMemo(() => {
    if (incomingInviteModalId == null) return null;
    return (
      incomingInvitesForUi.find((i) => i.id === incomingInviteModalId) ?? null
    );
  }, [incomingInviteModalId, incomingInvitesForUi]);

  useEffect(() => {
    if (!heldInvitesReady || inviteModalSessionDone) return;
    if (introOpen || mySquad != null) return;
    if (mainTab !== "join" || uiPhase !== "entry") return;
    if (incomingInviteModalId != null) return;
    const next = incomingInvitesForUi.find(
      (i) => !heldInviteIds.includes(i.id)
    );
    if (!next) return;
    setIncomingInviteModalId(next.id);
    setInviteModalSessionDone(true);
  }, [
    heldInvitesReady,
    inviteModalSessionDone,
    introOpen,
    mySquad,
    mainTab,
    uiPhase,
    incomingInviteModalId,
    incomingInvitesForUi,
    heldInviteIds,
  ]);

  function holdIncomingInvite(inviteId: string) {
    setHeldInviteIds((prev) => {
      const next = withHeldInviteId(prev, inviteId);
      void writeHeldInviteIdsNative(next);
      return next;
    });
    setIncomingInviteModalId(null);
  }

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
        if (res.ok) setInviteSendTarget(null);
      } catch {
        flash("招待に失敗しました");
      }
      setReformBusyId(null);
      return;
    }
    const member = item.members.find((m) => m.uid === memberUid);
    flash(`招待を送りました: ${member?.displayName ?? memberUid}`);
    setInviteSendTarget(null);
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
        setIncomingInviteModalId(null);
        setIncomingJoinConfirmInvite(null);
        setJoinedInviteSquad(squadFromIncomingInvite(invite));
        setPreviewState("recruiting");
        setCreatedSquadName(invite.squadName);
        setMainTab("join");
        flash(`参加: ${invite.squadName}`);
        return;
      } catch {
        flash("参加に失敗しました");
        return;
      }
    }
    setDismissedInviteIds((prev) => [...prev, invite.id]);
    setIncomingInviteModalId(null);
    setIncomingJoinConfirmInvite(null);
    setJoinedInviteSquad(squadFromIncomingInvite(invite));
    setPreviewState("recruiting");
    setCreatedSquadName(invite.squadName);
    setMainTab("join");
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
    setIncomingJoinConfirmInvite(null);
    flash(`パス: ${invite.squadName}`);
  }

  function handlePreviewStateChange(next: SquadBattlePreviewState) {
    setPreviewState(next);
    setExtraAppliedIds([]);
    setDismissedRequestIds([]);
    setWithdrawnRequestIds([]);
    setProfileRequest(null);
    setCreateSquadOpen(false);
    setJoinByCodeOpen(false);
    setCreatedSquadName(null);
    setJoinedInviteSquad(null);
    setReformTarget(null);
    setDismissedInviteIds([]);
    setInviteSendTarget(null);
    setIncomingInviteModalId(null);
    setIncomingJoinConfirmInvite(null);
    setMainTab(next === "none" ? "join" : "rank");
  }

  function applyPreviewJump(
    jump: (typeof SQUAD_BATTLE_PREVIEW_JUMPS)[number]
  ) {
    handlePreviewStateChange(jump.previewState);
    setUiPhase(jump.phase);
    setMainTab(jump.tab);
    if (jump.boardStatus) setBoardStatus(jump.boardStatus);
    setPreviewToolsOpen(false);
    if (jump.overlay === "intro") {
      void (async () => {
        await clearSquadBattleIntroSeenNative();
        setIntroOpen(true);
      })();
      return;
    }
    if (jump.overlay === "launch") {
      void (async () => {
        await clearSquadBattleLaunchSeenNative();
        setLaunchOpen(true);
      })();
      return;
    }
    if (jump.overlay === "create") {
      setCreateSquadOpen(true);
      return;
    }
    if (jump.overlay === "joinCode") {
      setJoinByCodeOpen(true);
      return;
    }
    if (jump.overlay === "applicant") {
      const req = getSquadBattleMock("recruiting").incomingRequests[0];
      if (req) setProfileRequest(req);
      return;
    }
    if (jump.overlay === "detail") {
      const top = getSquadBattleMock("full").leaderboard[0];
      if (top) setDetailSquad(top);
    }
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

  async function handleCreateSquad(name: string) {
    if (liveBattleId) {
      setCreateSquadBusy(true);
      try {
        const token = await withAuthToken();
        const res = await createGroupBattleSquadNative(
          liveBattleId,
          { name, acceptRules: true },
          { idToken: token }
        );
        if (!res.ok) {
          flash(`作成失敗: ${res.error}`);
          setCreateSquadBusy(false);
          return;
        }
        setCreateSquadOpen(false);
        setCreatedSquadName(name);
        setLiveMySquadId(res.squadId);
        setLiveIsOwner(true);
        setLiveFormingSquad(
          mapCurrentMySquadToUiSquad(
            {
              id: res.squadId,
              name,
              memberUids: liveSelfUid ? [liveSelfUid] : [],
              memberCount: 1,
              status: "forming",
              inviteCode: res.inviteCode,
            },
            liveSelfUid
          )
        );
        setExtraAppliedIds([]);
        setDismissedRequestIds([]);
        setProfileRequest(null);
        setMainTab("join");
        flash(`グループを作成: ${name}`);
      } catch {
        flash("作成に失敗しました");
      }
      setCreateSquadBusy(false);
      return;
    }

    if (!isPreviewMode) {
      flash("開催中の大会がありません");
      return;
    }

    setCreateSquadOpen(false);
    setCreatedSquadName(name);
    setPreviewState("recruiting");
    setExtraAppliedIds([]);
    setDismissedRequestIds([]);
    setProfileRequest(null);
    setMainTab("join");
    flash(`グループを作成: ${name}`);
  }

  async function handleApplyToSquad(squadId: string, squadName: string) {
    if (appliedSquadIds.has(squadId)) return;
    if (pendingCount >= SQUAD_BATTLE_MAX_PENDING_APPLICATIONS) {
      flash(`申請は最大${SQUAD_BATTLE_MAX_PENDING_APPLICATIONS}件まで`);
      return;
    }
    if (liveBattleId) {
      try {
        const token = await withAuthToken();
        const res = await applyToGroupBattleSquadNative(
          liveBattleId,
          squadId,
          { idToken: token }
        );
        if (!res.ok) {
          flash(`申請失敗: ${res.error}`);
          return;
        }
        setExtraAppliedIds((prev) =>
          prev.includes(squadId) ? prev : [...prev, squadId]
        );
        setLiveOutgoingRequests((prev) => {
          const base = prev ?? [];
          if (base.some((r) => r.squadId === squadId)) return base;
          return [
            ...base,
            {
              id: res.requestId,
              squadId,
              squadName,
              status: "pending",
              createdAtLabel: "たった今",
              applicant: {
                uid: liveSelfUid ?? "me",
                handle: "",
                displayName: "YOU",
                points: 0,
                winRate: 0,
                activeWinStreak: 0,
                totalPosts: 0,
                bio: "",
              },
            },
          ];
        });
        flash(`申請を送信: ${squadName}`);
      } catch {
        flash("申請に失敗しました");
      }
      return;
    }

    if (!isPreviewMode) {
      flash("開催中の大会がありません");
      return;
    }

    setExtraAppliedIds((prev) =>
      prev.includes(squadId) ? prev : [...prev, squadId]
    );
    flash(`申請を送信: ${squadName}`);
  }

  async function handleResolveJoinRequest(
    req: SquadJoinRequest,
    decision: "approve" | "reject"
  ) {
    if (liveBattleId) {
      try {
        const token = await withAuthToken();
        const res = await resolveGroupBattleJoinRequestNative(
          liveBattleId,
          req.id,
          decision,
          { idToken: token }
        );
        if (!res.ok) {
          flash(
            `${decision === "approve" ? "承認" : "拒否"}失敗: ${res.error}`
          );
          return;
        }
        setDismissedRequestIds((prev) =>
          prev.includes(req.id) ? prev : [...prev, req.id]
        );
        setLiveIncomingRequests((prev) =>
          (prev ?? []).filter((r) => r.id !== req.id)
        );
        setApproveConfirmRequest(null);
        setProfileRequest(null);
        flash(
          `${decision === "approve" ? "承認" : "拒否"}: ${req.applicant.displayName}`
        );
      } catch {
        flash("処理に失敗しました");
      }
      return;
    }

    setDismissedRequestIds((prev) =>
      prev.includes(req.id) ? prev : [...prev, req.id]
    );
    setApproveConfirmRequest(null);
    setProfileRequest(null);
    flash(
      `${decision === "approve" ? "承認" : "拒否"}: ${req.applicant.displayName}`
    );
  }

  async function handleRenameSquad(name: string) {
    if (liveBattleId && mySquad?.id) {
      try {
        const token = await withAuthToken();
        const res = await renameGroupBattleSquadNative(
          liveBattleId,
          mySquad.id,
          name,
          { idToken: token }
        );
        if (!res.ok) {
          flash(`名前変更失敗: ${res.error}`);
          return;
        }
        setCreatedSquadName(res.name);
        setLiveFormingSquad((prev) =>
          prev ? { ...prev, name: res.name } : prev
        );
        flash(`名前を変更: ${res.name}`);
        return;
      } catch {
        flash("名前変更に失敗しました");
        return;
      }
    }
    setCreatedSquadName(name);
    flash(`名前を変更: ${name}`);
  }

  async function handleWithdrawRequest(req: SquadJoinRequest) {
    if (liveBattleId) {
      try {
        const token = await withAuthToken();
        const res = await cancelGroupBattleJoinRequestNative(
          liveBattleId,
          req.id,
          { idToken: token }
        );
        if (!res.ok) {
          flash(`取り下げ失敗: ${res.error}`);
          return;
        }
        setLiveOutgoingRequests((prev) =>
          prev ? prev.filter((r) => r.id !== req.id) : prev
        );
        setExtraAppliedIds((prev) => prev.filter((id) => id !== req.squadId));
        flash(`申請を取り下げ: ${req.squadName}`);
        return;
      } catch {
        flash("取り下げに失敗しました");
        return;
      }
    }
    setWithdrawnRequestIds((prev) =>
      prev.includes(req.id) ? prev : [...prev, req.id]
    );
    setExtraAppliedIds((prev) => prev.filter((id) => id !== req.squadId));
    flash(`申請を取り下げ: ${req.squadName}`);
  }

  async function handleLeaveSquad() {
    if (!liveBattleId || !mySquad?.id) return;
    try {
      const token = await withAuthToken();
      const res = await leaveGroupBattleSquadNative(
        liveBattleId,
        mySquad.id,
        { idToken: token }
      );
      if (!res.ok) {
        flash(`脱退失敗: ${res.error}`);
        return;
      }
      setLiveFormingSquad(null);
      setLiveMySquadId(null);
      setLiveIsOwner(false);
      setCreatedSquadName(null);
      flash("スクワッドから脱退しました");
    } catch {
      flash("脱退に失敗しました");
    }
  }

  async function handleDissolveSquad() {
    if (!liveBattleId || !mySquad?.id) return;
    try {
      const token = await withAuthToken();
      const res = await dissolveGroupBattleSquadNative(
        liveBattleId,
        mySquad.id,
        { idToken: token }
      );
      if (!res.ok) {
        flash(`解散失敗: ${res.error}`);
        return;
      }
      setLiveFormingSquad(null);
      setLiveMySquadId(null);
      setLiveIsOwner(false);
      setCreatedSquadName(null);
      flash("スクワッドを解散しました");
    } catch {
      flash("解散に失敗しました");
    }
  }

  function openMemberProfile(profile: SquadApplicantProfile) {
    const key = profilePathKeyFromRow(profile);
    if (!key) return;
    navigateToPublicProfileNative(navigation as never, { handle: key });
  }

  /** RANK + 自スクワッド時: tabs=0 / period=1 / pinned=2 で sticky */
  const rankStickyIndices =
    mainTab === "rank" && mySquad != null ? [2] : undefined;

  return (
    <View style={styles.root}>
      <CyberSubpageShellNative
        eyebrow="RANKINGS"
        title="SQUAD BATTLE"
        hideBrandShelf={false}
        titleInBrandShelf
        headerTrailing={
          isPreviewMode ? (
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
              color="rgba(255,247,224,0.92)"
            />
          </Pressable>
          ) : undefined
        }
        onBack={() => navigation.goBack()}
        contentStyle={{ paddingBottom: bottomContentReserveY + spacing.md }}
        stickyHeaderIndices={rankStickyIndices}
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
          <View style={styles.joinStack}>
            <SquadGoldPhaseTrackNative activeKey={phaseTrackKey} />
            {uiPhase !== "idle" ? (
              <SquadPhaseStatusBannerNative
                phase={uiPhase}
                hasSquad={mySquad != null}
                activeMemberCount={myActiveCount}
                deadlineLabel={
                  uiPhase === "entry"
                    ? formatSquadBattleRecruitDeadlineLabel(
                        liveRecruitEndAtMs
                      ) ??
                      (isPreviewMode ? SQUAD_BATTLE_MOCK_DEADLINE_LABEL : null)
                    : null
                }
              />
            ) : null}
            {uiPhase === "idle" ? (
              <SquadIdlePanelNative />
            ) : uiPhase === "reward" ? (
              <SquadRewardResultPanelNative
                hasSquad={
                  liveRewardHasSquad != null
                    ? liveRewardHasSquad
                    : mySquad != null
                }
                result={
                  liveRewardResult ??
                  (isPreviewMode
                    ? SQUAD_BATTLE_REWARD_RESULT_MOCK
                    : {
                        weekly: [
                          {
                            weekIndex: 1,
                            rank: null,
                            units: 0,
                            status: "none",
                          },
                          {
                            weekIndex: 2,
                            rank: null,
                            units: 0,
                            status: "none",
                          },
                          {
                            weekIndex: 3,
                            rank: null,
                            units: 0,
                            status: "none",
                          },
                          {
                            weekIndex: 4,
                            rank: null,
                            units: 0,
                            status: "none",
                          },
                        ],
                        monthlyRank: null,
                        monthlyUnits: 0,
                        monthlyStatus: "none",
                        payoutNote: "獲得 Unit を読み込み中…",
                      })
                }
                loading={
                  Boolean(liveBattleId) &&
                  rewardPayoutLoading &&
                  liveRewardResult == null
                }
              />
            ) : mySquad == null ? (
              uiPhase === "battle" ? (
                <View style={styles.battleSpectatorStack}>
                  <SquadEmptyHintNative>
                    バトル中のため新規参加・作成はできません。順位表は RANK
                    タブで観戦できます。
                  </SquadEmptyHintNative>
                  <Pressable
                    onPress={() => setMainTab("rank")}
                    style={({ pressed }) => [
                      styles.spectatorCta,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="RANK を見る"
                  >
                    <Text style={styles.spectatorCtaText}>RANK を見る</Text>
                  </Pressable>
                </View>
              ) : (
                <NoneStateNative
                  openSquads={openSquadsForUi}
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
                    void handleApplyToSquad(squadId, squadName);
                  }}
                  onWithdraw={(req) => {
                    void handleWithdrawRequest(req);
                  }}
                  onOpenMemberProfile={openMemberProfile}
                  onReform={(item) => setReformTarget(item)}
                  onAcceptInvite={(invite) => {
                    setIncomingJoinConfirmInvite(invite);
                  }}
                  onDeclineInvite={(invite) => {
                    void handleDeclineInvite(invite);
                  }}
                />
              )
            ) : (
              <>
                <MySquadCardNative
                  squad={mySquad}
                  phase={uiPhase}
                  isOwner={liveIsOwner || (isPreviewMode && Boolean(mySquad))}
                  onRenameSquad={
                    uiPhase === "entry"
                      ? (n) => void handleRenameSquad(n)
                      : undefined
                  }
                  onLeaveSquad={
                    uiPhase === "entry" && liveBattleId && !liveIsOwner
                      ? () => void handleLeaveSquad()
                      : undefined
                  }
                  onDissolveSquad={
                    uiPhase === "entry" && liveBattleId && liveIsOwner
                      ? () => void handleDissolveSquad()
                      : undefined
                  }
                  onOpenMemberProfile={openMemberProfile}
                  onCopyInviteCode={(code) => {
                    void copyTextNative(code).then((ok) => {
                      flash(
                        ok ? `コピーしました: ${code}` : `招待コード: ${code}`
                      );
                    });
                  }}
                />
                {membersLocked ? (
                  <View style={styles.lockedNote}>
                    <Text style={styles.lockedNoteText}>
                      メンバー LOCKED · 入れ替え・追加申請の受付は終了しています。
                    </Text>
                  </View>
                ) : null}
                {(liveIsOwner ||
                  (isPreviewMode && previewState === "recruiting")) &&
                uiPhase === "entry" &&
                pastSquadsForUi.length > 0 ? (
                  <PastSquadsPanelNative
                    pastSquads={pastSquadsForUi}
                    selfUid={selfUidForUi}
                    canReform={false}
                    canInvite={
                      liveIsOwner ||
                      (isPreviewMode && previewState === "recruiting")
                    }
                    busyId={reformBusyId}
                    onReform={() => {}}
                    onInvite={(item, uid) => {
                      const member = item.members.find((m) => m.uid === uid);
                      if (!member) return;
                      setInviteSendTarget({ source: item, member });
                    }}
                  />
                ) : null}
                {uiPhase === "entry" ? (
                  <IncomingRequestsNative
                    requests={visibleIncoming}
                    onOpenProfile={(req) => {
                      setProfileRequest(req);
                    }}
                    onApprove={(req) => {
                      setApproveConfirmRequest(req);
                    }}
                    onReject={(req) => {
                      void handleResolveJoinRequest(req, "reject");
                    }}
                  />
                ) : null}
              </>
            )}
          </View>
        ) : (
          <>
            {/* index 1: 期間行 + 週チップ + ヒント + idle/reward */}
            <View>
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

              {rankPeriod === "weekly" ? (
                <SquadWeekChipsNative
                  weekIndex={weekIndex}
                  onChange={setWeekIndex}
                />
              ) : (
                <Text style={styles.monthPeriodHint}>
                  月間 · 開催期間全体の平均スコア
                </Text>
              )}

              {uiPhase === "idle" ? <SquadIdlePanelNative /> : null}
            </View>

            {/* index 2: ピン留め（sticky）または未参加ヒント */}
            {mySquad ? (
              <View style={styles.stickyYouTop}>
                <PinnedYourSquadCardNative
                  squad={mySquad}
                  onOpenDetail={() => setDetailSquad(mySquad)}
                />
              </View>
            ) : (
              <View style={styles.rankEmptyPinWrap}>
                <SquadEmptyHintNative>
                  {SQUAD_BATTLE_RANK_SPECTATOR_HINT}
                </SquadEmptyHintNative>
              </View>
            )}

            {uiPhase !== "idle" ? (
              <View
                key={`${mainTab}-${rankPeriod}-${weekIndex}`}
                style={styles.boardList}
              >
                {rankingList.length === 0 ? (
                  <SquadEmptyHintNative>
                    リーダーボードに表示するグループがありません。
                  </SquadEmptyHintNative>
                ) : (
                  rankingList.map((squad, i) => (
                    <LeaderboardRowNative
                      key={squad.id}
                      squad={squad}
                      runnerUpAvg={boardRunnerUpAvg}
                      board={rankingList}
                      index={i}
                      period={rankPeriod}
                      replayKey={`${mainTab}-${rankPeriod}-${weekIndex}`}
                      onOpenDetail={() => setDetailSquad(squad)}
                    />
                  ))
                )}
              </View>
            ) : null}
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
        onOpenPublicProfile={
          profileRequest
            ? () => {
                const profile = profileRequest.applicant;
                setProfileRequest(null);
                openMemberProfile(profile);
              }
            : undefined
        }
        onApprove={
          profileRequest
            ? () => {
                setApproveConfirmRequest(profileRequest);
              }
            : undefined
        }
        onReject={
          profileRequest
            ? () => {
                void handleResolveJoinRequest(profileRequest, "reject");
              }
            : undefined
        }
      />

      <InviteSendConfirmModalNative
        visible={inviteSendTarget != null && mySquad != null}
        target={inviteSendTarget}
        squadName={mySquad?.name ?? ""}
        onClose={() => setInviteSendTarget(null)}
        onConfirm={() => {
          if (!inviteSendTarget) return;
          void handleInvitePastMember(
            inviteSendTarget.source,
            inviteSendTarget.member.uid
          );
        }}
      />

      <ApproveApplicantConfirmModalNative
        visible={approveConfirmRequest != null}
        request={approveConfirmRequest}
        onClose={() => setApproveConfirmRequest(null)}
        onConfirm={() => {
          if (!approveConfirmRequest) return;
          void handleResolveJoinRequest(approveConfirmRequest, "approve");
        }}
      />

      <IncomingJoinConfirmModalNative
        visible={incomingJoinConfirmInvite != null}
        invite={incomingJoinConfirmInvite}
        openSquads={openSquadsForUi}
        onClose={() => setIncomingJoinConfirmInvite(null)}
        onConfirm={() => {
          if (!incomingJoinConfirmInvite) return;
          void handleAcceptInvite(incomingJoinConfirmInvite);
        }}
        onDecline={() => {
          if (!incomingJoinConfirmInvite) return;
          void handleDeclineInvite(incomingJoinConfirmInvite);
        }}
        onOpenMemberProfile={openMemberProfile}
      />

      <IncomingInviteModalNative
        visible={!introOpen && incomingInviteForModal != null}
        invite={incomingInviteForModal}
        onClose={() => {
          if (!incomingInviteForModal) return;
          holdIncomingInvite(incomingInviteForModal.id);
        }}
        onAccept={() => {
          if (!incomingInviteForModal) return;
          void handleAcceptInvite(incomingInviteForModal);
        }}
        onHold={() => {
          if (!incomingInviteForModal) return;
          holdIncomingInvite(incomingInviteForModal.id);
          flash("保留しました。招待されているスクワッドから参加できます");
        }}
      />

      <SquadRankingDetailModalNative
        visible={detailSquad != null}
        squad={detailSquad}
        onClose={() => setDetailSquad(null)}
      />

      {toast ? (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      {isPreviewMode ? (
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
          <View
            style={styles.previewOverlayCard}
            accessibilityRole="summary"
          >
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
            <ScrollView
              style={styles.previewOverlayScroll}
              contentContainerStyle={styles.previewOverlayScrollContent}
              showsVerticalScrollIndicator={false}
            >
            <Text style={styles.previewSectionLabel}>Screens</Text>
            <View style={styles.stateChips}>
              {SQUAD_BATTLE_PREVIEW_JUMPS.map((jump) => (
                <Pressable
                  key={jump.id}
                  onPress={() => applyPreviewJump(jump)}
                  style={styles.stateChip}
                >
                  <Text style={styles.stateChipText}>{jump.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.previewSectionLabel}>Membership</Text>
            <View style={styles.stateChips}>
              {SQUAD_BATTLE_PREVIEW_STATES.map((s) => {
                const active = previewState === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      handlePreviewStateChange(s.id);
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
            </View>
            <Text style={styles.previewSectionLabel}>Season phase</Text>
            <View style={styles.stateChips}>
              {SQUAD_BATTLE_UI_PHASE_OPTIONS.map((s) => {
                const active = uiPhase === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setUiPhase(s.id)}
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
            </View>
            <Text style={styles.previewSectionLabel}>Board</Text>
            <View style={styles.stateChips}>
              {(["live", "final"] as const).map((s) => {
                const active = boardStatus === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setBoardStatus(s)}
                    style={[styles.stateChip, active && styles.stateChipActive]}
                  >
                    <Text
                      style={[
                        styles.stateChipText,
                        active && styles.stateChipTextActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.stateChips}>
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
              <Pressable
                onPress={() => {
                  void (async () => {
                    await clearSquadBattleLaunchSeenNative();
                    setPreviewToolsOpen(false);
                    setLaunchOpen(true);
                  })();
                }}
                style={styles.launchReplayChip}
                accessibilityRole="button"
                accessibilityLabel="開催モーダル"
              >
                <MaterialCommunityIcons
                  name="restart"
                  size={12}
                  color="rgba(254,243,199,0.9)"
                />
                <Text style={styles.launchReplayChipText}>開催モーダル</Text>
              </Pressable>
            </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      ) : null}

      <SquadBattleIntroOverlayNative
        open={introOpen}
        onClose={() => setIntroOpen(false)}
      />
      <SquadBattleLaunchOverlayNative
        visible={launchOpen}
        battleId={liveBattleId}
        onClose={() => setLaunchOpen(false)}
        onEnter={() => {
          setLaunchOpen(false);
          setMainTab("join");
        }}
        deadlineLabel={
          formatSquadBattleRecruitDeadlineLabel(liveRecruitEndAtMs) ??
          SQUAD_BATTLE_MOCK_DEADLINE_LABEL
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
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
    borderColor: "rgba(251,191,36,0.35)",
    backgroundColor: "rgba(251,191,36,0.1)",
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
    borderColor: "rgba(251,191,36,0.6)",
    backgroundColor: "rgba(251,191,36,0.25)",
  },
  pageNumText: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    fontVariant: ["tabular-nums"],
  },
  pageNumTextActive: {
    color: "#FFF7E0",
  },
  stickyYouTop: {
    marginBottom: spacing.md,
    backgroundColor: "transparent",
    paddingTop: 4,
    paddingBottom: 10,
  },
  rankEmptyPinWrap: {
    marginBottom: spacing.md,
  },
  rankRewardWrap: {
    marginBottom: 12,
  },
  phaseBanner: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  phaseBannerDefault: {
    borderColor: "rgba(251,191,36,0.3)",
    backgroundColor: "rgba(245,158,11,0.07)",
  },
  phaseBannerWarn: {
    borderColor: "rgba(251,113,133,0.45)",
    backgroundColor: "rgba(244,63,94,0.1)",
  },
  phaseBannerIdle: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  phaseBannerReward: {
    borderColor: "rgba(252,211,77,0.4)",
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  phaseBannerKicker: {
    fontFamily: fonts.metricExtra,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.7)",
  },
  phaseBannerKickerWarn: {
    fontFamily: fonts.metricExtra,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(254,205,211,0.8)",
  },
  phaseBannerKickerIdle: {
    fontFamily: fonts.metricExtra,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  phaseBannerTitle: {
    marginTop: 2,
    fontFamily: fonts.metric,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#FFF7E0",
  },
  phaseBannerDetail: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.5)",
  },
  rewardPanel: {
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.4)",
    backgroundColor: "rgba(251,191,36,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rewardPanelEmpty: {
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(245,158,11,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
  },
  rewardPanelKicker: {
    fontFamily: fonts.metricExtra,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.75)",
  },
  rewardPanelEmptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
  },
  rewardLedger: {
    marginTop: 12,
  },
  rewardLedgerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    paddingVertical: 8,
  },
  rewardLedgerRowLine: {
    borderTopWidth: 1,
    borderTopColor: "rgba(251,191,36,0.12)",
  },
  rewardLedgerMonthlyRow: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(252,211,77,0.35)",
    paddingTop: 10,
    paddingBottom: 10,
  },
  rewardLedgerWeek: {
    width: 32,
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.45)",
  },
  rewardLedgerWeekHi: {
    width: 32,
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.7)",
  },
  rewardLedgerRank: {
    width: 40,
    fontFamily: fonts.metricExtra,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "900",
    color: "#FDE68A",
  },
  rewardLedgerRankFirst: {
    width: 40,
    fontFamily: fonts.metricExtra,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: "900",
    color: "#FBBF24",
  },
  rewardLedgerUnits: {
    flex: 1,
    textAlign: "right",
    fontFamily: fonts.metricExtra,
    fontSize: 12,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    color: "#FFF7E0",
  },
  rewardLedgerUnitsHi: {
    flex: 1,
    textAlign: "right",
    fontFamily: fonts.metricExtra,
    fontSize: 13,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    color: "#FFF7E0",
  },
  rewardTotalRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(252,211,77,0.5)",
    paddingTop: 12,
  },
  rewardTotalLabel: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(253,230,138,0.55)",
  },
  rewardTotal: {
    fontFamily: fonts.metricExtra,
    fontSize: 16,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    color: "#FFF7E0",
  },
  rewardNote: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.4)",
  },
  idlePanel: {
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  idleKicker: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  idleTitle: {
    marginTop: 8,
    fontFamily: fonts.metricExtra,
    fontSize: 26,
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.7)",
  },
  idleDetail: {
    marginTop: 8,
    maxWidth: 280,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  idleRulesDivider: {
    alignSelf: "stretch",
    marginTop: 20,
    marginBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  idleRulesTitle: {
    alignSelf: "stretch",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.6,
    color: "#FFF8E7",
  },
  idleRulesList: {
    alignSelf: "stretch",
    marginTop: 12,
    gap: 10,
  },
  idleRulesRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  idleRulesDot: {
    marginTop: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: JOIN_BATTLE_AMBER,
    shadowColor: JOIN_BATTLE_AMBER,
    shadowOpacity: 0.65,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  idleRulesText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: "rgba(255,255,255,0.88)",
  },
  emptyHint: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(251,191,36,0.2)",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  emptyHintText: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  weekChipsWrap: {
    marginBottom: 12,
  },
  weekChipsRow: {
    flexDirection: "row",
    gap: 6,
  },
  weekChip: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingVertical: 6,
    alignItems: "center",
  },
  weekChipActive: {
    borderColor: "rgba(252,211,77,0.55)",
    backgroundColor: "rgba(251,191,36,0.2)",
  },
  weekChipText: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  weekChipTextActive: {
    color: "rgba(255,251,235,1)",
  },
  weekPeriodLabel: {
    marginTop: 6,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  monthPeriodHint: {
    marginBottom: 12,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  boardStatusHint: {
    marginBottom: 12,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.4)",
  },
  battleSpectatorStack: {
    gap: 12,
  },
  spectatorCta: {
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
    backgroundColor: "rgba(251,191,36,0.1)",
    paddingVertical: 12,
    alignItems: "center",
  },
  spectatorCtaText: {
    fontFamily: fonts.metricExtra,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "rgba(255,251,235,1)",
  },
  lockedNote: {
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(245,158,11,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  lockedNoteText: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(254,243,199,0.7)",
  },
  lbGapFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(251,191,36,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lbGapLabel: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)",
  },
  lbGapValue: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    color: "rgba(254,243,199,0.7)",
  },
  avatarStackWithCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  memberCountLabel: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    color: "rgba(253,230,138,0.55)",
  },
  memberCountLabelMuted: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    color: "rgba(255,255,255,0.4)",
  },
  previewSectionLabel: {
    marginTop: 4,
    marginBottom: 8,
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)",
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
    borderColor: "rgba(251,191,36,0.55)",
    backgroundColor: "transparent",
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
    borderColor: "rgba(251,191,36,0.55)",
    backgroundColor: "#0A0805",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pinnedTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FDE68A",
  },
  pinnedTabText: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#FFF7E0",
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
    color: "rgba(251,191,36,0.65)",
  },
  pinnedRankValue: {
    marginTop: 2,
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: 0.8,
    color: "#FBBF24",
    ...Platform.select({
      ios: { fontWeight: "400" },
      android: { fontWeight: "400" },
      default: {},
    }),
  },
  pinnedDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(251,191,36,0.3)",
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
    color: "#FBBF24",
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
    maxHeight: "78%",
    alignSelf: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "#0a0c10",
    padding: 12,
  },
  previewOverlayScroll: {
    maxHeight: 420,
  },
  previewOverlayScrollContent: {
    paddingBottom: 8,
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
  launchReplayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
    backgroundColor: "rgba(245,158,11,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  launchReplayChipText: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(254,243,199,0.9)",
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
    borderColor: "rgba(251,191,36,0.45)",
    backgroundColor: "rgba(251,191,36,0.1)",
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
    color: "#FDE68A",
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
  goldListShell: {
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.22)",
    backgroundColor: SQUAD_GOLD_NATIVE.panel,
  },
  goldListInner: {
    position: "relative",
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "hidden",
  },
  goldDecorTopBeam: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1.5,
    backgroundColor: "rgba(253,230,138,0.9)",
    zIndex: 3,
    ...Platform.select({
      ios: {
        shadowColor: JOIN_BATTLE_AMBER,
        shadowOpacity: 0.65,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      },
      default: {},
    }),
  },
  goldDecorLeftRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: "rgba(251,191,36,0.75)",
    zIndex: 3,
  },
  goldDecorCornerTL: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 14,
    height: 14,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: "rgba(253,230,138,0.92)",
    zIndex: 4,
  },
  requestStatsGoldUnit: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: JOIN_BATTLE_AMBER,
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
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(251,191,36,0.1)",
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
    borderColor: "rgba(251,191,36,0.92)",
  },
  pinnedTopBeam: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1.5,
    backgroundColor: "rgba(251,191,36,0.92)",
    shadowColor: "#FBBF24",
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 4,
  },
  myCardWrap: {
    marginBottom: spacing.md,
    borderColor: "rgba(251,191,36,0.3)",
    backgroundColor: "rgba(251,191,36,0.04)",
  },
  myCardInner: {
    padding: spacing.md,
  },
  joinStack: {
    gap: spacing.md,
  },
  phaseTrack: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 2,
  },
  phaseRailWrap: {
    position: "absolute",
    top: 7,
    height: 2,
    overflow: "hidden",
    borderRadius: 1,
  },
  phaseRail: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(251,191,36,0.18)",
  },
  phaseRailFill: {
    height: 2,
    borderRadius: 1,
    backgroundColor: JOIN_BATTLE_AMBER,
    ...Platform.select({
      ios: {
        shadowColor: JOIN_BATTLE_AMBER,
        shadowOpacity: 0.55,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      },
      default: {},
    }),
  },
  phaseNode: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    zIndex: 1,
  },
  phaseDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  phaseDotLit: {
    backgroundColor: JOIN_BATTLE_AMBER,
    ...Platform.select({
      ios: {
        shadowColor: JOIN_BATTLE_AMBER,
        shadowOpacity: 0.75,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
      },
      default: {},
    }),
  },
  phaseDotIdle: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "rgba(251,191,36,0.22)",
  },
  phaseSegText: {
    fontFamily: fonts.metricExtra,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  phaseSegTextActive: {
    color: JOIN_BATTLE_AMBER,
  },
  phaseSegTextDone: {
    color: SQUAD_GOLD_NATIVE.mut,
  },
  phaseSegTextIdle: {
    color: "rgba(201,178,126,0.5)",
  },
  legionMetaRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  legionMetaLabel: {
    fontFamily: fonts.metricExtra,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: SQUAD_GOLD_NATIVE.mut,
  },
  legionRankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legionRankNum: {
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 20,
    lineHeight: 22,
    color: JOIN_BATTLE_AMBER,
  },
  legionHeroRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 2,
  },
  legionNameCol: {
    flex: 1,
    minWidth: 0,
  },
  legionNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legionSquadName: {
    flexShrink: 1,
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: 0.6,
    color: SQUAD_GOLD_NATIVE.ink,
    textTransform: "uppercase",
  },
  legionCodeChip: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(251,191,36,0.12)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.42)",
  },
  legionCodeChipText: {
    fontFamily: fonts.metricExtra,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: JOIN_BATTLE_AMBER,
  },
  legionAvgCol: {
    alignItems: "flex-end",
  },
  legionAvgValue: {
    fontFamily: RANK_DISPLAY_FONT,
    fontSize: 30,
    lineHeight: 32,
    color: JOIN_BATTLE_AMBER,
    ...Platform.select({
      ios: {
        textShadowColor: "rgba(251,191,36,0.5)",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      },
      default: {},
    }),
  },
  legionAvgLabel: {
    marginTop: 2,
    fontFamily: fonts.metricExtra,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: SQUAD_GOLD_NATIVE.mut,
  },
  legionAvgDelta: {
    color: SQUAD_GOLD_NATIVE.up,
  },
  legionMedalRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 16,
  },
  legionMedalCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  legionMedal: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    // RN は clipPath 非対応のため角を強めに落とす近似
    borderRadius: 4,
    transform: [{ rotate: "0deg" }],
  },
  legionMedalMe: {
    backgroundColor: JOIN_BATTLE_AMBER,
    ...Platform.select({
      ios: {
        shadowColor: JOIN_BATTLE_AMBER,
        shadowOpacity: 0.55,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
      },
      default: {},
    }),
  },
  legionMedalOther: {
    backgroundColor: "rgba(251,191,36,0.16)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.35)",
  },
  legionMedalEmpty: {
    backgroundColor: "rgba(251,191,36,0.05)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.22)",
    borderStyle: "dashed",
  },
  legionMedalInitial: {
    fontFamily: fonts.metricExtra,
    fontSize: 13,
    fontWeight: "900",
    color: SQUAD_GOLD_NATIVE.ink,
  },
  legionMedalInitialMe: {
    color: SQUAD_GOLD_NATIVE.accOn,
  },
  legionMedalName: {
    maxWidth: "100%",
    fontFamily: fonts.metricExtra,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: SQUAD_GOLD_NATIVE.mut,
  },
  legionMedalPts: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    color: SQUAD_GOLD_NATIVE.ink,
  },
  mySquadOuter: {
    position: "relative",
    overflow: "visible",
    marginBottom: spacing.md,
  },
  mySquadShell: {
    marginTop: -10,
    borderWidth: 2,
    borderColor: "rgba(251,191,36,0.45)",
    backgroundColor: SQUAD_GOLD_NATIVE.panel,
    overflow: "hidden",
    position: "relative",
    ...Platform.select({
      ios: {
        shadowColor: "#FBBF24",
        shadowOpacity: 0.28,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  mySquadShellEntry: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    backgroundColor: "transparent",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 0 },
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
    borderColor: "rgba(251,191,36,0.55)",
    backgroundColor: "#0A0805",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mySquadTabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FDE68A",
  },
  mySquadTabText: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#FFF7E0",
  },
  mySquadTabEntry: {
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "#000",
  },
  mySquadTabDotEntry: {
    backgroundColor: "#FFFFFF",
  },
  mySquadTabTextEntry: {
    color: "rgba(255,255,255,0.9)",
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
    borderColor: "rgba(251,191,36,0.35)",
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  mySquadRenameBtnEntry: {
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.06)",
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
    color: "rgba(251,191,36,0.55)",
  },
  mySquadRenameCount: {
    fontFamily: fonts.metric,
    fontSize: 9,
    fontVariant: ["tabular-nums"],
    color: "rgba(255,255,255,0.3)",
  },
  mySquadRenameInput: {
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.45)",
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
    borderColor: "rgba(251,191,36,0.5)",
    backgroundColor: "rgba(251,191,36,0.2)",
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
    color: "#FFF7E0",
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
    borderColor: "rgba(251,191,36,0.2)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  mySquadHudCellEntry: {
    borderColor: "rgba(255,255,255,0.55)",
    backgroundColor: "transparent",
  },
  mySquadHudLabel: {
    fontFamily: fonts.metric,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
  },
  mySquadHudLabelEntry: {
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
    borderColor: "rgba(251,191,36,0.45)",
    backgroundColor: "rgba(251,191,36,0.05)",
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
    borderColor: "rgba(251,191,36,0.2)",
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
  mySquadLeaveRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  mySquadDissolveBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.35)",
    backgroundColor: "rgba(244,63,94,0.12)",
    paddingVertical: 10,
    alignItems: "center",
  },
  mySquadDissolveBtnText: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(254,226,226,0.9)",
  },
  mySquadLeaveBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 10,
    alignItems: "center",
  },
  mySquadLeaveBtnText: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
  },
  mySquadMembersHeadEntry: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.18)",
    paddingBottom: 8,
  },
  mySquadMembersDotEntry: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  mySquadMembersLabelEntry: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.7)",
  },
  mySquadPeriodHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingBottom: 2,
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
    color: "rgba(251,191,36,0.7)",
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
    borderColor: "rgba(251,191,36,0.35)",
    backgroundColor: "rgba(251,191,36,0.1)",
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
    color: "#FFF7E0",
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
    color: "#FDE68A",
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
    borderColor: "rgba(251,191,36,0.22)",
    backgroundColor: "rgba(10,14,20,0.9)",
  },
  memberRowEntry: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "#000",
  },
  memberRowEmptyEntry: {
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.55)",
    backgroundColor: "#000",
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
  squadUserNameLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    flex: 1,
  },
  squadUserNameLineCenter: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    justifyContent: "center",
    alignSelf: "center",
  },
  squadUserNameText: {
    flexShrink: 1,
    minWidth: 0,
  },
  squadUserNameTextCenter: {
    flexShrink: 0,
  },
  squadUserProBadge: {
    flexShrink: 0,
  },
  applicantSheetNameWrap: {
    marginTop: 12,
    width: "100%",
    alignItems: "center",
  },
  inviteSendNameWrap: {
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  pastInviteNameBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
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
    color: "#FDE68A",
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
    borderColor: "rgba(251,191,36,0.35)",
    backgroundColor: "rgba(251,191,36,0.1)",
  },
  avatarInitial: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    color: "#FFF7E0",
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
    marginBottom: spacing.sm,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#FBBF24",
        shadowOpacity: 0.22,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      },
      default: {},
    }),
  },
  noneIconImage: {
    width: 56,
    height: 56,
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
    borderWidth: 0,
    backgroundColor: JOIN_BATTLE_AMBER,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: JOIN_BATTLE_AMBER,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
      },
      default: {},
    }),
  },
  ctaPrimaryText: {
    fontFamily: fonts.metricExtra,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: SQUAD_GOLD_NATIVE.accOn,
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
  openSquadShell: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: "visible",
  },
  openPeriodRankHeader: {
    flexShrink: 0,
    alignItems: "stretch",
    gap: 4,
  },
  openPeriodRankGroupLabel: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.82)",
  },
  openPeriodRanks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  openPeriodRankCol: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  openPeriodRankHeaderLabel: {
    width: 44,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.78)",
  },
  openMemberList: {
    gap: 6,
  },
  openMemberHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingBottom: 2,
  },
  openMemberHeaderAvatarSpacer: {
    width: 40,
    height: 1,
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
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    overflow: "hidden",
  },
  openMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
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
    color: "rgba(251,191,36,0.55)",
  },
  viewMembersBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  viewMembersBtnText: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#FFF7E0",
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
    color: "#FDE68A",
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
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.4)",
    backgroundColor: "rgba(251,191,36,0.12)",
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
    color: "#FFF7E0",
    textAlign: "center",
  },
  applyBtnTextPending: {
    color: "rgba(254,243,199,0.85)",
  },
  withdrawBtn: {
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.35)",
    backgroundColor: "rgba(244,63,94,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  withdrawBtnText: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,228,230,0.9)",
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
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(251,191,36,0.05)",
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
    color: "#FFF7E0",
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
    borderColor: "rgba(251,191,36,0.4)",
    backgroundColor: "rgba(251,191,36,0.12)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pastSquadReformBtnText: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#FFF7E0",
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
    borderColor: "rgba(251,191,36,0.4)",
    backgroundColor: "rgba(251,191,36,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pastInviteBtnText: {
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#FFF7E0",
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
    borderColor: "rgba(251,191,36,0.4)",
    backgroundColor: "rgba(251,191,36,0.12)",
    paddingVertical: 10,
  },
  incomingInviteAcceptText: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "#FFFFFF",
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
  incomingRequestCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
  },
  requestStatsRow: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  requestThisWeekLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
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
    color: "#FFF7E0",
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
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(251,191,36,0.1)",
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
    borderRadius: 0,
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
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: JOIN_BATTLE_AMBER,
    paddingVertical: 10,
  },
  approveBtnText: {
    fontFamily: fonts.metricExtra,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: SQUAD_GOLD_NATIVE.accOn,
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
    borderColor: "rgba(251,191,36,0.3)",
    backgroundColor: "#0A0805",
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
  createAgreeRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  createAgreeBox: {
    marginTop: 2,
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.45)",
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  createAgreeBoxOn: {
    backgroundColor: JOIN_BATTLE_AMBER,
    borderColor: JOIN_BATTLE_AMBER,
  },
  createAgreeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.55)",
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
  applyConfirmCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "86%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "#0A0A0C",
    overflow: "hidden",
  },
  applyConfirmInner: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    position: "relative",
  },
  applyConfirmHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  applyConfirmName: {
    fontFamily: fonts.metric,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#ffffff",
  },
  applyConfirmCopy: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.6)",
  },
  applyConfirmClose: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  applicantModalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(5,2,8,0.78)",
  },
  applicantSheetCloseAbs: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 11,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  applicantSheetCloseRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  applicantSheetCenter: {
    alignItems: "center",
  },
  applicantSheetName: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#ffffff",
  },
  applicantSheetHandle: {
    marginTop: 2,
    fontSize: 14,
    textAlign: "center",
    color: "rgba(255,255,255,0.45)",
  },
  applicantSheetMeta: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
  },
  applicantSheetBio: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
  },
  applicantSheetRanks: {
    marginTop: 20,
    alignItems: "center",
    gap: 4,
  },
  applicantSheetStatsRow: {
    marginTop: 16,
    width: "100%",
    flexDirection: "row",
    gap: 8,
  },
  applicantSheetStatCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  applicantSheetStatKey: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },
  applicantSheetStatValue: {
    marginTop: 4,
    alignItems: "center",
  },
  applicantProfileBtn: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "#000",
    paddingVertical: 12,
  },
  applicantProfileBtnText: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
  },
  applicantSheetActions: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
  },
  applyConfirmList: {
    maxHeight: 280,
  },
  applyConfirmListContent: {
    gap: 6,
  },
  inviteSendHero: {
    alignItems: "center",
    marginBottom: 16,
    gap: 4,
  },
  inviteSendName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  inviteSendHandle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
  },
  incomingInviteModalTitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    color: "#ffffff",
  },
  incomingInviteSquadName: {
    fontFamily: fonts.metric,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 8,
  },
  incomingInviteMemberList: {
    gap: 6,
    marginBottom: 8,
  },
  incomingInviteMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "#000",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  incomingInviteHoldHint: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.45)",
  },
  incomingInviteHoldBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "#000",
    paddingVertical: 12,
    alignItems: "center",
  },
  incomingInviteHoldBtnText: {
    fontFamily: fonts.metric,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.75)",
  },
  applyConfirmSubmit: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: SQUAD_GOLD_NATIVE.acc,
  },
  applyConfirmSubmitText: {
    fontFamily: fonts.metric,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: SQUAD_GOLD_NATIVE.accOn,
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
    color: "rgba(251,191,36,0.7)",
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
    color: "#FFF7E0",
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
  lbRowWrap: {
    position: "relative",
    overflow: "visible",
    paddingRight: SQUAD_RANKING_DETAIL_SPINE.width - 1,
  },
  /** リザルトカード / ランキング行と同じ押し込み */
  lbRowPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  lbRowPressedReduce: {
    opacity: 0.96,
  },
  detailSpine: {
    position: "absolute",
    right: 0,
    zIndex: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#070b12",
    borderWidth: 1.5,
    borderLeftWidth: 0,
  },
  detailSpineFlush: {
    top: 0,
    bottom: 0,
    right: -(SQUAD_RANKING_DETAIL_SPINE.width - 1),
  },
  detailSpineTextCol: {
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  detailSpineChar: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 8,
    fontWeight: "700",
    lineHeight: 9,
    letterSpacing: 0,
    textTransform: "uppercase",
    includeFontPadding: false,
    color: "rgba(226,232,240,0.72)",
    textAlign: "center",
  },
  detailSquadHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  detailSquadRank: {
    alignItems: "center",
  },
  detailSquadMeta: {
    flex: 1,
    minWidth: 0,
  },
  detailSquadName: {
    fontFamily: fonts.metricExtra,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textPrimary,
  },
  detailSquadCount: {
    marginTop: 2,
    fontFamily: fonts.metric,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.35)",
  },
  detailMemberList: {
    gap: 6,
  },
  lbRow: {
    flexDirection: "column",
    borderWidth: 2,
    borderColor: "rgba(251,191,36,0.18)",
    backgroundColor: "transparent",
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
  lbFirstStatMuted: {
    fontFamily: fonts.metric,
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
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
    borderColor: "rgba(251,191,36,0.45)",
    backgroundColor: "transparent",
  },
  lbRowFirst: {
    borderColor: "rgba(255,214,90,0.65)",
    backgroundColor: "transparent",
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
    backgroundColor: "transparent",
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
    backgroundColor: "transparent",
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
    color: "#FFF7E0",
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
    color: "#FDE68A",
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
    borderColor: "rgba(251,191,36,0.35)",
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
    color: "#FFF7E0",
    textAlign: "center",
  },
  joinCodeHint: {
    fontFamily: fonts.metric,
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 14,
  },
});
