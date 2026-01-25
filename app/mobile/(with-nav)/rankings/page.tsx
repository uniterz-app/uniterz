// app/mobile/(with-nav)/rankings/page.tsx
"use client";


import { useEffect, useState } from "react";
import { Alfa_Slab_One } from "next/font/google";
import type React from "react";
import Link from "next/link";
import { animate } from "framer-motion";



import type {
  Period,
  LeagueTab,
  Metric,
  RankingRow,
  RankingResponse,
} from "@/lib/rankings/types";

const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
});

const DUMMY_ROWS: RankingRow[] = [
  {
    uid: "u1",
    handle: "dummy_king",
    displayName: "Dummy King",
    photoURL: "/dummy/1.png",
    winRate: 0.72,
    avgPrecision: 7.8,
    streak: 6,
    posts: 42,
  },
  {
    uid: "u2",
    handle: "dummy_ace",
    displayName: "Dummy Ace",
    photoURL: "/dummy/2.png",
    winRate: 0.67,
    avgPrecision: 7.2,
    streak: 4,
    posts: 38,
  },
  {
    uid: "u3",
    handle: "dummy_star",
    displayName: "Dummy Star",
    photoURL: "/dummy/3.png",
    winRate: 0.63,
    avgPrecision: 6.9,
    streak: 3,
    posts: 30,
  },
  {
    uid: "u4",
    handle: "dummy_pro",
    displayName: "Dummy Pro",
    photoURL: "/dummy/4.png",
    winRate: 0.61,
    avgPrecision: 6.5,
    streak: 2,
    posts: 28,
  },
  {
    uid: "u5",
    handle: "dummy_rookie",
    displayName: "Dummy Rookie",
    photoURL: "/dummy/5.png",
    winRate: 0.58,
    avgPrecision: 6.1,
    streak: 1,
    posts: 22,
  },
  {
    uid: "u6",
    handle: "dummy_alpha",
    displayName: "Dummy Alpha",
    photoURL: "/dummy/1.png",
    winRate: 0.56,
    avgPrecision: 6.0,
    streak: 1,
    posts: 20,
  },
  {
    uid: "u7",
    handle: "dummy_beta",
    displayName: "Dummy Beta",
    photoURL: "/dummy/2.png",
    winRate: 0.55,
    avgPrecision: 5.9,
    streak: 0,
    posts: 19,
  },
  {
    uid: "u8",
    handle: "dummy_gamma",
    displayName: "Dummy Gamma",
    photoURL: "/dummy/3.png",
    winRate: 0.54,
    avgPrecision: 5.8,
    streak: 0,
    posts: 18,
  },
  {
    uid: "u9",
    handle: "dummy_delta",
    displayName: "Dummy Delta",
    photoURL: "/dummy/4.png",
    winRate: 0.53,
    avgPrecision: 5.7,
    streak: 0,
    posts: 17,
  },
  {
    uid: "u10",
    handle: "dummy_epsilon",
    displayName: "Dummy Epsilon",
    photoURL: "/dummy/5.png",
    winRate: 0.52,
    avgPrecision: 5.6,
    streak: 0,
    posts: 16,
  },
];


const METRICS: { key: Metric; title: string }[] = [
  { key: "winRate", title: "勝率" },
  { key: "avgPrecision", title: "スコア精度" },
 { key: "streak", title: "連勝" },
];




/* ====== UI 定数 ====== */
const MAX_AVATAR = 70;
const AVATAR_BOX_H = MAX_AVATAR + 26;
const CARD_H = 190;




function AnimatedValue({
  value,
  isPercent,
  animateTrigger = true, // ★ 追加
}: {
  value: number;
  isPercent?: boolean;
  animateTrigger?: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!animateTrigger) return; // ★ 正面でない場合はアニメしない
    const controls = animate(display, value, {
      duration: 0.7, // ★ 速くする
      onUpdate(latest) {
        setDisplay(latest);
      },
      ease: [0.6, 0.01, 0.05, 0.95],
    });
    return () => controls.stop();
  }, [value, animateTrigger]);

  return <>{isPercent ? `${Math.round(display)}%` : display.toFixed(1)}</>;
}




