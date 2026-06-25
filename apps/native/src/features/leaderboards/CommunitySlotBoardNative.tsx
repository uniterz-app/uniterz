import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Language } from "../../../../../lib/i18n/language";
import { formatCommunityCompetitionLine } from "../../../../../lib/communities/competitionDisplay";
import {
  COMMUNITY_GROUP_SLOT_CARD_BG,
  COMMUNITY_GROUP_SLOT_CARD_NATIVE_SCRIM,
  COMMUNITY_GROUP_SLOT_CARD_NATIVE_SCRIM_TOP,
} from "../../../../../lib/communities/communityGroupSlotCard";
import {
  DEFAULT_HEADER_IMAGE_POSITION_Y,
  HEADER_IMAGE_NATIVE_SLOT_ADJUST_SCALE,
  headerImageNativeImageHeight,
  headerImageNativeMarginTop,
  sanitizeHeaderImagePositionY,
} from "../../../../../lib/communities/headerImagePosition";
import { CommunityCrtSectionLabelNative } from "./CommunityCrtPartsNative";
import CommunityMemberAvatarStackNative from "./CommunityMemberAvatarStackNative";
import type { CommunityListGroup, CommunityListLimits } from "./communityApiNative";
import { prefetchCommunityHeaderImageNative } from "./prefetchCommunityHeaderImageNative";
import {
  CRT_CYAN,
  communityCrtStyles,
  communityEmptyJoinSlotStyle,
  communityEmptySlotStyle,
  communityMono,
  communityPressableFilledStyle,
  communityPressableTapStyle,
} from "./communityCrtThemeNative";

type Props = {
  language: Language;
  groups: CommunityListGroup[];
  limits: CommunityListLimits;
  loading: boolean;
  joinBusy: boolean;
  onOpenGroup: (g: CommunityListGroup) => void;
  onCreate: () => void;
  onPreviewJoin: (code: string) => Promise<void>;
  onPasteJoin: () => Promise<string | null>;
  labels: {
    hostSection: string;
    memberSection: string;
    createSlot: string;
    joinSlot: string;
    inviteCode: string;
    paste: string;
    checkCode: string;
    owner: string;
    member: string;
    nMembers: string;
    openRanking: string;
    slotCount: (used: number, max: number) => string;
  };
};

