"use client";

import type { Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Home, Plane } from "lucide-react";
import { useSearchParams } from "next/navigation";
import WireframeBg from "@/app/component/background/WireframeBg";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";



import { Alfa_Slab_One, Bebas_Neue } from "next/font/google";

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"] });


type TeamDetail = any;
type Props = { team: TeamDetail };

type Game = {
  date: string;
  home: boolean;
  vs: string;
  score: string;
  result: "W" | "L";
};

/* ================= Motion ================= */

const page: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const item: Variants = {
  hidden: {
    opacity: 0,
    y: -40,
    rotateX: 70,
    transformPerspective: 1200,
  },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

/* ================= UI Parts ================= */

function GlassHeroCard({ children }: { children: React.ReactNode }) {
  return (
    // ① 動かす箱（丸角・overflowを持たせない）
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative"
    >
      {/* ② 切り抜き専用の箱 */}
      <div className="relative overflow-hidden rounded-2xl p-3 border border-white/10 bg-white/5 backdrop-blur">

        {/* ネオン */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: `
              radial-gradient(600px 240px at 20% 0%, rgba(0,220,255,0.25), transparent 60%),
              radial-gradient(520px 220px at 85% 20%, rgba(140,80,255,0.22), transparent 60%)
            `,
          }}
        />

        {/* スキャンライン */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ backgroundPositionY: ["0%", "100%"] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)",
            opacity: 0.25,
          }}
        />

        {/* シマー（insetは0固定） */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ x: ["-120%", "120%"] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{
            background:
              "linear-gradient(120deg, transparent 40%, rgba(80,200,255,.10) 50%, transparent 60%)",
            mixBlendMode: "screen",
          }}
        />

        {/* 枠（外グロー禁止、insetのみ） */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            boxShadow: "inset 0 0 0 1px rgba(80,200,255,.35)",
          }}
        />

        {/* コンテンツ */}
        <div className="relative z-10">{children}</div>
      </div>
    </motion.div>
  );
}




function DepthCard({
  children,
  accent,
  classNameOverride = "p-4",
}: {
  children: React.ReactNode;
  accent: string;
  classNameOverride?: string;
}) {
  return (
    <div
      className={`min-w-0 h-full  rounded-2xl ${classNameOverride}
        bg-white/6 backdrop-blur-md border border-white/10`}
      style={{
        // ホログラム縁（薄く自然）
        boxShadow: `
          0 0 0 1px rgba(255,255,255,.10),
          0 0 24px ${accent}33
        `,
      }}
    >
      {children}
    </div>
  );
}




