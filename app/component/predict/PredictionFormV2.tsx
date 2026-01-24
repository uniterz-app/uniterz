// app/component/predict/PredictionForm2.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import MatchCard, { type MatchCardProps } from "@/app/component/games/MatchCard";
import { auth } from "@/lib/firebase";
import { toast } from "@/app/component/ui/toast";
import { logGameEvent } from "@/lib/analytics/logEvent";
import { useRouter, usePathname } from "next/navigation";
import { Alfa_Slab_One } from "next/font/google";
import { Home, Plane } from "lucide-react";

import { motion, type Variants } from "framer-motion";

// ページ全体
const pageContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

// 普通の上からフェード
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

// stats 全体（カードを順番に）
const statsContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// stats カード本体（中央→左右）
const statCardAnim: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  show: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

// stats 文字
const statTextAnim: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { delay: 0.15, duration: 0.25 },
  },
};

const fadeUpAfterStats: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
      delay: 0.6, // ← stats 全体分の待ち
    },
  },
};

const afterStatsContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.6, // ← stats 完了待ち
    },
  },
};

const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};






const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
});

type Props = {
  dense?: boolean;
  game: MatchCardProps;
  user: { name: string; avatarUrl?: string | null; verified?: boolean };
  onPostCreated?: (payload: { id: string; at: Date }) => void;
};

// 👇 PredictionForm より上に置く
const StatCard = ({
  left,
  right,
  label,
  last10Label, // ここで last10Label を受け取る
  highlight,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  label: string;
  last10Label?: string; // optionalにしておく
  highlight?: "left" | "right" | null;
}) => (
  <div
    className="
      relative rounded-2xl
      bg-gradient-to-br from-white/8 to-white/5
      border border-white/10
      px-4 py-2
      shadow-[0_6px_20px_rgba(0,0,0,0.3)]
    "
  >
    {/* 中央バー */}
    <div
      className="
        absolute inset-y-3 left-1/2 w-[2px]
        bg-cyan-400/70
        shadow-[0_0_12px_rgba(34,211,238,0.8)]
      "
    />

    <div className="grid grid-cols-3 items-center">
      {/* 左（HOME 数字） */}
      <div
        className={`
          text-right tabular-nums text-2xl font-bold
          ${alfa.className}
          ${
            highlight === "left"
              ? "text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.9)]"
              : "text-white/90"
          }
        `}
      >
        {left}
      </div>

      {/* 中央ラベル */}
      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
        {/* HOME icon（光らせない） */}
        {label === "勝 敗" && (
          <Home
            size={14}
            className="text-white/50 drop-shadow-none"
          />
        )}

        {/* ラベル本体 */}
        <span className="text-sm font-semibold tracking-[0.05em] text-white/80">
          {label}
        </span>

        {/* AWAY icon（光らせない） */}
        {label === "勝 敗" && (
          <Plane
            size={14}
            className="text-white/50 drop-shadow-none"
          />
        )}
      </div>

      {/* 右（AWAY 数字） */}
      <div
        className={`
          text-left tabular-nums text-2xl font-bold
          ${alfa.className}
          ${
            highlight === "right"
              ? "text-yellow-300 drop-shadow-[0_0_12px_rgba(253,224,71,0.9)]"
              : "text-white/90"
          }
        `}
      >
        {right}
      </div>
    </div>

    {/* 追加部分: last10Label */}
    {last10Label && (
      <div className="text-center mt-2 text-white font-semibold">{last10Label}</div>
    )}
  </div>
);

