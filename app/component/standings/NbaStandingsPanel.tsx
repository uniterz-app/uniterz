"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { resultStatsMetricNumClass } from "@/lib/fonts";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { nbaRegularSeasonWinsLosses } from "@/lib/nbaRegularSeasonRecord";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import { compareNbaStandingsSortRows } from "@/lib/nba/compareNbaStandingsSort";

/* ================= util ================= */

function rankNumberClass(rank: number) {
  if (rank <= 6) {
    return "text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]";
  }
  if (rank <= 10) {
    return "text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]";
  }
  return "text-red-300/80";
}

function conferenceBaseColor(conference: "east" | "west") {
  return conference === "east"
    ? { r: 220, g: 38, b: 38 }
    : { r: 37, g: 99, b: 235 };
}

function rankGradientStyle(rank: number, conference: "east" | "west") {
  const base = conferenceBaseColor(conference);

  let a1 = 0.65;
  let a2 = 0.45;
  let a3 = 0.18;

  if (rank > 6 && rank <= 10) {
    a1 = 0.55;
    a2 = 0.35;
    a3 = 0.15;
  }

  if (rank > 10) {
    a1 = 0.45;
    a2 = 0.25;
    a3 = 0.12;
  }

  return {
    background: `linear-gradient(
      to right,
      rgba(${base.r}, ${base.g}, ${base.b}, ${a1}),
      rgba(${base.r}, ${base.g}, ${base.b}, ${a2}),
      rgba(${base.r}, ${base.g}, ${base.b}, ${a3}),
      rgba(${base.r}, ${base.g}, ${base.b}, 0.04)
    )`,
  };
}

function normalizeConference(v: any): "east" | "west" {
  if (v === "EAST" || v === "east") return "east";
  return "west";
}

/* ================= types ================= */

type Team = {
  id: string;
  name: string;
  conference: "east" | "west" | "EAST" | "WEST";
  wins: number;
  losses: number;
  winRate?: number;
  rank?: number;
  standingsTiebreakOrder?: number;
  cupFinalWins?: number;
  cupFinalLosses?: number;
  /** 詳細スタッツと同じ集計元（onGameFinalV2 → updateTeamStats） */
  homeGames?: number;
  homeWins?: number;
  awayGames?: number;
  awayWins?: number;
};

type Props = {
  compact?: boolean;
  className?: string;
};

/* ================= main ================= */

