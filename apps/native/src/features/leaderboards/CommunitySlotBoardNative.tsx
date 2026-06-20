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
import type { Language } from "../../../../../lib/i18n/language";
import { formatCommunityCompetitionLine } from "../../../../../lib/communities/competitionDisplay";
import CommunityMemberAvatarStackNative from "./CommunityMemberAvatarStackNative";
import { CommunityCrtSectionLabelNative } from "./CommunityCrtPartsNative";
import type { CommunityListGroup, CommunityListLimits } from "./communityApiNative";
import {
  CRT_CYAN,
  communityCrtStyles,
  communityEmptyJoinSlotStyle,
  communityEmptySlotStyle,
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

function GroupThumbnailNative({
  headerImageUrl,
  size,
}: {
  headerImageUrl: string | null;
  size: number;
}) {
  return (
    <View style={[styles.thumb, { width: size, height: size }]}>
      {headerImageUrl ? (
        <Image source={{ uri: headerImageUrl }} style={styles.thumbImage} />
      ) : (
        <Text style={styles.thumbPlaceholder}>▣</Text>
      )}
    </View>
  );
}

function RoleBadgeNative({ isOwner, label }: { isOwner: boolean; label: string }) {
  return (
    <View style={isOwner ? communityCrtStyles.roleBadgeOwner : communityCrtStyles.roleBadgeMember}>
      <Text style={isOwner ? communityCrtStyles.roleBadgeTextOwner : communityCrtStyles.roleBadgeTextMember}>
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
      onPress={onOpen}
      style={({ pressed }) => [styles.filledSlot, communityPressableFilledStyle(pressed)]}
    >
      <View style={styles.filledAccent} />
      <View style={styles.filledInner}>
        <View style={styles.filledLeftCol}>
          <RoleBadgeNative isOwner={isOwner} label={isOwner ? labels.owner : labels.member} />
          <GroupThumbnailNative headerImageUrl={g.headerImageUrl} size={52} />
        </View>
        <View style={styles.filledBody}>
          <Text style={styles.groupName} numberOfLines={1}>
            {g.name}
          </Text>
          <Text style={styles.groupMeta} numberOfLines={2}>
            {competition}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.memberCount}>
              {labels.nMembers.replace("{n}", String(g.memberCount))}
            </Text>
            <CommunityMemberAvatarStackNative previews={g.memberPreviews ?? []} size={20} />
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
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  filledAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: CRT_CYAN,
    shadowColor: CRT_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
  },
  filledInner: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  filledLeftCol: {
    alignItems: "center",
    gap: 6,
  },
  filledBody: {
    flex: 1,
    minWidth: 0,
  },
  groupName: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(236,254,255,0.95)",
  },
  groupMeta: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.4)",
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  memberCount: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(165,243,252,0.75)",
    fontVariant: ["tabular-nums"],
  },
  thumb: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
    backgroundColor: "#0a1018",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    fontSize: 16,
    color: "rgba(34,211,238,0.25)",
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