/* ============ ページ本体 ============ */

export default function MobileRankingsPage() {
  const [metricIndex, setMetricIndex] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false); // ← ここに追加
  const swipe = useSwipe((step) => {
  setMetricIndex(i =>
    (i + step + METRICS.length) % METRICS.length
  );
});

const [entered, setEntered] = useState(false);

useEffect(() => {
  const id = requestAnimationFrame(() => setEntered(true));
  return () => cancelAnimationFrame(id);
}, []);



  const DISABLE_RANKINGS_UI = false;
    if (DISABLE_RANKINGS_UI) {
    return (
      <>
        <header className="pt-2 sticky top-0 z-40 border-b border-white/10 bg-transparent backdrop-blur-md">

          <div className="relative h-11 flex items-center justify-center px-3">
            <img src="/logo/logo.png" alt="Uniterz Logo" className="w-10 h-auto" />
          </div>
        </header>

        <div className="px-4 py-10 text-center text-white/60 text-sm">
          ランキングは現在準備中です
        </div>
      </>
    );
  }

  const [league, setLeague] = useState<LeagueTab>("nba");
  const [period, setPeriod] = useState<Period>("week");

  const [rows, setRows] = useState<Record<Metric, RankingRow[]>>({
  winRate: [],
  avgPrecision: [],
  streak: [],
});

  const [periodInfo, setPeriodInfo] = useState<{
  startAt: string;
  endAt: string;
} | null>(null);

// ★ 追加：この period 用のデータかを判定するキー
const [periodKey, setPeriodKey] = useState<Period>("week");


  const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);


  const heroCount = 3;
 const listCount = period === "week" ? 10 : 20;

  const headingStyle: React.CSSProperties = {
    fontFamily:
      "'Hiragino Kaku Gothic Std','Hiragino Kaku Gothic ProN','Hiragino Sans',system-ui,sans-serif",
    fontWeight: 800,
    letterSpacing: "0.02em",
  };

  /* ====== fetch (V2) ====== */
async function fetchAll() {
  const currentPeriod = period;
  setPeriodKey(currentPeriod);
  setPeriodInfo(null);

  setLoading(true);

  try {
    setError(null);

    const metrics: Metric[] = [
  "winRate",
  "avgPrecision",
  "streak",
];



    const results = await Promise.all(
      metrics.map(async (metric) => {
        const res = await fetch(
          `/api/rankings-v2?period=${period}&league=${league}&metric=${metric}`
        );
        const json = await res.json();

        // ★ ここが重要
        if (json.period && metric === "winRate") {
          setPeriodInfo(json.period);
        }

        return [metric, json.rows ?? []] as const;
      })
    );

    setRows((prev) => {
      const next = { ...prev };
      for (const [metric, rows] of results) {
        next[metric] = rows;
      }
      return next;
    });
  } catch (e: any) {
    setError(e?.message ?? "failed to load");
    } finally {
    setLoading(false);
  }
}

useEffect(() => {
  document.body.classList.remove("splash-bg");
  return () => {
    document.body.classList.add("splash-bg");
  };
}, []);


useEffect(() => {
  setLoading(false);
  setError(null);

  setRows({
    winRate: DUMMY_ROWS,
    avgPrecision: DUMMY_ROWS,
   streak: DUMMY_ROWS,
  });

 
  setPeriodInfo({
    startAt: "2026-01-13",
    endAt: "2026-01-19",
  });
}, [league, period]);


  const noData = Object.values(rows).every((arr) => arr.length === 0);