function SlotCardImageBackgroundNative({
  headerImageUrl,
  headerImagePositionY = DEFAULT_HEADER_IMAGE_POSITION_Y,
  isOwner,
}: {
  headerImageUrl: string | null;
  headerImagePositionY?: number;
  isOwner: boolean;
}) {
  const [containerHeight, setContainerHeight] = useState(0);
  const scrim = isOwner
    ? COMMUNITY_GROUP_SLOT_CARD_NATIVE_SCRIM.owner
    : COMMUNITY_GROUP_SLOT_CARD_NATIVE_SCRIM.member;
  const positionY = sanitizeHeaderImagePositionY(headerImagePositionY);
  const needsAdjust = positionY !== DEFAULT_HEADER_IMAGE_POSITION_Y;
  const scale = HEADER_IMAGE_NATIVE_SLOT_ADJUST_SCALE;
  const imageHeight =
    containerHeight > 0 ? headerImageNativeImageHeight(containerHeight, needsAdjust ? scale : 1) : 0;
  const imageTop =
    containerHeight > 0 && needsAdjust
      ? headerImageNativeMarginTop(containerHeight, positionY, scale)
      : 0;

  if (!headerImageUrl) return null;

  return (
    <View
      style={styles.slotImageLayer}
      pointerEvents="none"
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
    >
      {containerHeight > 0 ? (
        <Image
          source={{ uri: headerImageUrl }}
          style={
            needsAdjust
              ? {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  width: "100%",
                  height: imageHeight,
                  top: imageTop,
                }
              : StyleSheet.absoluteFillObject
          }
          resizeMode="cover"
          fadeDuration={0}
        />
      ) : null}
      <LinearGradient
        colors={[...scrim.colors]}
        locations={[...scrim.locations]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[...COMMUNITY_GROUP_SLOT_CARD_NATIVE_SCRIM_TOP.colors]}
        locations={[...COMMUNITY_GROUP_SLOT_CARD_NATIVE_SCRIM_TOP.locations]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function RoleBadgeNative({ isOwner, label }: { isOwner: boolean; label: string }) {
  return (
    <View style={isOwner ? communityCrtStyles.roleBadgeOwner : communityCrtStyles.roleBadgeMember}>
      <Text
        style={[
          isOwner ? communityCrtStyles.roleBadgeTextOwner : communityCrtStyles.roleBadgeTextMember,
          styles.roleBadgeText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function GroupFilledSlotNative({
  g,
  language,
  labels,
  onOpen,
}: {
  g: CommunityListGroup;
  language: Language;
  labels: Props["labels"];
  onOpen: () => void;
}) {
  const isOwner = g.role === "owner";
  const hasBgImage = Boolean(g.headerImageUrl);
  const competition = formatCommunityCompetitionLine(
    {
      rankingLeague: g.rankingLeague ?? "all",
      rankingMetric: g.rankingMetric,
      rankingTeamIds: g.rankingTeamIds,
    },
    language
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${g.name} — ${labels.openRanking}`}
      onPressIn={() => prefetchCommunityHeaderImageNative(g.headerImageUrl)}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.filledSlot,
        hasBgImage && styles.filledSlotWithImage,
        isOwner ? styles.filledSlotOwner : styles.filledSlotMember,
        communityPressableFilledStyle(pressed),
      ]}
    >
      <View style={styles.filledClip}>
        <SlotCardImageBackgroundNative
          headerImageUrl={g.headerImageUrl}
          headerImagePositionY={g.headerImagePositionY}
          isOwner={isOwner}
        />
        <View style={styles.filledRow}>
          <View
            style={[
              styles.filledAccent,
              isOwner ? styles.filledAccentOwner : styles.filledAccentMember,
            ]}
          />
          <View style={styles.filledInner}>
            <View style={styles.slotTopRow}>
              <RoleBadgeNative isOwner={isOwner} label={isOwner ? labels.owner : labels.member} />
            </View>
            <Text style={styles.groupName} numberOfLines={1}>
              {g.name}
            </Text>
            <Text style={styles.groupMeta} numberOfLines={2}>
              {competition}
            </Text>
            {(g.memberPreviews?.length ?? 0) > 0 ? (
              <View style={styles.metaRow}>
                <CommunityMemberAvatarStackNative previews={g.memberPreviews ?? []} size={28} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function CreateEmptySlotNative({ label, onCreate }: { label: string; onCreate: () => void }) {
  return (
    <Pressable
      onPress={onCreate}
      style={({ pressed }) => [
        styles.emptySlot,
        communityEmptySlotStyle,
        communityPressableTapStyle(pressed),
      ]}
    >
      <MaterialCommunityIcons name="plus" size={16} color="rgba(34,211,238,0.55)" />
      <Text style={styles.emptyLabel}>{label}</Text>
    </Pressable>
  );
}

function JoinEmptySlotNative({
  slotKey,
  expanded,
  label,
  invitePlaceholder,
  pasteLabel,
  submitLabel,
  joinBusy,
  onExpand,
  onCollapse,
  onPaste,
  onSubmit,
}: {
  slotKey: string;
  expanded: boolean;
  label: string;
  invitePlaceholder: string;
  pasteLabel: string;
  submitLabel: string;
  joinBusy: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onPaste: () => Promise<string | null>;
  onSubmit: (code: string) => Promise<void>;
}) {
  const [code, setCode] = useState("");

  const handlePaste = useCallback(async () => {
    const pasted = await onPaste();
    if (pasted) setCode(pasted);
  }, [onPaste]);

  if (!expanded) {
    return (
      <Pressable
        onPress={onExpand}
        style={({ pressed }) => [
          styles.emptySlot,
          communityEmptyJoinSlotStyle,
          communityPressableTapStyle(pressed),
        ]}
      >
        <MaterialCommunityIcons name="plus" size={16} color="rgba(251,191,36,0.5)" />
        <Text style={[styles.emptyLabel, styles.emptyJoinLabel]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.joinExpanded, communityEmptyJoinSlotStyle]} key={slotKey}>
      <View style={styles.joinHeader}>
        <Text style={styles.joinCodeLabel}>INVITE_CODE:</Text>
        <Pressable onPress={onCollapse} hitSlop={8}>
          <Text style={styles.joinEsc}>ESC</Text>
        </Pressable>
      </View>
      <TextInput
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        placeholder={invitePlaceholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        autoCapitalize="characters"
        autoCorrect={false}
        style={styles.joinInput}
      />
      <View style={styles.joinActions}>
        <Pressable
          disabled={joinBusy}
          onPress={() => void handlePaste()}
          style={({ pressed }) => [styles.joinPasteBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialCommunityIcons name="content-paste" size={14} color="rgba(34,211,238,0.9)" />
          <Text style={styles.joinPasteText}>{pasteLabel}</Text>
        </Pressable>
        <Pressable
          disabled={joinBusy || code.trim().length < 4}
          onPress={() => void onSubmit(code.trim()).then(() => setCode(""))}
          style={({ pressed }) => [
            styles.joinSubmitBtn,
            (joinBusy || code.trim().length < 4) && styles.joinSubmitDisabled,
            pressed && !(joinBusy || code.trim().length < 4) && communityPressableTapStyle(true),
          ]}
        >
          <Text style={styles.joinSubmitText}>{joinBusy ? "…" : submitLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function LoadingSlotsNative({ count }: { count: number }) {
  return (
    <View style={styles.slotList}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.loadingSlot, communityEmptySlotStyle]}>
          <ActivityIndicator color={CRT_CYAN} />
        </View>
      ))}
    </View>
  );
}

export default function CommunitySlotBoardNative({
  language,
  groups,
  limits,
  loading,
  joinBusy,
  onOpenGroup,
  onCreate,
  onPreviewJoin,
  onPasteJoin,
  labels,
}: Props) {
  const [expandedJoinSlot, setExpandedJoinSlot] = useState<string | null>(null);

  const ownedGroups = useMemo(() => groups.filter((g) => g.role === "owner"), [groups]);
  const memberGroups = useMemo(() => groups.filter((g) => g.role !== "owner"), [groups]);

  const hostSlots = useMemo(() => {
    const slots: Array<{ kind: "group"; group: CommunityListGroup } | { kind: "create"; key: string }> = [];
    for (const g of ownedGroups) slots.push({ kind: "group", group: g });
    for (let i = ownedGroups.length; i < limits.maxOwned; i++) {
      if (limits.membershipCount >= limits.maxMemberships) break;
      slots.push({ kind: "create", key: `create-${i}` });
    }
    return slots;
  }, [ownedGroups, limits.maxOwned, limits.membershipCount, limits.maxMemberships]);

  const memberSlots = useMemo(() => {
    const joinCapacity = Math.max(0, limits.maxMemberships - ownedGroups.length);
    const slots: Array<{ kind: "group"; group: CommunityListGroup } | { kind: "join"; key: string }> = [];
    for (const g of memberGroups) slots.push({ kind: "group", group: g });
    const emptyJoin = Math.max(0, joinCapacity - memberGroups.length);
    for (let i = 0; i < emptyJoin; i++) slots.push({ kind: "join", key: `join-${i}` });
    return slots;
  }, [memberGroups, ownedGroups.length, limits.maxMemberships]);

  const handleJoinSubmit = useCallback(
    async (code: string) => {
      await onPreviewJoin(code);
      setExpandedJoinSlot(null);
    },
    [onPreviewJoin]
  );

  return (
    <View style={styles.root}>
      <View style={styles.section}>
        <CommunityCrtSectionLabelNative suffix={labels.slotCount(ownedGroups.length, limits.maxOwned)}>
          {labels.hostSection}
        </CommunityCrtSectionLabelNative>
        {loading ? (
          <LoadingSlotsNative count={limits.maxOwned} />
        ) : (
          <View style={styles.slotList}>
            {hostSlots.map((slot) =>
              slot.kind === "group" ? (
                <GroupFilledSlotNative
                  key={slot.group.id}
                  g={slot.group}
                  language={language}
                  labels={labels}
                  onOpen={() => onOpenGroup(slot.group)}
                />
              ) : (
                <CreateEmptySlotNative key={slot.key} label={labels.createSlot} onCreate={onCreate} />
              )
            )}
          </View>
        )}
      </View>

      <View style={[styles.section, styles.sectionGap]}>
        <CommunityCrtSectionLabelNative
          suffix={labels.slotCount(
            limits.membershipCount - ownedGroups.length,
            Math.max(0, limits.maxMemberships - ownedGroups.length)
          )}
        >
          {labels.memberSection}
        </CommunityCrtSectionLabelNative>
        {loading ? (
          <LoadingSlotsNative count={Math.min(4, limits.maxMemberships)} />
        ) : memberSlots.length === 0 ? (
          <View style={[styles.allFull, communityEmptySlotStyle]}>
            <Text style={styles.allFullText}>
              {language === "en" ? "All slots in use." : "スロットがいっぱいです。"}
            </Text>
          </View>
        ) : (
          <View style={styles.slotList}>
            {memberSlots.map((slot) =>
              slot.kind === "group" ? (
                <GroupFilledSlotNative
                  key={slot.group.id}
                  g={slot.group}
                  language={language}
                  labels={labels}
                  onOpen={() => onOpenGroup(slot.group)}
                />
              ) : (
                <JoinEmptySlotNative
                  key={slot.key}
                  slotKey={slot.key}
                  expanded={expandedJoinSlot === slot.key}
                  label={labels.joinSlot}
                  invitePlaceholder={labels.inviteCode}
                  pasteLabel={labels.paste}
                  submitLabel={labels.checkCode}
                  joinBusy={joinBusy}
                  onExpand={() => setExpandedJoinSlot(slot.key)}
                  onCollapse={() => setExpandedJoinSlot(null)}
                  onPaste={onPasteJoin}
                  onSubmit={handleJoinSubmit}
                />
              )
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  section: {},
  sectionGap: {
    marginTop: 24,
  },
  slotList: {
    gap: 8,
  },
  filledSlot: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "rgba(2,8,18,0.72)",
    borderWidth: 1,
  },
  filledClip: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  filledRow: {
    flexDirection: "row",
    alignItems: "stretch",
    position: "relative",
    zIndex: 2,
  },
  filledSlotWithImage: {
    backgroundColor: COMMUNITY_GROUP_SLOT_CARD_BG,
  },
  filledSlotOwner: {
    borderColor: "rgba(251,191,36,0.22)",
  },
  filledSlotMember: {
    borderColor: "rgba(34,211,238,0.16)",
  },
  filledAccent: {
    width: 3,
    flexShrink: 0,
    zIndex: 3,
  },
  filledAccentOwner: {
    backgroundColor: "rgba(251,191,36,0.85)",
  },
  filledAccentMember: {
    backgroundColor: CRT_CYAN,
  },
  filledInner: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  slotTopRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
  },
  roleBadgeText: {
    fontFamily: communityMono,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  groupName: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.96)",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  groupMeta: {
    marginTop: 2,
    fontFamily: communityMono,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(224,242,254,0.85)",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  emptySlot: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.4,
    color: "rgba(207,250,254,0.8)",
    textAlign: "center",
  },
  emptyJoinLabel: {
    color: "rgba(254,243,199,0.75)",
  },
  joinExpanded: {
    padding: 10,
    gap: 10,
  },
  joinHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  joinCodeLabel: {
    fontSize: 12,
    letterSpacing: 2.8,
    color: "rgba(251,191,36,0.75)",
  },
  joinEsc: {
    fontSize: 12,
    letterSpacing: 1.6,
    color: "rgba(255,255,255,0.35)",
  },
  joinInput: {
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: "rgba(254,243,199,0.9)",
    letterSpacing: 2,
    fontSize: 12,
  },
  joinActions: {
    flexDirection: "row",
    gap: 8,
  },
  joinPasteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    paddingVertical: 6,
  },
  joinPasteText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(34,211,238,0.9)",
  },
  joinSubmitBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.45)",
    backgroundColor: "rgba(251,191,36,0.08)",
    paddingVertical: 6,
  },
  joinSubmitDisabled: {
    opacity: 0.4,
  },
  joinSubmitText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(251,191,36,0.95)",
  },
  slotImageLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  loadingSlot: {
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  allFull: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  allFullText: {
    fontSize: 12,
    color: "rgba(165,243,252,0.45)",
    textAlign: "center",
  },
});
