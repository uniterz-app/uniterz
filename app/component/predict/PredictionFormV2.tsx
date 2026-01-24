// app/component/predict/PredictionForm2.tsx
"use client";

import { useState } from "react";
import MatchCard, { type MatchCardProps } from "@/app/component/games/MatchCard";
import { auth } from "@/lib/firebase";
import { toast } from "@/app/component/ui/toast";
import { logGameEvent } from "@/lib/analytics/logEvent";
import { useRouter, usePathname } from "next/navigation";


type Props = {
  dense?: boolean;
  game: MatchCardProps;
  user: { name: string; avatarUrl?: string | null; verified?: boolean };
  onPostCreated?: (payload: { id: string; at: Date }) => void;
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
    <div className={`${padX} ${padY} text-white`}>

      {/* 試合カード */}
      <MatchCard
        {...game}
        startAtJst={game?.startAtJst ?? null}
        home={homeSafe}
        away={awaySafe}
        dense={dense}
        hideLine
        hideActions
      />

      {/* ===== 勝敗予想 ===== */}
      <section className="mt-4">
        <div className="text-sm font-bold mb-1">勝利予想</div>
        <select
  value={winner ?? ""}
  onChange={(e) => setWinner(e.target.value as Winner)}
  className={fieldBase}
>
  <option value="" disabled>
    勝敗を選択
  </option>

  <option value="home">{homeSafe.name}</option>

  {isSoccer && (
    <option value="draw">引き分け</option>
  )}

  <option value="away">{awaySafe.name}</option>
</select>
      </section>

      {/* ===== 自信度 ===== */}
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

      {/* ===== スコア予想 ===== */}
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

      {/* ===== コメント ===== */}
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

      {/* ===== 投稿ボタン ===== */}
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

    </div>
  );
}
