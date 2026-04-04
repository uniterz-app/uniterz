"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import { motion } from "framer-motion";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { nbaRegularSeasonWinsLosses } from "@/lib/nbaRegularSeasonRecord";

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
    <div className={["space-y-5 text-left", className].join(" ")}>
      <div className="flex flex-wrap justify-start gap-3">
        {(["east", "west"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setTab(c)}
            className={`rounded-full border px-5 py-2 text-sm font-medium ${
              tab === c
                ? "border-white/30 bg-white/15 text-white"
                : "border-white/10 text-white/50"
            }`}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-white/70">Loading...</div>
      ) : (
        <Conference teams={filtered} conference={tab} compact={compact} />
      )}
    </div>
  );
}

/* ================= Conference ================= */

function Conference({
  teams,
  conference,
  compact,
}: {
  teams: Team[];
  conference: "east" | "west";
  compact: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sorted = [...teams].sort((a, b) => {
    const { wins: aw, losses: al } = nbaRegularSeasonWinsLosses(a);
    const { wins: bw, losses: bl } = nbaRegularSeasonWinsLosses(b);

    const ar = aw + al > 0 ? aw / (aw + al) : 0;
    const br = bw + bl > 0 ? bw / (bw + bl) : 0;

    if (ar !== br) return br - ar;
    if (aw !== bw) return bw - aw;
    return 0;
  });

  const leader = sorted[0];
  if (!leader) return null;

  return (
    <div className="space-y-2 text-left">
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
}) {
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
    <div className="mb-2 cursor-default">
      <motion.div
        initial={{ opacity: 0, y: 28, rotateX: 14, z: -120, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, z: 0, scale: 1 }}
        transition={{
          duration: 0.7,
          delay: index * 0.07,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ perspective: "1400px" }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <motion.div
          className="relative overflow-hidden rounded-2xl transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          style={rankGradientStyle(rank, conference)}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
          />

          <div
            className={[
              "relative z-10 flex items-center justify-between",
              compact ? "px-4 py-3" : "px-5 py-3",
            ].join(" ")}
          >
            <div className="flex min-w-0 flex-1 items-center justify-start gap-2">
              <span
                className={`w-5 shrink-0 text-left text-xs font-mono tabular-nums ${rankNumberClass(rank)}`}
              >
                {rank}
              </span>
              <span className="truncate font-semibold text-white">
                {team.name}
              </span>
            </div>

            <div
              className={[
                "flex items-center gap-4 font-mono tabular-nums shrink-0",
                compact ? "text-[10px]" : "text-[11px]",
              ].join(" ")}
            >
              <span className="text-white/70">
                {teamWins}-{teamLosses}
              </span>

              <span className="w-8 text-right text-white/45">
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
    </div>
  );
}

/* ================= Separator ================= */

function SeparatorLine({
  color,
  delay,
}: {
  color: "emerald" | "amber";
  delay: number;
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
    <div className="my-3">
      <div
        ref={ref}
        className={`h-px w-full ${
          color === "emerald" ? "bg-emerald-400/60" : "bg-amber-400/60"
        }`}
      />
    </div>
  );
}