const Last10SplitCard = ({
  left,
  right,
  leftVsLabel,
  rightVsLabel,
}: {
  left: string;
  right: string;
  leftVsLabel: string;   // HOME 用
  rightVsLabel: string;  // AWAY 用
}) => {
  const isEast = (v: string) => v.toUpperCase().includes("EAST");

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* LEFT = HOME */}
      <div className="relative min-h-[76px] rounded-2xl bg-gradient-to-br from-white/8 to-white/5 border border-white/10 px-5 py-3">
        <div
          className={[
            "absolute top-2 left-3 text-[11px] font-semibold tracking-widest",
            isEast(leftVsLabel) ? "text-red-400" : "text-blue-400",
          ].join(" ")}
        >
          {leftVsLabel}
        </div>
        <div className="flex items-center justify-center h-full pt-3">
          <div className={`text-3xl font-bold tabular-nums ${alfa.className}`}>
            {left}
          </div>
        </div>
      </div>

      {/* RIGHT = AWAY */}
      <div className="relative min-h-[76px] rounded-2xl bg-gradient-to-br from-white/8 to-white/5 border border-white/10 px-5 py-3">
        <div
          className={[
            "absolute top-2 left-3 text-[11px] font-semibold tracking-widest",
            isEast(rightVsLabel) ? "text-red-400" : "text-blue-400",
          ].join(" ")}
        >
          {rightVsLabel}
        </div>
        <div className="flex items-center justify-center h-full pt-3">
          <div className={`text-3xl font-bold tabular-nums ${alfa.className}`}>
            {right}
          </div>
        </div>
      </div>
    </div>
  );
};



