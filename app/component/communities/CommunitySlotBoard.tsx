"use client";

import { useCallback, useMemo, useState } from "react";
import { Clipboard, Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { jp } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { formatCommunityCompetitionLine } from "@/lib/communities/competitionDisplay";
import type { CommunityLeague, CommunityMetric, CommunityPeriodType } from "@/lib/communities/types";
import type { GroupMemberPreview } from "@/lib/communities/memberPreviews";
import {
  COMMUNITY_GROUP_SLOT_CARD_BG,
  COMMUNITY_GROUP_SLOT_CARD_SCRIM_MEMBER,
  COMMUNITY_GROUP_SLOT_CARD_SCRIM_OWNER,
  COMMUNITY_GROUP_SLOT_CARD_SCRIM_TOP,
} from "@/lib/communities/communityGroupSlotCard";
import { headerImageObjectPosition } from "@/lib/communities/headerImagePosition";
import CommunityMemberAvatarStack from "@/app/component/communities/CommunityMemberAvatarStack";
import {
  CommunityCrtSectionLabel,
  communityCrtMono,
  communityCrtPanelStyle,
} from "@/app/component/communities/CommunityCrtTheme";
import { preserveScrollOnInputFocus } from "@/lib/dom/preserveScrollOnInputFocus";

const CYAN = "#22d3ee";
const AMBER = "#fbbf24";
const NOTCH_CLIP =
  "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)";

export type CommunityListGroup = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  headerImageUrl: string | null;
  headerImagePositionY?: number;
  rankingMetric: CommunityMetric;
  periodType: CommunityPeriodType;
  rankingLeague: CommunityLeague;
  rankingTeamIds?: string[];
  role: string;
  memberPreviews?: GroupMemberPreview[];
};

export type CommunityListLimits = {
  plan: "free" | "pro";
  maxOwned: number;
  maxMemberships: number;
  ownedCount: number;
  membershipCount: number;
};

type SlotSizing = {
  pad: string;
  thumb: string;
  thumbIcon: string;
  roleBadge: string;
  name: string;
  meta: string;
  avatarStack: string;
  emptyMinH: string;
  emptyLabel: string;
  emptyIcon: string;
  joinInput: string;
  joinBtn: string;
  shellPad: string;
};

function slotSizing(isWeb: boolean): SlotSizing {
  if (isWeb) {
    return {
      pad: "p-4 sm:p-5",
      thumb: "size-[4.5rem] sm:size-28",
      thumbIcon: "text-3xl",
      roleBadge: "py-1 text-[11px] tracking-[0.14em]",
      name: "text-sm sm:text-[15px]",
      meta: "text-xs sm:text-sm",
      avatarStack: "size-10",
      emptyMinH: "min-h-[148px]",
      emptyLabel: "text-sm tracking-[0.14em]",
      emptyIcon: "h-6 w-6",
      joinInput: "px-3 py-2.5 text-base",
      joinBtn: "py-2 text-sm",
      shellPad: "p-4 sm:p-5",
    };
  }
  return {
    pad: "p-2",
    thumb: "size-[3.25rem]",
    thumbIcon: "text-base",
    roleBadge: "py-px text-[9px] tracking-[0.1em] sm:text-[10px]",
    name: "text-[15px] leading-snug",
    meta: "text-[11px] leading-snug",
    avatarStack: "size-7",
    emptyMinH: "min-h-[72px]",
    emptyLabel: "text-[11px] tracking-[0.12em]",
    emptyIcon: "h-4 w-4",
    joinInput: "px-2 py-1.5 text-xs",
    joinBtn: "py-1.5 text-[11px]",
    shellPad: "p-2.5",
  };
}

