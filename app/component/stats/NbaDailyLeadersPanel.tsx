"use client";

/**
 * TODAY — 今日の試合の主要スタッツ Top20
 * Native `NbaDailyLeadersPanelNative` 相当
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import TeamAbbrBadge from "@/app/component/games/TeamAbbrBadge";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import { resolveLocalizedLang } from "@/lib/i18n/localize";
import { formatNbaPlayerListName } from "@/lib/nba/formatNbaPlayerListName";
import { fetchLatestNbaSlateDateKey } from "@/lib/games/latestNbaSlate";
import { TIMEZONE_ET } from "@/lib/time/zonedTime";
import {
  DAILY_LEADER_STATS,
  dailyLeaderSideStats,
  type DailyLeaderStatKey,
  type DailyLeadersPayload,
} from "@/lib/nba/dailyLeaders/buildDailyLeaders";
import { dailyLeadersCopy } from "@/lib/nba/dailyLeaders/dailyLeadersCopy";

const POLL_MS = 60_000;
const SKEW = "skewX(-6deg)";

type Props = {
  language: string;
  onSelectPlayer?: (playerId: string) => void;
};

export default function NbaDailyLeadersPanel({
  language,
  onSelectPlayer,
}: Props) {
  const copy = useMemo(
    () => dailyLeadersCopy(resolveLocalizedLang(language)),
    [language]
  );
  const reduceMotion = useReducedMotion();
  const [stat, setStat] = useState<DailyLeaderStatKey>("pts");
  const [data, setData] = useState<DailyLeadersPayload | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const dateKey = await fetchLatestNbaSlateDateKey();
      const res = await fetch(
        `/api/nba/daily-leaders?date=${dateKey}&tz=${encodeURIComponent(TIMEZONE_ET)}`
      );
      const json = (await res.json()) as DailyLeadersPayload | { ok: false };
      if (!res.ok || !json.ok) throw new Error("failed");
      setData(json);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data?.hasLive) return;
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [data?.hasLive, load]);

  const rows = data?.boards[stat] ?? [];
  const statLabel =
    DAILY_LEADER_STATS.find((s) => s.key === stat)?.label ?? "";

  let empty: string | null = null;
  if (!data) empty = failed ? copy.loadFailed : null;
  else if (data.gameCount === 0) empty = copy.noGames;
  else if (data.gamesWithStats === 0) empty = copy.notStarted;

  return (
    <div className="space-y-3 text-white">
      <CyberSlantedTabBar fill aria-label="Stat">
        {DAILY_LEADER_STATS.map((s) => (
          <CyberSlantedTab
            key={s.key}
            label={s.label}
            active={stat === s.key}
            onClick={() => setStat(s.key)}
            compact
          />
        ))}
      </CyberSlantedTabBar>

      {data && data.gameCount > 0 ? (
        <div
          className={`${nameOxanium.className} flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55`}
        >
          <span>{copy.gamesLabel(data.gameCount)}</span>
          {data.preseason ? (
            <span className="rounded-sm border border-amber-300/50 px-1.5 py-[1px] text-amber-200">
              {copy.preseason}
            </span>
          ) : null}
          {data.hasLive ? (
            <span className="normal-case tracking-normal text-white/45">
              · {copy.liveNote}
            </span>
          ) : null}
        </div>
      ) : null}

      {empty ? (
        <p className="py-10 text-center text-[13px] text-white/55">{empty}</p>
      ) : !data ? (
        <div className="py-10" />
      ) : (
        <motion.ol
          key={stat}
          className="space-y-1.5"
          variants={restContainer}
          initial={reduceMotion ? "show" : "hidden"}
          animate="show"
        >
          {rows.map((r, i) => {
            const rankColor =
              i === 0 ? "#FCD34D" : i < 3 ? "#00F5FF" : "rgba(255,255,255,0.45)";
            return (
              <motion.li key={`${r.playerId}-${r.gameId}`} variants={restItem} custom={i}>
                <button
                  type="button"
                  onClick={() => onSelectPlayer?.(r.playerId)}
                  className={`relative flex min-h-[60px] w-full items-center gap-3 overflow-hidden rounded border bg-white/[0.03] px-3.5 py-2 text-left active:opacity-75 ${i === 0 ? "border-amber-300/35" : "border-white/[0.08]"}`}
                >
                  <span
                    className={`${nameBebas.className} w-[26px] text-center text-[28px] leading-none`}
                    style={{ color: rankColor, transform: SKEW }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`${nameOxanium.className} block min-w-0 truncate text-[15px] font-semibold uppercase tracking-[0.03em] text-white/95`}
                        style={{ transform: SKEW }}
                      >
                        {formatNbaPlayerListName(
                          `${r.firstName} ${r.lastName}`,
                          r.playerId
                        )}
                      </span>
                      <TeamAbbrBadge teamId={r.teamId} />
                    </span>
                    <span
                      className={`${nameOxanium.className} flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/50`}
                    >
                      <span style={{ transform: SKEW }}>
                        {r.isHome ? "vs" : "@"} {r.oppAbbr}
                      </span>
                      {r.stats ? (
                        <span
                          className="min-w-0 truncate normal-case tracking-[0.06em] text-white/40"
                          style={{ transform: SKEW }}
                        >
                          {dailyLeaderSideStats(r.stats, stat).map((s) => (
                            <span key={s.key}>
                              {" · "}
                              <span className="text-white/85">{s.value}</span>{" "}
                              {s.label}
                            </span>
                          ))}
                        </span>
                      ) : null}
                      {r.live ? (
                        <span className="text-red-400" style={{ transform: SKEW }}>
                          ● {copy.live}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className="min-w-[44px] text-right">
                    <span
                      className={`${nameOxanium.className} block text-[26px] font-extrabold leading-none tabular-nums ${i === 0 ? "text-[#00F5FF]" : "text-white"}`}
                      style={{ transform: SKEW }}
                    >
                      {r.value}
                    </span>
                    <span
                      className={`${nameOxanium.className} block text-[9px] font-bold tracking-[0.14em] text-white/40`}
                      style={{ transform: SKEW }}
                    >
                      {statLabel}
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
