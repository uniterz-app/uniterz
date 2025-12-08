"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";

import MatchCard from "@/app/component/games/MatchCard";
import PredictionListByGame from "@/app/component/post/PredictionListByGame";

// ★ 新しい勝敗分布ドーナツ（V2）
import GamePredictionDistributionV2 from "@/app/component/predict/GamePredictionDistribution";

import { toMatchCardProps } from "@/lib/games/transform";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

import { getTeamPrimaryColor } from "@/lib/team-colors";
import { normalizeLeague } from "@/lib/leagues";


// Firestore の games 生ドキュメント型（id 付き）
type GameDoc = Parameters<typeof toMatchCardProps>[0];

export default function Page() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const gameId = String(id);

  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? null;

  const [hasMyPost, setHasMyPost] = useState<boolean | null>(null);

  // 🔍 自分の投稿チェック
  useEffect(() => {
    if (!uid || !gameId) return;

    (async () => {
      const q = query(
        collection(db, "posts"),
        where("authorUid", "==", uid),
        where("gameId", "==", gameId),
        limit(1)
      );
      const snap = await getDocs(q);
      setHasMyPost(!snap.empty);
    })();
  }, [uid, gameId]);

  // 🔍 ゲーム情報の取得
  const [rawGame, setRawGame] = useState<GameDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "games", gameId));
        if (!alive) return;
        setRawGame(snap.exists() ? ({ id: snap.id, ...snap.data() } as GameDoc) : null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [gameId]);

  // MatchCard 用の props 整形
  const matchProps = useMemo(() => {
    if (!rawGame) return null;
    const base = toMatchCardProps(rawGame, { dense: true });
    return { ...base, hideActions: true };
  }, [rawGame]);

  const homeName = matchProps?.home.name ?? "";
  const awayName = matchProps?.away.name ?? "";

  const leagueNorm = matchProps?.league ? normalizeLeague(matchProps.league) : null;

  const homeColor =
    leagueNorm && matchProps?.home.teamId
      ? getTeamPrimaryColor(leagueNorm, matchProps.home.teamId)
      : "#0ea5e9";

  const awayColor =
    leagueNorm && matchProps?.away.teamId
      ? getTeamPrimaryColor(leagueNorm, matchProps.away.teamId)
      : "#f43f5e";

  return (
    <div className="mx-auto max-w-3xl px-3 py-3">
      <h1 className="sr-only">Predictions (Mobile) for {gameId}</h1>

      {/* ゲームカード */}
      {!loading && matchProps && <MatchCard {...matchProps} />}

      {/* 🎯 V2 勝敗ドーナツグラフ */}
      <div className="mt-2">
        <GamePredictionDistributionV2
          gameId={gameId}
          homeName={homeName}
          awayName={awayName}
          homeColor={homeColor}
          awayColor={awayColor}
        />
      </div>

      {/* 投稿一覧 */}
      <div className="mt-2">
        <PredictionListByGame gameId={gameId} />
      </div>

      {/* 🔥 初投稿ボタン */}
      {hasMyPost === false && (
        <button
          onClick={() => router.push(`/mobile/games/${gameId}/predict`)}
          className="
            fixed bottom-24 right-6 z-50
            w-13 h-13 rounded-full
            bg-yellow-400 text-white
            flex items-center justify-center
            shadow-xl
            active:scale-90 transition-transform
          "
          aria-label="分析する"
        >
          <Pencil size={22} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}
