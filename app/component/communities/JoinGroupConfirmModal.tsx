"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { jp } from "@/lib/fonts";
import type {
  CommunityLeague,
  CommunityMetric,
} from "@/lib/communities/types";
import { formatCommunityCompetitionLine } from "@/lib/communities/competitionDisplay";
import { CommunityModalGridBackdrop } from "@/app/component/communities/CommunityModalGridBackdrop";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";

export type JoinGroupPreview = {
  id: string;
  name: string;
  description: string | null;
  ownerDisplayName: string;
  memberCount: number;
  headerImageUrl: string | null;
  rankingMetric: CommunityMetric;
  rankingLeague: CommunityLeague;
  rankingTeamIds?: string[];
};

type Props = {
  open: boolean;
  preview: JoinGroupPreview | null;
  alreadyMember?: boolean;
  language: Language;
  busy?: boolean;
  onBack: () => void;
  onJoin: () => void;
};

export default function JoinGroupConfirmModal({
  open,
  preview,
  alreadyMember = false,
  language,
  busy = false,
  onBack,
  onJoin,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const m = t(language);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const labels = useMemo(
    () =>
      language === "en"
        ? {
            title: "Join this group?",
            noDescription: "No description.",
          }
        : {
            title: "このグループに参加しますか？",
            noDescription: "説明はありません。",
          },
    [language]
  );

  if (!open || !mounted || !preview) return null;

  const competition = formatCommunityCompetitionLine(
    {
      rankingLeague: preview.rankingLeague ?? "all",
      rankingMetric: preview.rankingMetric,
      rankingTeamIds: preview.rankingTeamIds,
    },
    language
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[1000030] overflow-hidden overscroll-none"
      role="dialog"
      aria-modal
      aria-labelledby="join-group-confirm-title"
    >
      <CommunityModalGridBackdrop
        onClick={busy ? undefined : onBack}
        disabled={busy}
        closeLabel={m.common.back}
      />
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-4 pb-[max(1rem,var(--bottom-nav-clearance))]">
        <div
          className={`pointer-events-auto relative isolate w-full max-w-md overflow-hidden rounded-2xl border border-white/12 bg-[#0c1419]/95 shadow-[0_18px_44px_rgba(0,0,0,0.55)] backdrop-blur-xl ${jp.className}`}
          onClick={(e) => e.stopPropagation()}
        >
          <ShellGridOverlay />
          <div className="relative z-10 p-5">
            <h2
              id="join-group-confirm-title"
              className="text-center text-lg font-bold text-white"
            >
              {labels.title}
            </h2>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/25">
              <div className="aspect-[16/9] w-full bg-black/40">
                {preview.headerImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.headerImageUrl}
                    alt=""
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl text-white/20">
                    —
                  </div>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    {m.community.groupName}
                  </p>
                  <p className="mt-0.5 text-lg font-bold leading-snug text-white">
                    {preview.name}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    {m.rankings.owner}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-white/90">
                    {preview.ownerDisplayName}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    {m.community.groupDescriptionLabel}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/70">
                    {preview.description?.trim() || labels.noDescription}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    {m.rankings.competingOn}
                  </p>
                  <p className="mt-0.5 text-sm text-white/85">{competition}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    {m.community.members}
                  </p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-100/90">
                    {m.rankings.nMembers.replace(
                      "{n}",
                      String(preview.memberCount)
                    )}
                  </p>
                </div>

                {alreadyMember ? (
                  <p className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100/90">
                    {m.community.alreadyMember}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={onBack}
                className="flex-1 rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white/90 disabled:opacity-40"
              >
                {m.common.back}
              </button>
              {!alreadyMember ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onJoin}
                  className="flex-1 rounded-xl border border-emerald-400/35 bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-50 disabled:opacity-40"
                >
                  {busy ? m.community.joining : m.community.joinGroup}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
