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
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import RankingsOpenProLock from "@/app/component/rankings/RankingsOpenProLock";
import { auth } from "@/lib/firebase";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import { FLAG_SRC, getCountryCode } from "@/lib/rankings/country";
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

const SKEW = "skewX(-6deg)";

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
        <RankingsOpenProLock language={language as Language} />
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
          {rows.map((r, i) => {
            const rankColor =
              r.rank === 1
                ? "#FCD34D"
                : r.rank <= 3
                  ? "#00F5FF"
                  : "rgba(255,255,255,0.45)";
            const name = r.displayName || r.handle || "—";
            const code = getCountryCode({ countryCode: r.countryCode });
            const flagSrc = code ? FLAG_SRC[code] : undefined;
            return (
              <motion.li key={r.uid} variants={restItem} custom={i}>
                <button
                  type="button"
                  onClick={() => onSelectUser?.(r.uid)}
                  className={`relative flex min-h-[60px] w-full items-center gap-3 overflow-hidden rounded border bg-white/[0.03] px-3.5 py-2 text-left active:opacity-75 ${r.rank === 1 ? "border-amber-300/35" : "border-white/[0.08]"}`}
                >
                  <span
                    className={`${nameBebas.className} w-[26px] text-center text-[28px] leading-none`}
                    style={{ color: rankColor, transform: SKEW }}
                  >
                    {r.rank}
                  </span>
                  <RankingsAvatarCircle
                    photoURL={r.photoURL}
                    displayName={name}
                    boxClassName="h-9 w-9 shrink-0"
                    shape="square"
                    imageLoading={i < 8 ? "eager" : "lazy"}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
                    <span
                      className={`${nameOxanium.className} block min-w-0 truncate text-[15px] font-semibold uppercase tracking-[0.03em] text-white/95`}
                      style={{ transform: SKEW }}
                    >
                      {name}
                    </span>
                    <span
                      className={`${nameOxanium.className} flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/50`}
                    >
                      {flagSrc ? (
                        <img
                          src={flagSrc}
                          alt=""
                          width={21}
                          height={14}
                          className="h-[14px] w-[21px] shrink-0 rounded-[1px] object-cover opacity-80"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                      <span className="normal-case tracking-[0.06em] text-white/40" style={{ transform: SKEW }}>
                        {copy.postsLabel(r.posts)}
                      </span>
                    </span>
                  </span>
                  <span className="min-w-[52px] text-right">
                    <span
                      className={`${nameOxanium.className} block text-[26px] font-extrabold leading-none tabular-nums ${r.rank === 1 ? "text-[#00F5FF]" : "text-white"}`}
                      style={{ transform: SKEW }}
                    >
                      {formatDailyScorePoints(r.points)}
                    </span>
                    <span
                      className={`${nameOxanium.className} block text-[9px] font-bold tracking-[0.14em] text-white/40`}
                      style={{ transform: SKEW }}
                    >
                      {copy.pointsUnit}
                    </span>
                  </span>
                </button>
              </motion.li>
            );
          })}
        </motion.ol>
      )}
    </div>
  );
}