type Props = {
  language: Language;
  variant: "web" | "mobile";
  groups: CommunityListGroup[];
  limits: CommunityListLimits;
  loading: boolean;
  joinBusy: boolean;
  onOpenGroup: (g: CommunityListGroup) => void;
  onPrefetchGroup?: (g: CommunityListGroup) => void;
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

function slotAccent(isOwner: boolean) {
  return isOwner
    ? {
        color: AMBER,
        bar: "rgba(251,191,36,0.85)",
        glow: "0 0 8px rgba(251,191,36,0.8), 0 0 16px rgba(251,191,36,0.35)",
      }
    : {
        color: CYAN,
        bar: CYAN,
        glow: `0 0 8px rgba(34,211,238,0.8), 0 0 16px rgba(34,211,238,0.35)`,
      };
}

function SlotCardImageBackground({
  headerImageUrl,
  headerImagePositionY = 50,
  isOwner,
}: {
  headerImageUrl: string | null;
  headerImagePositionY?: number;
  isOwner: boolean;
}) {
  if (!headerImageUrl) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={headerImageUrl}
        alt=""
        className="h-full w-full object-cover"
        style={{ objectPosition: headerImageObjectPosition(headerImagePositionY) }}
        loading="lazy"
        decoding="async"
      />
      <div
        className="absolute inset-0"
        style={{
          background: isOwner
            ? COMMUNITY_GROUP_SLOT_CARD_SCRIM_OWNER
            : COMMUNITY_GROUP_SLOT_CARD_SCRIM_MEMBER,
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: COMMUNITY_GROUP_SLOT_CARD_SCRIM_TOP }}
      />
    </div>
  );
}

function RoleBadge({
  isOwner,
  label,
}: {
  isOwner: boolean;
  label: string;
}) {
  return (
    <span
      className={[
        "shrink-0 border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em]",
        communityCrtMono.className,
      ].join(" ")}
      style={
        isOwner
          ? {
              borderColor: "rgba(251,191,36,0.65)",
              color: "#fde68a",
              background: "rgba(4,8,18,0.82)",
              boxShadow:
                "0 2px 12px rgba(0,0,0,0.55), 0 0 14px rgba(251,191,36,0.35)",
              backdropFilter: "blur(6px)",
              textShadow: "0 1px 3px rgba(0,0,0,0.85)",
            }
          : {
              borderColor: "rgba(34,211,238,0.45)",
              color: "#e0f2fe",
              background: "rgba(4,8,18,0.82)",
              boxShadow:
                "0 2px 12px rgba(0,0,0,0.55), 0 0 14px rgba(34,211,238,0.28)",
              backdropFilter: "blur(6px)",
              textShadow: "0 1px 3px rgba(0,0,0,0.85)",
            }
      }
    >
      {label}
    </span>
  );
}

function GroupSlotTextBlock({
  g,
  language,
  labels,
  isOwner,
  stackSize,
  className = "",
}: {
  g: CommunityListGroup;
  language: Language;
  labels: Props["labels"];
  isOwner: boolean;
  stackSize: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex justify-end">
        <RoleBadge
          isOwner={isOwner}
          label={isOwner ? labels.owner : labels.member}
        />
      </div>
      <p
        className="truncate text-[19px] font-extrabold leading-tight tracking-[0.03em] text-white sm:text-xl"
        style={{ textShadow: `0 1px 12px rgba(0,0,0,0.55), 0 0 20px ${isOwner ? AMBER : CYAN}18` }}
      >
        {g.name}
      </p>
      <p
        className={[
          "mt-1.5 line-clamp-2 font-mono text-[11px] font-bold uppercase leading-relaxed tracking-[0.12em] text-cyan-100/85",
          communityCrtMono.className,
        ].join(" ")}
        style={{ textShadow: "0 1px 8px rgba(0,0,0,0.45)" }}
      >
        {competitionLine(g, language)}
      </p>
      {(g.memberPreviews?.length ?? 0) > 0 ? (
        <div className="mt-2.5">
          <CommunityMemberAvatarStack
            previews={g.memberPreviews ?? []}
            sizeClassName={stackSize}
            variant="square"
          />
        </div>
      ) : null}
    </div>
  );
}