export default function PredictionForm({
  dense = false,
  game,
  user,
  onPostCreated,
}: Props) {

    const router = useRouter();
const pathname = usePathname();
const isMobile = pathname.startsWith("/mobile");
const prefix = isMobile ? "/mobile" : "/web";


const gameDateKey = game.startAtJst
  ? game.startAtJst.toISOString().slice(0, 10)
  : undefined;

  /* ===== State ===== */
  type Winner = "home" | "away" | "draw";

const [winner, setWinner] = useState<Winner | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSoccer = game.league === "pl" || game.league === "j1";

type TeamStats = {
  wins: number;
  losses: number;
  avgFor: number;
  avgAgainst: number;
  last10: string;       // "7-3"
  last10Label: string;  // ✅ "VS EAST" / "VS WEST"
};


const emptyStats: TeamStats = {
  wins: 0,
  losses: 0,
  avgFor: 0,
  avgAgainst: 0,
  last10: "0-0",
  last10Label: "VS EAST", // ✅ 仮でOK
};


const [homeStats, setHomeStats] = useState<TeamStats>(emptyStats);
const [awayStats, setAwayStats] = useState<TeamStats>(emptyStats);

const normalizeConf = (v: any): "east" | "west" => {
  const s = String(v ?? "").toLowerCase();
  return s.includes("east") ? "east" : "west";
};

const confRecordStr = (d: any, oppConf: "east" | "west") => {
  const wins = oppConf === "east" ? (d.vsEastWins ?? 0) : (d.vsWestWins ?? 0);
  const games = oppConf === "east" ? (d.vsEastGames ?? 0) : (d.vsWestGames ?? 0);
  const losses = Math.max(0, games - wins);
  return `${wins}-${losses}`;
};


useEffect(() => {
  const homeTeamId = game?.home?.teamId;
  const awayTeamId = game?.away?.teamId;
  if (!homeTeamId || !awayTeamId) return;

const buildStats = (
  d: any,
  mode: "home" | "away", 
  oppConf: "east" | "west" // 相手のカンファレンス（East または West）
): TeamStats => {
  const gpMode = mode === "home" ? (d.homeGames ?? 0) : (d.awayGames ?? 0);
  const winsMode = mode === "home" ? (d.homeWins ?? 0) : (d.awayWins ?? 0);
  const lossesMode = Math.max(0, gpMode - winsMode);

  const gpAll = d.gamesPlayed ?? 0;
  const forAll = d.pointsForTotal ?? 0;
  const againstAll = d.pointsAgainstTotal ?? 0;

  const avgFor = gpAll > 0 ? Number((forAll / gpAll).toFixed(1)) : 0;
  const avgAgainst = gpAll > 0 ? Number((againstAll / gpAll).toFixed(1)) : 0;

  // 相手のカンファレンスに応じて last10Label を設定
  const last10Label = oppConf === "east" ? "VS EAST" : "VS WEST";

  return {
    wins: winsMode,
    losses: lossesMode,
    avgFor,
    avgAgainst,
    last10: confRecordStr(d, oppConf), // 勝敗（例："7-3"）を表示
    last10Label, // ここで last10Label を設定
  };
};



  const run = async () => {
    const [hSnap, aSnap] = await Promise.all([
      getDoc(doc(db, "teams", homeTeamId)),
      getDoc(doc(db, "teams", awayTeamId)),
    ]);

 if (hSnap.exists() && aSnap.exists()) {
  const hData = hSnap.data();
  const aData = aSnap.data();

  const homeOppConf = normalizeConf(aData.conference); // 相手(away)のconf
  const awayOppConf = normalizeConf(hData.conference); // 相手(home)のconf

  setHomeStats(buildStats(hData, "home", homeOppConf));
  setAwayStats(buildStats(aData, "away", awayOppConf));
}


  };

  run();
}, [game?.home?.teamId, game?.away?.teamId]);



  const canSubmit =
  !!winner &&
  !submitting &&
  scoreHome !== "" &&
  scoreAway !== "";

  const padX = dense ? "px-3" : "px-6";
  const padY = dense ? "py-3" : "py-6";

  const homeSafe = game?.home ?? {
    name: "Home",
    record: { w: 0, l: 0 },
    number: 0,
    colorHex: "#ef4444",
  };

  const awaySafe = game?.away ?? {
    name: "Away",
    record: { w: 0, l: 0 },
    number: 0,
    colorHex: "#3b82f6",
  };

  

  const fieldBase =
    "w-full h-11 md:h-14 rounded-xl px-3 md:px-4 " +
    "bg-white/10 text-white placeholder-white/60 " +
    "border border-white/10 " +
    "focus:outline-none focus:ring-2 focus:ring-white/20";

const handleSubmit = async () => {
  if (!canSubmit) return;

  const me = auth.currentUser;
  if (!me) {
    alert("ログインが必要です");
    return;
  }

    // ===== スコアと勝敗の整合性チェック =====
  const h = Number(scoreHome);
  const a = Number(scoreAway);


  

  if (Number.isNaN(h) || Number.isNaN(a)) {
    alert("スコアを正しく入力してください");
    return;
  }

  // 共通ルール（全競技）
  if (winner === "home" && h <= a) {
    alert("ホーム勝利予想の場合、ホーム得点を多くしてください");
    return;
  }

  if (winner === "away" && a <= h) {
    alert("アウェイ勝利予想の場合、アウェイ得点を多くしてください");
    return;
  }

  // サッカー専用ルール

  if (isSoccer) {
    if (winner === "draw" && h !== a) {
      alert("引き分け予想の場合、スコアは同点にしてください");
      return;
    }
  }

  try {
    setSubmitting(true);
    const idToken = await me.getIdToken();

    const body = {
      gameId: (game as any).id,
      league: game.league, // ★ 追加必須
      authorUid: me.uid,   // ★ 追加推奨
      prediction: {
        winner,
        confidence,
        score: {
          home: scoreHome ? Number(scoreHome) : 0,
          away: scoreAway ? Number(scoreAway) : 0,
        },
      },
      comment: comment || "",
    };

    const res = await fetch("/api/posts_v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `投稿失敗 (${res.status})`);
    }

    const json = await res.json();

   // analytics
try {
  // 送信用の統一リーグ名
  const normalizedLeague =
    game.league === "bj"
      ? "B1"
      : game.league === "j1"
      ? "J1"
      : game.league.toUpperCase(); // nba → NBA など

  void logGameEvent({
    type: "predict",
    gameId: (game as any).id,
    league: normalizedLeague,
  });
} catch {}


  toast.success("予想を投稿しました");

// 親に通知（先に）
onPostCreated?.({ id: json.id ?? "(local)", at: new Date() });

// 前のページへ戻る
router.push(`${prefix}/games?date=${gameDateKey}`);

// Reset（戻った後は基本使われないが安全のため残す）
setWinner(null);
setConfidence(50);
setScoreHome("");
setScoreAway("");
setComment("");

  } catch (e: any) {
    alert(e.message ?? "送信に失敗しました");
  } finally {
    setSubmitting(false);
  }
};



 return (
 <motion.div
  variants={pageContainer}
  initial="hidden"
  animate="show"
  className={`${padX} ${padY} text-white min-h-screen overflow-y-auto overscroll-contain`}
>

 {/* 試合カード */}
      <motion.div variants={fadeUp}>
      <MatchCard
      
        {...game}
        startAtJst={game?.startAtJst ?? null}
        home={homeSafe}
        away={awaySafe}
        dense={dense}
        hideLine
        hideActions
      />
      </motion.div>
  
{/* ===== Cyber Stats Compare ===== */}
<motion.section
  className="mt-6 space-y-3"
  variants={statsContainer}
  initial="hidden"
  animate="show"
>
  {[
    {
      left: `${homeStats.wins}-${homeStats.losses}`,
      right: `${awayStats.wins}-${awayStats.losses}`,
      label: "勝 敗",
      highlight:
        homeStats.wins > awayStats.wins
          ? ("left" as const)
          : homeStats.wins < awayStats.wins
          ? ("right" as const)
          : null,
    },
    {
      left: homeStats.avgFor,
      right: awayStats.avgFor,
      label: "平均得点",
      highlight:
        homeStats.avgFor > awayStats.avgFor
          ? ("left" as const)
          : homeStats.avgFor < awayStats.avgFor
          ? ("right" as const)
          : null,
    },
    {
      left: homeStats.avgAgainst,
      right: awayStats.avgAgainst,
      label: "平均失点",
      highlight:
        homeStats.avgAgainst < awayStats.avgAgainst
          ? ("left" as const)
          : homeStats.avgAgainst > awayStats.avgAgainst
          ? ("right" as const)
          : null,
    },
  ].map((props) => (
    <motion.div
      key={props.label}
      style={{ originX: 0.5 }}
      variants={statCardAnim}
    >
      <motion.div variants={statTextAnim}>
        <StatCard {...props} />
      </motion.div>
    </motion.div>
  ))}

  {/* ★ 最後の1枚だけ左右分割 */}
  <motion.div variants={statCardAnim}>
    <Last10SplitCard
  left={homeStats.last10}
  right={awayStats.last10}
  leftVsLabel={homeStats.last10Label}   // HOMEは相手=AWAY
  rightVsLabel={awayStats.last10Label}  // AWAYは相手=HOME
/>

  </motion.div>
</motion.section>




<motion.div variants={afterStatsContainer}>
      {/* ===== 自信度 ===== */}
      <motion.div variants={fadeUpItem}>
      <section className="mt-4">
        <div className="text-sm font-bold mb-1">自信度</div>
        <input
          type="range"
          min={1}
          max={100}
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-right text-sm opacity-70 tabular-nums">
          {confidence}%
        </div>
      </section>
      </motion.div>

      {/* ===== スコア予想 ===== */}
      <motion.div variants={fadeUpItem}>
      <section className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-sm font-bold mb-1">{homeSafe.name}</div>
          <input
            type="number"
            inputMode="numeric"
            className={fieldBase}
            placeholder="得点"
            value={scoreHome}
            onChange={(e) => setScoreHome(e.target.value)}
          />
        </div>

        <div>
          <div className="text-sm font-bold mb-1">{awaySafe.name}</div>
          <input
            type="number"
            inputMode="numeric"
            className={fieldBase}
            placeholder="得点"
            value={scoreAway}
            onChange={(e) => setScoreAway(e.target.value)}
          />
        </div>
      </section>
      </motion.div>

      {/* ===== コメント ===== */}
      <motion.div variants={fadeUpItem}>
      <section className="mt-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="コメント（任意）"
          className={[
            "w-full rounded-xl resize-none",
            "bg-white/8 border border-white/10",
            "p-3 md:p-4 leading-relaxed",
            "placeholder-white/50 text-white",
            "focus:outline-none focus:ring-2 focus:ring-white/20",
          ].join(" ")}
        />
      </section>
     </motion.div>

      {/* ===== 投稿ボタン ===== */}
      <motion.div variants={fadeUpAfterStats}>
      <div className="mt-5 flex justify-end">
        <button
          disabled={!canSubmit}
          onClick={handleSubmit}
          className={[
            "rounded-xl h-10 px-4 font-bold transition",
            canSubmit
              ? "bg-lime-400 text-black hover:bg-lime-300"
              : "bg-white/10 text-white/60 cursor-not-allowed",
          ].join(" ")}
        >
          {submitting ? "投稿中…" : "投稿"}
        </button>
      </div>
      </motion.div>



       </motion.div>
       </motion.div>
  );
}