function Last10List({ games }: { games: any[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [frontIndex, setFrontIndex] = useState<number | null>(null);
const [expanded, setExpanded] = useState(false);
const sortedGames = [...games].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      

      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;

      itemRefs.current.forEach((node, i) => {
        if (!node) return;
        const r = node.getBoundingClientRect();
        const nodeCenter = r.top + r.height / 2;
        const dist = Math.abs(nodeCenter - centerY);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });

      setFrontIndex(best);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [games?.length]);

  // 先頭も中央に来る
  useEffect(() => {
    const el = containerRef.current;
    const first = itemRefs.current[0];
    if (!el || !first) return;
    const top = first.offsetTop - (el.clientHeight - first.clientHeight) / 2;
    el.scrollTop = Math.max(0, top);
  }, [games?.length]);

  if (!games?.length) {
    return <div className="text-xs text-white/40">No games</div>;
  }

  return (
    <div className="relative">
      {/* 上下ガウス（さらに弱く・自然） */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-6 z-20
        bg-gradient-to-b from-black/12 via-black/6 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 z-20
        bg-gradient-to-t from-black/12 via-black/6 to-transparent" />

      {/* 中枠（小さめ・端も中央に来るよう余白拡張） */}
      <div
        ref={containerRef}
        className="
          relative overflow-y-auto px-2
          [-ms-overflow-style:none] [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
        style={{
          height: "140px",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.55) 28%, rgba(0,0,0,.55) 72%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,.55) 28%, rgba(0,0,0,.55) 72%, transparent 100%)",
        }}
      >
        {/* 端のカードも“手前”に来るための余白（増量） */}
        <div style={{ height: "44px" }} />

        {[...games].reverse().map((g, i) => {
          const isFront = i === frontIndex;
          const win = g.result === "W";

          return (
            <div
              key={i}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="
                w-full
                relative flex items-center justify-between
                rounded-md px-3 py-2.5   /* ← 枠を小さく */
                bg-white/6 backdrop-blur-md
                transition-[transform,filter,opacity,box-shadow,border] duration-200
              "
              style={{
                /* 横ズレ防止＆手前だけ少し拡大 */
                transform: isFront ? "scale(1.02)" : "scale(0.96)",
                transformOrigin: "center center",

                /* W=青 / L=赤 の枠 */
                border: isFront
                  ? win
                    ? "1px solid rgba(80,200,255,.9)"
                    : "1px solid rgba(255,80,80,.9)"
                  : "1px solid rgba(255,255,255,.08)",

                /* グロー */
                boxShadow: isFront
                  ? win
                    ? "0 0 0 1px rgba(80,200,255,.9), 0 0 18px rgba(80,200,255,.45)"
                    : "0 0 0 1px rgba(255,80,80,.9), 0 0 18px rgba(255,80,80,.45)"
                  : "0 0 0 1px rgba(255,255,255,.05)",

                /* 背面の滲み（弱め） */
                filter: isFront ? "none" : "blur(2px)",
                opacity: isFront ? 1 : 0.35,
                zIndex: isFront ? 2 : 1,
              }}
            >
              {/* 左 */}
              <div className={`text-[13px] font-medium ${isFront ? "text-white" : "text-white/70"}`}>
                {g.date} {g.home ? "vs" : "@"} {g.vs}
              </div>

              {/* 右（字体を他カードと統一） */}
              <div className="flex items-center gap-3">
                <span
                  className={`${alfa.className} tabular-nums text-[18px] font-bold ${
                    isFront ? "text-white" : "text-white/70"
                  }`}
                >
                  {g.score}
                </span>
                <span
                  className={`text-[13px] font-semibold ${
                    win ? "text-cyan-400" : "text-red-400"
                  }`}
                >
                  {g.result}
                </span>
              </div>
            </div>
          );
        })}

        {/* 下側も同じ余白 */}
        <div style={{ height: "44px" }} />
      </div>
    </div>
  );
}

/**
 * avgForRank: 平均得点のリーグ順位（1が最高）
 * avgAgainstRank: 平均失点のリーグ順位（1が最良）
 * teams: リーグのチーム数（NBAなら30）
 */