return (
 <div className="relative min-h-screen bg-transparent"

  style={{
    perspective: "1200px",
    transformStyle: "preserve-3d",
  }}
>
<div className="pointer-events-none absolute inset-0 z-25 depth-vignette" />

{/* ===== Rankings 専用 3D 背景 ===== */}
<div className="pointer-events-none absolute inset-0 z-0 rank-bg-far" />
<div className="pointer-events-none absolute inset-0 z-10 rank-bg-mid" />
<div className="pointer-events-none absolute inset-0 z-20 rank-bg-fog" />
<div className="pointer-events-none absolute inset-0 z-30 depth-vignette" />



    {/* ===== 中身 ===== */}
    <div
  className="relative z-30"
  style={{
    transformStyle: "preserve-3d",
  }}
>

      {/* ヘッダー */}
      <header className="pt-2 sticky top-0 z-40 border-b border-white/10 bg-transparent backdrop-blur-md">
        <div className="relative h-11 flex items-center justify-center px-3">
          <img src="/logo/logo.png" alt="Uniterz Logo" className="w-10 h-auto" />
        </div>
      </header>

      {/* タブ＋期間 */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <TabsRow
          league={league}
          setLeague={setLeague}
          period={period}
          setPeriod={setPeriod}
        />

        {period === "week" && periodInfo && (
          <div className="text-center text-[11px] text-white/45">
            集計期間：
            {new Date(periodInfo.startAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
            {" 〜 "}
            {new Date(periodInfo.endAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
          </div>
        )}
      </div>

      {/* ★ 固定インジケータ（ここ） */}
<div className="sticky top-[88px] z-40 flex justify-center py-2">
  {METRICS.map((_, i) => {
    const active = i === metricIndex;
    return (
      <span
        key={i}
        className={[
          "w-2 h-2 rounded-full mx-1 transition-opacity",
          active ? "bg-white opacity-100" : "bg-black/40 opacity-50",
        ].join(" ")}
      />
    );
  })}
</div>

      {/* 状態表示 */}
      {error && <p className="text-xs text-center text-red-300">{error}</p>}
      {loading && <p className="text-sm text-center text-white/60">読み込み中…</p>}
      {!loading && noData && <p className="text-sm text-center text-white/60">データなし</p>}

{!loading && !noData && (
  <>
    <Rankings3D
      swipe={swipe}
      metrics={METRICS}
      rows={rows}
      metricIndex={metricIndex}
      league={league}
      period={period}
      listCount={listCount}
      entered={entered} 
    />

</>
)}
</div>
</div>
);
}



/* ============ Tabs ============ */

function TabsRow(props: {
  league: LeagueTab;
  setLeague: (v: LeagueTab) => void;
  period: Period;
  setPeriod: (v: Period) => void;
}) {
  const { league, setLeague, period, setPeriod } = props;
  const isB1 = league === "b1";

  const Tab = ({
    label,
    active,
    onClick,
  }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-2xl border transition-colors text-sm",
        active
          ? "bg-white/12 border-white/30 text-white font-semibold ring-1 ring-white/15"
          : "bg-white/5 border-white/10 text-white/70 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
  <div className="flex flex-col gap-1">
    {/* タブ本体 */}
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Tab
          label="NBA"
          active={league === "nba"}
          onClick={() => setLeague("nba")}
        />
        <Tab
          label="B1"
          active={league === "b1"}
          onClick={() => setLeague("b1")}
        />
      </div>

      <div className="flex gap-2">
        <Tab
          label="週間"
          active={period === "week"}
          onClick={() => setPeriod("week")}
        />
        <Tab
          label="月間"
          active={period === "month"}
          onClick={() => setPeriod("month")}
        />
      </div>
    </div>

    {/* ★ ランキング条件の説明（minPosts対応） */}
<div className="mt-2 text-[13px] text-white/40 text-center leading-relaxed">
  {league === "nba" && period === "week" && (
    <>NBA週間ランキングは <b>20投稿以上</b> が対象です</>
  )}

  {league === "nba" && period === "month" && (
    <>NBA月間ランキングは <b>30投稿以上</b> が対象です</>
  )}

  {league === "b1" && period === "month" && (
    <>Bリーグ月間ランキングは <b>25投稿以上</b> が対象です</>
  )}

  {league === "b1" && period === "week" && (
    <>Bリーグは月間ランキングのみです</>
  )}
</div>
  </div>
);
}


/* =========================
 * Hero (Top3固定) — V2対応版
 * =======================*/
function HeroRow({
  rows,
  heroCount,
  metric,
  league,
  period, // ★ 追加: 週間/月間で表示が変わる可能性あり
  isFront,
  entered,
}: {
  rows: RankingRow[];
  heroCount: number;
  metric: Metric;
  league: LeagueTab;
  period: Period;
  isFront: boolean
   entered: boolean;
}) {
  const base = rows.slice(0, heroCount);
  const ORDER_3 = [1, 0, 2];
  const top = ORDER_3.map((i) => base[i]).filter(Boolean);

  return (
    <div className="grid grid-cols-3 gap-3 items-end">
      {top.map((r, i) => {
        const rank = (base.indexOf(r) ?? i) + 1;

        const ring = ringByRank(rank);
        const avatarSize = avatarSizeByRankMobile(rank);
       

        /* --------------------------
         * ★ metricごとの値の表示切替 (V2仕様)
         * ------------------------ */
  let value = "-";

if (metric === "winRate") {
  value = `${Math.round((r.winRate ?? 0) * 100)}%`;
} else if (metric === "avgPrecision") {
  value = `${(r.avgPrecision ?? 0).toFixed(1)} pt`;
} else if (metric === "streak") {
  value = `${r.streak ?? 0}連勝`;
}




        /* --------------------------
         * ★ metricごとに色変更
         * ------------------------ */
        const chip =
  metric === "winRate"
    ? "bg-emerald-600 text-white"
   
    : metric === "avgPrecision"
    ? "bg-purple-600 text-white"
    
    
    : "bg-gray-500 text-white";

    const delayByRank =
  rank === 1 ? 0.45 :   // ★ 1位を最後
  rank === 2 ? 0.25 :
  rank === 3 ? 0.15 :
  0;

    
return (
  <Link
    key={r.uid}
    href={`/mobile/u/${r.handle}`}
    className={[
      "relative rounded-2xl",
      "px-2.5 pt-8 pb-3 flex flex-col items-center gap-0 overflow-visible",
      "shadow-[0_18px_40px_rgba(0,0,0,.45)]",
    ].join(" ")}
     style={{
    height: CARD_H,
    opacity: entered ? 1 : 0,
    transform: entered
      ? "translateY(0) scale(1)"
      : "translateY(24px) scale(0.96)",
    transition: `opacity 420ms ease-out ${delayByRank}s,
                 transform 520ms cubic-bezier(.22,.61,.36,1) ${delayByRank}s`,
    animation: rank === 1 ? "float 6s ease-in-out infinite" : undefined,
  }}
>
    {/* ★ 1位専用 背景 */}
   {rank === 1 && (
  <div
    className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 w-[120%] h-24"
    style={{
      background:
        "radial-gradient(50% 60% at 50% 100%, rgba(255,215,120,.45), rgba(255,215,120,0))",
      filter: "blur(20px)",
      zIndex: -1,
    }}
  />
)}


    {/* ↓ 既存の中身そのまま */}


          

            

            <div
              className="w-full flex items-center justify-center"
              style={{ height: AVATAR_BOX_H }}
            >
              <div className="relative">
                <div
                  className={[
                    "rounded-full overflow-hidden ring-2 shadow-[0_8px_22px_rgba(0,0,0,.30)]",
                    ring.ring,
                  ].join(" ")}
                  style={{ width: avatarSize, height: avatarSize }}
                >
                  <Avatar
                    name={r.displayName}
                    photoURL={r.photoURL}
                    size={avatarSize}
                  />
                </div>
                <div
                  className={[
                    "absolute inset-0 rounded-full blur-xl pointer-events-none",
                    ring.glow,
                  ].join(" ")}
                />
              </div>
            </div>

            <div className="text-white font-bold text-[13px] text-center max-w-[16ch] truncate h-[18px] flex items-center">
              {r.displayName}
            </div>

            <div className="mt-2 flex flex-col items-center gap-0.5">
  {/* 指標（Impact / Alfa） */}
<span
  className={[
    alfa.className,
    rank === 1 ? "text-[26px]" : "text-[22px]",
    "font-bold",
    rank === 1 ? "text-yellow-400" :
    rank === 2 ? "text-slate-300" :
    rank === 3 ? "text-orange-400" :
    "text-white/90",
  ].join(" ")}
>
  <AnimatedValue
  value={
    metric === "winRate"
      ? (r.winRate ?? 0) * 100
      : metric === "avgPrecision"
      ? r.avgPrecision ?? 0
      : r.streak ?? 0
  }
  isPercent={metric === "winRate"}
  animateTrigger={isFront}
/>


</span>

  {/* 投稿数（補足情報） */}
  <span className="text-[11px] text-white/40 leading-none">
    {r.posts} 投稿
  </span>
</div>   
          </Link>
        );
      })}
    </div>
  );
}



/* =========================
 * 見た目は変更なし
 * =======================*/
function ringByRank(rank: number) {
  if (rank === 1) return { ring: "ring-yellow-300", glow: "bg-yellow-300/25" };
  if (rank === 2) return { ring: "ring-slate-200", glow: "bg-slate-200/20" };
  if (rank === 3) return { ring: "ring-amber-600", glow: "bg-amber-600/25" };
  if (rank === 4) return { ring: "ring-cyan-300", glow: "bg-cyan-300/25" };
  return { ring: "ring-teal-300", glow: "bg-teal-300/25" };
}

function avatarSizeByRankMobile(rank: number) {
  if (rank === 1) return MAX_AVATAR;
  if (rank === 2) return 65;
  return 60;
}

function badgeDimsByRankMobile(
  rank: number,
  avatarSize: number
): { badgeWidth: number; badgeLift: number } {
  const widthScale: Record<number, number> = {
  1: 1.8,   // 1位はそのまま
  2: 2.25,  // ★ 少し大きく
  3: 2.55,  // ★ 2位よりわずかに大きく
  4: 1.05,
  5: 0.98,
};
  const liftScale: Record<number, number> = {
    1: 0.4,
    2: 0.34,
    3: 0.26,
    4: 0.22,
    5: 0.18,
  };

  const badgeWidth = Math.round(avatarSize * (widthScale[rank] ?? 1.0));
  const EXTRA_DOWN = 8;
  const badgeLift = Math.max(
    0,
    Math.round(badgeWidth * (liftScale[rank] ?? 0.3)) - EXTRA_DOWN
  );
  return { badgeWidth, badgeLift };
}

/* =========================
 * ★ Listing(Row) の V2対応版
 * =======================*/
function RankingList({
  rows,
  metric,
  baseRank,
}: {
  rows: RankingRow[];
  metric: Metric;
  baseRank: number;
}) {
  return (
    <div className="w-full bg-transparent divide-y divide-white/10">

      {rows.map((r, i) => {
        const rank = baseRank + i + 1;

        /* ----------------------------
         * ★ V2仕様の表示値
         * ----------------------------*/
let value = "-";

if (metric === "winRate") {
  value = `${Math.round((r.winRate ?? 0) * 100)}%`;
} else if (metric === "avgPrecision") {
  value = `${(r.avgPrecision ?? 0).toFixed(1)} pt`;
} else if (metric === "streak") {
  value = `${r.streak ?? 0}連勝`;
}




        /* ----------------------------
         * ★ metricごとに色を変える
         * ----------------------------*/
        const chip =
  metric === "winRate"
    ? "bg-emerald-600 text-white"
  
    : metric === "avgPrecision"
    ? "bg-purple-600 text-white"
    
    
    : "bg-gray-500 text-white";

        return (
          <Link
  key={r.uid}
  href={`/mobile/u/${r.handle}`}
            className="flex items-center px-4 py-4 hover:bg-white/[.06]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <RankCircle rank={rank} />
              <Avatar name={r.displayName} photoURL={r.photoURL} size={44} />
              <div className="text-white text-[15px] font-semibold min-w-0 truncate">
                {r.displayName}
              </div>
            </div>
           <div className="ml-auto flex items-center gap-2">
  {/* 指標 */}
  <span className="text-[15px] font-bold text-white/90">
    {value}
  </span>

  {/* 投稿数 */}
  <span className="text-[12px] text-white/40">
    {r.posts}投稿
  </span>
</div>

          </Link>
        );
      })}
    </div>
  );
}

/* =========================
 * RankCircle — UIそのまま
 * =======================*/
function RankCircle({ rank }: { rank: number }) {
  return (
    <div className="w-8 h-8 rounded-full grid place-items-center text-[12px] font-extrabold border border-amber-300/60 text-amber-300/95">
      {rank}
    </div>
  );
}

/* =========================
 * Avatar — UIそのまま
 * =======================*/
function Avatar({
  name,
  photoURL,
  size = 40,
}: {
  name: string;
  photoURL?: string;
  size?: number;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center shrink-0"
    >
      {photoURL && (
        <img
          src={photoURL}
          alt={name}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}



// useSwipe の上 or 下（コンポーネント定義の外）
function loopOffset(i: number, current: number, len: number) {
  const diff = i - current;
  if (diff >  len / 2) return diff - len;
  if (diff < -len / 2) return diff + len;
  return diff;
}


function useSwipe(
  onStep: (step: number) => void,
  onSwipeState?: (v: boolean) => void
) {
  let startX = 0;
  let startY = 0;
  let startT = 0;
  let locked: "h" | "v" | null = null;

  return {
    onTouchStart: (e: React.TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startT = performance.now();
      locked = null;
      onSwipeState?.(true);
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (locked) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) * 1.3) locked = "h";
      else if (Math.abs(dy) > Math.abs(dx) * 1.3) locked = "v";
    },
    onTouchEnd: (e: React.TouchEvent) => {
      onSwipeState?.(false);
      if (locked !== "h") return;

      const dx = e.changedTouches[0].clientX - startX;
      const dt = performance.now() - startT;
      const velocity = Math.abs(dx) / Math.max(dt, 1);

      let step = 0;
      if (Math.abs(dx) > 60) step = dx < 0 ? 1 : -1;
      if (velocity > 0.6) step *= 2;

      if (step !== 0) onStep(step);
    },
  };
}




function Rankings3D({
  swipe,
  metrics,
  rows,
  metricIndex,
  league,
  period,
  listCount,
  entered,
}: {
  swipe: any;
  metrics: { key: Metric; title: string }[];
  rows: Record<Metric, RankingRow[]>;
  metricIndex: number;
  league: LeagueTab;
  period: Period;
  listCount: number;
  entered: boolean;
}) {
  return (
    <div className="mx-auto w-full px-3 py-6 overflow-x-hidden">
      <div
        {...swipe}
        className="relative w-full h-[calc(100vh-140px)] overflow-hidden"
        style={{
  perspective: "1200px",
  transformStyle: "preserve-3d",
  touchAction: "pan-y", // ← これを追加
}}

      >
       
        {metrics.map((m, i) => {
          const offset = loopOffset(i, metricIndex, metrics.length);

          const rowsForMetric = rows[m.key] ?? [];
const isFront = offset === 0;
          return (
            <div
              key={m.key}
              className="absolute inset-0 flex justify-center transition-transform duration-500 ease-out"
       style={{
  transform: isFront
    ? entered
      ? `
        translateX(0%)
        translateZ(0px)
        rotateY(0deg)
        scale(1.08)
      `
      : `
        translateX(0%)
        translateZ(-120px)
        rotateY(0deg)
        scale(0.96)
      `
    : `
      translateX(${offset * 110}%)
      translateZ(-260px)
      rotateY(${offset * -18}deg)
      scale(0.92)
    `,
  opacity: isFront ? 1 : Math.abs(offset) === 1 ? 0.35 : 0,
  pointerEvents: isFront ? "auto" : "none",
  transition:
    isFront && !entered
      ? "none"
      : "transform 420ms cubic-bezier(.22,.61,.36,1), opacity 220ms ease-out",
}}


            >
              <section className="w-full px-3 py-6 flex flex-col h-full">
                <h2 className="text-white text-[26px] text-center font-extrabold">
                  {m.title}
                </h2>

                <HeroRow
                  rows={rowsForMetric}
                  heroCount={3}
                  metric={m.key}
                  league={league}
                  period={period}
                  isFront={offset === 0}
                  entered={entered}
                />
<div className="flex-1 overflow-y-auto mt-6">
                <RankingList
                  rows={rowsForMetric.slice(3, listCount)}
                  metric={m.key}
                  baseRank={3}
                />
                </div>
              </section>
            </div>
          );
        })}
      </div>
    </div>
  );
}
