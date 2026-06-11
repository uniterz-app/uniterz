"use client";

import { useCallback, useMemo, useState } from "react";
import { ChevronRight, Clipboard, Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { jp } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { formatCommunityCompetitionLine } from "@/lib/communities/competitionDisplay";
import type { CommunityLeague, CommunityMetric, CommunityPeriodType } from "@/lib/communities/types";
import type { GroupMemberPreview } from "@/lib/communities/memberPreviews";
import CommunityMemberAvatarStack from "@/app/component/communities/CommunityMemberAvatarStack";
import {
  CommunityCrtSectionLabel,
  CommunityCrtShell,
  communityCrtPanelStyle,
} from "@/app/component/communities/CommunityCrtTheme";
import { preserveScrollOnInputFocus } from "@/lib/dom/preserveScrollOnInputFocus";

export type CommunityListGroup = {
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

export type CommunityListLimits = {
  plan: "free" | "pro";
  maxOwned: number;
  maxMemberships: number;
  ownedCount: number;
  membershipCount: number;
};

type SlotSizing = {
  pad: string;
  gap: string;
  thumbCol: string;
  thumb: string;
  thumbIcon: string;
  roleBadge: string;
  name: string;
  meta: string;
  members: string;
  chevron: string;
  avatarStack: string;
  emptyMinH: string;
  emptyLabel: string;
  emptyIcon: string;
  joinInput: string;
  joinBtn: string;
  shellPad: string;
  showDescription: boolean;
};

function slotSizing(isWeb: boolean): SlotSizing {
  if (isWeb) {
    return {
      pad: "p-4 sm:p-5",
      gap: "gap-4",
      thumbCol: "w-[6.5rem] sm:w-28",
      thumb: "size-[6.5rem] sm:size-28",
      thumbIcon: "text-3xl",
      roleBadge: "py-1 text-[11px] tracking-[0.14em]",
      name: "text-lg sm:text-xl",
      meta: "text-sm",
      members: "text-sm",
      chevron: "h-6 w-6",
      avatarStack: "size-8",
      emptyMinH: "min-h-[120px] sm:min-h-[128px]",
      emptyLabel: "text-sm tracking-[0.14em]",
      emptyIcon: "h-6 w-6",
      joinInput: "px-3 py-2.5 text-base",
      joinBtn: "py-2 text-sm",
      shellPad: "p-4 sm:p-5",
      showDescription: true,
    };
  }
  return {
    pad: "p-2",
    gap: "gap-2",
    thumbCol: "w-[3.25rem]",
    thumb: "size-[3.25rem]",
    thumbIcon: "text-base",
    roleBadge: "py-px text-[9px] tracking-[0.1em]",
    name: "text-[15px] leading-snug",
    meta: "text-[11px] leading-snug",
    members: "text-[11px]",
    chevron: "h-4 w-4",
    avatarStack: "size-5",
    emptyMinH: "min-h-[68px]",
    emptyLabel: "text-[11px] tracking-[0.12em]",
    emptyIcon: "h-4 w-4",
    joinInput: "px-2 py-1.5 text-xs",
    joinBtn: "py-1.5 text-[11px]",
    shellPad: "p-2.5",
    showDescription: false,
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

function GroupFilledSlot({
  g,
  language,
  sizing,
  labels,
  onOpen,
}: {
  g: CommunityListGroup;
  language: Language;
  sizing: SlotSizing;
  labels: Props["labels"];
  onOpen: () => void;
}) {
  const isOwner = g.role === "owner";
  return (
    <button
      type="button"
      aria-label={`${g.name} — ${labels.openRanking}`}
      onClick={onOpen}
      className={[
        "group/slot w-full border text-left transition-[filter,border-color] duration-150 hover:brightness-105",
        sizing.pad,
        sizing.emptyMinH,
      ].join(" ")}
      style={communityCrtPanelStyle("cyan")}
    >
      <div className={["flex items-center", sizing.gap].join(" ")}>
        <div
          className={[
            "flex shrink-0 flex-col items-center gap-1.5",
            sizing.thumbCol,
          ].join(" ")}
        >
          <span
            className={[
              "w-full border text-center font-medium",
              sizing.roleBadge,
            ].join(" ")}
            style={
              isOwner
                ? {
                    borderColor: "rgba(251,191,36,0.45)",
                    color: "rgba(251,191,36,0.9)",
                    background: "rgba(251,191,36,0.08)",
                  }
                : {
                    borderColor: "rgba(34,211,238,0.3)",
                    color: "rgba(186,230,253,0.75)",
                    background: "rgba(34,211,238,0.06)",
                  }
            }
          >
            {isOwner ? labels.owner : labels.member}
          </span>
          <div
            className={[
              "flex items-center justify-center overflow-hidden border",
              sizing.thumb,
            ].join(" ")}
            style={{ borderColor: "rgba(34,211,238,0.25)" }}
          >
            {g.headerImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={g.headerImageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className={["text-cyan-300/25", sizing.thumbIcon].join(" ")}>
                ▣
              </span>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={["truncate font-semibold text-cyan-50/95", sizing.name].join(" ")}
          >
            {g.name}
          </p>
          {sizing.showDescription && g.description ? (
            <p className={["mt-0.5 line-clamp-1 text-white/55", sizing.meta].join(" ")}>
              {g.description}
            </p>
          ) : null}
          <p className={["mt-1 line-clamp-2 text-white/45", sizing.meta].join(" ")}>
            {formatCommunityCompetitionLine(
              {
                rankingLeague: g.rankingLeague ?? "all",
                rankingMetric: g.rankingMetric,
                rankingTeamIds: g.rankingTeamIds,
              },
              language
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <p className={["font-medium tabular-nums text-cyan-200/75", sizing.members].join(" ")}>
              {labels.nMembers.replace("{n}", String(g.memberCount))}
            </p>
            {(g.memberPreviews?.length ?? 0) > 0 ? (
              <CommunityMemberAvatarStack
                previews={g.memberPreviews ?? []}
                sizeClassName={sizing.avatarStack}
              />
            ) : null}
          </div>
        </div>
        <ChevronRight
          className={[
            "shrink-0 text-cyan-400/35 group-hover/slot:text-cyan-300/70",
            sizing.chevron,
          ].join(" ")}
        />
      </div>
    </button>
  );
}

function CreateEmptySlot({
  label,
  sizing,
  onCreate,
  reduceMotion,
}: {
  label: string;
  sizing: SlotSizing;
  onCreate: () => void;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.button
      type="button"
      onClick={onCreate}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      className={[
        "flex w-full flex-col items-center justify-center gap-2 border border-dashed px-4 py-5 transition-colors hover:border-cyan-400/45 hover:bg-cyan-500/5",
        sizing.emptyMinH,
      ].join(" ")}
      style={communityCrtPanelStyle("empty")}
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
          "flex w-full flex-col items-center justify-center gap-2 border border-dashed px-4 py-5 transition-colors hover:border-amber-400/40 hover:bg-amber-500/5",
          sizing.emptyMinH,
        ].join(" ")}
        style={communityCrtPanelStyle("empty")}
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
      style={communityCrtPanelStyle("amber")}
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

function LoadingSlots({ count, sizing }: { count: number; sizing: SlotSizing }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={["skeleton-scan border", sizing.emptyMinH].join(" ")}
          style={communityCrtPanelStyle("empty")}
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

  const slotGridClass = "grid grid-cols-1 gap-3";

  return (
    <CommunityCrtShell>
      <div className={[sizing.shellPad, jp.className].join(" ")}>
        <section>
          <CommunityCrtSectionLabel
            large
            suffix={labels.slotCount(ownedGroups.length, limits.maxOwned)}
          >
            {labels.hostSection}
          </CommunityCrtSectionLabel>
          {loading ? (
            <LoadingSlots count={limits.maxOwned} sizing={sizing} />
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
                    />
                  ) : (
                    <CreateEmptySlot
                      label={labels.createSlot}
                      sizing={sizing}
                      onCreate={onCreate}
                      reduceMotion={reduceMotion}
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
            <LoadingSlots count={Math.min(4, limits.maxMemberships)} sizing={sizing} />
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
    </CommunityCrtShell>
  );
}
