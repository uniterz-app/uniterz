"use client";

import { useEffect, useState, useRef, Fragment } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { motion } from "framer-motion";




/* ================= util ================= */

function rankNumberClass(rank: number) {
  if (rank <= 6)
    return "text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]";
  if (rank <= 10)
    return "text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]";
  return "text-red-300/80";
}

function conferenceBaseColor(conference: "east" | "west") {
  return conference === "east"
    ? { r: 220, g: 38, b: 38 }   // red (EAST)
    : { r: 37, g: 99, b: 235 }; // blue (WEST)
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

/* ================= types ================= */

type Team = {
  id: string;
  name: string;
  conference: "east" | "west";
  wins: number;
  losses: number;
  winRate: number;
  rank: number;
  cupFinalWins?: number;
  cupFinalLosses?: number;
};

/* ================= page ================= */

export default function StandingsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tab, setTab] = useState<"east" | "west">("east");

  useEffect(() => {
    async function fetchTeams() {
      const q = query(collection(db, "teams"), where("league", "==", "nba"));
      const snap = await getDocs(q);

      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Team, "id">),
      }));

      setTeams(list);
    }

    fetchTeams();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnalysisBackground />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-3">
          {(["east", "west"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setTab(c)}
              className={`px-5 py-2 rounded-full text-sm font-medium border ${
                tab === c
                  ? "text-white bg-white/15 border-white/30"
                  : "text-white/50 border-white/10"
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>

        <Conference teams={teams.filter((t) => t.conference === tab)} />
      </div>
    </div>
  );
}

/* ================= Conference ================= */

function Conference({ teams }: { teams: Team[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 勝率ベースで並び替え（Cup除外）
  const sorted = [...teams].sort((a, b) => {
    const aw = a.wins - (a.cupFinalWins ?? 0);
    const al = a.losses - (a.cupFinalLosses ?? 0);
    const bw = b.wins - (b.cupFinalWins ?? 0);
    const bl = b.losses - (b.cupFinalLosses ?? 0);

    const ar = aw / (aw + al);
    const br = bw / (bw + bl);

    if (ar !== br) return br - ar;
    if (aw !== bw) return bw - aw;
    return 0;
  });

  const leader = sorted[0];

  return (
    <div className="space-y-2">
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
          />

          {/* ★ PO / PI ライン復活 */}
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
}: {
  team: Team;
  leader: Team;
  rank: number;
  index: number;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const [rate, setRate] = useState(0);

  const teamWins = team.wins - (team.cupFinalWins ?? 0);
  const teamLosses = team.losses - (team.cupFinalLosses ?? 0);
  const games = teamWins + teamLosses;
  const winRateCalc = games > 0 ? teamWins / games : 0;

  const leaderWins = leader.wins - (leader.cupFinalWins ?? 0);
  const leaderLosses = leader.losses - (leader.cupFinalLosses ?? 0);

  const gb =
    team.id === leader.id
      ? null
      : ((leaderWins - teamWins) +
          (teamLosses - leaderLosses)) / 2;

  // 勝率 hover アニメーション
  useEffect(() => {
    if (!hovered) {
      setRate(0);
      return;
    }

    const start = performance.now();
    const duration = 280;
    const target = winRateCalc * 100;

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      setRate(target * (t * (2 - t)));
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [hovered, winRateCalc]);

  return (
    <Link href={`/web/teams/${team.id}`} scroll={false}>
      <motion.div
        initial={{
          opacity: 0,
          y: 28,
          rotateX: 14,
          z: -120,
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          y: 0,
          rotateX: 0,
          z: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.7,
          delay: index * 0.07,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ perspective: "1400px" }}
        className="mb-2"
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <motion.div
          className="relative overflow-hidden rounded-2xl transition
                     hover:scale-[1.03]
                     hover:shadow-[0_22px_70px_rgba(0,0,0,0.65)]"
          style={rankGradientStyle(rank, team.conference)}
        >
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
          />

          <div className="relative z-10 flex justify-between px-5 py-3">
            <div className="flex gap-4 items-center">
              <span className={`w-6 text-xs font-mono ${rankNumberClass(rank)}`}>
                {rank}
              </span>
              <span className="font-semibold text-white">
                {team.name}
              </span>
            </div>

            <div className="flex gap-4 text-[11px] font-mono tabular-nums items-center">
              <span className="text-white/70">
                {teamWins}-{teamLosses}
              </span>

              <span className="text-white/45 w-8 text-right">
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
    </Link>
  );
}

/* ================= Separator（PO / PI） ================= */

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
          color === "emerald"
            ? "bg-emerald-400/60"
            : "bg-amber-400/60"
        }`}
      />
    </div>
  );
}

/* ================= 分析背景 ================= */

function AnalysisBackground() {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 -z-10 overflow-hidden"
      style={{
        background: `
          radial-gradient(900px 500px at 15% -10%, rgba(56,189,248,0.25), transparent 60%),
          radial-gradient(700px 400px at 85% 10%, rgba(168,85,247,0.22), transparent 60%),
          linear-gradient(180deg, #020617 0%, #030b14 100%)
        `,
      }}
    >
      {/* グリッド */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(rgba(56,189,248,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          animation: "cyberGrid 26s linear infinite",
        }}
      />

      {/* スキャンライン */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(120deg, transparent 40%, rgba(56,189,248,0.35) 50%, transparent 60%)",
          animation: "cyberScan 14s linear infinite",
          mixBlendMode: "screen",
        }}
      />

      {/* ノイズ */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 0 0, rgba(255,255,255,0.15) 0, transparent 2px)",
          backgroundSize: "3px 3px",
        }}
      />

      <style jsx global>{`
        @keyframes cyberGrid {
          from { transform: translateY(0); }
          to { transform: translateY(72px); }
        }
        @keyframes cyberScan {
          from { transform: translateX(-70%); }
          to { transform: translateX(70%); }
        }
      `}</style>
    </motion.div>
  );
}