function competitionLine(g: CommunityListGroup, language: Language) {
  return formatCommunityCompetitionLine(
    {
      rankingLeague: g.rankingLeague ?? "all",
      rankingMetric: g.rankingMetric,
      rankingTeamIds: g.rankingTeamIds,
    },
    language
  );
}

function GroupFilledSlotMobile({
  g,
  language,
  sizing,
  labels,
  onOpen,
  onPrefetchGroup,
}: {
  g: CommunityListGroup;
  language: Language;
  sizing: SlotSizing;
  labels: Props["labels"];
  onOpen: () => void;
  onPrefetchGroup?: () => void;
}) {
  const isOwner = g.role === "owner";
  const accent = slotAccent(isOwner);
  const hasBgImage = Boolean(g.headerImageUrl);
  return (
    <button
      type="button"
      aria-label={`${g.name} — ${labels.openRanking}`}
      onClick={onOpen}
      onTouchStart={onPrefetchGroup}
      onPointerDown={onPrefetchGroup}
      onPointerEnter={onPrefetchGroup}
      onFocus={onPrefetchGroup}
      className="group/slot relative flex w-full overflow-hidden border border-cyan-400/16 text-left transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.995]"
      style={{
        background: hasBgImage ? COMMUNITY_GROUP_SLOT_CARD_BG : "rgba(2,8,18,0.72)",
      }}
    >
      <SlotCardImageBackground
        headerImageUrl={g.headerImageUrl}
        headerImagePositionY={g.headerImagePositionY}
        isOwner={isOwner}
      />
      <span
        className="relative z-10 w-[3px] shrink-0"
        style={{
          background: accent.bar,
          boxShadow: accent.glow,
        }}
        aria-hidden
      />
      <div className="relative z-10 flex min-w-0 flex-1 items-stretch">
        <GroupSlotTextBlock
          g={g}
          language={language}
          labels={labels}
          isOwner={isOwner}
          stackSize={sizing.avatarStack}
          className="min-w-0 flex-1 px-3.5 py-3"
        />
      </div>
    </button>
  );
}

function GroupFilledSlotWeb({
  g,
  language,
  sizing,
  labels,
  onOpen,
  onPrefetchGroup,
}: {
  g: CommunityListGroup;
  language: Language;
  sizing: SlotSizing;
  labels: Props["labels"];
  onOpen: () => void;
  onPrefetchGroup?: () => void;
}) {
  const isOwner = g.role === "owner";
  const accent = slotAccent(isOwner);
  const hasBgImage = Boolean(g.headerImageUrl);
  return (
    <button
      type="button"
      aria-label={`${g.name} — ${labels.openRanking}`}
      onClick={onOpen}
      onTouchStart={onPrefetchGroup}
      onPointerDown={onPrefetchGroup}
      onPointerEnter={onPrefetchGroup}
      onFocus={onPrefetchGroup}
      className="group/slot relative w-full overflow-hidden text-left transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.995]"
      style={{
        clipPath: NOTCH_CLIP,
        background: hasBgImage
          ? COMMUNITY_GROUP_SLOT_CARD_BG
          : "linear-gradient(145deg, rgba(34,211,238,0.06) 0%, rgba(2,8,18,0.78) 42%, rgba(0,0,0,0.28) 100%)",
        border: isOwner
          ? "1px solid rgba(251,191,36,0.22)"
          : "1px solid rgba(34,211,238,0.16)",
        boxShadow: isOwner
          ? "0 0 18px rgba(251,191,36,0.12), inset 0 0 0 1px rgba(251,191,36,0.08)"
          : "0 0 18px rgba(34,211,238,0.1), inset 0 0 0 1px rgba(34,211,238,0.06)",
      }}
    >
      <SlotCardImageBackground
        headerImageUrl={g.headerImageUrl}
        headerImagePositionY={g.headerImagePositionY}
        isOwner={isOwner}
      />
      <span
        className="absolute bottom-0 left-0 top-0 z-10 w-[3px]"
        style={{
          background: accent.bar,
          boxShadow: accent.glow,
        }}
        aria-hidden
      />
      <div className="relative z-10 px-3.5 pb-3.5 pt-3 sm:px-5 sm:pb-4 sm:pt-3.5">
        <GroupSlotTextBlock
          g={g}
          language={language}
          labels={labels}
          isOwner={isOwner}
          stackSize={sizing.avatarStack}
        />
      </div>
    </button>
  );
}

