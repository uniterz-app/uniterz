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

  /* ===== State ===== */
  const [winner, setWinner] = useState<"home" | "away" | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
  !!winner &&
  scoreHome !== "" &&
  scoreAway !== "" &&
  !submitting;

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

      // ★ 投稿直後の初期 stats
      stats: {
        isWin: null,
        upsetScore: null,
      },
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

    // Reset
    setWinner(null);
    setConfidence(50);
    setScoreHome("");
    setScoreAway("");
    setComment("");

    onPostCreated?.({ id: json.id ?? "(local)", at: new Date() });
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
          onChange={(e) => setWinner(e.target.value as any)}
          className={fieldBase}
        >
          <option value="" disabled>
            勝利チームを選択
          </option>
          <option value="home">{homeSafe.name}</option>
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
