"use client";

import type { Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Home, Plane, ChevronDown } from "lucide-react";
import WireframeBg from "@/app/component/background/WireframeBg";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  nbaRegularSeasonWinsLosses,
  type NbaTeamRecordFields,
} from "@/lib/nbaRegularSeasonRecord";
import {
  CONFERENCE_RECORD_STYLE,
  enOrdinal,
} from "@/lib/teamDetailConference";
import { compareLastGamesByTime } from "@/lib/teamLastGameAt";

import { Alfa_Slab_One, Bebas_Neue } from "next/font/google";

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"] });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"] });


type TeamDetail = any;
type Props = { team: TeamDetail };

type Game = {
  date: string;
  sortAtMs?: number;
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
const sortedGames = [...games].sort(compareLastGamesByTime);

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
        bg-linear-to-b from-black/12 via-black/6 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 z-20
        bg-linear-to-t from-black/12 via-black/6 to-transparent" />

      {/* 中枠（小さめ・端も中央に来るよう余白拡張） */}
      <div
        ref={containerRef}
        className="
          relative overflow-y-auto overflow-x-clip px-1 sm:px-2
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

        {[...sortedGames].reverse().map((g, i) => {
          const isFront = i === frontIndex;
          const win = g.result === "W";

          return (
            <div
              key={i}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="
                w-full min-w-0
                relative flex items-center justify-between gap-2
                rounded-md px-2.5 py-2.5 sm:px-3
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
              <div
                className={`min-w-0 flex-1 truncate text-[13px] font-medium ${isFront ? "text-white" : "text-white/70"}`}
              >
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


/* ================= Page ================= */

export default function TeamDetailViewWeb({ team }: Props) {
  

  const [frontIndex, setFrontIndex] = useState<number | null>(null);


  const [conferenceRank, setConferenceRank] = useState<number | null>(null);

  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<"total" | "home" | "away">("total");
  const [confMode, setConfMode] = useState<"east" | "west">(
    team.conference === "EAST" || team.conference === "east" ? "east" : "west"
  );

  const conferenceLabel: "east" | "west" =
    team.conference === "EAST" || team.conference === "east"
      ? "east"
      : "west";

  const ptsForCount = useMotionValue(0);
  const ptsAgainstCount = useMotionValue(0);
  const rateCount = useMotionValue(0);

  const ptsForDisplay = useTransform(ptsForCount, v => v.toFixed(1));
  const ptsAgainstDisplay = useTransform(ptsAgainstCount, v => v.toFixed(1));
  // team.winRate は 0–100（page 組み立てとモバイルと同じ）
  const rateDisplay = useTransform(rateCount, v => `${v.toFixed(1)}%`);


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
    let alive = true;
    (async () => {
      if (!team.conference) {
        setConferenceRank(null);
        return;
      }
      try {
        const q = query(
          collection(db, "teams"),
          where("league", "==", "nba"),
          where("conference", "==", team.conference)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Record<string, unknown>),
        }));
        const sorted = [...list].sort((a, b) => {
          const ar = nbaRegularSeasonWinsLosses(a as NbaTeamRecordFields);
          const br = nbaRegularSeasonWinsLosses(b as NbaTeamRecordFields);
          const ag = ar.wins + ar.losses;
          const bg = br.wins + br.losses;
          const arate = ag > 0 ? ar.wins / ag : 0;
          const brate = bg > 0 ? br.wins / bg : 0;
          if (brate !== arate) return brate - arate;
          if (br.wins !== ar.wins) return br.wins - ar.wins;
          return 0;
        });
        const idx = sorted.findIndex((t) => t.id === team.id);
        if (alive && idx !== -1) setConferenceRank(idx + 1);
        else if (alive) setConferenceRank(null);
      } catch {
        if (alive) setConferenceRank(null);
      }
    })();
    return () => {
      alive = false;
    };
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
      className="relative z-10 min-h-screen px-4 pt-4 pb-bottom-nav space-y-5 text-white overflow-hidden"
    >
      {/* Hero */}
      <motion.div variants={item}>
        <GlassHeroCard>
          {/* はみ出し防止 */}
          <div className="relative overflow-hidden rounded-2xl">
        
            {/* カンファレンス順位（モバイルと同じ EAST 1st 形式） */}
            <div className="flex justify-start px-4 pt-2">
              <p
                className={`${bebas.className} w-full text-left text-base tracking-wide sm:text-xl`}
              >
                <span style={CONFERENCE_RECORD_STYLE[conferenceLabel]}>
                  {conferenceLabel.toUpperCase()}
                </span>
                <span className="text-white/55">
                  {" "}
                  {conferenceRank != null ? enOrdinal(conferenceRank) : "—"}
                </span>
              </p>
            </div>

            {/* ===== 中央：チーム名（被らない） ===== */}
            <div className="mt-1 flex justify-center px-4">
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
                style={CONFERENCE_RECORD_STYLE[confMode]}
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

      {/* Last10（「まだ見切れ」対応の大きな高さ変更・マスク削除は入れない） */}
      <motion.div variants={item} className="min-w-0">
        <DepthCard
          accent={team.colors.primary}
          classNameOverride="p-4 h-auto overflow-visible"
        >
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
                <div className="grid min-w-0 grid-cols-2 gap-3 max-h-[400px] overflow-y-auto overflow-x-clip px-1 py-2 sm:px-2">
                  {(() => {
                    const sorted = [...team.last10.games].sort(
                      compareLastGamesByTime
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
                          className="flex min-w-0 flex-col justify-between px-2 py-2 sm:px-3 rounded-lg bg-gray-900/40 backdrop-blur-sm cursor-pointer"
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
                          <div className="min-w-0 truncate text-[12px] font-medium text-white/70 mb-1">
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
                  games={[...team.last10.games].sort(compareLastGamesByTime)}
                />
              )
            ) : (
              <div className="text-xs text-white/40">No games</div>
            )}
        </DepthCard>
      </motion.div>



</motion.div>   
</div>
);
}