function GroupFilledSlot({
  g,
  language,
  sizing,
  labels,
  onOpen,
  onPrefetchGroup,
  isWeb,
}: {
  g: CommunityListGroup;
  language: Language;
  sizing: SlotSizing;
  labels: Props["labels"];
  onOpen: () => void;
  onPrefetchGroup?: () => void;
  isWeb: boolean;
}) {
  if (isWeb) {
    return (
      <GroupFilledSlotWeb
        g={g}
        language={language}
        sizing={sizing}
        labels={labels}
        onOpen={onOpen}
        onPrefetchGroup={onPrefetchGroup}
      />
    );
  }
  return (
    <GroupFilledSlotMobile
      g={g}
      language={language}
      sizing={sizing}
      labels={labels}
      onOpen={onOpen}
      onPrefetchGroup={onPrefetchGroup}
    />
  );
}

function CreateEmptySlot({
  label,
  sizing,
  onCreate,
  reduceMotion,
  isWeb,
}: {
  label: string;
  sizing: SlotSizing;
  onCreate: () => void;
  reduceMotion: boolean | null;
  isWeb: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onCreate}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      className={[
        "flex w-full items-center justify-center gap-2 border border-dashed px-4 py-5 transition-colors hover:border-cyan-400/45 hover:bg-cyan-500/5",
        isWeb ? "min-h-[148px]" : sizing.emptyMinH,
      ].join(" ")}
      style={{
        ...communityCrtPanelStyle("empty"),
        clipPath: isWeb ? NOTCH_CLIP : undefined,
      }}
    >
      <Plus className={["text-cyan-300/55", sizing.emptyIcon].join(" ")} aria-hidden />
      <span
        className={[
          "text-center font-medium text-cyan-100/80",
          sizing.emptyLabel,
        ].join(" ")}
        style={{ textShadow: "0 0 10px rgba(34,211,238,0.25)" }}
      >
        {label}
      </span>
    </motion.button>
  );
}