function OffDefenseBalanceBar({
  avgForRank,
  avgAgainstRank,
  teams = 30,
}: {
  avgForRank: number;
  avgAgainstRank: number;
  teams?: number;
}) {
  // 0..1 に正規化（1位=1, 最下位=0）
  const norm = (r: number) => Math.max(0, Math.min(1, (teams - r) / (teams - 1)));

  const off = norm(avgForRank);
  const def = norm(avgAgainstRank);

  // -1..+1（+ = OFF寄り, - = DF寄り）
  const bias = off - def;

  // 表示用
  const pct = Math.round(Math.abs(bias) * 100);
  const side = bias >= 0 ? "OFFENSE" : "DEFENSE";
  const label = `${bias >= 0 ? "+" : "−"}${pct}% ${side}`;

  // 位置（中央=50%）
  const pos = 50 + bias * 45; // 余白5%残し

  return (
    <div className="relative w-full">
      {/* 外枠 */}
      <div
        className="relative h-10 rounded-xl overflow-hidden border border-white/10"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02))",
        }}
      >
        {/* 背景グラデーション（DF→OFF） */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,80,80,.20) 0%, rgba(255,255,255,.08) 50%, rgba(80,200,255,.22) 100%)",
          }}
        />

        {/* センターライン */}
        <div
          className="absolute inset-y-1 left-1/2 w-px"
          style={{
            background: "rgba(255,255,255,.35)",
            boxShadow: "0 0 10px rgba(255,255,255,.25)",
          }}
        />

        {/* スキャンライト（常時） */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(120deg, transparent 30%, rgba(120,200,255,.28) 45%, transparent 60%)",
            mixBlendMode: "screen",
          }}
          animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
        />

        {/* 可動インジケータ */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-7 rounded-lg"
          style={{
            left: `${pos}%`,
            transform: "translate(-50%, -50%)",
            width: "22%",
            background:
              bias >= 0
                ? "linear-gradient(90deg, rgba(80,200,255,.35), rgba(80,200,255,.12))"
                : "linear-gradient(90deg, rgba(255,80,80,.35), rgba(255,80,80,.12))",
            boxShadow:
              bias >= 0
                ? "0 0 0 1px rgba(80,200,255,.7), 0 0 18px rgba(80,200,255,.55)"
                : "0 0 0 1px rgba(255,80,80,.7), 0 0 18px rgba(255,80,80,.55)",
          }}
          animate={{
            // 位置は滑らかに
            x: 0,
            // 呼吸するような微アニメ
            scale: [1, 1.04, 1],
            filter: ["brightness(1)", "brightness(1.15)", "brightness(1)"],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ラベル */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[11px] font-semibold tracking-wider"
            style={{
              color: bias >= 0 ? "#7dd3fc" : "#fca5a5",
              textShadow:
                bias >= 0
                  ? "0 0 10px rgba(80,200,255,.6)"
                  : "0 0 10px rgba(255,80,80,.6)",
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* 補助テキスト */}
      <div className="mt-2 flex justify-between text-[10px] text-white/60">
        <span>DEF LEANING</span>
        <span>NEUTRAL</span>
        <span>OFF LEANING</span>
      </div>
    </div>
  );
}
/* ================= Page ================= */

export default function TeamDetailViewWeb({ team }: Props) {
  

  const [frontIndex, setFrontIndex] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  
const conference = team.conference.toLowerCase() as "east" | "west";

const [conferenceRank, setConferenceRank] = useState<number | null>(null);


  

  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<"total" | "home" | "away">("total");
  const [confMode, setConfMode] = useState<"east" | "west">(
    team.conference === "EAST" || team.conference === "east" ? "east" : "west"
  );

  const ptsForCount = useMotionValue(0);
  const ptsAgainstCount = useMotionValue(0);
  const rateCount = useMotionValue(0);

  const ptsForDisplay = useTransform(ptsForCount, v => v.toFixed(1));
  const ptsAgainstDisplay = useTransform(ptsAgainstCount, v => v.toFixed(1));
  const rateDisplay = useTransform(rateCount, v => `${(v * 100).toFixed(1)}%`);


  const home = team.homeAway?.home;
  const away = team.homeAway?.away;

  useEffect(() => {
    const ptsFor =
      mode === "total"
        ? team.avgPointsFor
        : mode === "home"
        ? home?.avgFor ?? 0
        : away?.avgFor ?? 0;

    const ptsAgainst =
      mode === "total"
        ? team.avgPointsAgainst
        : mode === "home"
        ? home?.avgAgainst ?? 0
        : away?.avgAgainst ?? 0;

    const wins =
      mode === "total"
        ? team.wins
        : mode === "home"
        ? home?.wins ?? 0
        : away?.wins ?? 0;

    const losses =
      mode === "total"
        ? team.losses
        : mode === "home"
        ? home?.losses ?? 0
        : away?.losses ?? 0;

    const rate =
      mode === "total"
        ? team.winRate
        : wins + losses > 0
        ? (wins / (wins + losses)) * 100
        : 0;

    const a = animate(ptsForCount, ptsFor, { duration: 0.6 });
    const b = animate(ptsAgainstCount, ptsAgainst, { duration: 0.6 });
    const c = animate(rateCount, rate, { duration: 0.6 });

    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [mode, team]);

useEffect(() => {
  async function calcRank() {
    const q = query(
      collection(db, "teams"),
      where("league", "==", "nba"),
      where("conference", "==", team.conference)
    );

    const snap = await getDocs(q);

    const list = snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as any),
    }));

    const sorted = [...list].sort((a, b) => {
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

    const idx = sorted.findIndex(t => t.id === team.id);
    if (idx !== -1) setConferenceRank(idx + 1);
  }

  calcRank();
}, [team.id, team.conference]);

return (
  <div>
    {/* 背景（最背面） */}
    <WireframeBg />
   

    {/* コンテンツ */}
    <motion.div
      variants={page}
      initial="hidden"
      animate="show"
      className="relative z-10 min-h-screen px-4 pt-4 pb-28 space-y-5 text-white overflow-hidden"
    >
      {/* Hero */}
      <motion.div variants={item}>
        <GlassHeroCard>
          {/* はみ出し防止 */}
          <div className="relative overflow-hidden rounded-2xl">
        
            {/* ===== 上段：バッジ（左寄せ・非absolute） ===== */}
            <div className="flex items-center justify-start px-4 pt-2">
              <motion.div
          className="
            inline-flex items-center gap-1
            px-2 py-[2px] rounded-md
            text-[11px] font-semibold tracking-wide text-cyan-300
          "
          animate={{
            boxShadow: [
              "0 0 0 1px rgba(80,200,255,.45), 0 0 6px rgba(80,200,255,.25)",
              "0 0 0 1px rgba(80,200,255,.75), 0 0 10px rgba(80,200,255,.45)",
              "0 0 0 1px rgba(80,200,255,.45), 0 0 6px rgba(80,200,255,.25)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background:
              "linear-gradient(90deg, rgba(80,200,255,.20), rgba(80,200,255,.05))",
          }}
        >
          {/* 王冠は1位だけ */}
        {conferenceRank === 1 && <span>👑</span>}
        
        {conferenceRank !== null && (
  <>
    #{conferenceRank} IN {team.conference.toUpperCase()}
  </>
)}

        </motion.div>
        
            </div>
        
            {/* ===== 中央：チーム名（被らない） ===== */}
            <div className="mt-0.5 flex justify-center px-4">
              <h1
                className={`${bebas.className}
            text-[34px]         /* 1行に収まる最大サイズ */
            tracking-wider
            text-white
            text-center
            leading-none
            whitespace-nowrap   /* ← 強制1行 */
            relative z-10`}
              >
                {team.name}
              </h1>
            </div>
        
            {/* ===== PPG ===== */}
            <div className="mt-2 flex items-center justify-center gap-3 pb-4">
          <span className="text-[11px] text-white/50 tracking-widest">
            PPG
          </span>
        
          <motion.span
            animate={{
              textShadow: [
                "0 0 8px rgba(255,255,255,.20)",
                "0 0 14px rgba(120,200,255,.40)",
                "0 0 8px rgba(255,255,255,.20)",
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className={`${alfa.className} text-[40px] font-bold tabular-nums leading-none`}
          >
            {team.avgPointsFor.toFixed(1)}
          </motion.span>
        
          {typeof team.ppgRank === "number" && (
            <span className="text-[10px] text-white/60">
              #{team.ppgRank} in NBA
            </span>
          )}
        </div>
        </div>
        </GlassHeroCard>
      </motion.div>
      

      {/* Mode */}
      <motion.div variants={item}>
        <DepthCard accent={team.colors.primary}>
                <div
                  className="flex justify-between select-none"
                  onClick={() =>
                    setMode(
                      mode === "total" ? "home" : mode === "home" ? "away" : "total"
                    )
                  }
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                      {mode === "home" ? <Home size={14} /> : null}
                      {mode === "away" ? <Plane size={14} /> : null}
                      <span>{mode.toUpperCase()}</span>
                    </div>
        
        <div className={`${alfa.className} text-3xl font-bold tabular-nums`}>
          {mode === "total" && `${team.wins}-${team.losses}`}
          {mode === "home" && home && `${home.wins}-${home.losses}`}
          {mode === "away" && away && `${away.wins}-${away.losses}`}
        </div>
        
        
                    <div className="text-xs text-white/40 mt-1">tap to switch</div>
                  </div>
        
               <div className="text-right space-y-2">
          <div className="flex items-end justify-end gap-2">
            <span className="text-xs text-white/60">PTS For</span>
            <motion.span
              className={`${alfa.className} text-2xl font-bold tabular-nums`}
            >
              {ptsForDisplay}
            </motion.span>
          </div>
        
          <div className="flex items-end justify-end gap-2">
            <span className="text-xs text-white/60">Against</span>
            <motion.span
              className={`${alfa.className} text-2xl font-bold tabular-nums`}
            >
              {ptsAgainstDisplay}
            </motion.span>
          </div>
        
          <div className="flex items-end justify-end gap-2">
            <span className="text-xs text-white/60">Win Rate</span>
            <motion.span
              className={`${alfa.className} text-2xl font-bold tabular-nums`}
            >
              {rateDisplay}
         </motion.span>
        </div>
        </div>
        </div>
        </DepthCard>
        </motion.div>
        <motion.div variants={item} className="flex gap-3 items-stretch">
          <div className="basis-1/2">
              <DepthCard accent={team.colors.orange}>
          <div className="text-xs text-white/70 mb-1">
            CLUTCH (±5 PTS)
          </div>
        
          <div className="flex items-end justify-between gap-2">
            <div>
              
              <div className={`${alfa.className} text-3xl font-bold tabular-nums`}>
                {team.clutch.wins}-{team.clutch.losses}
              </div>
            </div>
        
            <div className="text-right">
              <div className="text-[10px] text-white/50">Win Rate</div>
              <div className="text-sm font-semibold tabular-nums">
                {(
                  (team.clutch.wins /
                    (team.clutch.wins + team.clutch.losses)) *
                  100
                ).toFixed(1)}
                %
              </div>
            </div>
          </div>
        </DepthCard>
        </div>
        
        
        <div className="basis-1/2 h-fit">
        <DepthCard accent={confMode === "east" ? "#EF3B24" : "#007AC1"} classNameOverride="p-4">
          <div
            className="select-none cursor-pointer"
            onClick={() =>
              setConfMode(confMode === "east" ? "west" : "east")
            }
          >
            <div className="text-xs text-white/70 mb-1">
              {confMode === "east" ? "VS EAST" : "VS WEST"}
            </div>
        
            <div className="flex items-end justify-between gap-2">
              <div
                className={`${alfa.className} text-3xl font-bold tabular-nums`}
                style={{
                  color: confMode === "east" ? "#F87171" : "#5AC8FA",
                }}
              >
                {confMode === "east"
                  ? `${team.conferenceRecord.vsEast.wins}-${team.conferenceRecord.vsEast.losses}`
                  : `${team.conferenceRecord.vsWest.wins}-${team.conferenceRecord.vsWest.losses}`}
              </div>
        
              <div className="text-right">
                <div className="text-[10px] text-white/50">Win Rate</div>
                <div className="text-sm font-semibold tabular-nums">
                  {(
                    (
                      confMode === "east"
                        ? team.conferenceRecord.vsEast.wins /
                          (team.conferenceRecord.vsEast.wins +
                            team.conferenceRecord.vsEast.losses)
                        : team.conferenceRecord.vsWest.wins /
                          (team.conferenceRecord.vsWest.wins +
                            team.conferenceRecord.vsWest.losses)
                    ) * 100
                  ).toFixed(1)}
                  %
                </div>
              </div>
            </div>
          </div>
        </DepthCard>
        </div>
      </motion.div>

      {/* Last10 */}
      <motion.div variants={item}>
        <motion.div variants={item}>
          <DepthCard accent={team.colors.primary} classNameOverride="p-4 h-auto">
            {/* タイトル部分 */}
            <div
              className="text-xs text-white/70 mb-2 cursor-pointer select-none"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? "Last 10 Games" : "Last 10 Games"} ({team.last10.wins}-{team.last10.losses})
            </div>
        
            {/* ゲームリスト */}
            {team.last10.games?.length ? (
              expanded ? (
                /* 展開時は横2列グリッド */
                <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto px-2 py-2">
                  {(() => {
                    const sorted = [...team.last10.games].sort(
                      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                    );
        
                    let leftColumn: Game[] = [];
                    let rightColumn: Game[] = [];
        
                    // 左右列に交互に振り分け
                    sorted.forEach((g, i) => {
                      if (i % 2 === 0) leftColumn.push(g);
                      else rightColumn.push(g);
                    });
        
                    // 左右列とも逆順にして下に新しいゲームが来るように
                    leftColumn = [...leftColumn].reverse();
                    rightColumn = [...rightColumn].reverse();
        
                    // 左右列を縦に交互に結合
                    const combined: Game[] = [];
                    for (let i = 0; i < Math.max(leftColumn.length, rightColumn.length); i++) {
                      if (i < rightColumn.length) combined.push(rightColumn[i]); // 右列を先に
                      if (i < leftColumn.length) combined.push(leftColumn[i]);   // 左列を後に
                    }
        
                    return combined.map((g, i) => {
                      const win = g.result === "W";
        
                      return (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.03, y: -2 }}
                          onClick={() => setFrontIndex(i)}
                          animate={
                            frontIndex === i
                              ? {
                                  y: [-1, 0, -1], // フロントカードだけ呼吸
                                  boxShadow: [
                                    win
                                      ? "0 0 2px rgba(80,200,255,0.2), 0 0 6px rgba(80,200,255,0.12)"
                                      : "0 0 2px rgba(255,80,80,0.2), 0 0 6px rgba(255,80,80,0.12)",
                                  ],
                                }
                              : {}
                          }
                          transition={{
                            y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                            boxShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                          }}
                          className="flex flex-col justify-between px-3 py-2 rounded-lg bg-gray-900/40 backdrop-blur-sm cursor-pointer"
                          style={{
                            border: win
                              ? "1px solid rgba(80,200,255,.7)"
                              : "1px solid rgba(255,80,80,.7)",
                            boxShadow: win
                              ? "0 0 1px rgba(80,200,255,0.15), 0 0 4px rgba(80,200,255,0.08)"
                              : "0 0 1px rgba(255,80,80,0.15), 0 0 4px rgba(255,80,80,0.08)",
                          }}
                        >
                          {/* 上段：日付 + VS + チーム */}
                          <div className="text-[12px] font-medium text-white/70 mb-1">
                            {g.date} {g.home ? "vs" : "@"} {g.vs}
                          </div>
        
                          {/* 下段：スコア + 勝敗 */}
                          <div className="flex justify-between items-center">
                            <span className={`${alfa.className} tabular-nums font-bold text-[16px] text-white`}>
                              {g.score}
                            </span>
                            <span className={win ? "text-cyan-400 font-semibold" : "text-red-400 font-semibold"}>
                              {g.result}
                            </span>
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <Last10List
                  games={[...team.last10.games].sort(
                    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                  )}
                />
              )
            ) : (
              <div className="text-xs text-white/40">No games</div>
            )}
          </DepthCard>
        </motion.div>
      </motion.div>

      {/* Balance */}
      <motion.div variants={item}>
      <div className="relative"> {/* ← カードの“外”を基準にする */}
      
        <DepthCard accent={team.colors.primary}>
          <div className="flex items-center gap-1 text-xs text-white/70 mb-2">
            <span> OFF / DF Balance</span>
      
            {/* ⓘ トリガー（クリックで開閉） */}
            <button
              type="button"
              onClick={() => setOpen(v => !v)}   // もう一回押すと閉じる
              className="
                inline-flex h-4 w-4 items-center justify-center rounded-full
                border border-white/30 text-[10px] text-white/70
                cursor-pointer
              "
              aria-label="info"
            >
              i
            </button>
          </div>
      
          <OffDefenseBalanceBar
            avgForRank={1}
            avgAgainstRank={10}
            teams={30}
          />
        </DepthCard>
        
      
       {/* ===== 説明パネル：カード“外”の右上（馴染む背景＋アニメ） ===== */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="
            absolute z-50
            right-0 -top-2 translate-y-[-100%]
            rounded-lg px-3 py-2
            text-[11px] text-white/95
            border border-white/10
            max-w-[360px]
            whitespace-pre-wrap
            leading-relaxed
            overflow-hidden
          "
          style={{
            /* 黒ベタをやめて“馴染む”ガラス背景 */
            background: `
              linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)),
              radial-gradient(140px 60px at 20% 0%, rgba(80,200,255,0.20), transparent 60%),
              radial-gradient(160px 70px at 85% 20%, rgba(140,80,255,0.18), transparent 60%)
            `,
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 0 18px rgba(80,200,255,.35)",
          }}
        >
          {/* ===== 内側のホログラム・シマー（常時ゆっくり） ===== */}
          <motion.div
            className="pointer-events-none absolute -inset-1"
            animate={{ x: ["-120%", "120%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{
              background:
                "linear-gradient(120deg, transparent 40%, rgba(120,200,255,.12) 50%, transparent 60%)",
              mixBlendMode: "screen",
            }}
          />
      
          {/* ===== 微スキャンライン ===== */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            animate={{ backgroundPositionY: ["0%", "100%"] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{
              backgroundImage:
                "repeating-linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)",
              opacity: 0.22,
            }}
          />
      
          {/* ===== コンテンツ ===== */}
          <div className="relative z-10">
      表示値の意味：
      攻撃力（平均得点） − 守備力（平均失点）
      
      ＋ → 得点力が強い（OFF寄り）
   ０ → 攻守が均衡
 − → 守備力が強い（DEF寄り）
 </div>
 </motion.div>
 )}
</div>
</motion.div>
</motion.div>   
</div>
);
}
