"use client";

/**
 * TODAY UNITERZ — その日の合計ポイント Top20（PICK UP / PRO LEAGUE）
 * Native `UniterzDailyScoreLeadersPanelNative` 相当
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import RankingsProLeagueTeaser from "@/app/component/rankings/RankingsProLeagueTeaser";
import DailyScoreRankRow, {
  dailyScoreRankRowSkew,
} from "@/app/component/rankings/DailyScoreRankRow";
import { rankingRowProSkinVariant } from "@/lib/rankings/rankingRowProSkinVariant";
import { t } from "@/lib/i18n/t";
import { auth } from "@/lib/firebase";
import { nameOxanium } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import type {
  DailyScoreDivision,
  DailyScoreLeadersResponse,
} from "@/lib/rankings/dailyScoreLeaders/buildDailyScoreLeaders";
import {
  dailyScoreLeadersCopy,
  formatDailyScorePoints,
  formatDailyScoreSlateLabel,
} from "@/lib/rankings/dailyScoreLeaders/dailyScoreLeadersCopy";
import { dailyLeadersCopy } from "@/lib/nba/dailyLeaders/dailyLeadersCopy";

type LoadState =
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "locked" }
  | { kind: "ok"; data: DailyScoreLeadersResponse };

type Props = {
  language: string;
  onSelectUser?: (uid: string) => void;
};

export default function UniterzDailyScoreLeadersPanel({
  language,
  onSelectUser,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const copy = useMemo(() => dailyScoreLeadersCopy(lang), [lang]);
  const baseCopy = useMemo(() => dailyLeadersCopy(lang), [lang]);
  const [division, setDivision] = useState<DailyScoreDivision>("standard");
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (division === "open") {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          setState({ kind: "locked" });
          return;
        }
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(
        `/api/uniterz/daily-leaders?division=${division}`,
        { headers }
      );
      if (res.status === 403) {
        setState({ kind: "locked" });
        return;
      }
      const json = (await res.json()) as DailyScoreLeadersResponse | { ok: false };
      if (!res.ok || !json.ok) throw new Error("failed");
      setState({ kind: "ok", data: json });
    } catch {
      setState((prev) => (prev.kind === "ok" ? prev : { kind: "failed" }));
    }
  }, [division]);

  useEffect(() => {
    setState({ kind: "loading" });
    void load();
  }, [load]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  const data = state.kind === "ok" ? state.data : null;
  const rows = data?.rows ?? [];

  let empty: string | null = null;
  if (state.kind === "failed") empty = baseCopy.loadFailed;
  else if (data) {
    if (data.gameCount === 0) empty = baseCopy.noGames;
    else if (data.finalCount === 0) empty = copy.noFinals;
    else if (rows.length === 0) empty = copy.noEntries;
  }

  return (
    <div className="space-y-3 text-white">
      <CyberSlantedTabBar fill aria-label="Division">
        <CyberSlantedTab
          label={copy.pickUp}
          active={division === "standard"}
          onClick={() => setDivision("standard")}
          compact
        />
        <CyberSlantedTab
          label={copy.proLeague}
          active={division === "open"}
          onClick={() => setDivision("open")}
          compact
        />
      </CyberSlantedTabBar>

      {data && data.gameCount > 0 ? (
        <div
          className={`${nameOxanium.className} flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55`}
        >
          <span>{formatDailyScoreSlateLabel(data.dateKey)}</span>
          <span>· {copy.finalsLabel(data.finalCount, data.gameCount)}</span>
          {data.preseason ? (
            <span className="rounded-sm border border-amber-300/50 px-1.5 py-[1px] text-amber-200">
              {baseCopy.preseason}
            </span>
          ) : null}
        </div>
      ) : null}

      {state.kind === "locked" ? (
        <RankingsProLeagueTeaser
          language={language as Language}
          onBackToPickUp={() => setDivision("standard")}
        />
      ) : empty ? (
        <p className="py-10 text-center text-[13px] text-white/55">{empty}</p>
      ) : !data ? (
        <div className="py-10" />
      ) : (
        <motion.ol
          key={division}
          className="space-y-1.5"
          variants={restContainer}
          initial={reduceMotion ? "show" : "hidden"}
          animate="show"
        >
          {rows.map((r, i) => (
            <motion.li key={r.uid} variants={restItem} custom={i}>
              <button
                type="button"
                onClick={() => onSelectUser?.(r.uid)}
                className="block w-full active:opacity-75"
              >
                <DailyScoreRankRow
                  rank={r.rank}
                  name={r.displayName || r.handle || "—"}
                  photoURL={r.photoURL}
                  isPro={r.plan === "pro"}
                  proLabel={t(language as Language).common.proMember}
                  planProBgVariant={rankingRowProSkinVariant(
                    r.plan,
                    typeof r.planProBgVariant === "string" ? r.planProBgVariant : null
                  )}
                  countryCode={r.countryCode}
                  imageLoading={i < 8 ? "eager" : "lazy"}
                  sub={
                    <>
                      <span className="normal-case tracking-[0.06em] text-white/40" style={{ transform: dailyScoreRankRowSkew }}>
                        {copy.postsLabel(r.posts)}
                      </span>
                      {typeof r.wins === "number" ? (
                        <span className="normal-case tabular-nums tracking-[0.06em] text-white/70" style={{ transform: dailyScoreRankRowSkew }}>
                          {copy.hitsLabel(r.wins, r.posts)}
                        </span>
                      ) : null}
                    </>
                  }
                  value={formatDailyScorePoints(r.points)}
                  valueUnit={copy.pointsUnit}
                />
              </button>
            </motion.li>
          ))}
        </motion.ol>
      )}
    </div>
  );
}