function JoinEmptySlot({
  slotKey,
  expanded,
  label,
  sizing,
  invitePlaceholder,
  pasteLabel,
  submitLabel,
  joinBusy,
  reduceMotion,
  isWeb,
  onExpand,
  onCollapse,
  onPaste,
  onSubmit,
}: {
  slotKey: string;
  expanded: boolean;
  label: string;
  sizing: SlotSizing;
  invitePlaceholder: string;
  pasteLabel: string;
  submitLabel: string;
  joinBusy: boolean;
  reduceMotion: boolean | null;
  isWeb: boolean;
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
      <motion.button
        type="button"
        onClick={onExpand}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className={[
          "flex w-full items-center justify-center gap-2 border border-dashed px-4 py-5 transition-colors hover:border-amber-400/40 hover:bg-amber-500/5",
          isWeb ? "min-h-[148px]" : sizing.emptyMinH,
        ].join(" ")}
        style={{
          ...communityCrtPanelStyle("empty"),
          clipPath: isWeb ? NOTCH_CLIP : undefined,
        }}
      >
        <Plus className={["text-amber-300/50", sizing.emptyIcon].join(" ")} aria-hidden />
        <span
          className={[
            "text-center font-medium text-amber-100/75",
            sizing.emptyLabel,
          ].join(" ")}
          style={{ textShadow: "0 0 8px rgba(251,191,36,0.25)" }}
        >
          {label}
        </span>
      </motion.button>
    );
  }

  return (
    <div
      className={["border", sizing.pad].join(" ")}
      style={{
        ...communityCrtPanelStyle("amber"),
        clipPath: isWeb ? NOTCH_CLIP : undefined,
      }}
      data-slot-key={slotKey}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p
          className="text-xs tracking-[0.18em] sm:text-sm"
          style={{ color: "rgba(251,191,36,0.75)" }}
        >
          INVITE_CODE:
        </p>
        <button
          type="button"
          onClick={onCollapse}
          className="text-xs tracking-wider text-white/35 hover:text-white/60"
        >
          ESC
        </button>
      </div>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!joinBusy && code.trim().length >= 4) {
            void onSubmit(code.trim()).then(() => setCode(""));
          }
        }}
      >
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onFocus={preserveScrollOnInputFocus}
          placeholder={invitePlaceholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          enterKeyHint="go"
          className={[
            "w-full border bg-black/60 tracking-[0.14em] text-amber-100/90 outline-none placeholder:text-white/30",
            sizing.joinInput,
          ].join(" ")}
          style={{ borderColor: "rgba(251,191,36,0.3)" }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={joinBusy}
            onClick={() => void handlePaste()}
            className={[
              "inline-flex flex-1 items-center justify-center gap-1.5 border font-medium",
              sizing.joinBtn,
            ].join(" ")}
            style={{
              borderColor: "rgba(34,211,238,0.35)",
              color: "rgba(34,211,238,0.9)",
            }}
          >
            <Clipboard className="h-4 w-4 shrink-0" aria-hidden />
            {pasteLabel}
          </button>
          <motion.button
            type="submit"
            disabled={joinBusy || code.trim().length < 4}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className={[
              "flex-1 border font-semibold disabled:opacity-40",
              sizing.joinBtn,
            ].join(" ")}
            style={{
              borderColor: "rgba(251,191,36,0.45)",
              color: "rgba(251,191,36,0.95)",
              background: "rgba(251,191,36,0.08)",
            }}
          >
            {joinBusy ? "…" : submitLabel}
          </motion.button>
        </div>
      </form>
    </div>
  );
}

