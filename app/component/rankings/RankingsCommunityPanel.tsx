"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { jp } from "@/lib/fonts";
import { toast } from "@/app/component/ui/toast";
import CreateGroupModal from "@/app/component/communities/CreateGroupModal";
import CommunityGroupOverlay from "@/app/component/communities/CommunityGroupOverlay";
import type { CommunityMetric, CommunityPeriodType } from "@/lib/communities/types";
import { metricLabel, periodLabel } from "@/lib/communities/labels";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

async function authHeader(): Promise<string | null> {
  const u = auth.currentUser;
  if (!u) return null;
  const token = await u.getIdToken();
  return `Bearer ${token}`;
}

type ListGroup = {
  id: string;
  name: string;
  memberCount: number;
  headerImageUrl: string | null;
  rankingMetric: CommunityMetric;
  periodType: CommunityPeriodType;
  role: string;
};

type Props = {
  language: Language;
  variant: "web" | "mobile";
};

export default function RankingsCommunityPanel({ language, variant }: Props) {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [groups, setGroups] = useState<ListGroup[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [overlayGroupId, setOverlayGroupId] = useState<string | null>(null);

  const basePath = variant === "web" ? "/web" : "/mobile";
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
        return;
      }
      setGroups(json.groups ?? []);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList, uid]);

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
          setErr(m.rankings.maxGroupsReached);
        } else if (code === "group_full") {
          setErr(m.rankings.groupFull);
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
  }, [joinCode, m, fetchList]);

  return (
    <div
      className={`mx-auto max-w-[860px] space-y-5 px-1 pb-bottom-nav pt-2 ${jp.className}`}
    >
      <CommunityGroupOverlay
        open={overlayGroupId != null}
        groupId={overlayGroupId}
        language={language}
        variant={variant}
        onClose={() => setOverlayGroupId(null)}
        onRefreshList={() => void fetchList()}
      />

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        language={language}
        onCreated={() => void fetchList()}
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

      <section className="space-y-2 rounded-2xl border border-white/10 bg-white/4 p-4">
        <h2 className="text-sm font-bold text-white/90">{m.community.joinWithCode}</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder={m.community.inviteCode}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white placeholder:text-white/35"
          />
          <button
            type="button"
            disabled={joinBusy || joinCode.trim().length < 4}
            onClick={() => void onJoin()}
            className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 disabled:opacity-40"
          >
            {joinBusy ? "\u2026" : m.community.joinGroup}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-white/80">{m.rankings.myCommunity}</h2>
        {loadingList ? (
          <p className="text-sm text-white/45">{m.common.loading}</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-white/45">{m.rankings.noGroupsYet}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {groups.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  aria-label={`${g.name} \u2014 ${m.rankings.openRanking}`}
                  onClick={() => setOverlayGroupId(g.id)}
                  className="flex w-full items-stretch gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left shadow-[0_2px_14px_rgba(0,0,0,0.28)] transition-colors hover:border-cyan-400/25 hover:bg-white/7"
                >
                  <div className="aspect-square w-17 shrink-0 overflow-hidden rounded-xl bg-black/45 sm:w-19">
                    {g.headerImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.headerImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg text-white/20">
                        —
                      </div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                    <span
                      className={[
                        "inline-flex w-fit max-w-full items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
                        g.role === "owner"
                          ? "border-cyan-400/35 bg-cyan-500/10 text-cyan-200/90"
                          : "border-white/15 bg-white/5 text-white/65",
                      ].join(" ")}
                    >
                      {g.role === "owner" ? m.rankings.owner : m.rankings.member}
                    </span>
                    <p className="line-clamp-1 text-[15px] font-bold leading-snug text-white">
                      {g.name}
                    </p>
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-white/48">
                      <span className="text-white/40">{m.rankings.competingOn}: </span>
                      {metricLabel(g.rankingMetric, language)}
                      <span className="text-white/30"> · </span>
                      {periodLabel(g.periodType, language)}
                    </p>
                    <p className="text-sm font-bold tabular-nums text-white/90">
                      {m.rankings.nMembers.replace("{n}", String(g.memberCount))}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center self-center pr-0.5 text-white/35">
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