export default function NbaStandingsPanel({
  compact = false,
  className = "",
}: Props) {
  const pathname = usePathname() ?? "";
  const layoutMobile =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/");
  const [teams, setTeams] = useState<Team[]>([]);
  const [tab, setTab] = useState<"east" | "west">("east");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const q = query(collection(db, "teams"), where("league", "==", "nba"));

    getDocs(q)
      .then((snap) => {
        if (!alive) return;
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Team, "id">),
        }));
        setTeams(list);
      })
      .catch((err) => {
        console.error("standings fetch error", err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const filtered = teams.filter(
    (t) => normalizeConference(t.conference) === tab
  );

  return (
    <div
      className={[compact ? "space-y-3" : "space-y-5", className].join(" ")}
    >
      <div className={compact ? "flex gap-2" : "flex gap-3"}>
        {(["east", "west"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setTab(c)}
            className={[
              "rounded-full border font-medium",
              compact ? "px-3.5 py-1.5 text-xs" : "px-5 py-2 text-sm",
              tab === c
                ? "border-white/30 bg-white/15 text-white"
                : "border-white/10 text-white/50",
            ].join(" ")}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <CandleChartLoader />
      ) : (
        <Conference
          teams={filtered}
          conference={tab}
          compact={compact}
          layoutMobile={layoutMobile}
        />
      )}
    </div>
  );
}

/* ================= Conference ================= */

function Conference({
  teams,
  conference,
  compact,
  layoutMobile,
}: {
  teams: Team[];
  conference: "east" | "west";
  compact: boolean;
  layoutMobile: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sorted = [...teams].sort(compareNbaStandingsSortRows);

  const leader = sorted[0];
  if (!leader) return null;

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {sorted.map((team, index) => (
        <Fragment key={team.id}>
          <TeamRow
            team={team}
            leader={leader}
            rank={index + 1}
            index={index}
            hovered={hoveredId === team.id}
            onEnter={() => setHoveredId(team.id)}
            onLeave={() => setHoveredId(null)}
            conference={conference}
            compact={compact}
            layoutMobile={layoutMobile}
          />

          {(index + 1 === 6 || index + 1 === 10) && (
            <SeparatorLine
              color={index + 1 === 6 ? "emerald" : "amber"}
              delay={index * 80 + 480}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}

/* ================= TeamRow ================= */

function TeamRow({
  team,
  leader,
  rank,
  index,
  hovered,
  onEnter,
  onLeave,
  conference,
  compact,
  layoutMobile,
}: {
  team: Team;
  leader: Team;
  rank: number;
  index: number;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
  conference: "east" | "west";
  compact: boolean;
  layoutMobile: boolean;
}) {
  const teamNameTy = bracketMarketTeamTypography(layoutMobile);
  const [rate, setRate] = useState(0);

  const { wins: teamWins, losses: teamLosses } = nbaRegularSeasonWinsLosses(team);
  const games = teamWins + teamLosses;
  const winRateCalc = games > 0 ? teamWins / games : 0;

  const { wins: leaderWins, losses: leaderLosses } =
    nbaRegularSeasonWinsLosses(leader);

  const gb =
    team.id === leader.id
      ? null
      : ((leaderWins - teamWins) + (teamLosses - leaderLosses)) / 2;

  useEffect(() => {
    if (!hovered) {
      setRate(0);
      return;
    }

    const start = performance.now();
    const duration = 280;
    const target = winRateCalc * 100;
    let raf = 0;

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      setRate(target * (t * (2 - t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hovered, winRateCalc]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotateX: 14, z: -120, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, z: 0, scale: 1 }}
      transition={{
        duration: 0.7,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ perspective: "1400px" }}
      className={[compact ? "mb-1" : "mb-2", "cursor-default"].join(" ")}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
        <motion.div
          className={[
            "relative overflow-hidden transition hover:scale-[1.03] hover:shadow-[0_22px_70px_rgba(0,0,0,0.65)]",
            compact ? "rounded-xl" : "rounded-2xl",
          ].join(" ")}
          style={rankGradientStyle(rank, conference)}
        >
          <div
            className={[
              "pointer-events-none absolute inset-0",
              compact ? "rounded-xl" : "rounded-2xl",
            ].join(" ")}
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
          />

          <div
            className={[
              "relative z-10 flex items-center justify-between",
              compact ? "px-3 py-2" : "px-5 py-3",
            ].join(" ")}
          >
            <div
              className={[
                "flex min-w-0 items-center",
                compact ? "gap-2" : "gap-4",
              ].join(" ")}
            >
              <span
                className={[
                  resultStatsMetricNumClass,
                  compact ? "w-5 text-[10px]" : "w-6 text-xs",
                  rankNumberClass(rank),
                ].join(" ")}
              >
                {rank}
              </span>
              <span
                className={[
                  "min-w-0 truncate font-bold text-white",
                  compact
                    ? "text-[13px] leading-tight"
                    : "text-sm leading-tight md:text-base",
                ].join(" ")}
                style={teamNameTy}
              >
                {team.name}
              </span>
            </div>

            <div
              className={[
                "flex shrink-0 items-center",
                resultStatsMetricNumClass,
                compact ? "gap-2 text-[9px]" : "gap-4 text-[11px]",
              ].join(" ")}
            >
              <span className="text-white/70">
                {teamWins}-{teamLosses}
              </span>

              <span
                className={[
                  "text-right text-white/45",
                  compact ? "w-7" : "w-8",
                ].join(" ")}
              >
                {gb === null ? "—" : gb.toFixed(1)}
              </span>

              {hovered && (
                <span className="text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]">
                  {rate.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
  );
}

/* ================= Separator ================= */

function SeparatorLine({
  color,
  delay,
  compact = false,
}: {
  color: "emerald" | "amber";
  delay: number;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.animate(
      [
        { opacity: 0, transform: "translateX(-48px)" },
        { opacity: 1, transform: "translateX(0)" },
      ],
      {
        duration: 380,
        easing: "cubic-bezier(0.22,1,0.36,1)",
        delay,
        fill: "forwards",
      }
    );
  }, [delay]);

  return (
    <div className={compact ? "my-2" : "my-3"}>
      <div
        ref={ref}
        className={`h-px w-full ${
          color === "emerald" ? "bg-emerald-400/60" : "bg-amber-400/60"
        }`}
      />
    </div>
  );
}