function LoadingSlots({
  count,
  sizing,
  isWeb,
}: {
  count: number;
  sizing: SlotSizing;
  isWeb: boolean;
}) {
  return (
    <div
      className={
        isWeb ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "space-y-2"
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={[
            "skeleton-scan border",
            isWeb ? "min-h-[148px]" : sizing.emptyMinH,
          ].join(" ")}
          style={{
            ...communityCrtPanelStyle("empty"),
            clipPath: isWeb ? NOTCH_CLIP : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default function CommunitySlotBoard({
  language,
  variant,
  groups,
  limits,
  loading,
  joinBusy,
  onOpenGroup,
  onPrefetchGroup,
  onCreate,
  onPreviewJoin,
  onPasteJoin,
  labels,
}: Props) {
  const isWeb = variant === "web";
  const sizing = slotSizing(isWeb);
  const reduceMotion = useReducedMotion();
  const [expandedJoinSlot, setExpandedJoinSlot] = useState<string | null>(null);

  const ownedGroups = useMemo(
    () => groups.filter((g) => g.role === "owner"),
    [groups]
  );
  const memberGroups = useMemo(
    () => groups.filter((g) => g.role !== "owner"),
    [groups]
  );

  const hostSlots = useMemo(() => {
    const slots: Array<
      | { kind: "group"; group: CommunityListGroup }
      | { kind: "create"; key: string }
    > = [];
    for (const g of ownedGroups) {
      slots.push({ kind: "group", group: g });
    }
    for (let i = ownedGroups.length; i < limits.maxOwned; i++) {
      if (limits.membershipCount >= limits.maxMemberships) break;
      slots.push({ kind: "create", key: `create-${i}` });
    }
    return slots;
  }, [ownedGroups, limits.maxOwned, limits.membershipCount, limits.maxMemberships]);

  const memberSlots = useMemo(() => {
    const joinCapacity = Math.max(0, limits.maxMemberships - ownedGroups.length);
    const slots: Array<
      | { kind: "group"; group: CommunityListGroup }
      | { kind: "join"; key: string }
    > = [];
    for (const g of memberGroups) {
      slots.push({ kind: "group", group: g });
    }
    const emptyJoin = Math.max(0, joinCapacity - memberGroups.length);
    for (let i = 0; i < emptyJoin; i++) {
      slots.push({ kind: "join", key: `join-${i}` });
    }
    return slots;
  }, [memberGroups, ownedGroups.length, limits.maxMemberships]);

  const handleJoinSubmit = useCallback(
    async (code: string) => {
      await onPreviewJoin(code);
      setExpandedJoinSlot(null);
    },
    [onPreviewJoin]
  );

  const slotGridClass = isWeb
    ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
    : "space-y-2";

  return (
    <div className={[sizing.shellPad, jp.className, communityCrtMono.className].join(" ")}>
        <section>
          <CommunityCrtSectionLabel
            large
            suffix={labels.slotCount(ownedGroups.length, limits.maxOwned)}
          >
            {labels.hostSection}
          </CommunityCrtSectionLabel>
          {loading ? (
            <LoadingSlots count={limits.maxOwned} sizing={sizing} isWeb={isWeb} />
          ) : (
            <ul className={slotGridClass}>
              {hostSlots.map((slot) => (
                <li key={slot.kind === "group" ? slot.group.id : slot.key}>
                  {slot.kind === "group" ? (
                    <GroupFilledSlot
                      g={slot.group}
                      language={language}
                      sizing={sizing}
                      labels={labels}
                      onOpen={() => onOpenGroup(slot.group)}
                      onPrefetchGroup={
                        onPrefetchGroup
                          ? () => onPrefetchGroup(slot.group)
                          : undefined
                      }
                      isWeb={isWeb}
                    />
                  ) : (
                    <CreateEmptySlot
                      label={labels.createSlot}
                      sizing={sizing}
                      onCreate={onCreate}
                      reduceMotion={reduceMotion}
                      isWeb={isWeb}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-6">
          <CommunityCrtSectionLabel
            large
            suffix={labels.slotCount(
              limits.membershipCount - ownedGroups.length,
              Math.max(0, limits.maxMemberships - ownedGroups.length)
            )}
          >
            {labels.memberSection}
          </CommunityCrtSectionLabel>
          {loading ? (
            <LoadingSlots
              count={Math.min(4, limits.maxMemberships)}
              sizing={sizing}
              isWeb={isWeb}
            />
          ) : memberSlots.length === 0 ? (
            <p
              className={[
                "border px-4 py-5 text-center text-cyan-100/45",
                isWeb ? "text-sm" : "text-xs",
              ].join(" ")}
              style={communityCrtPanelStyle("empty")}
            >
              {language === "en" ? "All slots in use." : "スロットがいっぱいです。"}
            </p>
          ) : (
            <ul className={slotGridClass}>
              {memberSlots.map((slot) => (
                <li key={slot.kind === "group" ? slot.group.id : slot.key}>
                  {slot.kind === "group" ? (
                    <GroupFilledSlot
                      g={slot.group}
                      language={language}
                      sizing={sizing}
                      labels={labels}
                      onOpen={() => onOpenGroup(slot.group)}
                      onPrefetchGroup={
                        onPrefetchGroup
                          ? () => onPrefetchGroup(slot.group)
                          : undefined
                      }
                      isWeb={isWeb}
                    />
                  ) : (
                    <JoinEmptySlot
                      slotKey={slot.key}
                      expanded={expandedJoinSlot === slot.key}
                      label={labels.joinSlot}
                      sizing={sizing}
                      invitePlaceholder={labels.inviteCode}
                      pasteLabel={labels.paste}
                      submitLabel={labels.checkCode}
                      joinBusy={joinBusy}
                      reduceMotion={reduceMotion}
                      isWeb={isWeb}
                      onExpand={() => setExpandedJoinSlot(slot.key)}
                      onCollapse={() => setExpandedJoinSlot(null)}
                      onPaste={onPasteJoin}
                      onSubmit={handleJoinSubmit}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
    </div>
  );
}
